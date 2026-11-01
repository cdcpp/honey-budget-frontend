import { ref, computed, watch, onMounted } from 'vue'
import { useAccountClassification } from './useAccountClassification'
import { accountYearMonthApi } from '../api/accountYearMonthApi'
import { STORAGE_KEYS, TYPE_ORDER, DEFAULT_BALANCE_LIST, createEmptyMonths } from '../constants/budgetDefaults'
import { classifyGroup, toMonthArray, toAmountsMap, formatNumber, formatCurrency } from '../utils/formatters'
import { downloadJson, readJsonFile, downloadCsv } from '../utils/fileExport'

/**
 * @file useBudget.js
 * @description 연간 예산 플래너 비즈니스 로직 및 상태 관리 Composable (Spring의 Service 계층 역할)
 * 
 * 백엔드 매핑 안내 (Backend Mapping):
 * - Spring Entity: AccountYearMonth, CategoryGroup, Category, Account
 * - Spring Controller: AccountYearMonthController (/api/v1/account-year-months)
 * - 데이터 흐름:
 *   1. useAccountClassification()에서 카테고리 계층 트리(수입/저축/지출) 로딩
 *   2. accountYearMonthApi.fetchByYear(year)로 연도별 계좌 월별 금액(1~12월) 로딩
 *   3. 화면의 변경분을 감지(dirtyCount)하여 saveAmounts() 호출 시 POST/PUT 일괄 요청
 */

const snapshotOf = (values) => JSON.stringify(values.map((v) => Number(v) || 0))

