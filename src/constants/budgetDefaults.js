/**
 * @file budgetDefaults.js
 * @description 예산 플래너(Budget Planner) 관련 비즈니스 기본값 및 상수 정의
 * 백엔드 개발자 참고:
 * - DB에 초기 데이터가 없거나 localStorage 초기화 시 사용할 기본 상수값입니다.
 */

export const STORAGE_KEYS = {
  CURRENT: 'honey-budget-data-v2',
  LEGACY: 'honey-budget-data-v1',
  TRANSACTIONS: 'honey-budget-transactions-v1'
}

// 화면 표시 순서: 수입 -> 저축 및 투자 -> 지출 -> 기타
export const TYPE_ORDER = ['income', 'saving', 'expense', 'other']

// 초기 비상금/자산 기본 항목
export const DEFAULT_BALANCE_LIST = [
  { id: 'bal-1', name: '비상금', amount: 0 },
  { id: 'bal-2', name: '차량비상금', amount: 0 },
  { id: 'bal-3', name: '행사비', amount: 0 },
  { id: 'bal-4', name: '예금', amount: 0 },
  { id: 'bal-5', name: '자유적금', amount: 0 }
]

// 12개월 0원 기본 배열 생성기
export const createEmptyMonths = () => Array(12).fill(0)

// 엑셀 시트(2026 가계.xlsx) 3대 기본 지출 프리셋 계좌
export const DEFAULT_ACCOUNT_PRESETS = [
  { id: 'preset-living', name: '생활비(식비)', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'preset-fixed', name: '고정비', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'preset-car-hospital', name: '자동차/병원비', badgeColor: 'bg-amber-50 text-amber-800 border-amber-200' }
]
