<script setup>
/**
 * @file BudgetPlannerView.vue
 * @description 월간 예산 플래너 최상위 도메인 뷰 (Domain View)
 * 
 * 백엔드 개발자 참고 (Spring MVC 비유):
 * - 이 컴포넌트는 예산 플래너 메인 화면 뷰입니다.
 * - Service 계층인 useBudget()을 호출하여 데이터를 받아오고 하위 컴포넌트들에 전달합니다.
 * - 하위 컴포넌트:
 *   - AppHeader: 상단 타이틀, 연간 합계 뱃지, 초기화/백업/엑셀 내보내기 버튼
 *   - SummaryCards: 총 자산, 연간 수입, 저축, 지출 요약 카드
 *   - GuideSection: 사용 가이드 안내 박스
 *   - BalanceSection: 현재 비상금 및 통장 잔액 현황 관리
 *   - BudgetTable: 연간 1~12월 계좌별 금액 입력 및 집계 명세표 (핵심 그리드)
 */
import { useBudget } from '../../composables/useBudget'
import AppHeader from '../AppHeader.vue'
import SummaryCards from '../SummaryCards.vue'
import GuideSection from '../GuideSection.vue'
import BalanceSection from '../BalanceSection.vue'
import BudgetTable from '../BudgetTable.vue'

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
    <!-- 1. 헤더 (버튼/백업/내보내기) -->
    <AppHeader
      :on-reset="resetToZero"
      :on-export-json="exportToJson"
      :on-import-json="importFromJson"
      :on-export-csv="exportToCsv"
    />

    <!-- 2. 핵심 지표 요약 카드 (총자산 / 연간 수입 / 연간 저축 / 연간 지출) -->
    <SummaryCards
      :total-balance="totalBalance"
      :annual-income="annualIncomeTotal"
      :annual-savings="annualSavingsTotal"
      :annual-expenses="annualExpensesTotal"
      :annual-net="annualNetTotal"
      :format-currency="formatCurrency"
    />

    <!-- 3. 사용 안내 & 자산/비상금 현황 -->
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

    <!-- 4. 연간 수입/저축/지출 계좌별 1~12월 명세표 (AccountYearMonth 연동) -->
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

