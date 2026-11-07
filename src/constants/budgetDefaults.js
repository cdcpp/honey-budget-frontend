/**
 * ============================================================================
 * @file        budgetDefaults.js
 * @layer       Constants Layer (Spring의 상수 클래스 / Enum / application.yml 기본값 역할)
 * @role        예산 플래너 및 소비내역에서 공통으로 참조하는 로컬스토리지 키, 정렬 순서, 초기 프리셋 정의
 * @note        초기 기본 항목이나 프리셋 이름을 변경하려면 이 파일만 수정하면 됩니다.
 * ============================================================================
 */

/**
 * 브라우저 로컬 스토리지(localStorage) 저장 키 목록
 * - 백엔드 연동 전이거나 브라우저 단독 데이터(비상금 목록 등)를 영구 보관할 때 사용합니다.
 */
export const STORAGE_KEYS = {
  CURRENT: 'honey-budget-data-v2',
  LEGACY: 'honey-budget-data-v1',
  TRANSACTIONS: 'honey-budget-transactions-v1'
}

/**
 * 연간 명세표 테이블의 대분류(구간) 화면 표시 순서
 * - 수입(income) -> 저축 및 투자(saving) -> 지출(expense) -> 기타(other) 순으로 정렬됩니다.
 */
export const TYPE_ORDER = ['income', 'saving', 'expense', 'other']

/**
 * 잔액 현황(BalanceSection) 카드에 최초 노출되는 기본 자산/비상금 목록
 */
export const DEFAULT_BALANCE_LIST = [
  { id: 'bal-1', name: '비상금', amount: 0 },
  { id: 'bal-2', name: '차량비상금', amount: 0 },
  { id: 'bal-3', name: '행사비', amount: 0 },
  { id: 'bal-4', name: '예금', amount: 0 },
  { id: 'bal-5', name: '자유적금', amount: 0 }
]

/**
 * 1월~12월(길이 12)까지 모두 0원으로 초기화된 새 배열을 생성하는 팩토리 함수
 * @returns {number[]} [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
 */
export const createEmptyMonths = () => Array(12).fill(0)

/**
 * 월별 소비내역(MonthlyTransactionsView)의 3대 핵심 지출 기본 프리셋
 * - '2026 가계.xlsx'의 월별 지출 시트 구분과 동일합니다.
 */
export const DEFAULT_ACCOUNT_PRESETS = [
  { id: 'preset-living', name: '생활비(식비)', badgeColor: 'bg-[#F7F6F2] text-[#141413] border-[#141413]/15' },
  { id: 'preset-fixed', name: '고정비', badgeColor: 'bg-[#F7F6F2] text-[#141413] border-[#141413]/15' },
  { id: 'preset-car-hospital', name: '자동차/병원비', badgeColor: 'bg-[#F7F6F2] text-[#141413] border-[#141413]/15' }
]
