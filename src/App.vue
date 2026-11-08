<script setup>
/**
 * ============================================================================
 * @file        App.vue
 * @layer       Root Presentation Layer (Spring의 DispatcherServlet / Front Controller 역할)
 * @role        상단(데스크톱) 및 하단(모바일) 네비게이션 탭(currentTab)을 관리하고 3대 핵심 도메인 뷰를 전환 렌더링합니다.
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
// [SECTION 1] Reactive State (현재 선택된 탭 상태)
// ============================================================================
const currentTab = ref('budget')
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#0B0D11] text-[#F9FAFB] pb-20 md:pb-0">
    <!-- ================================================================== -->
    <!-- [UI 영역 1] 상단 고정 헤더 및 데스크톱 탭 네비게이션 바 (시크 블랙)   -->
    <!-- ================================================================== -->
    <header class="sticky top-0 z-30 w-full h-[60px] md:h-[64px] bg-[#0B0D11]/85 backdrop-blur-md border-b border-white/[0.07]">
      <div class="max-w-[1360px] h-full mx-auto px-4 sm:px-8 flex items-center justify-between gap-4">
        <!-- 좌측: 브랜드 로고 + 데스크톱 3대 메뉴 탭 -->
        <div class="flex items-center gap-6 sm:gap-8 h-full">
          <button
            @click="currentTab = 'budget'"
            class="flex items-center gap-2.5 text-left cursor-pointer bg-transparent border-0 p-0 focus:outline-none"
          >
            <span class="w-7 h-7 rounded-[9px] bg-[#3182F6] text-white inline-flex items-center justify-center text-[15px] font-extrabold tracking-tight">
              H
            </span>
            <span class="text-[18px] font-extrabold tracking-tight text-[#F9FAFB]">
              Honey Budget
            </span>
          </button>

          <nav class="hidden md:flex items-center gap-1.5 h-full" aria-label="주요 메뉴">
            <button
              @click="currentTab = 'budget'"
              :aria-current="currentTab === 'budget' ? 'page' : undefined"
              class="ts-nav-item"
            >
              월간 예산 플래너
            </button>

            <button
              @click="currentTab = 'transactions'"
              :aria-current="currentTab === 'transactions' ? 'page' : undefined"
              class="ts-nav-item"
            >
              월별 소비내역
            </button>

            <button
              @click="currentTab = 'account-hierarchy'"
              :aria-current="currentTab === 'account-hierarchy' ? 'page' : undefined"
              class="ts-nav-item"
            >
              카테고리 관리
            </button>
          </nav>
        </div>

        <!-- 우측: 회계 기준일 배지 -->
        <div class="flex items-center gap-2 text-[13px] text-[#8B95A1] tabular-nums">
          <span class="px-3 py-1 rounded-full bg-[#1C202B] text-[#D1D6DB] border border-white/[0.06] font-semibold">
            급여 정산일 매월 5일
          </span>
        </div>
      </div>
    </header>

    <!-- ================================================================== -->
    <!-- [UI 영역 2] 메인 콘텐츠 컨테이너 (모바일 패딩 및 데스크톱 균등 여백)   -->
    <!-- ================================================================== -->
    <main class="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-8 py-5 sm:py-8">
      <div v-show="currentTab === 'budget'">
        <BudgetPlannerView />
      </div>

      <div v-show="currentTab === 'transactions'">
        <MonthlyTransactionsView />
      </div>

      <div v-show="currentTab === 'account-hierarchy'">
        <AccountClassificationView />
      </div>
    </main>

    <!-- ================================================================== -->
    <!-- [UI 영역 3] 모바일 전용 하단 고정 탭바 (토스 다크모드 앱 스타일)       -->
    <!-- ================================================================== -->
    <nav
      class="md:hidden fixed bottom-0 left-0 right-0 z-40 h-[64px] bg-[#151821]/95 backdrop-blur-md border-t border-white/[0.08] grid grid-cols-3 px-2"
      aria-label="모바일 하단 메뉴"
    >
      <button
        @click="currentTab = 'budget'"
        :class="[
          'flex flex-col items-center justify-center gap-1 text-[13px] font-bold transition-colors cursor-pointer bg-transparent border-0',
          currentTab === 'budget' ? 'text-[#64A8FF]' : 'text-[#6B7684]'
        ]"
      >
        <span
          :class="[
            'w-1.5 h-1.5 rounded-full transition-opacity',
            currentTab === 'budget' ? 'bg-[#3182F6] opacity-100' : 'opacity-0'
          ]"
        ></span>
        <span>예산 플래너</span>
      </button>

      <button
        @click="currentTab = 'transactions'"
        :class="[
          'flex flex-col items-center justify-center gap-1 text-[13px] font-bold transition-colors cursor-pointer bg-transparent border-0',
          currentTab === 'transactions' ? 'text-[#64A8FF]' : 'text-[#6B7684]'
        ]"
      >
        <span
          :class="[
            'w-1.5 h-1.5 rounded-full transition-opacity',
            currentTab === 'transactions' ? 'bg-[#3182F6] opacity-100' : 'opacity-0'
          ]"
        ></span>
        <span>월별 소비내역</span>
      </button>

      <button
        @click="currentTab = 'account-hierarchy'"
        :class="[
          'flex flex-col items-center justify-center gap-1 text-[13px] font-bold transition-colors cursor-pointer bg-transparent border-0',
          currentTab === 'account-hierarchy' ? 'text-[#64A8FF]' : 'text-[#6B7684]'
        ]"
      >
        <span
          :class="[
            'w-1.5 h-1.5 rounded-full transition-opacity',
            currentTab === 'account-hierarchy' ? 'bg-[#3182F6] opacity-100' : 'opacity-0'
          ]"
        ></span>
        <span>카테고리 관리</span>
      </button>
    </nav>

    <!-- ================================================================== -->
    <!-- [UI 영역 4] 하단 공통 푸터 (데스크톱)                                -->
    <!-- ================================================================== -->
    <footer class="hidden md:block w-full border-t border-white/[0.06] bg-[#0B0D11] mt-16">
      <div class="max-w-[1360px] mx-auto px-8 py-6 flex items-center justify-between text-[13px] text-[#6B7684]">
        <div class="flex items-center gap-2 font-bold text-[#D1D6DB]">
          <span class="w-5 h-5 rounded-[6px] bg-[#3182F6] text-white inline-flex items-center justify-center text-[13px] font-extrabold">H</span>
          <span>Honey Budget</span>
        </div>
        <p class="m-0">가계 예산 및 지출 관리 시스템 · 데이터는 백엔드 서버 및 로컬 저장소에 동기화됩니다.</p>
      </div>
    </footer>
  </div>
</template>
