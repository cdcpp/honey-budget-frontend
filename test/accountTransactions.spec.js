import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { useAccountTransactions } from '../src/composables/useAccountTransactions'
import MonthlyTransactionsView from '../src/components/transactions/MonthlyTransactionsView.vue'

describe('월별 소비내역 (AccountTransaction & 2026 가계.xlsx 연동)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal(
      'fetch',
      vi.fn((url, options = {}) => {
        const method = options.method || 'GET'

        if (url.includes('/api/v1/category-groups')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                success: true,
                data: [
                  {
                    id: 3,
                    categoryGroupName: '지출',
                    categories: [
                      {
                        id: 30,
                        categoryName: '생활비',
                        accounts: [{ id: 301, accountName: '생활비(식비)' }]
                      }
                    ]
                  }
                ]
              })
          })
        }

        if (url.includes('/api/v1/account-transactions')) {
          if (method === 'GET') {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: () =>
                Promise.resolve({
                  success: true,
                  data: [
                    {
                      id: 1,
                      accountId: 301,
                      accountName: '생활비(식비)',
                      yearMonth: '2026-01',
                      transactionDate: '2026-01-05',
                      amount: 18990,
                      description: '네이버 올리브유',
                      memo: '식재료'
                    },
                    {
                      id: 2,
                      accountId: null,
                      accountName: '자동차/병원비',
                      yearMonth: '2026-01',
                      transactionDate: '2026-01-05',
                      amount: 61000,
                      description: 'GS칼텍스 주유',
                      memo: '주유'
                    }
                  ]
                })
            })
          }
          if (method === 'POST') {
            const body = JSON.parse(options.body)
            return Promise.resolve({
              ok: true,
              status: 201,
              json: () => Promise.resolve({ success: true, data: { id: 99, ...body } })
            })
          }
          if (method === 'PUT') {
            const body = JSON.parse(options.body)
            return Promise.resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({ success: true, data: { id: 1, ...body } })
            })
          }
          if (method === 'DELETE') {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({ success: true, message: 'Deleted' })
            })
          }
        }

        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ success: true, data: [] }) })
      })
    )
  })

  it('1. composable: 연월 네비게이션 및 소비내역 합계 계산 검증', async () => {
    const transactions = useAccountTransactions()
    transactions.setYearMonth(2026, 1)
    await flushPromises()

    expect(transactions.currentYearMonth.value).toBe('2026-01')
    expect(transactions.periodLabel.value).toContain('1월 5일 ~ 2월 4일')
    expect(transactions.transactions.value.length).toBe(2)
    expect(transactions.totalMonthAmount.value).toBe(18990 + 61000)
    expect(transactions.accountTotals.value['생활비(식비)']).toBe(18990)
    expect(transactions.accountTotals.value['자동차/병원비']).toBe(61000)

    // 다음 달 이동
    transactions.nextMonth()
    expect(transactions.currentYearMonth.value).toBe('2026-02')
  })

  it('2. composable: 소비 내역 등록 및 삭제 검증', async () => {
    const transactions = useAccountTransactions()
    transactions.setYearMonth(2026, 1)
    await flushPromises()

    await transactions.addTransaction({
      accountId: 301,
      accountName: '생활비(식비)',
      transactionDate: '2026-01-08',
      amount: 15000,
      description: '우영마트',
      memo: '간식'
    })

    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/account-transactions',
      expect.objectContaining({
        method: 'POST'
      })
    )

    await transactions.removeTransaction(1)
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/account-transactions/1',
      expect.objectContaining({
        method: 'DELETE'
      })
    )
  })

  it('3. MonthlyTransactionsView: 화면 렌더링 및 주요 UI 요소 검증', async () => {
    const wrapper = mount(MonthlyTransactionsView)
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('월별 소비내역')
    expect(text).toContain('생활비(식비)')
    expect(text).toContain('자동차/병원비')
    expect(text).toContain('네이버 올리브유')
    expect(text).toContain('GS칼텍스 주유')
    expect(text).toContain('빠른 소비내역 추가')
  })
})

