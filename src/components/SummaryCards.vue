<script setup>
import { computed } from 'vue'

const props = defineProps({
  totalBalance: { type: Number, required: true },
  annualIncome: { type: Number, required: true },
  annualSavings: { type: Number, required: true },
  annualExpenses: { type: Number, required: true },
  annualNet: { type: Number, required: true },
  formatCurrency: { type: Function, required: true }
})

const savingsRate = computed(() => {
  if (!props.annualIncome || props.annualIncome === 0) return 0
  const rate = (props.annualSavings / props.annualIncome) * 100
  return Math.round(rate * 10) / 10
})
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
    <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div class="flex items-center justify-between text-slate-500">
        <span class="text-xs font-semibold">보유 잔액 총계</span>
        <span class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">
          <i class="fa-solid fa-vault"></i>
        </span>
      </div>
      <div class="mt-2">
        <div class="text-lg font-bold font-mono text-emerald-700 truncate">{{ formatCurrency(totalBalance) }}</div>
        <p class="text-[11px] text-slate-400 mt-0.5">비상금 / 예적금 등 합산</p>
      </div>
    </div>

    <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div class="flex items-center justify-between text-slate-500">
        <span class="text-xs font-semibold">연간 총 수입</span>
        <span class="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">
          <i class="fa-solid fa-coins"></i>
        </span>
      </div>
      <div class="mt-2">
        <div class="text-lg font-bold font-mono text-indigo-700 truncate">{{ formatCurrency(annualIncome) }}</div>
        <p class="text-[11px] text-slate-400 mt-0.5">수입 + 부수입 합산</p>
      </div>
    </div>

    <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div class="flex items-center justify-between text-slate-500">
        <span class="text-xs font-semibold">연간 저축 & 투자</span>
        <span class="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs">
          <i class="fa-solid fa-piggy-bank"></i>
        </span>
      </div>
      <div class="mt-2">
        <div class="text-lg font-bold font-mono text-amber-700 truncate">{{ formatCurrency(annualSavings) }}</div>
        <p class="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
          <span>저축률:</span>
          <span class="font-semibold text-amber-600 font-mono">{{ savingsRate }}%</span>
        </p>
      </div>
    </div>

    <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div class="flex items-center justify-between text-slate-500">
        <span class="text-xs font-semibold">연간 총 지출</span>
        <span class="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs">
          <i class="fa-solid fa-receipt"></i>
        </span>
      </div>
      <div class="mt-2">
        <div class="text-lg font-bold font-mono text-rose-700 truncate">{{ formatCurrency(annualExpenses) }}</div>
        <p class="text-[11px] text-slate-400 mt-0.5">고정/변동 소비 합산</p>
      </div>
    </div>

    <div class="col-span-2 md:col-span-4 lg:col-span-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div class="flex items-center justify-between text-slate-500">
        <span class="text-xs font-semibold">연간 순 잉여자금</span>
        <span :class="['w-7 h-7 rounded-lg flex items-center justify-center text-xs', annualNet >= 0 ? 'bg-sky-50 text-sky-600' : 'bg-rose-50 text-rose-600']">
          <i :class="annualNet >= 0 ? 'fa-solid fa-scale-balanced' : 'fa-solid fa-triangle-exclamation'"></i>
        </span>
      </div>
      <div class="mt-2">
        <div :class="['text-lg font-bold font-mono truncate', annualNet >= 0 ? 'text-sky-700' : 'text-rose-600']">{{ formatCurrency(annualNet) }}</div>
        <p class="text-[11px] text-slate-400 mt-0.5">수입 - 저축 - 지출</p>
      </div>
    </div>
  </div>
</template>