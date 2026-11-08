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
// [SECTION 1] Props
// ============================================================================
const props = defineProps({
  totalBalance: { type: Number, required: true },
  annualIncome: { type: Number, required: true },
  annualSavings: { type: Number, required: true },
  annualExpenses: { type: Number, required: true },
  annualNet: { type: Number, required: true },
  formatCurrency: { type: Function, required: true }
})

// ============================================================================
// [SECTION 2] Computed Properties (저축률 %)
// ============================================================================
const savingsRate = computed(() => {
  if (!props.annualIncome || props.annualIncome === 0) return 0
  const rate = (props.annualSavings / props.annualIncome) * 100
  return Math.round(rate * 10) / 10
})
</script>

<template>
  <!-- ==================================================================== -->
  <!-- [UI 영역] 토스 다크 스타일 4열 핵심 자산/예산 요약 카드 그리드          -->
  <!-- ==================================================================== -->
  <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4" aria-label="연간 재무 요약">
    <!-- 카드 1: 보유 잔액 총계 -->
    <div class="ts-card p-5 sm:p-6 flex flex-col justify-between gap-2.5">
      <div class="flex items-center justify-between">
        <span class="text-[14px] font-bold text-[#8B95A1]">보유 잔액 총계</span>
        <span class="px-2.5 py-0.5 rounded-full text-[13px] font-bold bg-[#1C202B] text-[#D1D6DB] border border-white/[0.06]">내 비상금·예금</span>
      </div>
      <div>
        <div class="text-[24px] sm:text-[26px] font-extrabold font-mono text-[#F9FAFB] tracking-tight truncate tabular-nums">
          {{ formatCurrency(totalBalance) }}
        </div>
        <p class="text-[13px] text-[#6B7684] mt-1 m-0">비상금 및 예적금 누적 합산</p>
      </div>
    </div>

    <!-- 카드 2: 연간 총 수입 -->
    <div class="ts-card p-5 sm:p-6 flex flex-col justify-between gap-2.5">
      <div class="flex items-center justify-between">
        <span class="text-[14px] font-bold text-[#8B95A1]">연간 총 수입</span>
        <span class="px-2.5 py-0.5 rounded-full text-[13px] font-bold bg-[#3182F6]/15 text-[#64A8FF]">12개월 수입</span>
      </div>
      <div>
        <div class="text-[24px] sm:text-[26px] font-extrabold font-mono text-[#F9FAFB] tracking-tight truncate tabular-nums">
          {{ formatCurrency(annualIncome) }}
        </div>
        <p class="text-[13px] text-[#6B7684] mt-1 m-0">급여 및 부수입 12개월 합산</p>
      </div>
    </div>

    <!-- 카드 3: 연간 저축 & 투자 (저축률 뱃지 포함) -->
    <div class="ts-card p-5 sm:p-6 flex flex-col justify-between gap-2.5">
      <div class="flex items-center justify-between gap-2">
        <span class="text-[14px] font-bold text-[#8B95A1]">연간 저축 & 투자</span>
        <span class="px-2.5 py-0.5 rounded-full text-[13px] font-bold bg-[#3182F6]/15 text-[#64A8FF] tabular-nums">
          저축률 {{ savingsRate }}%
        </span>
      </div>
      <div>
        <div class="text-[24px] sm:text-[26px] font-extrabold font-mono text-[#64A8FF] tracking-tight truncate tabular-nums">
          {{ formatCurrency(annualSavings) }}
        </div>
        <p class="text-[13px] text-[#6B7684] mt-1 m-0">예적금, 청약, 투자 계좌 합산</p>
      </div>
    </div>

    <!-- 카드 4: 연간 총 지출 -->
    <div class="ts-card p-5 sm:p-6 flex flex-col justify-between gap-2.5">
      <div class="flex items-center justify-between">
        <span class="text-[14px] font-bold text-[#8B95A1]">연간 총 지출</span>
        <span class="px-2.5 py-0.5 rounded-full text-[13px] font-bold bg-[#1C202B] text-[#D1D6DB] border border-white/[0.06]">고정·생활비</span>
      </div>
      <div>
        <div class="text-[24px] sm:text-[26px] font-extrabold font-mono text-[#F9FAFB] tracking-tight truncate tabular-nums">
          {{ formatCurrency(annualExpenses) }}
        </div>
        <p class="text-[13px] text-[#6B7684] mt-1 m-0">고정지출 및 생활비 12개월 합산</p>
      </div>
    </div>
  </section>
</template>
