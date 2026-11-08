<script setup>
/**
 * ============================================================================
 * @file        BalanceSection.vue
 * @layer       UI Component (Presentation Layer)
 * @role        우측 상단 '잔액 현황' 카드 (비상금, 차량비상금, 예금 등의 누적 보유 잔액 입력 및 항목 추가/삭제)
 * @parent      BudgetPlannerView.vue
 * @children    NumberInput.vue
 * ============================================================================
 */
import { ref } from 'vue'
import NumberInput from './NumberInput.vue'

// ============================================================================
// [SECTION 1] Props
// ============================================================================
defineProps({
  balanceList: { type: Array, required: true },
  totalBalance: { type: Number, required: true },
  formatCurrency: { type: Function, required: true },
  onAddBalanceItem: { type: Function, required: true },
  onRemoveBalanceItem: { type: Function, required: true }
})

// ============================================================================
// [SECTION 2] Reactive State
// ============================================================================
const isEditingList = ref(false)
</script>

<template>
  <section class="ts-card p-5 sm:p-6 flex flex-col justify-between" aria-label="잔액 현황">
    <div>
      <!-- [UI 영역 1] 카드 상단 헤더 및 '항목 편집 / 편집 완료' 토글 버튼 -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-[17px] font-extrabold text-[#F9FAFB] tracking-tight">
            잔액 현황
          </h2>
          <p class="text-[13px] text-[#8B95A1] mt-0.5 m-0">누적 보유 자산</p>
        </div>

        <button
          @click="isEditingList = !isEditingList"
          :class="[
            'btn !min-h-[32px] !px-3 !text-[13px]',
            isEditingList ? 'btn--primary' : 'btn--secondary'
          ]"
        >
          <span>{{ isEditingList ? '편집 완료' : '항목 편집' }}</span>
        </button>
      </div>

      <!-- [UI 영역 2] 토스 다크 계좌 리스트 스타일 보유 잔액 항목 및 금액 입력 필드 -->
      <div class="space-y-2 max-h-[240px] overflow-y-auto pr-1">
        <div
          v-for="(item, idx) in balanceList"
          :key="item.id || idx"
          class="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-[14px] bg-[#1C202B] hover:bg-[#242938] border border-white/[0.05] transition-colors text-[14px]"
        >
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <button
              v-if="isEditingList"
              @click="onRemoveBalanceItem(idx)"
              title="항목 삭제"
              class="text-[#FF6B76] hover:underline text-[13px] font-bold shrink-0 cursor-pointer"
            >
              삭제
            </button>
            <input
              v-if="isEditingList"
              v-model="item.name"
              class="ts-input !h-[32px] !px-2.5 !text-[13px] !bg-[#151821] w-full max-w-[140px]"
            />
            <span v-else class="text-[#D1D6DB] font-bold truncate" :title="item.name">
              {{ item.name }}
            </span>
          </div>

          <!-- 우측 금액 입력 (NumberInput 컴포넌트 바인딩) -->
          <div class="w-36 shrink-0">
            <NumberInput
              v-model="item.amount"
              :show-zero-as-dash="false"
              placeholder="0"
              class-name="text-right font-bold text-[#F9FAFB] text-[14px] py-1 tabular-nums"
            />
          </div>
        </div>

        <!-- 편집 모드일 때만 보이는 '+ 잔액 항목 추가' 버튼 -->
        <button
          v-if="isEditingList"
          @click="onAddBalanceItem"
          class="btn btn--secondary w-full mt-2 !min-h-[36px] !text-[13px]"
        >
          + 잔액 항목 추가
        </button>
      </div>
    </div>

    <!-- [UI 영역 3] 하단 잔액 총계 표시 -->
    <div class="mt-4 pt-4 border-t border-white/[0.07] flex justify-between items-baseline">
      <span class="text-[#8B95A1] text-[14px] font-bold">잔액 총계</span>
      <span class="text-[20px] font-extrabold text-[#64A8FF] font-mono tracking-tight tabular-nums">
        {{ formatCurrency(totalBalance) }}
      </span>
    </div>
  </section>
</template>
