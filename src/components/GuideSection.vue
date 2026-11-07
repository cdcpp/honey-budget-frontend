<script setup>
/**
 * ============================================================================
 * @file        GuideSection.vue
 * @layer       UI Component (Presentation Layer)
 * @role        가계부 지출 및 수입 분류 기준(부수입, 고정지출, 비고정지출, 차량·병원비, 행사비) 설명 카드
 * @parent      BudgetPlannerView.vue
 * @note        분류 기준 안내 문구를 수정하려면 아래 <dl> 내부의 <dt>, <dd> 텍스트만 변경하면 됩니다.
 * ============================================================================
 */
</script>

<template>
  <!-- ==================================================================== -->
  <!-- [UI 영역] 지출 및 수입 5대 분류 기준 정의 목록(dl/dt/dd) 카드          -->
  <!-- ==================================================================== -->
  <section class="ts-card p-6 flex flex-col justify-between" aria-label="지출 및 수입 분류 기준">
    <div class="pb-4 border-b border-[#141413]/12 flex items-baseline justify-between gap-2">
      <h2 class="text-[16px] font-bold text-[#141413] tracking-tight">
        지출 및 수입 분류 기준
      </h2>
      <span class="text-[13px] text-[#575653]">가계부 항목별 기록 원칙</span>
    </div>

    <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-4 text-[14px] flex-1 items-center">
      <div class="flex flex-col gap-0.5 pb-3 border-b border-[#141413]/8">
        <dt class="font-semibold text-[#141413]">부수입</dt>
        <dd class="text-[#575653] m-0">상여금, 성과급, 금융 소득, 포인트 등 정기 급여 외 수익</dd>
      </div>

      <div class="flex flex-col gap-0.5 pb-3 border-b border-[#141413]/8">
        <dt class="font-semibold text-[#141413]">고정지출</dt>
        <dd class="text-[#575653] m-0">대출원리금, 세금, 통신비, 보험료, 정기 구독료 등 매월 확정 지출</dd>
      </div>

      <div class="flex flex-col gap-0.5 pb-3 border-b border-[#141413]/8">
        <dt class="font-semibold text-[#141413]">비고정지출 (생활비)</dt>
        <dd class="text-[#575653] m-0">식재료, 외식, 생필품, 의류 등 월별 변동 폭이 있는 생활 소비</dd>
      </div>

      <div class="flex flex-col gap-0.5 pb-3 border-b border-[#141413]/8">
        <dt class="font-semibold text-[#141413]">차량 · 병원비</dt>
        <dd class="text-[#575653] m-0">주유비, 하이패스, 자동차 보험/정비, 병원 진료 및 약국 비용</dd>
      </div>

      <div class="flex flex-col gap-0.5 md:col-span-2">
        <dt class="font-semibold text-[#141413]">행사비 · 예비비</dt>
        <dd class="text-[#575653] m-0">결혼·장례 경조사비, 명절 용돈, 가족 기념일 등 비정기 지출</dd>
      </div>
    </dl>
  </section>
</template>
