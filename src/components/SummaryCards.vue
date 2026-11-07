<script setup>
/**
 * ============================================================================
 * @file        SummaryCards.vue
 * @layer       UI Component (Presentation Layer)
 * @role        월간 예산 플래너 상단 4대 핵심 재무 지표(보유 잔액, 연간 총 수입, 연간 저축/투자, 연간 총 지출) 요약 카드
 * @parent      BudgetPlannerView.vue
 * ============================================================================
 */
import { computed } from 'vue'

// ============================================================================
// [SECTION 1] Props (부모로부터 전달받는 연간 집계 수치 및 통화 포맷터)
// ============================================================================
const props = defineProps({
  totalBalance: { type: Number, required: true },   // 보유 잔액 총계
  annualIncome: { type: Number, required: true },   // 연간 총 수입 합계
  annualSavings: { type: Number, required: true },  // 연간 저축 & 투자 합계
  annualExpenses: { type: Number, required: true }, // 연간 총 지출 합계
  annualNet: { type: Number, required: true },      // 연간 순 잔여 자금
  formatCurrency: { type: Function, required: true } // 원화('0,000원') 포맷팅 함수
})

// ============================================================================
// [SECTION 2] Computed Properties (파생 계산 속성 - 저축률 %)
// ============================================================================
/** 연간 총 수입 대비 연간 저축액 비율(소수점 첫째 자리 반올림) 계산 */
const savingsRate = computed(() => {
  if (!props.annualIncome || props.annualIncome === 0) return 0
  const rate = (props.annualSavings / props.annualIncome) * 100
  return Math.round(rate * 10) / 10
})
</script>

<template>
  <!-- ==================================================================== -->
  <!-- [UI 영역] 4열 재무 지표 요약 카드 그리드                               -->
  <!-- ==================================================================== -->
  <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="연간 재무 요약">
    <!-- 카드 1: 보유 잔액 총계 -->
    <div class="ts-card p-5 flex flex-col justify-between gap-3">
      <div class="text-[13px] font-medium text-[#575653]">보유 잔액 총계</div>
      <div>
        <div class="text-[24px] font-bold font-mono text-[#141413] tracking-tight truncate tabular-nums">
          {{ formatCurrency(totalBalance) }}
        </div>
        <p class="text-[13px] text-[#575653] mt-1">비상금 및 예적금 누적 합산</p>
      </div>
    </div>

    <!-- 카드 2: 연간 총 수입 -->
    <div class="ts-card p-5 flex flex-col justify-between gap-3">
      <div class="text-[13px] font-medium text-[#575653]">연간 총 수입</div>
      <div>
        <div class="text-[24px] font-bold font-mono text-[#141413] tracking-tight truncate tabular-nums">
          {{ formatCurrency(annualIncome) }}
        </div>
        <p class="text-[13px] text-[#575653] mt-1">급여 및 부수입 12개월 합산</p>
      </div>
    </div>

    <!-- 카드 3: 연간 저축 & 투자 (저축률 포함) -->
    <div class="ts-card p-5 flex flex-col justify-between gap-3">
      <div class="flex items-center justify-between gap-2">
        <span class="text-[13px] font-medium text-[#575653]">연간 저축 & 투자</span>
        <span class="text-[13px] font-semibold font-mono text-[#0a4b49] tabular-nums">
          저축률 {{ savingsRate }}%
        </span>
      </div>
      <div>
        <div class="text-[24px] font-bold font-mono text-[#141413] tracking-tight truncate tabular-nums">
          {{ formatCurrency(annualSavings) }}
        </div>
        <p class="text-[13px] text-[#575653] mt-1">예적금, 청약, 투자 계좌 합산</p>
      </div>
    </div>

    <!-- 카드 4: 연간 총 지출 -->
    <div class="ts-card p-5 flex flex-col justify-between gap-3">
      <div class="text-[13px] font-medium text-[#575653]">연간 총 지출</div>
      <div>
        <div class="text-[24px] font-bold font-mono text-[#141413] tracking-tight truncate tabular-nums">
          {{ formatCurrency(annualExpenses) }}
        </div>
        <p class="text-[13px] text-[#575653] mt-1">고정지출 및 생활비 12개월 합산</p>
      </div>
    </div>
  </section>
</template>
