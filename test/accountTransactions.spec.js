import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { useAccountTransactions } from '../src/composables/useAccountTransactions'
import { useAccountClassification } from '../src/composables/useAccountClassification'
import MonthlyTransactionsView from '../src/components/transactions/MonthlyTransactionsView.vue'

describe('월별 소비내역 (AccountTransaction & 2026 가계.xlsx 연동)', () => {
  beforeEach(() => {
    localStorage.clear()
    useAccountClassification().groups.value = []
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
                  { id: 1, categoryGroupName: '수입' },
                  { id: 3, categoryGroupName: '지출' }
                ]
              })
          })
        }

        if (url.includes('/api/v1/categories')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                success: true,
                data: [
                  { id: 10, categoryGroupId: 1, categoryName: '급여' },
                  { id: 30, categoryGroupId: 3, categoryName: '생활비' }
                ]
              })
          })
        }

        if (url.includes('/api/v1/accounts')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                success: true,
                data: [
                  {
                    id: 101,
                    categoryId: 10,
                    accountName: '다혜월급',
                    institutionName: '국민은행',
                    isSpendingVisible: false,
                    useYn: true
                  },
                  {
                    id: 102,
                    categoryId: 10,
                    accountName: '태훈월급',
                    institutionName: '신한은행',
                    isSpendingVisible: false,
                    useYn: true
                  },
                  {
                    id: 301,
                    categoryId: 30,
                    accountName: '토스 생활비',
                    institutionName: '토스뱅크',
                    isSpendingVisible: true,
                    useYn: true
                  },
                  {
                    id: 302,
                    categoryId: 30,
                    accountName: '부부 공용카드',
                    institutionName: '현대카드',
                    isSpendingVisible: true,
                    useYn: true
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

  it('3. MonthlyTransactionsView: 소비내역 출력(isSpendingVisible=true) 계좌만 요약 카드·선택·탭에 출력된다', async () => {
    const wrapper = mount(MonthlyTransactionsView)
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('월별 소비내역')
    expect(text).toContain('네이버 올리브유')
    expect(text).toContain('GS칼텍스 주유')
    expect(text).toContain('빠른 소비내역 추가')

    // isSpendingVisible=true 계좌는 요약 카드, select, 필터 탭에 출력되어야 함
    expect(text).toContain('토스 생활비')
    expect(text).toContain('부부 공용카드')

    // isSpendingVisible=false 계좌(다혜월급/태훈월급) 및 기존 하드코딩 프리셋(고정비 등)은 출력되지 않아야 함
    expect(text).not.toContain('다혜월급')
    expect(text).not.toContain('태훈월급')
    expect(text).not.toContain('고정비')
    const optionTexts = wrapper.findAll('select option').map((o) => o.text())
    expect(optionTexts).toEqual(['토스 생활비', '부부 공용카드'])
  })

  it('4. MonthlyTransactionsView: 빠른 소비내역 추가 시 등록된 계좌 ID와 조회 월 날짜로 저장되고 입력값이 초기화된다', async () => {
    useAccountClassification().groups.value = []
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
                data: [{ id: 3, categoryGroupName: '지출' }]
              })
          })
        }
        if (url.includes('/api/v1/categories')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                success: true,
                data: [{ id: 30, categoryGroupId: 3, categoryName: '생활비' }]
              })
          })
        }
        if (url.includes('/api/v1/accounts')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                success: true,
                data: [
                  { id: 401, categoryId: 30, accountName: '다혜월급', isSpendingVisible: false, useYn: true },
                  { id: 501, categoryId: 30, accountName: '우리집 생활비', isSpendingVisible: true, useYn: true }
                ]
              })
          })
        }
        if (url.includes('/api/v1/account-transactions')) {
          if (method === 'POST') {
            const body = JSON.parse(options.body)
            return Promise.resolve({
              ok: true,
              status: 201,
              json: () => Promise.resolve({ success: true, data: { id: 101, ...body } })
            })
          }
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, data: [] })
          })
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ success: true, data: [] }) })
      })
    )

    const wrapper = mount(MonthlyTransactionsView)
    await flushPromises()

    const form = wrapper.find('form')
    const inputs = form.findAll('input')
    // inputs: [0]=date, [1]=description, [2]=amount, [3]=memo
    await inputs[1].setValue('스타벅스 커피')
    await inputs[2].setValue('5500')
    await inputs[3].setValue('간식')
    await form.trigger('submit')
    await flushPromises()

    const postCall = fetch.mock.calls.find(
      ([u, opts]) => u === '/api/v1/account-transactions' && opts?.method === 'POST'
    )
    expect(postCall).toBeTruthy()
    const payload = JSON.parse(postCall[1].body)
    expect(payload.accountId).toBe(501)
    expect(payload.accountName).toBe('우리집 생활비')
    expect(payload.description).toBe('스타벅스 커피')
    expect(payload.amount).toBe(5500)
    expect(payload.memo).toBe('간식')
    expect(payload.transactionDate).toMatch(/^2026-\d{2}-\d{2}$/)

    // 저장 완료 후 입력값 초기화 확인
    expect(inputs[1].element.value).toBe('')
    expect(inputs[2].element.value).toBe('')
    expect(inputs[3].element.value).toBe('')
  })

  it('5. accountTransactionApi: 서버 400 검증 오류 응답 시 localStorage로 삼키지 않고 예외를 발생시킨다', async () => {
    vi.stubGlobal('alert', vi.fn())
    vi.stubGlobal(
      'fetch',
      vi.fn((url, options = {}) => {
        if (url.includes('/api/v1/account-transactions') && options.method === 'POST') {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: () => Promise.resolve({ success: false, message: '계좌 ID는 필수입니다.' })
          })
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ success: true, data: [] }) })
      })
    )

    const transactions = useAccountTransactions()
    await flushPromises()

    await expect(
      transactions.addTransaction({
        accountId: null,
        accountName: '생활비(식비)',
        transactionDate: '2026-01-05',
        amount: 10000,
        description: '테스트'
      })
    ).rejects.toThrow('계좌 ID는 필수입니다.')
  })
})

