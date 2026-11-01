import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { useBudget } from '../src/composables/useBudget'
import BudgetTable from '../src/components/BudgetTable.vue'

const ok = (data) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ success: true, data }) })

describe('월간 예산 플래너 - AccountYearMonth 연동 명세표', () => {
  let createdPayloads = []
  let updatedPayloads = []

  beforeEach(() => {
    localStorage.clear()
    createdPayloads = []
    updatedPayloads = []

    vi.stubGlobal(
      'fetch',
      vi.fn((url, options = {}) => {
        const method = options.method || 'GET'

        if (url.includes('/api/v1/category-groups')) {
          return ok([
            { id: 1, categoryGroupCode: '100', categoryGroupName: '수입' },
            { id: 2, categoryGroupCode: '200', categoryGroupName: '저축 및 투자' },
            { id: 3, categoryGroupCode: '300', categoryGroupName: '지출' }
          ])
        }
        if (url.includes('/api/v1/categories')) {
          return ok([
            { id: 10, categoryGroupId: 1, categoryCode: '101', categoryName: '급여' },
            { id: 20, categoryGroupId: 2, categoryCode: '201', categoryName: '적금' },
            { id: 30, categoryGroupId: 3, categoryCode: '301', categoryName: '생활비' }
          ])
        }
        if (url.includes('/api/v1/accounts')) {
          return ok([
            { id: 100, categoryId: 10, accountName: '월급 통장', institutionName: 'A', accountNumber: '-', balance: 0, useYn: true },
            { id: 200, categoryId: 20, accountName: '자유적금', institutionName: 'B', accountNumber: '-', balance: 0, useYn: true },
            { id: 300, categoryId: 30, accountName: '식비', institutionName: 'C', accountNumber: '-', balance: 0, useYn: true }
          ])
        }
        if (url.includes('/api/v1/account-year-months')) {
          if (method === 'GET') {
            return ok([
              {
                id: 501,
                accountId: 100,
                year: 2026,
                amounts: { 1: 3000000, 2: 3000000, 3: 3000000, 4: 3000000, 5: 3000000, 6: 3000000, 7: 3000000, 8: 3000000, 9: 3000000, 10: 3000000, 11: 3000000, 12: 3000000 }
              }
            ])
          }
          if (method === 'POST') {
            const body = JSON.parse(options.body)
            createdPayloads.push(body)
            return ok({ id: 999, ...body })
          }
          if (method === 'PUT') {
            const body = JSON.parse(options.body)
            updatedPayloads.push(body)
            return ok({ id: 501, ...body })
          }
        }
        return Promise.reject(new Error('Unknown url: ' + url))
      })
    )
  })

  const mountPlanner = () => {
    let budgetInstance = null
    const wrapper = mount(
      defineComponent({
        setup() {
          const budget = useBudget()
          budgetInstance = budget
          return () =>
            h(BudgetTable, {
              sections: budget.sections.value,
              loading: budget.loading.value,
              error: budget.error.value,
              year: budget.year.value,
              yearLoading: budget.yearLoading.value,
              saving: budget.saving.value,
              saveError: budget.saveError.value,
              saveMessage: budget.saveMessage.value,
              dirtyCount: budget.dirtyCount.value,
              totalIncomeByMonth: budget.totalIncomeByMonth.value,
              totalSavingsByMonth: budget.totalSavingsByMonth.value,
              totalExpensesByMonth: budget.totalExpensesByMonth.value,
              annualIncomeTotal: budget.annualIncomeTotal.value,
              annualSavingsTotal: budget.annualSavingsTotal.value,
              annualExpensesTotal: budget.annualExpensesTotal.value,
              getRowTotal: budget.getRowTotal,
              getCategoryMonthTotal: budget.getCategoryMonthTotal,
              getCategoryTotal: budget.getCategoryTotal,
              fillRowAcrossMonths: budget.fillRowAcrossMonths,
              formatNumber: budget.formatNumber,
              onChangeYear: budget.changeYear,
              onSave: budget.saveAmounts
            })
        }
      })
    )
    return { wrapper, budget: budgetInstance }
  }

  it('1. 그룹은 구간, 카테고리는 소제목, 계좌는 행으로 표시되고 서버 월별 금액을 조회한다', async () => {
    const { wrapper, budget } = mountPlanner()
    await flushPromises()

    const text = wrapper.text()
    for (const label of ['수입', '저축 및 투자', '지출', '급여', '적금', '생활비', '월급 통장', '자유적금', '식비']) {
      expect(text).toContain(label)
    }
    expect(text).toContain('총 수입')
    expect(text).toContain('총 저축액')
    expect(text).toContain('총 지출')
    expect(text).not.toContain('순 잉여 자금')

    // 월급 통장의 월별 금액 3,000,000원이 조회되어 연간 36,000,000원으로 계산되는지 확인
    expect(budget.annualIncomeTotal.value).toBe(36000000)
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/account-year-months?year=2026'), expect.any(Object))
  })

  it('2. 신규 계좌 금액 수정 시 POST로 등록되고, 기존 계좌 금액 수정 시 PUT으로 수정된다', async () => {
    const { budget } = mountPlanner()
    await flushPromises()

    // 1) 기존 계좌 (id: 100)의 1월 금액을 350만원으로 수정
    const incomeRow = budget.sections.value[0].categories[0].rows[0]
    incomeRow.values[0] = 3500000

    // 2) 신규 계좌 (id: 300, 식비)의 1월 금액을 50만원으로 입력
    const expenseRow = budget.sections.value[2].categories[0].rows[0]
    expenseRow.values[0] = 500000

    expect(budget.dirtyCount.value).toBe(2)

    await budget.saveAmounts()
    await flushPromises()

    // PUT 호출 (id: 501 수정)
    expect(fetch).toHaveBeenCalledWith('/api/v1/account-year-months/501', expect.objectContaining({ method: 'PUT' }))
    // POST 호출 (accountId: 300 신규 등록)
    expect(fetch).toHaveBeenCalledWith('/api/v1/account-year-months', expect.objectContaining({ method: 'POST' }))
  })
})
