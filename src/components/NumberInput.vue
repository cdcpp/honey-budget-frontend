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
// [SECTION 1] Props & Emits
// ============================================================================
const props = defineProps({
  modelValue: { type: [Number, String], default: 0 },
  placeholder: { type: String, default: '-' },
  className: { type: String, default: '' },
  showZeroAsDash: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue', 'change'])

// ============================================================================
// [SECTION 2] Reactive State & Computed
// ============================================================================
const isFocused = ref(false)
const rawInput = ref('')

const displayValue = computed(() => {
  const num = Number(props.modelValue)
  if (isNaN(num) || (!isFocused.value && num === 0 && props.showZeroAsDash)) {
    return props.placeholder
  }
  return num.toLocaleString('ko-KR')
})

// ============================================================================
// [SECTION 3] Event Handlers
// ============================================================================
const onFocus = (e) => {
  isFocused.value = true
  const num = Number(props.modelValue)
  rawInput.value = num === 0 ? '' : String(num)
  setTimeout(() => { e.target.select() }, 10)
}

const onInput = (e) => {
  const cleanVal = e.target.value.replace(/[^0-9-]/g, '')
  rawInput.value = cleanVal
  const parsed = cleanVal === '' || cleanVal === '-' ? 0 : Number(cleanVal)
  emit('update:modelValue', parsed)
}

const onBlur = () => {
  isFocused.value = false
  const parsed = rawInput.value === '' ? 0 : Number(rawInput.value)
  emit('update:modelValue', isNaN(parsed) ? 0 : parsed)
  emit('change', isNaN(parsed) ? 0 : parsed)
}

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
        'w-full text-right py-1.5 px-2 rounded-[8px] cursor-pointer select-none truncate transition-colors font-mono tabular-nums hover:bg-white/[0.06]',
        modelValue > 0 ? 'text-[#F9FAFB] font-semibold' : 'text-[#6B7684]',
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
        'w-full text-right py-1.5 px-2 rounded-[8px] bg-[#202532] ring-2 ring-[#3182F6] outline-none font-mono tabular-nums text-[#F9FAFB] font-bold',
        className
      ]"
    />
  </div>
</template>
