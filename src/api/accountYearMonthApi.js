/**
 * 연간 수입/저축/지출 명세표 (계좌별 월별 금액) REST API 클라이언트
 * 백엔드 REST API 명세:
 * - AccountYearMonthController: /api/v1/account-year-months
 *   - GET  ?year=&accountId=  목록 조회 (둘 다 없으면 올해 전체 계좌)
 *   - POST                    등록 { accountId, year, amounts: { 1..12: 금액 } }
 *   - PUT  /{id}              수정 { amounts: { 월: 금액 } } (포함된 월만 수정)
 */

const BASE_URL = '/api/v1/account-year-months'

const request = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers
    },
    ...options
  })

  let json = null
  try {
    json = await res.json()
  } catch (err) {
    if (!res.ok) {
      throw new Error(`API 요청 실패 (HTTP ${res.status}): ${url}`)
    }
    return null
  }

  if (!res.ok || (json && json.success === false)) {
    throw new Error(json?.message || `API 요청 실패 (HTTP ${res.status}): ${url}`)
  }

  return json?.data !== undefined ? json.data : json
}

export const accountYearMonthApi = {
  // 연도별 전체 계좌 월별 금액 조회
  async fetchByYear(year) {
    const data = await request(`${BASE_URL}?year=${encodeURIComponent(year)}`)
    return Array.isArray(data) ? data : []
  },

  // 계좌+연도 월별 금액 등록
  async create({ accountId, year, amounts }) {
    return request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({ accountId, year, amounts })
    })
  },

  // 월별 금액 수정
  async update(id, { amounts }) {
    return request(`${BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ amounts })
    })
  }
}

