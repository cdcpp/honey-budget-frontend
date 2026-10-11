import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'honey-budget-data-v1'

const initMonths = (m1 = 0, m2 = 0) => {
  const arr = Array(12).fill(0)
  arr[0] = m1
  arr[1] = m2
  return arr
}

const getDefaultData = () => ({
  balanceList: [
    { id: 'bal-1', name: '비상금', amount: 0 },
    { id: 'bal-2', name: '차량비상금', amount: 0 },
    { id: 'bal-3', name: '행사비', amount: 0 },
    { id: 'bal-4', name: '예금', amount: 0 },
    { id: 'bal-5', name: '자유적금', amount: 0 }
  ],
  incomeRows: [
    { id: 'inc-1', label: '수입', values: Array(12).fill(0) },
    { id: 'inc-2', label: '부수입', values: Array(12).fill(0) }
  ],
  savingRows: [
    { id: 'sav-1', label: '적금', values: initMonths(1300000, 1300000) },
    { id: 'sav-2', label: '데이트비(여행)', values: Array(12).fill(0) },
    { id: 'sav-3', label: '자동차/병원비채우기', values: initMonths(250000, 250000) },
    { id: 'sav-4', label: '행사비', values: initMonths(200000, 400000) },
    { id: 'sav-5', label: '투자', values: initMonths(1500000, 1125050) }
  ],
  expenseRows: [
    { id: 'exp-1', label: '식비', values: initMonths(910000, 910000) },
    { id: 'exp-2', label: '화장품비', values: initMonths(90000, 90000) },
    { id: 'exp-3', label: '용돈', values: initMonths(1400000, 1400000) },
    { id: 'exp-4', label: '데이트비', values: initMonths(300000, 300000) },
    { id: 'exp-5', label: '고정지출', values: initMonths(1100000, 1100000) },
    { id: 'exp-6', label: '비고정지출', values: Array(12).fill(0) },
    { id: 'exp-7', label: '비상금', values: Array(12).fill(0) }
  ]
})

