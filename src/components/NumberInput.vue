<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: [Number, String], default: 0 },
  placeholder: { type: String, default: '-' },
  className: { type: String, default: '' },
  showZeroAsDash: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue', 'change'])
const isFocused = ref(false)
const rawInput = ref('')

const displayValue = computed(() => {
  const num = Number(props.modelValue)
  if (isNaN(num) || (!isFocused.value && num === 0 && props.showZeroAsDash)) {
    return props.placeholder
  }
  return num.toLocaleString('ko-KR')
})

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
    <div
      v-if="!isFocused"
      @click="isFocused = true"
      :class="[
        'w-full text-right py-1 px-1.5 rounded cursor-pointer select-none truncate transition-colors font-mono',
        modelValue > 0 ? 'text-slate-800 font-medium' : 'text-slate-400',
        className
      ]"
      tabindex="0"
      @focus="isFocused = true"
    >
      {{ displayValue }}
    </div>
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
        'w-full text-right py-1 px-1.5 rounded bg-white shadow-sm ring-2 ring-indigo-500 outline-none font-mono text-slate-900',
        className
      ]"
    />
  </div>
</template>