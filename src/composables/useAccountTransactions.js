import { ref, computed, watch, onMounted, getCurrentInstance } from 'vue'
import { accountTransactionApi } from '../api/accountTransactionApi'
import { useAccountClassification } from './useAccountClassification'
import { DEFAULT_ACCOUNT_PRESETS } from '../constants/budgetDefaults'

export { DEFAULT_ACCOUNT_PRESETS }

export function useAccountTransactions() {
  const { groups } = useAccountClassification()

  const today = new Date()
  const selectedYear = ref(2026)
  const selectedMonth = ref(today.getMonth() + 1)
  const activeTab = ref('ALL') // 'ALL' 또는 계좌명/ID

  const transactions = ref([])
  const loading = ref(false)
  const error = ref(null)

  const currentYearMonth = computed(() => {
    return `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}`
  })

  // 엑셀 시트 기준 기간 표기: "1월 5일 ~ 2월 4일" (월급 5일 기준)
  const periodLabel = computed(() => {
    const m = selectedMonth.value
    const nextM = m === 12 ? 1 : m + 1
    return `${m}월 5일 ~ ${nextM}월 4일`
  })

  // 등록된 계좌 목록 (카테고리 관리에서 등록된 계좌 + 기본 3대 지출 프리셋)
  const availableAccounts = computed(() => {
    const list = []
    const seen = new Set()

    // 1. 카테고리 관리에서 등록된 지출 계좌들 수집
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
              badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
            })
          }
        }
      }
    }

    // 2. 엑셀 기본 프리셋 추가 (중복 방지)
    for (const p of DEFAULT_ACCOUNT_PRESETS) {
      if (!seen.has(p.name)) {
        seen.add(p.name)
        list.push({
          id: p.id,
          name: p.name,
          categoryName: '기본 분류',
          groupName: '지출',
          badgeColor: p.badgeColor
        })
      }
    }

    return list
  })

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

  watch([selectedYear, selectedMonth], () => {
    loadTransactions()
  })

  if (getCurrentInstance()) {
    onMounted(() => {
      loadTransactions()
    })
  } else {
    loadTransactions()
  }

  const prevMonth = () => {
    if (selectedMonth.value === 1) {
      selectedYear.value -= 1
      selectedMonth.value = 12
    } else {
      selectedMonth.value -= 1
    }
  }

  const nextMonth = () => {
    if (selectedMonth.value === 12) {
      selectedYear.value += 1
      selectedMonth.value = 1
    } else {
      selectedMonth.value += 1
    }
  }

  const setYearMonth = (y, m) => {
    selectedYear.value = Number(y)
    selectedMonth.value = Number(m)
  }

  // 필터링된 거래 목록
  const filteredTransactions = computed(() => {
    if (activeTab.value === 'ALL') return transactions.value
    return transactions.value.filter(
      (t) => t.accountName === activeTab.value || String(t.accountId) === String(activeTab.value)
    )
  })

  // 해당 월 전체 소비 총액
  const totalMonthAmount = computed(() => {
    return transactions.value.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  })

  // 계좌별 소비 금액 집계
  const accountTotals = computed(() => {
    const map = {}
    for (const t of transactions.value) {
      const key = t.accountName || '기타'
      map[key] = (map[key] || 0) + (Number(t.amount) || 0)
    }
    return map
  })

  const addTransaction = async ({ accountId, accountName, transactionDate, amount, description, memo }) => {
    try {
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
    } catch (err) {
      throw err
    }
  }

  const updateTransaction = async (id, payload) => {
    try {
      const updated = await accountTransactionApi.updateTransaction(id, {
        ...payload,
        amount: Number(payload.amount) || 0
      })
      await loadTransactions()
      return updated
    } catch (err) {
      throw err
    }
  }

  const removeTransaction = async (id) => {
    try {
      await accountTransactionApi.deleteTransaction(id)
      await loadTransactions()
      return true
    } catch (err) {
      throw err
    }
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
