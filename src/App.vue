<script setup>
/**
 * @file App.vue
 * @description 애플리케이션 루트 컴포넌트
 * 
 * 백엔드 개발자 참고 (Spring DispatcherServlet & Front Controller 비유):
 * - 상단 탭 메뉴(currentTab)에 따라 3대 핵심 도메인 화면을 조건부 렌더링(Routing)합니다.
 * 
 * 도메인 뷰 구성:
 * 1. BudgetPlannerView        : 월간 예산 플래너 (AccountYearMonth 연동 1~12월 명세표)
 * 2. MonthlyTransactionsView  : 월별 소비내역 (AccountTransaction 연동 생활비/고정비/차량비)
 * 3. AccountClassificationView: 카테고리 관리 (CategoryGroup -> Category -> Account 3계층 관리)
 */
import { ref } from 'vue'
import BudgetPlannerView from './components/budget/BudgetPlannerView.vue'
import MonthlyTransactionsView from './components/transactions/MonthlyTransactionsView.vue'
import AccountClassificationView from './components/account-hierarchy/AccountClassificationView.vue'

// 기본 활성화 탭: 'budget' | 'transactions' | 'account-hierarchy'
const currentTab = ref('budget')
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 sm:p-6 md:p-8">
    <div class="max-w-[1500px] mx-auto space-y-6">

      <!-- Navigation Tab Bar -->
      <nav
        class="flex items-center justify-between bg-white px-4 sm:px-6 py-2.5 rounded-2xl shadow-sm border border-slate-200">
        <div class="flex items-center gap-1.5 sm:gap-2">
          <!-- TAB 1: 월간 예산 플래너 -->
          <button @click="currentTab = 'budget'" :class="[
            'px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
            currentTab === 'budget'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          ]">
            <i class="fa-solid fa-chart-pie"></i>
            <span>월간 예산 플래너</span>
          </button>

          <!-- TAB 2: 월별 소비내역 -->
          <button @click="currentTab = 'transactions'" :class="[
            'px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
            currentTab === 'transactions'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          ]">
            <i class="fa-solid fa-receipt"></i>
            <span>월별 소비내역</span>
          </button>

          <!-- TAB 3: 카테고리 관리 -->
          <button @click="currentTab = 'account-hierarchy'" :class="[
            'px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
            currentTab === 'account-hierarchy'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          ]">
            <i class="fa-solid fa-sitemap"></i>
            <span>카테고리 관리</span>
          </button>
        </div>

        <div class="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
          <i class="fa-solid fa-shield-halved text-indigo-500"></i>
          <span>Honey Budget System</span>
        </div>
      </nav>

      <!-- 1. 월간 예산 플래너 뷰 -->
      <div v-show="currentTab === 'budget'">
        <BudgetPlannerView />
      </div>

      <!-- 2. 월별 소비내역 뷰 -->
      <div v-show="currentTab === 'transactions'">
        <MonthlyTransactionsView />
      </div>

      <!-- 3. 카테고리 관리 뷰 -->
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
