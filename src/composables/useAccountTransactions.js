/**
 * ============================================================================
 * @file        useAccountTransactions.js
 * @layer       Service / State Layer (Spring의 @Service 역할)
 * @role        월별 소비내역(생활비/고정비/자동차·병원비) 상태 관리, 급여 주기(5일~익월 4일) 계산 및 CRUD 액션
 * @flow        [MonthlyTransactionsView]
 *                    <---> [useAccountTransactions]
 *                    <---> [accountTransactionApi]
 *                    <---> [Spring AccountTransaction API / localStorage]
 * ============================================================================
 */
import { ref, computed, watch, onMounted, getCurrentInstance } from 'vue'
import { accountTransactionApi } from '../api/accountTransactionApi'
import { useAccountClassification } from './useAccountClassification'
import { DEFAULT_ACCOUNT_PRESETS } from '../constants/budgetDefaults'

export { DEFAULT_ACCOUNT_PRESETS }

export function useAccountTransactions() {
  // 카테고리 관리 탭에 등록된 계좌 목록과 연동하기 위해 전역 분류 트리 참조
  const { groups } = useAccountClassification()

  // ==========================================================================
  // [SECTION 1] Reactive State (반응형 상태 변수 - ref)
  // ==========================================================================
  const today = new Date()
  const selectedYear = ref(2026)                     // 현재 선택된 조회 연도
  const selectedMonth = ref(today.getMonth() + 1)    // 현재 선택된 조회 월 (1 ~ 12)
  const activeTab = ref('ALL')                       // 현재 선택된 필터 탭 ('ALL' 또는 계좌명)

  const transactions = ref([])                       // 서버/로컬스토리지에서 조회된 해당 월 소비내역 리스트
  const loading = ref(false)                         // 조회 로딩 상태
  const error = ref(null)                            // 에러 메시지

  // ==========================================================================
  // [SECTION 2] Computed Properties (파생 계산 속성 - Java Getter / SQL 집계)
  // ==========================================================================

  /** API 요청에 사용되는 'YYYY-MM' 형식 연월 문자열 (예: '2026-01') */
  const currentYearMonth = computed(() => {
    return `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}`
  })

  /**
   * [엑셀 급여일(5일) 기준 정산 기간 라벨]
   * - 예: 1월 선택 시 -> '1월 5일 ~ 2월 4일', 12월 선택 시 -> '12월 5일 ~ 1월 4일'
   */
  const periodLabel = computed(() => {
    const m = selectedMonth.value
    const nextM = m === 12 ? 1 : m + 1
    return `${m}월 5일 ~ ${nextM}월 4일`
  })

  /**
   * [선택 가능한 소비 계좌 목록]
   * - 1순위: '카테고리 관리'에서 사용자가 등록한 계좌들
   * - 2순위: 엑셀 기본 3대 지출 프리셋('생활비(식비)', '고정비', '자동차/병원비') 병합 (중복 제외)
   */
  const availableAccounts = computed(() => {
    const list = []
    const seen = new Set()

    // 1. 카테고리 관리에 등록된 계좌 수집
    for (const grp of groups.value || []) {
      for (const cat of grp.categories || []) {
        for (const acc of cat.accounts || []) {
          const name = acc.accountName
          if (!seen.has(name)) {
            seen.add(name)
            list.push({
              id: acc.id,
              name,
              categoryName: cat.categoryName,
              groupName: grp.categoryGroupName,
              badgeColor: 'bg-[#F7F6F2] text-[#141413] border-[#141413]/15'
            })
          }
        }
      }
    }

    // 2. 엑셀 3대 기본 프리셋 보충 (동일 이름이 없을 때만 추가)
    for (const p of DEFAULT_ACCOUNT_PRESETS) {
      if (!seen.has(p.name)) {
        seen.add(p.name)
        list.push({
          id: null,
          name: p.name,
          categoryName: '기본 분류',
          groupName: '지출',
          badgeColor: p.badgeColor
        })
      }
    }

    return list
  })

  /** 현재 선택된 탭(activeTab)에 따라 필터링된 소비내역 목록 */
  const filteredTransactions = computed(() => {
    if (activeTab.value === 'ALL') return transactions.value
    return transactions.value.filter(
      (t) => t.accountName === activeTab.value || String(t.accountId) === String(activeTab.value)
    )
  })

  /** 해당 월 전체 소비내역의 총 지출 금액 합계 */
  const totalMonthAmount = computed(() => {
    return transactions.value.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  })

  /** 계좌(소비항목)별 지출 합계 맵 (예: { '생활비(식비)': 57990, '자동차/병원비': 131000 }) */
  const accountTotals = computed(() => {
    const map = {}
    for (const t of transactions.value) {
      const key = t.accountName || '기타'
      map[key] = (map[key] || 0) + (Number(t.amount) || 0)
    }
    return map
  })

  // ==========================================================================
  // [SECTION 3] Watchers & Lifecycle (연월 변경 감시 및 초기 데이터 로딩)
  // ==========================================================================

  /** 선택된 연월(currentYearMonth)에 해당하는 소비내역 목록 조회 */
  const loadTransactions = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await accountTransactionApi.fetchTransactions({
        yearMonth: currentYearMonth.value
      })
      transactions.value = data
    } catch (err) {
      error.value = err.message || '소비 내역을 불러오지 못했습니다.'
    } finally {
      loading.value = false
    }
  }

  // 연도 또는 월이 바뀔 때마다 자동으로 내역 재조회
  watch([selectedYear, selectedMonth], () => {
    loadTransactions()
  })

  // 컴포넌트 마운트 시(또는 단위 테스트 호출 시) 최초 1회 로드
  if (getCurrentInstance()) {
    onMounted(() => {
      loadTransactions()
    })
  } else {
    loadTransactions()
  }

  // ==========================================================================
  // [SECTION 4] Business Actions (월 이동 네비게이션 및 소비내역 CRUD)
  // ==========================================================================

  /** [이전 달로 이동] 1월에서 이전 달 클릭 시 작년 12월로 이동 */
  const prevMonth = () => {
    if (selectedMonth.value === 1) {
      selectedYear.value -= 1
      selectedMonth.value = 12
    } else {
      selectedMonth.value -= 1
    }
  }

  /** [다음 달로 이동] 12월에서 다음 달 클릭 시 내년 1월로 이동 */
  const nextMonth = () => {
    if (selectedMonth.value === 12) {
      selectedYear.value += 1
      selectedMonth.value = 1
    } else {
      selectedMonth.value += 1
    }
  }

  /** [특정 연월로 직접 이동] */
  const setYearMonth = (y, m) => {
    selectedYear.value = Number(y)
    selectedMonth.value = Number(m)
  }

  /** [신규 소비내역 등록 후 목록 갱신] */
  const addTransaction = async ({ accountId, accountName, transactionDate, amount, description, memo }) => {
    const created = await accountTransactionApi.createTransaction({
      accountId,
      accountName,
      yearMonth: transactionDate ? transactionDate.substring(0, 7) : currentYearMonth.value,
      transactionDate,
      amount: Number(amount) || 0,
      description,
      memo
    })
    await loadTransactions()
    return created
  }

  /** [기존 소비내역 수정 후 목록 갱신] */
  const updateTransaction = async (id, payload) => {
    const updated = await accountTransactionApi.updateTransaction(id, {
      ...payload,
      amount: Number(payload.amount) || 0,
      yearMonth: payload.transactionDate ? payload.transactionDate.substring(0, 7) : currentYearMonth.value
    })
    await loadTransactions()
    return updated
  }

  /** [소비내역 삭제 후 목록 갱신] */
  const removeTransaction = async (id) => {
    await accountTransactionApi.deleteTransaction(id)
    await loadTransactions()
    return true
  }

  return {
    selectedYear,
    selectedMonth,
    currentYearMonth,
    periodLabel,
    activeTab,
    transactions,
    filteredTransactions,
    availableAccounts,
    totalMonthAmount,
    accountTotals,
    loading,
    error,
    loadTransactions,
    prevMonth,
    nextMonth,
    setYearMonth,
    addTransaction,
    updateTransaction,
    removeTransaction
  }
}
