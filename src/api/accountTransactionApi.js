/**
 * ============================================================================
 * @file        accountTransactionApi.js
 * @layer       API Client Layer (Spring의 FeignClient / RestTemplate 역할)
 * @role        월별 소비내역(생활비/식비, 고정비, 자동차/병원비) 일자별 지출 CRUD API 클라이언트
 * @spring      백엔드 연동 정보:
 *              - Entity     : com.honeybudget.account.domain.AccountTransaction
 *              - Base URI   : /api/v1/account-transactions
 *              - 주요 컬럼  : id, accountId, yearMonth(YYYY-MM), transactionDate(YYYY-MM-DD), amount, description, memo
 * @fallback    백엔드 컨트롤러가 아직 띄워지지 않았거나 오프라인일 때도 화면이 정상 동작하도록
 *              try-catch 내부에서 브라우저 localStorage로 자동 폴백(Fallback) 처리합니다.
 * ============================================================================
 */

const BASE_URL = '/api/v1/account-transactions'
const STORAGE_KEY = 'honey-budget-transactions-v1'

// ============================================================================
// [INTERNAL] 로컬 스토리지 폴백(Fallback) 헬퍼 함수
// ============================================================================

/**
 * 로컬 스토리지에서 소비내역 목록을 읽어오며, 최초 실행 시 엑셀 기반 샘플 데이터를 반환합니다.
 * @returns {Array<object>} 거래 내역 배열
 */
const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to load transactions from localStorage', e)
  }
  // 최초 접속 시 노출할 기본 샘플 데이터 ('2026 가계.xlsx' 1월 시트 기준)
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

/**
 * 소비내역 배열을 로컬 스토리지에 직렬화하여 저장합니다.
 * @param {Array<object>} list - 저장할 거래 내역 배열
 */
const saveToStorage = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch (e) {
    console.error('Failed to save transactions to localStorage', e)
  }
}

/**
 * 백엔드 API 오류 응답 본문에서 사용자에게 노출할 메시지를 추출합니다.
 * JSON 응답이 아닌 경우(HTML 404/502 등) null을 반환하여 localStorage 폴백을 허용합니다.
 * @param {Response} res - fetch 응답 객체
 * @returns {Promise<string|null>} 추출된 에러 메시지 또는 null
 */
const parseApiError = async (res) => {
  try {
    const json = await res.json()
    if (json && typeof json === 'object') {
      return json.message || json.error || json.data?.message || `요청 처리에 실패했습니다. (HTTP ${res.status})`
    }
  } catch {
    // JSON 본문이 없으면 미구현/프록시 오류로 간주하고 폴백 진행
  }
  return null
}

/**
 * REST API 변경 요청(POST/PUT/DELETE)을 실행합니다.
 * 서버가 JSON 유효성/도메인 오류를 반환하면 예외를 던지고, 네트워크 오류 시 null을 반환합니다.
 * @param {string} url - 요청 URL
 * @param {RequestInit} options - fetch 옵션
 * @returns {Promise<{ data: any } | null>}
 */
const sendApiRequest = async (url, options) => {
  let res = null
  try {
    res = await fetch(url, options)
  } catch {
    return null
  }

  if (res.ok) {
    if (res.status === 204) return { data: true }
    let json = null
    try {
      json = await res.json()
    } catch {
      return { data: true }
    }
    return { data: json?.data !== undefined ? json.data : json }
  }

  const errMsg = await parseApiError(res)
  if (errMsg) {
    throw new Error(errMsg)
  }
  return null
}

// ============================================================================
// [PUBLIC API] 외부(Composable)에서 호출하는 REST API 메소드
// ============================================================================

export const accountTransactionApi = {
  /**
   * [월별/계좌별 소비내역 목록 조회]
   * @http        GET /api/v1/account-transactions?yearMonth={YYYY-MM}&accountId={id}
   * @param       {{ yearMonth?: string, accountId?: number|string }} params - 검색 조건
   * @returns     {Promise<Array<object>>} 일자 역순(최신순) 정렬된 소비내역 리스트
   */
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
      // 서버 미구현 또는 네트워크 오류 시 localStorage 폴백 진행
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

  /**
   * [신규 소비내역 단건 등록]
   * @http        POST /api/v1/account-transactions
   * @param       {object} payload - { accountId, accountName, yearMonth, transactionDate, amount, description, memo }
   * @returns     {Promise<object>} 등록된 소비내역 객체
   */
  async createTransaction(payload) {
    const result = await sendApiRequest(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    })
    if (result) return result.data

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

  /**
   * [기존 소비내역 단건 수정]
   * @http        PUT /api/v1/account-transactions/{id}
   * @param       {number|string} id - 수정할 거래 내역 PK
   * @param       {object} payload - 수정할 필드 객체
   * @returns     {Promise<object>} 수정 완료된 소비내역 객체
   */
  async updateTransaction(id, payload) {
    const result = await sendApiRequest(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    })
    if (result) return result.data

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

  /**
   * [소비내역 단건 삭제]
   * @http        DELETE /api/v1/account-transactions/{id}
   * @param       {number|string} id - 삭제할 거래 내역 PK
   * @returns     {Promise<boolean>} 삭제 성공 여부(true)
   */
  async deleteTransaction(id) {
    const result = await sendApiRequest(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' }
    })
    if (result) return true

    let all = loadFromStorage()
    all = all.filter((t) => t.id !== id)
    saveToStorage(all)
    return true
  }
}
