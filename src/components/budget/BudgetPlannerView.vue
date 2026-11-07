<script setup>
/**
 * ============================================================================
 * @file        BudgetPlannerView.vue
 * @layer       Domain View Layer (월간 예산 플래너 최상위 컨테이너 뷰)
 * @role        useBudget() 비즈니스 로직에서 상태와 액션을 받아 하위 5개 UI 컴포넌트에 주입합니다.
 * @parent      App.vue
 * @children    - AppHeader      : 타이틀 및 JSON 백업/복원, 0원 초기화, CSV 다운로드 버튼
 *              - SummaryCards   : 보유 잔액, 연간 총 수입, 연간 저축/투자, 연간 총 지출 4대 지표 카드
 *              - GuideSection   : 지출 및 수입 분류 기준 안내 카드
 *              - BalanceSection : 비상금 및 예적금 보유 잔액 편집 카드
 *              - BudgetTable    : 연간 1~12월 계좌별 금액 입력 및 자동 합산 그리드 테이블
 * ============================================================================
 */
import { useBudget } from '../../composables/useBudget'
import AppHeader from '../AppHeader.vue'
import SummaryCards from '../SummaryCards.vue'
import GuideSection from '../GuideSection.vue'
import BalanceSection from '../BalanceSection.vue'
import BudgetTable from '../BudgetTable.vue'

// ============================================================================
// [SECTION 1] Composable State & Actions (useBudget에서 상태 및 함수 구조분해)
// ============================================================================
const {
  balanceList,
  sections,
  loading,
  error,
  year,
  yearLoading,
  saving,
  saveError,
  saveMessage,
  dirtyCount,
  changeYear,
  saveAmounts,
  totalBalance,
  totalIncomeByMonth,
  totalSavingsByMonth,
  totalExpensesByMonth,
  annualIncomeTotal,
  annualSavingsTotal,
  annualExpensesTotal,
  annualNetTotal,
  getRowTotal,
  getCategoryMonthTotal,
  getCategoryTotal,
  addBalanceItem,
  removeBalanceItem,
  fillRowAcrossMonths,
  resetToZero,
  exportToJson,
  importFromJson,
  exportToCsv,
  formatNumber,
  formatCurrency
} = useBudget()
</script>

<template>
  <div class="space-y-6">
    <!-- [UI 영역 1] 상단 타이틀 및 파일 입출력 액션 헤더 -->
    <AppHeader
      :on-reset="resetToZero"
      :on-export-json="exportToJson"
      :on-import-json="importFromJson"
      :on-export-csv="exportToCsv"
    />

    <!-- [UI 영역 2] 연간 핵심 재무 지표 4열 요약 카드 -->
    <SummaryCards
      :total-balance="totalBalance"
      :annual-income="annualIncomeTotal"
      :annual-savings="annualSavingsTotal"
      :annual-expenses="annualExpensesTotal"
      :annual-net="annualNetTotal"
      :format-currency="formatCurrency"
    />

    <!-- [UI 영역 3] 좌측 분류 기준 안내(2칸) & 우측 보유 잔액 현황(1칸) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      <GuideSection class="lg:col-span-2 h-full" />
      <BalanceSection
        class="h-full"
        :balance-list="balanceList"
        :total-balance="totalBalance"
        :format-currency="formatCurrency"
        :on-add-balance-item="addBalanceItem"
        :on-remove-balance-item="removeBalanceItem"
      />
    </div>

    <!-- [UI 영역 4] 연간 수입/저축/지출 계좌별 1~12월 명세표 (백엔드 AccountYearMonth 연동) -->
    <BudgetTable
      :sections="sections"
      :loading="loading"
      :error="error"
      :year="year"
      :year-loading="yearLoading"
      :saving="saving"
      :save-error="saveError"
      :save-message="saveMessage"
      :dirty-count="dirtyCount"
      @change-year="changeYear"
      @save="saveAmounts"
      :total-income-by-month="totalIncomeByMonth"
      :total-savings-by-month="totalSavingsByMonth"
      :total-expenses-by-month="totalExpensesByMonth"
      :annual-income-total="annualIncomeTotal"
      :annual-savings-total="annualSavingsTotal"
      :annual-expenses-total="annualExpensesTotal"
      :get-row-total="getRowTotal"
      :get-category-month-total="getCategoryMonthTotal"
      :get-category-total="getCategoryTotal"
      :fill-row-across-months="fillRowAcrossMonths"
      :format-number="formatNumber"
    />
  </div>
</template>
