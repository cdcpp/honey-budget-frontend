/**
 * ============================================================================
 * @file        formatters.js
 * @layer       Utility Layer (Spring의 NumberFormat / DateTimeFormatter 유틸 클래스 역할)
 * @role        숫자 3자리 콤마 포맷팅, 원화(원) 표시, 백엔드 Map <-> 프론트 배열 간 데이터 구조 변환
 * @note        상태(State)를 가지지 않는 순수 함수(Pure Function)들로만 구성됩니다.
 * ============================================================================
 */

/**
 * [숫자 3자리 콤마 포맷터]
 * @description 숫자를 한국어 천 단위 구분 기호 문자열(예: 1,250,000)로 변환합니다.
 * @param       {number|string|null|undefined} val - 변환할 숫자 또는 숫자형 문자열
 * @returns     {string} 천 단위 콤마가 적용된 문자열 (유효하지 않은 값이면 '0')
 */
export const formatNumber = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0'
  return Number(val).toLocaleString('ko-KR')
}

/**
 * [원화(KRW) 통화 포맷터]
 * @description 숫자에 천 단위 콤마와 '원' 단위를 붙여 반환합니다. (예: 1,250,000원)
 * @param       {number|string|null|undefined} val - 변환할 금액
 * @returns     {string} '0,000원' 형식의 문자열
 */
export const formatCurrency = (val) => {
  return `${formatNumber(val)}원`
}

/**
 * [카테고리 그룹명 -> 명세표 구간 타입 분류기]
 * @description 백엔드에 등록된 대분류 그룹명(categoryGroupName)에 포함된 단어를 기준으로
 *              수입(income), 저축(saving), 지출(expense), 기타(other) 구간을 판별합니다.
 * @param       {string} name - 대분류 그룹명 (예: '수입', '저축 및 투자', '지출')
 * @returns     {'income' | 'saving' | 'expense' | 'other'} 구간 식별 코드
 */
export const classifyGroup = (name = '') => {
  if (name.includes('수입')) return 'income'
  if (name.includes('저축') || name.includes('투자')) return 'saving'
  if (name.includes('지출')) return 'expense'
  return 'other'
}

/**
 * [백엔드 월별 Map -> 프론트엔드 12개월 배열 변환기]
 * @description 백엔드 AccountYearMonth 응답의 amounts 객체({ "1": 3000000, ... "12": 3000000 })를
 *              화면 테이블 렌더링에 쓰이는 0~11 인덱스 배열(길이 12)로 변환합니다.
 * @param       {Record<string|number, number>} amountsMap - 백엔드에서 내려온 월별 금액 Map
 * @returns     {number[]} 길이 12의 숫자 배열 (index 0 = 1월, index 11 = 12월)
 */
export const toMonthArray = (amountsMap) => {
  const arr = Array(12).fill(0)
  if (amountsMap) {
    for (let m = 1; m <= 12; m++) {
      arr[m - 1] = Number(amountsMap[m]) || 0
    }
  }
  return arr
}

/**
 * [프론트엔드 12개월 배열 -> 백엔드 요청용 월별 Map 변환기]
 * @description 화면에서 편집한 길이 12짜리 금액 배열을 백엔드 POST/PUT 요청 DTO 규격인
 *              { 1: 금액, 2: 금액, ..., 12: 금액 } 형태의 Map 객체로 변환합니다.
 * @param       {number[]} values - 길이 12의 월별 금액 배열
 * @returns     {Record<number, number>} 1~12를 키로 갖는 월별 금액 객체
 */
export const toAmountsMap = (values) => {
  const map = {}
  for (let m = 1; m <= 12; m++) {
    map[m] = Number(values[m - 1]) || 0
  }
  return map
}