export function useBudget() {
  const { groups, loading, error, loadHierarchy } = useAccountClassification()

  // 1. 비상금/자산 현황 로컬 스토리지 로드
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

  const balanceList = ref(loadSavedBalances())

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

  // ===== 계좌별 월별 금액 (백엔드 AccountYearMonth 연동) =====
  const year = ref(new Date().getFullYear())
  // 계좌 ID -> 화면에서 편집 중인 월별 금액(12개)
  const amounts = ref({})
  // 계좌 ID -> 서버에 저장된 행 ID (없으면 아직 등록 전)
  const recordIds = ref({})
  // 계좌 ID -> 서버 기준 월별 금액 스냅샷 (변경 여부 비교용)
  const originals = ref({})
  const yearLoading = ref(false)
  const saving = ref(false)
  const saveError = ref(null)
  const saveMessage = ref('')

  let yearRecords = []

  const applyRecordToAccount = (accountId) => {
    const record = yearRecords.find((r) => r.accountId === accountId)
    const values = toMonthArray(record?.amounts)
    amounts.value[accountId] = [...values]
    originals.value[accountId] = snapshotOf(values)
    if (record) recordIds.value[accountId] = record.id
    else delete recordIds.value[accountId]
  }

  const forEachAccount = (callback) => {
    for (const grp of groups.value || []) {
      for (const cat of grp.categories || []) {
        for (const acc of cat.accounts || []) {
          callback(acc)
        }
      }
    }
  }

  const hasAnyAccount = () => {
    for (const grp of groups.value || []) {
      for (const cat of grp.categories || []) {
        if ((cat.accounts || []).length > 0) return true
      }
    }
    return false
  }

  const loadYearAmounts = async () => {
    // 등록된 계좌가 아직 하나도 없는 경우 불필요한 서버 호출 생략
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

  // 계층 데이터 로드 시 계좌가 존재하면 월별 금액 조회 및 배열 보장
  watch(
    groups,
    async () => {
      if (hasAnyAccount() && yearRecords.length === 0 && !yearLoading.value) {
        await loadYearAmounts()
      } else {
        forEachAccount((acc) => {
          if (!Array.isArray(amounts.value[acc.id])) {
            applyRecordToAccount(acc.id)
          }
        })
      }
    },
    { immediate: true, deep: true }
  )

  const dirtyAccountIds = computed(() => {
    return Object.keys(amounts.value).filter((id) => {
      const values = amounts.value[id]
      return Array.isArray(values) && snapshotOf(values) !== originals.value[id]
    })
  })

  const dirtyCount = computed(() => dirtyAccountIds.value.length)

  const changeYear = async (newYear) => {
    const target = Number(newYear)
    if (!target || target === year.value) return
    if (dirtyCount.value > 0 && !confirm('저장하지 않은 변경 내용이 있습니다. 연도를 변경하면 사라집니다. 계속하시겠습니까?')) {
      return false
    }
    year.value = target
    await loadYearAmounts()
    return true
  }

  // 변경된 계좌만 등록(POST) 또는 수정(PUT)
  const saveAmounts = async () => {
    if (dirtyCount.value === 0 || saving.value) return
    saving.value = true
    saveError.value = null
    saveMessage.value = ''
    const targets = [...dirtyAccountIds.value]
    const failed = []
    let savedCount = 0

    for (const id of targets) {
      const accountId = Number(id)
      const payload = toAmountsMap(amounts.value[id])
      try {
        if (recordIds.value[id]) {
          await accountYearMonthApi.update(recordIds.value[id], { amounts: payload })
        } else {
          await accountYearMonthApi.create({ accountId, year: year.value, amounts: payload })
        }
        savedCount++
      } catch (err) {
        failed.push(err.message || String(err))
      }
    }

    // 서버 기준으로 다시 불러와 행 ID와 스냅샷을 갱신 (실패한 계좌의 입력값은 유지)
    const pending = {}
    for (const id of targets) {
      if (failed.length && snapshotOf(amounts.value[id]) !== originals.value[id]) {
        pending[id] = [...amounts.value[id]]
      }
    }
    try {
      yearRecords = await accountYearMonthApi.fetchByYear(year.value)
      forEachAccount((acc) => applyRecordToAccount(acc.id))
      if (failed.length) {
        // 저장에 실패한 계좌는 편집 중이던 값을 복원
        for (const id of Object.keys(pending)) {
          const record = yearRecords.find((r) => String(r.accountId) === id)
          if (!record || snapshotOf(toMonthArray(record.amounts)) !== snapshotOf(pending[id])) {
            amounts.value[id] = pending[id]
          }
        }
      }
    } catch (err) {
      failed.push(err.message || String(err))
    }

    if (failed.length) {
      saveError.value = `${savedCount}건 저장, ${failed.length}건 실패: ${failed[0]}`
    } else {
      saveMessage.value = `${savedCount}개 계좌의 월별 금액이 저장되었습니다.`
    }
    saving.value = false
  }

  onMounted(async () => {
    await loadHierarchy()
    await loadYearAmounts()
  })

  // 그룹(구간) -> 카테고리(소제목) -> 계좌(행) 구조의 명세표 데이터
  const sections = computed(() => {
    const built = (groups.value || []).map((grp, order) => ({
      key: 'grp-' + grp.id,
      groupId: grp.id,
      type: classifyGroup(grp.categoryGroupName),
      title: grp.categoryGroupName,
      order,
      categories: (grp.categories || []).map((cat) => ({
        id: cat.id,
        name: cat.categoryName,
        rows: (cat.accounts || []).map((acc) => ({
          id: acc.id,
          label: acc.accountName,
          values: amounts.value[acc.id] || createEmptyMonths()
        }))
      }))
    }))
    return built.sort(
      (a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) || a.order - b.order
    )
  })

  const rowsOfType = (type) =>
    sections.value
      .filter((s) => s.type === type)
      .flatMap((s) => s.categories.flatMap((c) => c.rows))

  const incomeRows = computed(() => rowsOfType('income'))
  const savingRows = computed(() => rowsOfType('saving'))
  const expenseRows = computed(() => rowsOfType('expense'))

  const totalBalance = computed(() => {
    return balanceList.value.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0)
  })

  const sumByMonth = (rows) =>
    Array.from({ length: 12 }, (_, colIdx) =>
      rows.reduce((sum, row) => sum + (Number(row.values[colIdx]) || 0), 0)
    )

  const totalIncomeByMonth = computed(() => sumByMonth(incomeRows.value))
  const totalSavingsByMonth = computed(() => sumByMonth(savingRows.value))
  const totalExpensesByMonth = computed(() => sumByMonth(expenseRows.value))

  const netBalanceByMonth = computed(() => {
    return Array.from({ length: 12 }, (_, colIdx) => {
      const income = totalIncomeByMonth.value[colIdx] || 0
      const savings = totalSavingsByMonth.value[colIdx] || 0
      const expenses = totalExpensesByMonth.value[colIdx] || 0
      return income - savings - expenses
    })
  })

  const annualIncomeTotal = computed(() => totalIncomeByMonth.value.reduce((a, b) => a + b, 0))
  const annualSavingsTotal = computed(() => totalSavingsByMonth.value.reduce((a, b) => a + b, 0))
  const annualExpensesTotal = computed(() => totalExpensesByMonth.value.reduce((a, b) => a + b, 0))

  const annualNetTotal = computed(() => {
    return annualIncomeTotal.value - annualSavingsTotal.value - annualExpensesTotal.value
  })

  const getRowTotal = (row) => {
    if (!row || !row.values) return 0
    return row.values.reduce((sum, v) => sum + (Number(v) || 0), 0)
  }

  // 카테고리(소제목) 월별 소계
  const getCategoryMonthTotal = (category, monthIdx) => {
    return category.rows.reduce((sum, row) => sum + (Number(row.values[monthIdx]) || 0), 0)
  }

  const getCategoryTotal = (category) => {
    return category.rows.reduce((sum, row) => sum + getRowTotal(row), 0)
  }

  const addBalanceItem = () => {
    balanceList.value.push({
      id: 'bal-' + Date.now(),
      name: '새 잔액 항목',
      amount: 0
    })
  }

  const removeBalanceItem = (index) => {
    balanceList.value.splice(index, 1)
  }

  const fillRowAcrossMonths = (row, startMonthIdx = 0) => {
    const val = Number(row.values[startMonthIdx]) || 0
    for (let i = startMonthIdx; i < 12; i++) {
      row.values[i] = val
    }
  }

  // 화면의 모든 월별 금액을 0으로 만든다 (저장 버튼을 눌러야 서버에 반영)
  const resetToZero = () => {
    if (confirm('모든 수치 데이터를 0으로 초기화하시겠습니까? (저장 버튼을 눌러야 서버에 반영됩니다)')) {
      balanceList.value.forEach((item) => (item.amount = 0))
      Object.keys(amounts.value).forEach((id) => {
        amounts.value[id] = createEmptyMonths()
      })
    }
  }

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

  // 백업 파일의 금액을 화면에 불러온다 (저장 버튼을 눌러야 서버에 반영)
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
