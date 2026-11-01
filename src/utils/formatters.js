/**
 * @file formatters.js
 * @description 숫자, 통화, 일자 및 그룹 분류 유틸리티 함수
 * 백엔드 개발자 참고:
 * - Java의 DecimalFormat, NumberFormat, DateTimeFormatter와 동일한 포맷터 역할을 합니다.
 */

/**
 * 숫자를 한국어 3자리 콤마 포맷(예: 1,000,000)으로 변환
 * @param {number|string|null|undefined} val
 * @returns {string}
 */
export const formatNumber = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0'
  return Number(val).toLocaleString('ko-KR')
}

/**
 * 숫자를 한국 원화 형식(예: 1,000,000원)으로 변환
 * @param {number|string|null|undefined} val
 * @returns {string}
 */
export const formatCurrency = (val) => {
  return `${formatNumber(val)}원`
}

/**
 * 카테고리 그룹명으로 명세표 구간(type)을 분류한다.
 * (예: "수입" -> income, "저축 및 투자" -> saving, "지출" -> expense)
 * @param {string} name 
 * @returns {'income' | 'saving' | 'expense' | 'other'}
 */
export const classifyGroup = (name = '') => {
  if (name.includes('수입')) return 'income'
  if (name.includes('저축') || name.includes('투자')) return 'saving'
  if (name.includes('지출')) return 'expense'
  return 'other'
}

/**
 * 백엔드 Map 객체({ "1": 금액, ... "12": 금액 })를 12개 인덱스 배열로 변환
 * @param {Record<string|number, number>} amountsMap 
 * @returns {number[]} 12개 월별 숫자 배열
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
 * 12개 인덱스 배열을 백엔드 Map 객체({ 1: 금액, ... 12: 금액 })로 변환
 * @param {number[]} values 
 * @returns {Record<number, number>}
 */
export const toAmountsMap = (values) => {
  const map = {}
  for (let m = 1; m <= 12; m++) {
    map[m] = Number(values[m - 1]) || 0
  }
  return map
}

