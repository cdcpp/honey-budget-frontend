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
// [SECTION 1] Props (부모로부터 전달받는 잔액 목록과 추가/삭제 콜백)
// ============================================================================
defineProps({
  balanceList: { type: Array, required: true },        // 잔액 항목 배열 [{ id, name, amount }]
  totalBalance: { type: Number, required: true },      // 전체 잔액 합계
  formatCurrency: { type: Function, required: true },  // 원화 포맷팅 함수
  onAddBalanceItem: { type: Function, required: true },// '+ 잔액 항목 추가' 클릭 시 실행 함수
  onRemoveBalanceItem: { type: Function, required: true } // 항목 '삭제' 클릭 시 실행 함수
})

// ============================================================================
// [SECTION 2] Reactive State (항목 편집 모드 토글 상태)
// ============================================================================
/** true이면 항목 이름 수정 input과 삭제/추가 버튼이 노출됩니다. */
const isEditingList = ref(false)
</script>

<template>
  <section class="ts-card p-6 flex flex-col justify-between" aria-label="잔액 현황">
    <div>
      <!-- [UI 영역 1] 카드 상단 헤더 및 '항목 편집 / 편집 완료' 토글 버튼 -->
      <div class="flex items-center justify-between pb-4 mb-4 border-b border-[#141413]/12">
        <div class="flex items-baseline gap-2">
          <h2 class="text-[16px] font-bold text-[#141413] tracking-tight">
            잔액 현황
          </h2>
          <span class="text-[13px] text-[#575653]">누적 기준</span>
        </div>

        <button
          @click="isEditingList = !isEditingList"
          class="btn btn--secondary !min-h-[30px] !px-2.5 !text-[13px]"
        >
          <span>{{ isEditingList ? '편집 완료' : '항목 편집' }}</span>
        </button>
      </div>

      <!-- [UI 영역 2] 보유 잔액 항목 리스트 및 금액 입력 필드 -->
      <div class="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
        <div
          v-for="(item, idx) in balanceList"
          :key="item.id || idx"
          class="flex items-center justify-between gap-3 text-[14px]"
        >
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <!-- 편집 모드일 때만 보이는 삭제 버튼 및 이름 수정 input -->
            <button
              v-if="isEditingList"
              @click="onRemoveBalanceItem(idx)"
              title="항목 삭제"
              class="text-[#b91c1c] hover:underline text-[13px] font-medium shrink-0 cursor-pointer"
            >
              삭제
            </button>
            <input
              v-if="isEditingList"
              v-model="item.name"
              class="ts-input !h-[30px] !px-2 !text-[13px] w-full max-w-[140px]"
            />
            <span v-else class="text-[#141413] font-medium truncate" :title="item.name">
              {{ item.name }}
            </span>
          </div>

          <!-- 우측 금액 입력 (NumberInput 컴포넌트 바인딩) -->
          <div class="w-36 shrink-0">
            <div class="bg-[#F7F6F2] border border-[#141413]/15 rounded-[6px] px-2.5 py-0.5 focus-within:border-[#0a4b49] focus-within:bg-white transition-colors">
              <NumberInput
                v-model="item.amount"
                :show-zero-as-dash="false"
                placeholder="0"
                class-name="text-right font-semibold text-[#141413] text-[13px] py-1 tabular-nums"
              />
            </div>
          </div>
        </div>

        <!-- 편집 모드일 때만 보이는 '+ 잔액 항목 추가' 버튼 -->
        <button
          v-if="isEditingList"
          @click="onAddBalanceItem"
          class="btn btn--secondary w-full mt-2 !min-h-[32px]"
        >
          + 잔액 항목 추가
        </button>
      </div>
    </div>

    <!-- [UI 영역 3] 하단 잔액 총계 표시 -->
    <div class="mt-5 pt-4 border-t border-[#141413]/12 flex justify-between items-baseline">
      <span class="text-[#575653] text-[14px] font-medium">잔액 총계</span>
      <span class="text-[18px] font-bold text-[#141413] font-mono tracking-tight tabular-nums">
        {{ formatCurrency(totalBalance) }}
      </span>
    </div>
  </section>
</template>
