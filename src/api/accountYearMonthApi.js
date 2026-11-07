/**
 * ============================================================================
 * @file        accountYearMonthApi.js
 * @layer       API Client Layer (Spring의 FeignClient / RestTemplate 역할)
 * @role        연간 수입/저축/지출 명세표의 계좌별 1~12월 금액 조회·등록·수정 REST API 호출
 * @spring      백엔드 연동 정보:
 *              - Controller : com.honeybudget.account.controller.AccountYearMonthController
 *              - Base URI   : /api/v1/account-year-months
 *              - Entity     : com.honeybudget.account.domain.AccountYearMonth
 * ============================================================================
 */

const BASE_URL = '/api/v1/account-year-months'

/**
 * [공통 HTTP Fetch 래퍼 함수]
 * @description 백엔드의 공통 응답 포맷(ApiResponse { success, data, message })을 벗겨내어
 *              실제 data 본문만 반환하고, HTTP 에러 발생 시 예외(Error)를 던집니다.
 * @param       {string} url - 요청 엔드포인트 경로
 * @param       {RequestInit} options - HTTP 메소드, 헤더, 바디 옵션
 * @returns     {Promise<any>} 응답 JSON의 data 필드
 */
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
  /**
   * [연도별 전체 계좌 1~12월 금액 목록 조회]
   * @http        GET /api/v1/account-year-months?year={year}
   * @param       {number} year - 조회할 회계연도 (예: 2026)
   * @returns     {Promise<Array<{id: number, accountId: number, year: number, amounts: Record<number, number>}>>}
   */
  async fetchByYear(year) {
    const data = await request(`${BASE_URL}?year=${encodeURIComponent(year)}`)
    return Array.isArray(data) ? data : []
  },

  /**
   * [신규 계좌의 연간 월별 금액 최초 등록]
   * @description 해당 연도에 아직 DB 레코드(AccountYearMonth)가 없는 계좌의 금액을 최초 저장할 때 호출합니다.
   * @http        POST /api/v1/account-year-months
   * @param       {{ accountId: number, year: number, amounts: Record<number, number> }} payload
   * @returns     {Promise<object>} 생성된 AccountYearMonth 응답 객체 (생성된 id 포함)
   */
  async create({ accountId, year, amounts }) {
    return request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({ accountId, year, amounts })
    })
  },

  /**
   * [기존 계좌의 연간 월별 금액 수정]
   * @description 이미 DB 레코드(id)가 존재하는 계좌의 1~12월 금액을 업데이트할 때 호출합니다.
   * @http        PUT /api/v1/account-year-months/{id}
   * @param       {number} id - AccountYearMonth 테이블의 PK (account_yearmonth_id)
   * @param       {Record<number, number>} amounts - 수정할 월별 금액 맵 ({ 1: 금액, ..., 12: 금액 })
   * @returns     {Promise<object>} 수정된 AccountYearMonth 응답 객체
   */
  async update(id, amounts) {
    return request(`${BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ amounts })
    })
  }
}
