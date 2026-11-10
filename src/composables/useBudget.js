/**
 * ============================================================================
 * @file        useBudget.js
 * @layer       Service / State Layer (Spring의 @Service 역할)
 * @role        월간 예산 플래너(연간 1~12월 명세표) 상태 관리, 월별/연간 자동 합산, 변경 감지(Dirty Check) 및 일괄 저장
 * @spring      백엔드 연동 정보:
 *              - Entity     : AccountYearMonth, CategoryGroup, Category, Account
 *              - Controller : AccountYearMonthController (/api/v1/account-year-months)
 * @flow        1. useAccountClassification()에서 3단계 계좌 계층 트리(수입/저축/지출) 로드
 *              2. accountYearMonthApi.fetchByYear(year)로 해당 연도의 계좌별 1~12월 금액 로드
 *              3. 사용자가 테이블 셀 금액을 수정하면 originals 스냅샷과 비교하여 dirtyCount 자동 계산
 *              4. saveAmounts() 실행 시 변경된 계좌만 골라 신규(POST) / 기존(PUT) 분기 호출
 * ============================================================================
 */
import { ref, computed, watch, onMounted } from 'vue'
import { useAccountClassification } from './useAccountClassification'
import { accountYearMonthApi } from '../api/accountYearMonthApi'
import { STORAGE_KEYS, TYPE_ORDER, DEFAULT_BALANCE_LIST, createEmptyMonths } from '../constants/budgetDefaults'
import { classifyGroup, toMonthArray, toAmountsMap, formatNumber, formatCurrency } from '../utils/formatters'
import { downloadJson, readJsonFile, downloadCsv } from '../utils/fileExport'

/**
 * 12개월 금액 배열의 변경 여부(Dirty Checking)를 비교하기 위해 JSON 문자열 스냅샷을 만듭니다.
 * (JPA의 영속성 컨텍스트 스냅샷 비교와 동일한 원리입니다.)
 */
const snapshotOf = (values) => JSON.stringify(values.map((v) => Number(v) || 0))

