<script setup>
/**
 * ============================================================================
 * @file        NumberInput.vue
 * @layer       Common UI Component (공통 숫자/금액 입력 컴포넌트)
 * @role        평소에는 3자리 콤마('3,000,000') 또는 '-'로 보기 좋게 표시하고,
 *              클릭(포커스)했을 때만 순수 숫자 입력창(<input>)으로 전환되는 스마트 인풋입니다.
 * @parent      BudgetTable.vue, BalanceSection.vue
 * ============================================================================
 */
import { ref, computed } from 'vue'

// ============================================================================
// [SECTION 1] Props & Emits (v-model 양방향 바인딩 인터페이스)
// ============================================================================
const props = defineProps({
  modelValue: { type: [Number, String], default: 0 }, // v-model로 연결된 실제 숫자 값
  placeholder: { type: String, default: '-' },        // 0원일 때 표시할 기호 (기본: '-')
  className: { type: String, default: '' },           // 부모에서 추가로 주입할 CSS 클래스
  showZeroAsDash: { type: Boolean, default: true }    // true면 0원을 placeholder('-')로 표시
})

const emit = defineEmits(['update:modelValue', 'change'])

// ============================================================================
// [SECTION 2] Reactive State & Computed (포커스 여부 및 화면 표시 문자열)
// ============================================================================
const isFocused = ref(false) // 현재 사용자가 입력 칸을 클릭하여 편집 중인지 여부
const rawInput = ref('')     // 편집 중일 때 입력창에 표시할 순수 숫자 문자열

/** 포커스가 아닐 때 화면에 보여줄 3자리 콤마 포맷 문자열 */
const displayValue = computed(() => {
  const num = Number(props.modelValue)
  if (isNaN(num) || (!isFocused.value && num === 0 && props.showZeroAsDash)) {
    return props.placeholder
  }
  return num.toLocaleString('ko-KR')
})

// ============================================================================
// [SECTION 3] Event Handlers (포커스 진입, 숫자 타이핑, 포커스 해제, 엔터키 처리)
// ============================================================================

/** 입력창에 포커스될 때 기존 숫자를 전체 선택(드래그)하여 바로 덮어쓸 수 있게 합니다. */
const onFocus = (e) => {
  isFocused.value = true
  const num = Number(props.modelValue)
  rawInput.value = num === 0 ? '' : String(num)
  setTimeout(() => { e.target.select() }, 10)
}

/** 타이핑할 때 숫자와 마이너스(-) 기호 외의 문자를 제거하고 부모의 v-model 값을 즉시 갱신합니다. */
const onInput = (e) => {
  const cleanVal = e.target.value.replace(/[^0-9-]/g, '')
  rawInput.value = cleanVal
  const parsed = cleanVal === '' || cleanVal === '-' ? 0 : Number(cleanVal)
  emit('update:modelValue', parsed)
}

/** 포커스가 빠져나갈 때(Blur) 편집 모드를 종료하고 최종 숫자를 확정합니다. */
const onBlur = () => {
  isFocused.value = false
  const parsed = rawInput.value === '' ? 0 : Number(rawInput.value)
  emit('update:modelValue', isNaN(parsed) ? 0 : parsed)
  emit('change', isNaN(parsed) ? 0 : parsed)
}

/** 엔터(Enter) 키를 누르면 입력이 완료된 것으로 간주하고 포커스를 해제합니다. */
const onKeyDown = (e) => {
  if (e.key === 'Enter') e.target.blur()
}
</script>

<template>
  <div class="relative w-full">
    <!-- [평상시 보기 모드] 클릭하면 편집 모드(isFocused = true)로 전환됩니다. -->
    <div
      v-if="!isFocused"
      @click="isFocused = true"
      :class="[
        'w-full text-right py-1 px-1.5 rounded-[4px] cursor-pointer select-none truncate transition-colors font-mono tabular-nums',
        modelValue > 0 ? 'text-[#141413] font-medium' : 'text-[#575653]/60',
        className
      ]"
      tabindex="0"
      @focus="isFocused = true"
    >
      {{ displayValue }}
    </div>

    <!-- [클릭/포커스 시 편집 모드] 순수 숫자를 입력받습니다. -->
    <input
      v-else
      type="text"
      inputmode="numeric"
      :value="rawInput"
      @input="onInput"
      @blur="onBlur"
      @keydown="onKeyDown"
      :placeholder="placeholder"
      autofocus
      :class="[
        'w-full text-right py-1 px-1.5 rounded-[4px] bg-white ring-2 ring-[#0a4b49] outline-none font-mono tabular-nums text-[#141413]',
        className
      ]"
    />
  </div>
</template>
