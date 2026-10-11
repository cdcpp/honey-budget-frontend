<script setup>
import { ref } from 'vue'
import NumberInput from './NumberInput.vue'

const props = defineProps({
  incomeRows: { type: Array, required: true },
  savingRows: { type: Array, required: true },
  expenseRows: { type: Array, required: true },
  totalIncomeByMonth: { type: Array, required: true },
  totalSavingsByMonth: { type: Array, required: true },
  totalExpensesByMonth: { type: Array, required: true },
  netBalanceByMonth: { type: Array, required: true },
  annualIncomeTotal: { type: Number, required: true },
  annualSavingsTotal: { type: Number, required: true },
  annualExpensesTotal: { type: Number, required: true },
  annualNetTotal: { type: Number, required: true },
  getRowTotal: { type: Function, required: true },
  addRow: { type: Function, required: true },
  removeRow: { type: Function, required: true },
  fillRowAcrossMonths: { type: Function, required: true },
  formatNumber: { type: Function, required: true }
})

const editingRowId = ref(null)
const toggleEditLabel = (id) => {
  editingRowId.value = editingRowId.value === id ? null : id
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <div class="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50/50">
      <div>
        <h3 class="font-bold text-slate-800 flex items-center gap-2">
          <i class="fa-solid fa-table-list text-slate-500"></i> 연간 수입 / 저축 / 지출 명세표
        </h3>
        <p class="text-[11px] text-slate-500 mt-0.5">
          항목별 1월 금액 입력 후 <i class="fa-solid fa-angles-right text-indigo-500 text-[10px]"></i> 버튼을 누르면 12개월 전체에 동일 금액이 자동 채워집니다.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-slate-400 font-medium">단위: 원 (클릭하여 직접 수정 가능)</span>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs border-collapse">
        <thead>
          <tr class="bg-slate-100 text-slate-600 font-semibold text-center border-b border-slate-200 select-none">
            <th class="p-3 w-48 min-w-[190px] sticky left-0 bg-slate-100 z-20 shadow-[1px_0_0_#e2e8f0] text-left">
              월급 월기준 (+1달)
            </th>
            <th v-for="m in 12" :key="m" class="p-2.5 min-w-[95px] border-l border-slate-200">
              {{ m }}월
            </th>
            <th class="p-2.5 min-w-[115px] border-l border-slate-300 bg-slate-200/70 text-slate-700 font-bold sticky right-0 z-10 shadow-[-1px_0_0_#cbd5e1]">
              연간 합계
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-mono">
          <tr class="bg-indigo-50/60 border-y border-indigo-100 font-sans font-semibold text-indigo-950 text-xs">
            <td colspan="14" class="px-4 py-2 sticky left-0 z-10 bg-indigo-50/60">
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-1.5">
                  <i class="fa-solid fa-coins text-indigo-600"></i> 수입 (월급 및 부수입)
                </span>
                <button
                  @click="addRow('income')"
                  class="text-[11px] font-normal text-indigo-600 hover:text-indigo-800 bg-white/80 hover:bg-white px-2 py-0.5 rounded border border-indigo-200 transition-colors shadow-xs cursor-pointer"
                >
                  <i class="fa-solid fa-plus mr-1"></i> 수입 항목 추가
                </button>
              </div>
            </td>
          </tr>

          <tr
            v-for="(row, rIdx) in incomeRows"
            :key="row.id || 'inc-' + rIdx"
            class="hover:bg-slate-50/80 transition-colors group"
          >
            <td class="p-2 font-sans font-medium text-slate-700 sticky left-0 bg-white z-10 shadow-[1px_0_0_#f1f5f9]">
              <div class="flex items-center justify-between gap-1">
                <div class="flex items-center gap-1 flex-1 min-w-0">
                  <button
                    v-if="incomeRows.length > 1"
                    @click="removeRow('income', rIdx)"
                    title="항목 삭제"
                    class="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-opacity p-1 text-[11px] cursor-pointer"
                  >
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                  <input
                    v-if="editingRowId === (row.id || 'inc-' + rIdx)"
                    v-model="row.label"
                    @blur="toggleEditLabel(row.id || 'inc-' + rIdx)"
                    @keydown.enter="toggleEditLabel(row.id || 'inc-' + rIdx)"
                    class="w-full px-1.5 py-0.5 text-xs font-semibold rounded border border-indigo-400 outline-none"
                  />
                  <span
                    v-else
                    @dblclick="toggleEditLabel(row.id || 'inc-' + rIdx)"
                    class="truncate cursor-text"
                    title="더블클릭하여 이름 변경"
                  >
                    {{ row.label }}
                  </span>
                </div>
                <button
                  @click="fillRowAcrossMonths(row, 0)"
                  title="1월 금액을 12개월 전체에 동일하게 복사"
                  class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 px-1 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-indigo-50 transition-all flex items-center gap-0.5 cursor-pointer"
                >
                  <i class="fa-solid fa-angles-right"></i>
                </button>
              </div>
            </td>

            <td v-for="(val, cIdx) in row.values" :key="cIdx" class="p-1 border-l border-slate-100">
              <NumberInput
                v-model="row.values[cIdx]"
                placeholder="-"
                class-name="py-1 px-1 text-xs"
              />
            </td>

            <td class="p-2 text-right border-l border-slate-300 font-semibold text-slate-700 bg-slate-50 sticky right-0 z-10 shadow-[-1px_0_0_#e2e8f0]">
              {{ formatNumber(getRowTotal(row)) }}
            </td>
          </tr>

          <tr class="bg-indigo-50/40 border-t border-indigo-100 font-sans font-semibold text-indigo-900 text-xs">
            <td class="p-2.5 sticky left-0 bg-indigo-50/80 z-10 shadow-[1px_0_0_#c7d2fe] flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> 총 수입
            </td>
            <td v-for="(tot, idx) in totalIncomeByMonth" :key="idx" class="p-2 text-right border-l border-indigo-100 font-mono">
              {{ formatNumber(tot) }}
            </td>
            <td class="p-2.5 text-right border-l border-indigo-200 bg-indigo-100/60 font-bold font-mono text-indigo-950 sticky right-0 z-10 shadow-[-1px_0_0_#c7d2fe]">
              {{ formatNumber(annualIncomeTotal) }}
            </td>
          </tr>

          <tr class="bg-amber-50/70 border-y border-amber-200 font-sans font-semibold text-amber-900 text-xs">
            <td colspan="14" class="px-4 py-2 sticky left-0 z-10 bg-amber-50/70">
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-1.5">
                  <i class="fa-solid fa-piggy-bank text-amber-600"></i> 저축 및 투자 (총 저축액 산정 항목)
                </span>
                <button
                  @click="addRow('saving')"
                  class="text-[11px] font-normal text-amber-700 hover:text-amber-900 bg-white/80 hover:bg-white px-2 py-0.5 rounded border border-amber-200 transition-colors shadow-xs cursor-pointer"
                >
                  <i class="fa-solid fa-plus mr-1"></i> 저축/투자 항목 추가
                </button>
              </div>
            </td>
          </tr>

          <tr
            v-for="(row, rIdx) in savingRows"
            :key="row.id || 'sav-' + rIdx"
            class="hover:bg-amber-50/20 transition-colors bg-amber-50/10 group"
          >
            <td class="p-2 font-sans font-medium text-amber-950 sticky left-0 bg-amber-50/30 z-10 shadow-[1px_0_0_#fef3c7]">
              <div class="flex items-center justify-between gap-1">
                <div class="flex items-center gap-1 flex-1 min-w-0">
                  <button
                    v-if="savingRows.length > 1"
                    @click="removeRow('saving', rIdx)"
                    title="항목 삭제"
                    class="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-opacity p-1 text-[11px] cursor-pointer"
                  >
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                  <input
                    v-if="editingRowId === (row.id || 'sav-' + rIdx)"
                    v-model="row.label"
                    @blur="toggleEditLabel(row.id || 'sav-' + rIdx)"
                    @keydown.enter="toggleEditLabel(row.id || 'sav-' + rIdx)"
                    class="w-full px-1.5 py-0.5 text-xs font-semibold rounded border border-amber-400 outline-none"
                  />
                  <span
                    v-else
                    @dblclick="toggleEditLabel(row.id || 'sav-' + rIdx)"
                    class="truncate cursor-text"
                    title="더블클릭하여 이름 변경"
                  >
                    {{ row.label }}
                  </span>
                </div>
                <button
                  @click="fillRowAcrossMonths(row, 0)"
                  title="1월 금액을 12개월 전체에 동일하게 복사"
                  class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-amber-700 px-1 py-0.5 rounded text-[10px] bg-amber-100/60 hover:bg-amber-200 transition-all flex items-center gap-0.5 cursor-pointer"
                >
                  <i class="fa-solid fa-angles-right"></i>
                </button>
              </div>
            </td>

            <td v-for="(val, cIdx) in row.values" :key="cIdx" class="p-1 border-l border-slate-100">
              <NumberInput
                v-model="row.values[cIdx]"
                placeholder="-"
                class-name="py-1 px-1 text-xs"
              />
            </td>

            <td class="p-2 text-right border-l border-slate-300 font-semibold text-amber-950 bg-amber-50/40 sticky right-0 z-10 shadow-[-1px_0_0_#fde68a]">
              {{ formatNumber(getRowTotal(row)) }}
            </td>
          </tr>

          <tr class="bg-amber-100/50 border-t border-amber-200 font-sans font-semibold text-amber-950 text-xs">
            <td class="p-2.5 sticky left-0 bg-amber-100/80 z-10 shadow-[1px_0_0_#fcd34d] flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> 총 저축액
            </td>
            <td v-for="(tot, idx) in totalSavingsByMonth" :key="idx" class="p-2 text-right border-l border-amber-200 font-mono">
              {{ formatNumber(tot) }}
            </td>
            <td class="p-2.5 text-right border-l border-amber-300 bg-amber-200/60 font-bold font-mono text-amber-950 sticky right-0 z-10 shadow-[-1px_0_0_#fcd34d]">
              {{ formatNumber(annualSavingsTotal) }}
            </td>
          </tr>

          <tr class="bg-slate-100/70 border-y border-slate-200 font-sans font-semibold text-slate-700 text-xs">
            <td colspan="14" class="px-4 py-2 sticky left-0 z-10 bg-slate-100/70">
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-1.5">
                  <i class="fa-solid fa-receipt text-slate-500"></i> 일반 및 고정 지출
                </span>
                <button
                  @click="addRow('expense')"
                  class="text-[11px] font-normal text-slate-600 hover:text-slate-800 bg-white/80 hover:bg-white px-2 py-0.5 rounded border border-slate-200 transition-colors shadow-xs cursor-pointer"
                >
                  <i class="fa-solid fa-plus mr-1"></i> 지출 항목 추가
                </button>
              </div>
            </td>
          </tr>

          <tr
            v-for="(row, rIdx) in expenseRows"
            :key="row.id || 'exp-' + rIdx"
            class="hover:bg-slate-50/80 transition-colors group"
          >
            <td class="p-2 font-sans font-medium text-slate-700 sticky left-0 bg-white z-10 shadow-[1px_0_0_#f1f5f9]">
              <div class="flex items-center justify-between gap-1">
                <div class="flex items-center gap-1 flex-1 min-w-0">
                  <button
                    v-if="expenseRows.length > 1"
                    @click="removeRow('expense', rIdx)"
                    title="항목 삭제"
                    class="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-opacity p-1 text-[11px] cursor-pointer"
                  >
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                  <input
                    v-if="editingRowId === (row.id || 'exp-' + rIdx)"
                    v-model="row.label"
                    @blur="toggleEditLabel(row.id || 'exp-' + rIdx)"
                    @keydown.enter="toggleEditLabel(row.id || 'exp-' + rIdx)"
                    class="w-full px-1.5 py-0.5 text-xs font-semibold rounded border border-indigo-400 outline-none"
                  />
                  <span
                    v-else
                    @dblclick="toggleEditLabel(row.id || 'exp-' + rIdx)"
                    class="truncate cursor-text"
                    title="더블클릭하여 이름 변경"
                  >
                    {{ row.label }}
                  </span>
                </div>
                <button
                  @click="fillRowAcrossMonths(row, 0)"
                  title="1월 금액을 12개월 전체에 동일하게 복사"
                  class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 px-1 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-rose-50 transition-all flex items-center gap-0.5 cursor-pointer"
                >
                  <i class="fa-solid fa-angles-right"></i>
                </button>
              </div>
            </td>

            <td v-for="(val, cIdx) in row.values" :key="cIdx" class="p-1 border-l border-slate-100">
              <NumberInput
                v-model="row.values[cIdx]"
                placeholder="-"
                class-name="py-1 px-1 text-xs"
              />
            </td>

            <td class="p-2 text-right border-l border-slate-300 font-semibold text-slate-700 bg-slate-50 sticky right-0 z-10 shadow-[-1px_0_0_#e2e8f0]">
              {{ formatNumber(getRowTotal(row)) }}
            </td>
          </tr>

          <tr class="bg-rose-50/40 border-t border-rose-100 font-sans font-semibold text-rose-900 text-xs">
            <td class="p-2.5 sticky left-0 bg-rose-50/80 z-10 shadow-[1px_0_0_#fecdd3] flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> 총 지출
            </td>
            <td v-for="(tot, idx) in totalExpensesByMonth" :key="idx" class="p-2 text-right border-l border-rose-100 font-mono">
              {{ formatNumber(tot) }}
            </td>
            <td class="p-2.5 text-right border-l border-rose-200 bg-rose-100/60 font-bold font-mono text-rose-950 sticky right-0 z-10 shadow-[-1px_0_0_#fecdd3]">
              {{ formatNumber(annualExpensesTotal) }}
            </td>
          </tr>

          <tr class="bg-emerald-50 border-t-2 border-emerald-300 font-semibold text-emerald-950 text-xs">
            <td class="p-3 font-sans sticky left-0 bg-emerald-50 z-10 shadow-[1px_0_0_#a7f3d0] flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span> 총 저축액
            </td>
            <td v-for="(tot, idx) in totalSavingsByMonth" :key="idx" class="p-3 text-right border-l border-emerald-100 font-mono font-bold">
              {{ formatNumber(tot) }}
            </td>
            <td class="p-3 text-right border-l border-emerald-200 bg-emerald-100/70 font-bold font-mono text-emerald-950 sticky right-0 z-10 shadow-[-1px_0_0_#a7f3d0]">
              {{ formatNumber(annualSavingsTotal) }}
            </td>
          </tr>

          <tr class="bg-amber-100/60 border-t border-amber-300 font-bold text-slate-900 text-xs">
            <td class="p-3 font-sans sticky left-0 bg-amber-100/90 z-10 shadow-[1px_0_0_#fde68a] flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-amber-500"></span> 총 지출
            </td>
            <td v-for="(tot, idx) in totalExpensesByMonth" :key="idx" class="p-3 text-right border-l border-amber-200 font-mono font-bold">
              {{ formatNumber(tot) }}
            </td>
            <td class="p-3 text-right border-l border-amber-300 bg-amber-200/70 font-bold font-mono text-slate-950 sticky right-0 z-10 shadow-[-1px_0_0_#fde68a]">
              {{ formatNumber(annualExpensesTotal) }}
            </td>
          </tr>

          <tr class="bg-indigo-50/70 border-t border-indigo-200 font-bold text-xs">
            <td class="p-3 font-sans sticky left-0 bg-indigo-50/90 z-10 shadow-[1px_0_0_#c7d2fe] flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-indigo-600"></span> 순 잉여 자금 (잔여금)
            </td>
            <td
              v-for="(net, idx) in netBalanceByMonth"
              :key="idx"
              :class="[
                'p-3 text-right border-l font-mono',
                net < 0 ? 'text-rose-600 border-rose-200 bg-rose-50/30' : 'text-indigo-800 border-indigo-100'
              ]"
            >
              {{ formatNumber(net) }}
            </td>
            <td
              :class="[
                'p-3 text-right border-l font-bold font-mono sticky right-0 z-10',
                annualNetTotal < 0
                  ? 'bg-rose-100/70 text-rose-700 border-rose-200 shadow-[-1px_0_0_#fecdd3]'
                  : 'bg-indigo-100/70 text-indigo-900 border-indigo-200 shadow-[-1px_0_0_#c7d2fe]'
              ]"
            >
              {{ formatNumber(annualNetTotal) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>