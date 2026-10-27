<script setup>
import { ref } from 'vue'
import { useBudget } from './composables/useBudget'
import AppHeader from './components/AppHeader.vue'
import SummaryCards from './components/SummaryCards.vue'
import GuideSection from './components/GuideSection.vue'
import BalanceSection from './components/BalanceSection.vue'
import BudgetTable from './components/BudgetTable.vue'
import AccountClassificationView from './components/account-hierarchy/AccountClassificationView.vue'

const currentTab = ref('budget')

const {
  balanceList,
  incomeRows,
  savingRows,
  expenseRows,
  totalBalance,
  totalIncomeByMonth,
  totalSavingsByMonth,
  totalExpensesByMonth,
  netBalanceByMonth,
  annualIncomeTotal,
  annualSavingsTotal,
  annualExpensesTotal,
  annualNetTotal,
  getRowTotal,
  addBalanceItem,
  removeBalanceItem,
  addRow,
  removeRow,
  fillRowAcrossMonths,
  resetToZero,
  resetToDefaultSample,
  exportToJson,
  importFromJson,
  exportToCsv,
  formatNumber,
  formatCurrency
} = useBudget()
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 sm:p-6 md:p-8">
    <div class="max-w-[1500px] mx-auto space-y-6">

      <!-- Navigation Tab Bar -->
      <nav
        class="flex items-center justify-between bg-white px-4 sm:px-6 py-2.5 rounded-2xl shadow-sm border border-slate-200">
        <div class="flex items-center gap-1.5 sm:gap-2">
          <button @click="currentTab = 'budget'" :class="[
            'px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
            currentTab === 'budget'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          ]">
            <i class="fa-solid fa-chart-pie"></i>
            <span>월간 예산 플래너</span>
          </button>

          <button @click="currentTab = 'account-hierarchy'" :class="[
            'px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
            currentTab === 'account-hierarchy'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          ]">
            <i class="fa-solid fa-sitemap"></i>
            <span>카테고리 관리</span>
            <span class="text-[10px] px-1.5 py-0.2 rounded-full"
              :class="currentTab === 'account-hierarchy' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'">
            </span>
          </button>
        </div>

        <div class="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
          <i class="fa-solid fa-shield-halved text-indigo-500"></i>
          <span>Honey Budget System</span>
        </div>
      </nav>

      <!-- VIEW 1: Budget Planner -->
      <div v-show="currentTab === 'budget'" class="space-y-6">
        <AppHeader :on-reset="resetToZero" :on-reset-sample="resetToDefaultSample" :on-export-json="exportToJson"
          :on-import-json="importFromJson" :on-export-csv="exportToCsv" />

        <SummaryCards :total-balance="totalBalance" :annual-income="annualIncomeTotal"
          :annual-savings="annualSavingsTotal" :annual-expenses="annualExpensesTotal" :annual-net="annualNetTotal"
          :format-currency="formatCurrency" />

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <GuideSection class="lg:col-span-2 h-full" />
          <BalanceSection class="h-full" :balance-list="balanceList" :total-balance="totalBalance"
            :format-currency="formatCurrency" :on-add-balance-item="addBalanceItem"
            :on-remove-balance-item="removeBalanceItem" />
        </div>

        <BudgetTable :income-rows="incomeRows" :saving-rows="savingRows" :expense-rows="expenseRows"
          :total-income-by-month="totalIncomeByMonth" :total-savings-by-month="totalSavingsByMonth"
          :total-expenses-by-month="totalExpensesByMonth" :net-balance-by-month="netBalanceByMonth"
          :annual-income-total="annualIncomeTotal" :annual-savings-total="annualSavingsTotal"
          :annual-expenses-total="annualExpensesTotal" :annual-net-total="annualNetTotal" :get-row-total="getRowTotal"
          :add-row="addRow" :remove-row="removeRow" :fill-row-across-months="fillRowAcrossMonths"
          :format-number="formatNumber" />
      </div>

      <!-- VIEW 2: Account Classification Hierarchy -->
      <div v-show="currentTab === 'account-hierarchy'">
        <AccountClassificationView />
      </div>

      <!-- Footer -->
      <footer class="pt-4 pb-8 text-center text-xs text-slate-400">
        <p>Honey Budget • 모든 데이터는 브라우저 로컬 저장소 및 백엔드 REST API와 연동됩니다.</p>
      </footer>
    </div>
  </div>
</template>