export function useBudget() {
  const loadSavedData = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          balanceList: parsed.balanceList || getDefaultData().balanceList,
          incomeRows: parsed.incomeRows || getDefaultData().incomeRows,
          savingRows: parsed.savingRows || getDefaultData().savingRows,
          expenseRows: parsed.expenseRows || getDefaultData().expenseRows
        }
      }
    } catch (e) {
      console.error('Failed to load budget data from localStorage', e)
    }
    return getDefaultData()
  }

  const initialData = loadSavedData()
  const balanceList = ref(initialData.balanceList)
  const incomeRows = ref(initialData.incomeRows)
  const savingRows = ref(initialData.savingRows)
  const expenseRows = ref(initialData.expenseRows)

  watch(
    [balanceList, incomeRows, savingRows, expenseRows],
    () => {
      try {
        const payload = {
          balanceList: balanceList.value,
          incomeRows: incomeRows.value,
          savingRows: savingRows.value,
          expenseRows: expenseRows.value
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      } catch (e) {
        console.error('Failed to save budget data', e)
      }
    },
    { deep: true }
  )

  const totalBalance = computed(() => {
    return balanceList.value.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0)
  })

  const totalIncomeByMonth = computed(() => {
    return Array.from({ length: 12 }, (_, colIdx) => {
      return incomeRows.value.reduce((sum, row) => sum + (Number(row.values[colIdx]) || 0), 0)
    })
  })

  const totalSavingsByMonth = computed(() => {
    return Array.from({ length: 12 }, (_, colIdx) => {
      return savingRows.value.reduce((sum, row) => sum + (Number(row.values[colIdx]) || 0), 0)
    })
  })

  const totalExpensesByMonth = computed(() => {
    return Array.from({ length: 12 }, (_, colIdx) => {
      return expenseRows.value.reduce((sum, row) => sum + (Number(row.values[colIdx]) || 0), 0)
    })
  })

  const netBalanceByMonth = computed(() => {
    return Array.from({ length: 12 }, (_, colIdx) => {
      const income = totalIncomeByMonth.value[colIdx] || 0
      const savings = totalSavingsByMonth.value[colIdx] || 0
      const expenses = totalExpensesByMonth.value[colIdx] || 0
      return income - savings - expenses
    })
  })

  const annualIncomeTotal = computed(() => {
    return totalIncomeByMonth.value.reduce((a, b) => a + b, 0)
  })

  const annualSavingsTotal = computed(() => {
    return totalSavingsByMonth.value.reduce((a, b) => a + b, 0)
  })

  const annualExpensesTotal = computed(() => {
    return totalExpensesByMonth.value.reduce((a, b) => a + b, 0)
  })

  const annualNetTotal = computed(() => {
    return annualIncomeTotal.value - annualSavingsTotal.value - annualExpensesTotal.value
  })

  const getRowTotal = (row) => {
    if (!row || !row.values) return 0
    return row.values.reduce((sum, v) => sum + (Number(v) || 0), 0)
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

  const addRow = (section) => {
    const newRow = {
      id: section + '-' + Date.now(),
      label: '새 항목',
      values: Array(12).fill(0)
    }
    if (section === 'income') incomeRows.value.push(newRow)
    else if (section === 'saving') savingRows.value.push(newRow)
    else if (section === 'expense') expenseRows.value.push(newRow)
  }

  const removeRow = (section, index) => {
    if (section === 'income') incomeRows.value.splice(index, 1)
    else if (section === 'saving') savingRows.value.splice(index, 1)
    else if (section === 'expense') expenseRows.value.splice(index, 1)
  }

  const fillRowAcrossMonths = (row, startMonthIdx = 0) => {
    const val = Number(row.values[startMonthIdx]) || 0
    for (let i = startMonthIdx; i < 12; i++) {
      row.values[i] = val
    }
  }

  const resetToZero = () => {
    if (confirm('모든 수치 데이터를 0으로 초기화하시겠습니까?')) {
      balanceList.value.forEach(item => item.amount = 0)
      incomeRows.value.forEach(r => r.values.fill(0))
      savingRows.value.forEach(r => r.values.fill(0))
      expenseRows.value.forEach(r => r.values.fill(0))
    }
  }

  const resetToDefaultSample = () => {
    if (confirm('초기 샘플 데이터로 복원하시겠습니까? 현재 입력된 내용은 덮어씌워집니다.')) {
      const def = getDefaultData()
      balanceList.value = def.balanceList
      incomeRows.value = def.incomeRows
      savingRows.value = def.savingRows
      expenseRows.value = def.expenseRows
    }
  }

  const exportToJson = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      balanceList: balanceList.value,
      incomeRows: incomeRows.value,
      savingRows: savingRows.value,
      expenseRows: expenseRows.value
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'honey-budget-' + new Date().toISOString().slice(0, 10) + '.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importFromJson = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result)
          if (parsed.incomeRows && parsed.savingRows && parsed.expenseRows) {
            balanceList.value = parsed.balanceList || []
            incomeRows.value = parsed.incomeRows
            savingRows.value = parsed.savingRows
            expenseRows.value = parsed.expenseRows
            resolve(true)
          } else {
            alert('유효하지 않은 백업 파일 형식입니다.')
            reject(new Error('Invalid JSON structure'))
          }
        } catch (err) {
          alert('JSON 파일을 파싱하는 데 실패했습니다.')
          reject(err)
        }
      }
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  const exportToCsv = () => {
    const headers = ['구분', '항목', ...Array.from({ length: 12 }, (_, i) => (i + 1) + '월'), '연간 합계']
    const rows = []

    incomeRows.value.forEach(row => {
      rows.push(['수입', row.label, ...row.values, getRowTotal(row)])
    })
    rows.push(['총계', '총 수입', ...totalIncomeByMonth.value, annualIncomeTotal.value])

    savingRows.value.forEach(row => {
      rows.push(['저축및투자', row.label, ...row.values, getRowTotal(row)])
    })
    rows.push(['총계', '총 저축액', ...totalSavingsByMonth.value, annualSavingsTotal.value])

    expenseRows.value.forEach(row => {
      rows.push(['지출', row.label, ...row.values, getRowTotal(row)])
    })
    rows.push(['총계', '총 지출', ...totalExpensesByMonth.value, annualExpensesTotal.value])

    rows.push(['결과', '순 잔여/차액', ...netBalanceByMonth.value, annualNetTotal.value])

    const csvContent = '\uFEFF' + [headers, ...rows].map(e => e.map(val => '"' + val + '"').join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'honey-budget-' + new Date().toISOString().slice(0, 10) + '.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatNumber = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '0'
    return Number(val).toLocaleString('ko-KR')
  }

  const formatCurrency = (val) => {
    return formatNumber(val) + '원'
  }

  return {
    balanceList,
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
    addBalanceItem,
    removeBalanceItem,
    addRow,
    removeRow,
    fillRowAcrossMonths,
    resetToZero,
    resetToDefaultSample,
    exportToJson,
    importFromJson,
    exportToCsv,
    formatNumber,
    formatCurrency
  }
}