<script setup>
import { ref } from 'vue'
import NumberInput from './NumberInput.vue'

const props = defineProps({
  balanceList: { type: Array, required: true },
  totalBalance: { type: Number, required: true },
  formatCurrency: { type: Function, required: true },
  onAddBalanceItem: { type: Function, required: true },
  onRemoveBalanceItem: { type: Function, required: true }
})

const isEditingList = ref(false)
</script>

<template>
  <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <i class="fa-solid fa-piggy-bank text-emerald-500"></i> 잔액 현황
        </h2>
        <div class="flex items-center gap-2">
          <button @click="isEditingList = !isEditingList" class="text-xs text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-100 cursor-pointer">
            <i :class="isEditingList ? 'fa-solid fa-check text-emerald-600' : 'fa-solid fa-pen-to-square'"></i>
            <span>{{ isEditingList ? '완료' : '편집' }}</span>
          </button>
          <span class="text-xs font-normal text-slate-400">누적 기준</span>
        </div>
      </div>

      <div class="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
        <div v-for="(item, idx) in balanceList" :key="item.id || idx" class="flex items-center justify-between gap-2 text-sm group">
          <div class="flex items-center gap-1.5 flex-1 min-w-0">
            <button v-if="isEditingList" @click="onRemoveBalanceItem(idx)" title="항목 삭제" class="text-rose-400 hover:text-rose-600 text-xs p-1 cursor-pointer">
              <i class="fa-solid fa-circle-minus"></i>
            </button>
            <input v-if="isEditingList" v-model="item.name" class="px-1.5 py-0.5 text-xs font-medium border border-slate-200 rounded focus:border-indigo-500 outline-none w-28" />
            <span v-else class="text-slate-600 font-medium truncate" :title="item.name">{{ item.name }}</span>
          </div>

          <div class="w-36 flex-shrink-0">
            <div class="bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 hover:border-slate-300 focus-within:border-indigo-500 focus-within:bg-white transition-colors">
              <NumberInput v-model="item.amount" :show-zero-as-dash="false" placeholder="0" class-name="text-right font-semibold text-slate-800 text-xs py-1" />
            </div>
          </div>
        </div>

        <button v-if="isEditingList" @click="onAddBalanceItem" class="w-full mt-2 py-1.5 border border-dashed border-indigo-200 hover:border-indigo-400 text-indigo-600 text-xs rounded-lg flex items-center justify-center gap-1.5 bg-indigo-50/50 hover:bg-indigo-50 transition-colors cursor-pointer">
          <i class="fa-solid fa-plus text-[10px]"></i> 잔액 항목 추가
        </button>
      </div>
    </div>

    <div class="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center font-bold">
      <span class="text-slate-700 text-sm">잔액 총계</span>
      <span class="text-base text-indigo-600 font-mono tracking-tight">{{ formatCurrency(totalBalance) }}</span>
    </div>
  </div>
</template>