<script setup>
/**
 * ============================================================================
 * @file        App.vue
 * @layer       Root Presentation Layer (Spring의 DispatcherServlet / Front Controller 역할)
 * @role        상단 고정 네비게이션 탭(currentTab)을 관리하고 3대 핵심 도메인 뷰를 전환 렌더링합니다.
 * @children    1. BudgetPlannerView        : 월간 예산 플래너 (연간 1~12월 명세표)
 *              2. MonthlyTransactionsView  : 월별 소비내역 (생활비/고정비/자동차·병원비)
 *              3. AccountClassificationView: 카테고리 관리 (그룹-카테고리-계좌 3단계 설정)
 * ============================================================================
 */
import { ref } from 'vue'
import BudgetPlannerView from './components/budget/BudgetPlannerView.vue'
import MonthlyTransactionsView from './components/transactions/MonthlyTransactionsView.vue'
import AccountClassificationView from './components/account-hierarchy/AccountClassificationView.vue'

// ============================================================================
// [SECTION 1] Reactive State (현재 선택된 상단 탭 상태)
// - 'budget'            : 월간 예산 플래너 (기본 화면)
// - 'transactions'      : 월별 소비내역
// - 'account-hierarchy' : 카테고리 관리
// ============================================================================
const currentTab = ref('budget')
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#F7F6F2] text-[#141413]">
    <!-- ================================================================== -->
    <!-- [UI 영역 1] 상단 고정 헤더 및 탭 네비게이션 바                       -->
    <!-- - 탭 클릭 시 currentTab 값을 변경하여 하단 메인 뷰를 전환합니다.      -->
    <!-- ================================================================== -->
    <header class="sticky top-0 z-30 w-full h-[68px] bg-white border-b border-[#141413]/12">
      <div class="max-w-[1440px] h-full mx-auto px-6 sm:px-10 flex items-center justify-between gap-6">
        <!-- 좌측: 브랜드 로고 + 3대 메뉴 탭 -->
        <div class="flex items-center gap-8 sm:gap-10 h-full">
          <button
            @click="currentTab = 'budget'"
            class="flex items-center gap-2.5 text-left cursor-pointer bg-transparent border-0 p-0 focus:outline-none"
          >
            <span class="w-5 h-5 rounded-[4px] bg-[#141413] text-white inline-flex items-center justify-center text-[13px] font-bold tracking-tighter">
              H
            </span>
            <span class="text-[18px] font-bold tracking-tight text-[#141413]">
              Honey Budget
            </span>
          </button>

          <nav class="flex items-center gap-6 sm:gap-8 h-full" aria-label="주요 메뉴">
            <!-- 탭 1: 월간 예산 플래너 -->
            <button
              @click="currentTab = 'budget'"
              :aria-current="currentTab === 'budget' ? 'page' : undefined"
              class="ts-nav-item"
            >
              월간 예산 플래너
            </button>

            <!-- 탭 2: 월별 소비내역 -->
            <button
              @click="currentTab = 'transactions'"
              :aria-current="currentTab === 'transactions' ? 'page' : undefined"
              class="ts-nav-item"
            >
              월별 소비내역
            </button>

            <!-- 탭 3: 카테고리 관리 -->
            <button
              @click="currentTab = 'account-hierarchy'"
              :aria-current="currentTab === 'account-hierarchy' ? 'page' : undefined"
              class="ts-nav-item"
            >
              카테고리 관리
            </button>
          </nav>
        </div>

        <!-- 우측: 회계 기준일 및 통화 안내 -->
        <div class="hidden md:flex items-center gap-3 text-[13px] text-[#575653] tabular-nums">
          <span>회계 기준일 매월 5일</span>
          <span class="text-[#141413]/20">|</span>
          <span class="font-medium text-[#141413]">KRW (원)</span>
        </div>
      </div>
    </header>

    <!-- ================================================================== -->
    <!-- [UI 영역 2] 메인 콘텐츠 컨테이너 (v-show로 탭 전환 시 상태 유지)      -->
    <!-- ================================================================== -->
    <main class="flex-1 w-full max-w-[1440px] mx-auto px-6 sm:px-10 py-8 sm:py-10">
      <!-- 뷰 1: 월간 예산 플래너 -->
      <div v-show="currentTab === 'budget'">
        <BudgetPlannerView />
      </div>

      <!-- 뷰 2: 월별 소비내역 -->
      <div v-show="currentTab === 'transactions'">
        <MonthlyTransactionsView />
      </div>

      <!-- 뷰 3: 카테고리 관리 -->
      <div v-show="currentTab === 'account-hierarchy'">
        <AccountClassificationView />
      </div>
    </main>

    <!-- ================================================================== -->
    <!-- [UI 영역 3] 하단 공통 푸터                                          -->
    <!-- ================================================================== -->
    <footer class="w-full border-t border-[#141413]/12 bg-white mt-16">
      <div class="max-w-[1440px] mx-auto px-6 sm:px-10 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[13px] text-[#575653]">
        <div class="flex items-center gap-2 font-semibold text-[#141413]">
          <span class="w-5 h-5 rounded-[3px] bg-[#141413] text-white inline-flex items-center justify-center text-[13px] font-bold">H</span>
          <span>Honey Budget</span>
        </div>
        <p class="m-0">가계 예산 및 지출 관리 시스템 · 데이터는 백엔드 서버 및 로컬 저장소에 동기화됩니다.</p>
      </div>
    </footer>
  </div>
</template>
