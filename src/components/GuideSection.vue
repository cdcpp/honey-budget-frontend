<script setup>
/**
 * ============================================================================
 * @file        GuideSection.vue
 * @layer       UI Component (Presentation Layer)
 * @role        가계부 지출 및 수입 분류 기준(부수입, 고정지출, 비고정지출, 차량·병원비, 행사비) 안내 카드
 * @parent      BudgetPlannerView.vue
 * ============================================================================
 */
import { ref } from 'vue'

/** 모바일 화면에서 가이드를 접고 펼 수 있는 토글 상태 (데스크톱에서는 항상 표시) */
const isExpandedMobile = ref(false)
</script>

<template>
  <!-- ==================================================================== -->
  <!-- [UI 영역] 토스 다크 스타일 지출 및 수입 5대 분류 기준 안내 카드         -->
  <!-- ==================================================================== -->
  <section class="ts-card p-5 sm:p-6 flex flex-col justify-between" aria-label="지출 및 수입 분류 기준">
    <div class="flex items-center justify-between gap-2">
      <div>
        <h2 class="text-[17px] font-extrabold text-[#F9FAFB] tracking-tight">
          지출 및 수입 분류 기준
        </h2>
        <p class="text-[13px] text-[#8B95A1] mt-0.5 m-0">어느 계좌에 기록할지 헷갈릴 때 참고하세요</p>
      </div>

      <button
        type="button"
        @click="isExpandedMobile = !isExpandedMobile"
        class="md:hidden btn btn--secondary !min-h-[32px] !px-3 !text-[13px]"
      >
        {{ isExpandedMobile ? '접기' : '기준 보기' }}
      </button>
    </div>

    <dl
      :class="[
        'grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 text-[14px] flex-1',
        isExpandedMobile ? 'grid' : 'hidden md:grid'
      ]"
    >
      <div class="p-3.5 rounded-[14px] bg-[#1C202B] border border-white/[0.05] flex flex-col gap-1">
        <dt class="font-bold text-[#F9FAFB] text-[14px]">부수입</dt>
        <dd class="text-[#8B95A1] text-[13px] m-0">상여금, 성과급, 금융 소득, 포인트 등 정기 급여 외 수익</dd>
      </div>

      <div class="p-3.5 rounded-[14px] bg-[#1C202B] border border-white/[0.05] flex flex-col gap-1">
        <dt class="font-bold text-[#F9FAFB] text-[14px]">고정지출</dt>
        <dd class="text-[#8B95A1] text-[13px] m-0">대출원리금, 세금, 통신비, 보험료, 정기 구독료 등 매월 확정 지출</dd>
      </div>

      <div class="p-3.5 rounded-[14px] bg-[#1C202B] border border-white/[0.05] flex flex-col gap-1">
        <dt class="font-bold text-[#F9FAFB] text-[14px]">비고정지출 (생활비)</dt>
        <dd class="text-[#8B95A1] text-[13px] m-0">식재료, 외식, 생필품, 의류 등 월별 변동 폭이 있는 생활 소비</dd>
      </div>

      <div class="p-3.5 rounded-[14px] bg-[#1C202B] border border-white/[0.05] flex flex-col gap-1">
        <dt class="font-bold text-[#F9FAFB] text-[14px]">차량 · 병원비</dt>
        <dd class="text-[#8B95A1] text-[13px] m-0">주유비, 하이패스, 자동차 보험/정비, 병원 진료 및 약국 비용</dd>
      </div>

      <div class="p-3.5 rounded-[14px] bg-[#1C202B] border border-white/[0.05] flex flex-col gap-1 md:col-span-2">
        <dt class="font-bold text-[#F9FAFB] text-[14px]">행사비 · 예비비</dt>
        <dd class="text-[#8B95A1] text-[13px] m-0">결혼·장례 경조사비, 명절 용돈, 가족 기념일 등 비정기 지출</dd>
      </div>
    </dl>
  </section>
</template>
