/**
 * 계좌별 일자 거래(지출) 내역 REST API 클라이언트
 * 엔티티: com.honeybudget.domain.AccountTransaction
 * 필드: id, accountId, yearMonth (YYYY-MM), transactionDate (YYYY-MM-DD), amount, description, memo
 * 
 * 백엔드 REST API 규격:
 * - GET  /api/v1/account-transactions?yearMonth=YYYY-MM&accountId=
 * - POST /api/v1/account-transactions
 * - PUT  /api/v1/account-transactions/{id}
 * - DELETE /api/v1/account-transactions/{id}
 * 
 * ※ 백엔드 API 미구현 시 localStorage로 자동 fallback하여 즉시 사용 가능하도록 처리합니다.
 */

const BASE_URL = '/api/v1/account-transactions'
const STORAGE_KEY = 'honey-budget-transactions-v1'

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to load transactions from localStorage', e)
  }
  // 기본 샘플 데이터 (2026 가계.xlsx 1월 시트 기반)
  return [
    {
      id: 1,
      accountId: null,
      accountName: '생활비(식비)',
      yearMonth: '2026-01',
      transactionDate: '2026-01-05',
      amount: 18990,
      description: '네이버 (포마스 올리브유)',
      memo: '식재료'
    },
    {
      id: 2,
      accountId: null,
      accountName: '생활비(식비)',
      yearMonth: '2026-01',
      transactionDate: '2026-01-05',
      amount: 39000,
      description: '강릉 외식',
      memo: '주말 외식'
    },
    {
      id: 3,
      accountId: null,
      accountName: '자동차/병원비',
      yearMonth: '2026-01',
      transactionDate: '2026-01-05',
      amount: 61000,
      description: 'GS칼텍스 주유',
      memo: '주유'
    },
    {
      id: 4,
      accountId: null,
      accountName: '자동차/병원비',
      yearMonth: '2026-01',
      transactionDate: '2026-01-05',
      amount: 50000,
      description: '하이패스 충전',
      memo: '교통비'
    },
    {
      id: 5,
      accountId: null,
      accountName: '자동차/병원비',
      yearMonth: '2026-01',
      transactionDate: '2026-01-05',
      amount: 20000,
      description: '병원 진료비',
      memo: '이비인후과'
    },
    {
      id: 6,
      accountId: null,
      accountName: '고정비',
      yearMonth: '2026-01',
      transactionDate: '2026-01-10',
      amount: 120000,
      description: '통신비 (휴대폰/인터넷)',
      memo: '자동이체'
    }
  ]
}

const saveToStorage = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch (e) {
    console.error('Failed to save transactions to localStorage', e)
  }
}

export const accountTransactionApi = {
  async fetchTransactions({ yearMonth, accountId } = {}) {
    try {
      let query = []
      if (yearMonth) query.push(`yearMonth=${encodeURIComponent(yearMonth)}`)
      if (accountId) query.push(`accountId=${encodeURIComponent(accountId)}`)
      const qs = query.length ? `?${query.join('&')}` : ''

      const res = await fetch(`${BASE_URL}${qs}`, {
        headers: { Accept: 'application/json' }
      })
      if (res.ok) {
        const json = await res.json()
        const data = json?.data !== undefined ? json.data : json
        if (Array.isArray(data)) return data
      }
    } catch (err) {
      // 서버 미구현 또는 네트워크 오류 시 localStorage fallback
    }

    let all = loadFromStorage()
    if (yearMonth) {
      all = all.filter((t) => t.yearMonth === yearMonth)
    }
    if (accountId) {
      all = all.filter((t) => String(t.accountId) === String(accountId))
    }
    return all.sort((a, b) => (b.transactionDate || '').localeCompare(a.transactionDate || ''))
  },

  async createTransaction(payload) {
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        const json = await res.json()
        return json?.data !== undefined ? json.data : json
      }
    } catch (err) {
      // localStorage fallback
    }

    const all = loadFromStorage()
    const newTrans = {
      id: Date.now(),
      accountId: payload.accountId || null,
      accountName: payload.accountName || '',
      yearMonth: payload.yearMonth || (payload.transactionDate ? payload.transactionDate.substring(0, 7) : ''),
      transactionDate: payload.transactionDate,
      amount: Number(payload.amount) || 0,
      description: payload.description,
      memo: payload.memo || ''
    }
    all.unshift(newTrans)
    saveToStorage(all)
    return newTrans
  },

  async updateTransaction(id, payload) {
    try {
      const res = await fetch(`${BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        const json = await res.json()
        return json?.data !== undefined ? json.data : json
      }
    } catch (err) {
      // localStorage fallback
    }

    const all = loadFromStorage()
    const idx = all.findIndex((t) => t.id === id)
    if (idx !== -1) {
      all[idx] = {
        ...all[idx],
        ...payload,
        amount: payload.amount !== undefined ? Number(payload.amount) : all[idx].amount,
        yearMonth: payload.transactionDate ? payload.transactionDate.substring(0, 7) : all[idx].yearMonth
      }
      saveToStorage(all)
      return all[idx]
    }
    throw new Error('수정할 거래 내역을 찾을 수 없습니다.')
  },

  async deleteTransaction(id) {
    try {
      const res = await fetch(`${BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' }
      })
      if (res.ok) return true
    } catch (err) {
      // localStorage fallback
    }

    let all = loadFromStorage()
    all = all.filter((t) => t.id !== id)
    saveToStorage(all)
    return true
  }
}