export function useBudget() {
  // 카테고리 관리(그룹 -> 카테고리 -> 계좌) 전역 상태 참조
  const { groups, loading, error, loadHierarchy } = useAccountClassification()

  // ==========================================================================
  // [SECTION 1] Reactive State (반응형 상태 변수 - ref)
  // ==========================================================================

  /** 로컬스토리지에서 비상금/자산 현황 목록을 불러오는 초기 로더 */
  const loadSavedBalances = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.balanceList) return parsed.balanceList
      }
      const legacy = localStorage.getItem(STORAGE_KEYS.LEGACY)
      if (legacy) {
        const parsed = JSON.parse(legacy)
        if (parsed.balanceList) return parsed.balanceList
      }
    } catch (e) {
      console.error('Failed to load balance list from localStorage', e)
    }
    return DEFAULT_BALANCE_LIST
  }

  const balanceList = ref(loadSavedBalances())      // 우측 상단 '잔액 현황' 카드의 항목 배열
  const year = ref(new Date().getFullYear())        // 현재 조회/편집 중인 회계연도 (기본: 올해)
  const amounts = ref({})                           // { [accountId]: [1월금액, 2월금액, ..., 12월금액] }
  const recordIds = ref({})                         // { [accountId]: accountYearMonthId(PK) } (없으면 아직 DB 미등록 계좌)
  const originals = ref({})                         // { [accountId]: 서버에서 처음 받아온 12개월 금액 JSON 스냅샷 }
  const yearLoading = ref(false)                    // 연도별 금액 조회 중 여부
  const saving = ref(false)                         // 저장 버튼 클릭 후 API 요청 진행 중 여부
  const saveError = ref(null)                       // 저장/조회 실패 에러 메시지
  const saveMessage = ref('')                       // 저장 성공 안내 메시지

  // 서버에서 조회한 원본 AccountYearMonth 응답 리스트 보관용 내부 변수
  let yearRecords = []

  // ==========================================================================
  // [SECTION 2] Internal Helpers & Watchers (내부 동기화 헬퍼 및 감시자)
  // ==========================================================================

  // 잔액 현황(balanceList)이 수정될 때마다 브라우저 localStorage에 자동 저장
  watch(
    balanceList,
    () => {
      try {
        localStorage.setItem(STORAGE_KEYS.CURRENT, JSON.stringify({ balanceList: balanceList.value }))
      } catch (e) {
        console.error('Failed to save balance list', e)
      }
    },
    { deep: true }
  )

  /** 서버 응답(yearRecords)에서 특정 계좌의 월별 금액을 찾아 amounts와 originals 스냅샷에 세팅 */
  const applyRecordToAccount = (accountId) => {
    const record = yearRecords.find((r) => r.accountId === accountId)
    const values = toMonthArray(record?.amounts)
    amounts.value[accountId] = [...values]
    originals.value[accountId] = snapshotOf(values)
    if (record) recordIds.value[accountId] = record.id
    else delete recordIds.value[accountId]
  }

  /** 전체 3단계 트리를 순회하며 모든 계좌(acc)에 대해 콜백 실행 */
  const forEachAccount = (callback) => {
    for (const grp of groups.value || []) {
      for (const cat of grp.categories || []) {
        for (const acc of cat.accounts || []) {
          callback(acc)
        }
      }
    }
  }

  /** 등록된 계좌가 최소 1개라도 존재하는지 확인 */
  const hasAnyAccount = () => {
    for (const grp of groups.value || []) {
      for (const cat of grp.categories || []) {
        if ((cat.accounts || []).length > 0) return true
      }
    }
    return false
  }

  /**
   * [선택된 연도(year)의 계좌별 1~12월 금액 서버 조회]
   */
  const loadYearAmounts = async () => {
    // 등록된 계좌가 하나도 없으면 불필요한 서버 호출 생략
    if (!hasAnyAccount()) {
      yearRecords = []
      amounts.value = {}
      recordIds.value = {}
      originals.value = {}
      saveError.value = null
      return
    }

    yearLoading.value = true
    saveError.value = null
    try {
      yearRecords = await accountYearMonthApi.fetchByYear(year.value)
    } catch (err) {
      yearRecords = []
      saveError.value = err.message || '월별 금액을 불러오는 중 오류가 발생했습니다.'
    } finally {
      amounts.value = {}
      recordIds.value = {}
      originals.value = {}
      forEachAccount((acc) => applyRecordToAccount(acc.id))
      yearLoading.value = false
    }
  }

  // 카테고리 관리에서 계좌가 새로 추가되면 즉시 12개월 배열을 할당하고,
  // 대시보드 노출(isDashboardVisible === true) 계좌가 있으면 잔액 현황(balanceList)과 동기화합니다.
  watch(
    groups,
    async () => {
      const dashboardAccounts = []
      forEachAccount((acc) => {
        if (acc.isDashboardVisible) {
          dashboardAccounts.push({
            id: acc.id,
            name: acc.accountName,
            amount: Number(acc.balance) || 0
          })
        }
      })
      if (dashboardAccounts.length > 0) {
        balanceList.value = dashboardAccounts
      }

      if (hasAnyAccount() && yearRecords.length === 0 && !yearLoading.value) {
        await loadYearAmounts()
      } else {
        forEachAccount((acc) => {
          if (!amounts.value[acc.id]) {
            applyRecordToAccount(acc.id)
          }
        })
      }
    },
    { deep: true, immediate: true }
  )

  // 컴포넌트 최초 마운트 시 계층 구조 및 연도별 금액 순차 로드
  onMounted(async () => {
    if (!groups.value || groups.value.length === 0) {
      await loadHierarchy()
    }
    await loadYearAmounts()
  })

  // ==========================================================================
  // [SECTION 3] Computed Properties (파생 계산 속성 - 명세표 구조화 및 자동 합산)
  // ==========================================================================

  /** 현재 화면에서 수정되었으나 아직 서버에 저장하지 않은(Dirty) 계좌 배열 */
  const dirtyAccounts = computed(() => {
    const list = []
    forEachAccount((acc) => {
      const current = amounts.value[acc.id]
      if (!current) return
      const orig = originals.value[acc.id] ?? snapshotOf(createEmptyMonths())
      if (snapshotOf(current) !== orig) {
        list.push(acc)
      }
    })
    return list
  })

  /** 변경된 계좌 개수 (0보다 크면 '저장' 버튼 활성화) */
  const dirtyCount = computed(() => dirtyAccounts.value.length)

  /**
   * [명세표 렌더링용 3단계 섹션 배열]
   * - Level 1 그룹(수입/저축/지출) -> Level 2 카테고리(급여/적금/생활비) -> Level 3 계좌(행)
   */
  const sections = computed(() => {
    const mapped = (groups.value || []).map((grp) => {
      const type = classifyGroup(grp.categoryGroupName)
      const categories = (grp.categories || []).map((cat) => ({
        id: cat.id,
        name: cat.categoryName,
        code: cat.categoryCode,
        rows: (cat.accounts || []).map((acc) => ({
          id: acc.id,
          label: acc.accountName,
          values: amounts.value[acc.id] || createEmptyMonths()
        }))
      }))
      return {
        key: grp.id,
        title: grp.categoryGroupName,
        code: grp.categoryGroupCode,
        type,
        categories
      }
    })

    return mapped.sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type))
  })

  /** 특정 구간(income / saving / expense)에 속한 모든 계좌 행만 추출하는 헬퍼 */
  const rowsByType = (type) =>
    sections.value
      .filter((s) => s.type === type)
      .flatMap((s) => s.categories.flatMap((c) => c.rows))

  const incomeRows = computed(() => rowsByType('income'))
  const savingRows = computed(() => rowsByType('saving'))
  const expenseRows = computed(() => rowsByType('expense'))

  /** 보유 잔액 현황(BalanceSection) 총합계 */
  const totalBalance = computed(() => {
    return balanceList.value.reduce((acc, item) => acc + (Number(item.amount) || 0), 0)
  })

  /** 단일 계좌 행(row)의 1~12월 연간 합계 계산 */
  const getRowTotal = (row) => {
    return row.values.reduce((acc, val) => acc + (Number(val) || 0), 0)
  }

  /** 특정 카테고리의 특정 월(monthIdx: 0~11) 소계 계산 */
  const getCategoryMonthTotal = (category, monthIdx) => {
    return (category.rows || []).reduce((sum, row) => sum + (Number(row.values[monthIdx]) || 0), 0)
  }

  /** 특정 카테고리의 1~12월 연간 총소계 계산 */
  const getCategoryTotal = (category) => {
    return (category.rows || []).reduce((sum, row) => sum + getRowTotal(row), 0)
  }

  /** 구간별 1~12월 월별 총합계 배열(길이 12)을 계산하는 내부 헬퍼 */
  const sumRowsByMonth = (rowsRef) =>
    computed(() => {
      const totals = createEmptyMonths()
      rowsRef.value.forEach((row) => {
        for (let i = 0; i < 12; i++) {
          totals[i] += Number(row.values[i]) || 0
        }
      })
      return totals
    })

  const totalIncomeByMonth = sumRowsByMonth(incomeRows)     // 월별 총 수입 (1~12월 배열)
  const totalSavingsByMonth = sumRowsByMonth(savingRows)    // 월별 총 저축액 (1~12월 배열)
  const totalExpensesByMonth = sumRowsByMonth(expenseRows)  // 월별 총 지출 (1~12월 배열)

  /** 월별 순 잔여 자금 (수입 - 저축 - 지출) */
  const netBalanceByMonth = computed(() => {
    const nets = createEmptyMonths()
    for (let i = 0; i < 12; i++) {
      nets[i] =
        totalIncomeByMonth.value[i] - totalSavingsByMonth.value[i] - totalExpensesByMonth.value[i]
    }
    return nets
  })

  /** 연간 총 수입 / 총 저축 / 총 지출 / 순 잔여 합계 (SummaryCards 표시용) */
  const annualIncomeTotal = computed(() => totalIncomeByMonth.value.reduce((a, b) => a + b, 0))
  const annualSavingsTotal = computed(() => totalSavingsByMonth.value.reduce((a, b) => a + b, 0))
  const annualExpensesTotal = computed(() => totalExpensesByMonth.value.reduce((a, b) => a + b, 0))
  const annualNetTotal = computed(() => netBalanceByMonth.value.reduce((a, b) => a + b, 0))

  // ==========================================================================
  // [SECTION 4] Business Actions (연도 변경, 서버 일괄 저장, 행 복사, 파일 백업)
  // ==========================================================================

  /** [조회 연도 변경] 드롭다운에서 연도 변경 시 해당 연도의 월별 금액 재조회 */
  const changeYear = async (newYear) => {
    const parsed = Number(newYear)
    if (!parsed || parsed === year.value) return
    year.value = parsed
    saveMessage.value = ''
    await loadYearAmounts()
  }

  /**
   * [변경된 계좌 금액 일괄 서버 저장]
   * - dirtyAccounts만 순회하며, 이미 서버 ID(recordIds[acc.id])가 있으면 PUT 수정,
   *   없으면 POST 신규 등록을 호출합니다.
   */
  const saveAmounts = async () => {
    const targets = dirtyAccounts.value
    if (targets.length === 0) return

    saving.value = true
    saveError.value = null
    saveMessage.value = ''
    try {
      for (const acc of targets) {
        const values = amounts.value[acc.id] || createEmptyMonths()
        const payloadMap = toAmountsMap(values)
        const existingId = recordIds.value[acc.id]

        const saved = existingId
          ? await accountYearMonthApi.update(existingId, payloadMap)
          : await accountYearMonthApi.create({
              accountId: acc.id,
              year: year.value,
              amounts: payloadMap
            })

        const nextValues = saved?.amounts ? toMonthArray(saved.amounts) : [...values]
        amounts.value[acc.id] = nextValues
        originals.value[acc.id] = snapshotOf(nextValues)
        if (saved?.id) recordIds.value[acc.id] = saved.id
      }
      saveMessage.value = `${targets.length}개 계좌의 월별 금액이 저장되었습니다.`
    } catch (err) {
      saveError.value = err.message || '월별 금액 저장 중 오류가 발생했습니다.'
    } finally {
      saving.value = false
    }
  }

  /** [잔액 현황 항목 추가] */
  const addBalanceItem = () => {
    balanceList.value.push({ id: 'bal-' + Date.now(), name: '새 항목', amount: 0 })
  }

  /** [잔액 현황 항목 삭제] */
  const removeBalanceItem = (index) => {
    balanceList.value.splice(index, 1)
  }

  /** [1월 금액을 12개월 전체에 동일하게 복사] (행 우측 '»' 버튼 클릭 시 실행) */
  const fillRowAcrossMonths = (row, startMonthIdx = 0) => {
    const val = Number(row.values[startMonthIdx]) || 0
    for (let i = startMonthIdx; i < 12; i++) {
      row.values[i] = val
    }
  }

  /** [화면의 모든 월별 금액 0원 초기화] (저장 버튼을 눌러야 DB에 최종 반영됨) */
  const resetToZero = () => {
    if (confirm('모든 수치 데이터를 0으로 초기화하시겠습니까? (저장 버튼을 눌러야 서버에 반영됩니다)')) {
      balanceList.value.forEach((item) => (item.amount = 0))
      Object.keys(amounts.value).forEach((id) => {
        amounts.value[id] = createEmptyMonths()
      })
    }
  }

  /** [현재 예산 데이터 JSON 파일 백업 다운로드] */
  const exportToJson = () => {
    downloadJson(
      {
        version: 3,
        year: year.value,
        exportedAt: new Date().toISOString(),
        balanceList: balanceList.value,
        amounts: amounts.value
      },
      `honey-budget-${new Date().toISOString().slice(0, 10)}.json`
    )
  }

  /** [JSON 백업 파일 불러오기] */
  const importFromJson = async (file) => {
    try {
      const parsed = await readJsonFile(file)
      if (parsed.amounts && typeof parsed.amounts === 'object') {
        balanceList.value = parsed.balanceList || []
        Object.keys(amounts.value).forEach((id) => {
          if (Array.isArray(parsed.amounts[id])) {
            amounts.value[id] = toMonthArray(
              Object.fromEntries(parsed.amounts[id].map((v, i) => [i + 1, v]))
            )
          }
        })
        return true
      } else {
        alert('유효하지 않은 백업 파일 형식입니다.')
        throw new Error('Invalid JSON structure')
      }
    } catch (err) {
      alert(err.message || 'JSON 파일을 파싱하는 데 실패했습니다.')
      throw err
    }
  }

  /** [연간 명세표 전체 행을 엑셀 호환 CSV 파일로 다운로드] */
  const exportToCsv = () => {
    const headers = ['구분', '항목', ...Array.from({ length: 12 }, (_, i) => i + 1 + '월'), '연간 합계']
    const rows = []

    const totalRowOf = {
      income: ['총계', '총 수입', totalIncomeByMonth, annualIncomeTotal],
      saving: ['총계', '총 저축액', totalSavingsByMonth, annualSavingsTotal],
      expense: ['총계', '총 지출', totalExpensesByMonth, annualExpensesTotal]
    }

    sections.value.forEach((section, idx) => {
      section.categories.forEach((cat) => {
        cat.rows.forEach((row) => {
          rows.push([section.title, cat.name + ' / ' + row.label, ...row.values, getRowTotal(row)])
        })
      })
      const isLastOfType = !sections.value.slice(idx + 1).some((s) => s.type === section.type)
      const total = totalRowOf[section.type]
      if (isLastOfType && total) {
        rows.push([total[0], total[1], ...total[2].value, total[3].value])
      }
    })

    rows.push(['결과', '순 잔여/차액', ...netBalanceByMonth.value, annualNetTotal.value])

    downloadCsv(headers, rows, `honey-budget-${year.value}.csv`)
  }

  return {
    balanceList,
    sections,
    loading,
    error,
    year,
    yearLoading,
    saving,
    saveError,
    saveMessage,
    dirtyCount,
    changeYear,
    saveAmounts,
    incomeRows,
    savingRows,
    expenseRows,
    totalBalance,
    totalIncomeByMonth,
    totalSavingsByMonth,
    totalExpensesByMonth,
    netBalanceByMonth,
    annualIncomeTotal,
    annualSavingsTotal,
    annualExpensesTotal,
    annualNetTotal,
    getRowTotal,
    getCategoryMonthTotal,
    getCategoryTotal,
    addBalanceItem,
    removeBalanceItem,
    fillRowAcrossMonths,
    resetToZero,
    exportToJson,
    importFromJson,
    exportToCsv,
    formatNumber,
    formatCurrency
  }
}
