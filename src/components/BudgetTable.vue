<script setup>
import { ref, computed } from 'vue'
import NumberInput from './NumberInput.vue'

const props = defineProps({
  sections: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
  year: { type: Number, required: true },
  yearLoading: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  saveError: { type: String, default: null },
  saveMessage: { type: String, default: '' },
  dirtyCount: { type: Number, default: 0 },
  totalIncomeByMonth: { type: Array, required: true },
  totalSavingsByMonth: { type: Array, required: true },
  totalExpensesByMonth: { type: Array, required: true },
  annualIncomeTotal: { type: Number, required: true },
  annualSavingsTotal: { type: Number, required: true },
  annualExpensesTotal: { type: Number, required: true },
  getRowTotal: { type: Function, required: true },
  getCategoryMonthTotal: { type: Function, required: true },
  getCategoryTotal: { type: Function, required: true },
  fillRowAcrossMonths: { type: Function, required: true },
  formatNumber: { type: Function, required: true }
})

const emit = defineEmits(['change-year', 'save'])

// 현재 연도 기준 앞뒤 5년 + 선택된 연도
const yearOptions = computed(() => {
  const current = new Date().getFullYear()
  const years = new Set([props.year])
  for (let y = current - 5; y <= current + 5; y++) years.add(y)
  return [...years].sort((a, b) => b - a)
})

// 구간(수입 / 저축 및 투자 / 지출 / 기타)별 색상 테마
const themes = {
  income: {
    icon: 'fa-solid fa-coins text-indigo-600',
    sectionRow: 'bg-indigo-50/60 border-y border-indigo-100 text-indigo-950',
    sectionCell: 'bg-indigo-50/60',
    categoryRow: 'bg-indigo-50/30 text-indigo-900',
    categoryCell: 'bg-indigo-50',
    categoryTotalCell: 'border-indigo-100',
    labelCell: 'bg-white shadow-[1px_0_0_#f1f5f9] text-slate-700',
    fillBtn: 'hover:text-indigo-600 hover:bg-indigo-50',
    rowTotalCell: 'text-slate-700 bg-slate-50 shadow-[-1px_0_0_#e2e8f0]',
    totalRow: 'bg-indigo-50/40 border-t border-indigo-100 text-indigo-900',
    totalLabel: 'bg-indigo-50/80 shadow-[1px_0_0_#c7d2fe]',
    totalDot: 'bg-indigo-500',
    totalMonthCell: 'border-indigo-100',
    totalAnnualCell: 'border-indigo-200 bg-indigo-100/60 text-indigo-950 shadow-[-1px_0_0_#c7d2fe]'
  },
  saving: {
    icon: 'fa-solid fa-piggy-bank text-amber-600',
    sectionRow: 'bg-amber-50/70 border-y border-amber-200 text-amber-900',
    sectionCell: 'bg-amber-50/70',
    categoryRow: 'bg-amber-50/30 text-amber-900',
    categoryCell: 'bg-amber-50',
    categoryTotalCell: 'border-amber-100',
    labelCell: 'bg-amber-50/30 shadow-[1px_0_0_#fef3c7] text-amber-950',
    fillBtn: 'hover:text-amber-700 hover:bg-amber-200',
    rowTotalCell: 'text-amber-950 bg-amber-50/40 shadow-[-1px_0_0_#fde68a]',
    totalRow: 'bg-amber-100/50 border-t border-amber-200 text-amber-950',
    totalLabel: 'bg-amber-100/80 shadow-[1px_0_0_#fcd34d]',
    totalDot: 'bg-amber-500',
    totalMonthCell: 'border-amber-200',
    totalAnnualCell: 'border-amber-300 bg-amber-200/60 text-amber-950 shadow-[-1px_0_0_#fcd34d]'
  },
  expense: {
    icon: 'fa-solid fa-receipt text-rose-500',
    sectionRow: 'bg-slate-100/70 border-y border-slate-200 text-slate-700',
    sectionCell: 'bg-slate-100/70',
    categoryRow: 'bg-slate-50 text-slate-700',
    categoryCell: 'bg-slate-50',
    categoryTotalCell: 'border-slate-100',
    labelCell: 'bg-white shadow-[1px_0_0_#f1f5f9] text-slate-700',
    fillBtn: 'hover:text-rose-600 hover:bg-rose-50',
    rowTotalCell: 'text-slate-700 bg-slate-50 shadow-[-1px_0_0_#e2e8f0]',
    totalRow: 'bg-rose-50/40 border-t border-rose-100 text-rose-900',
    totalLabel: 'bg-rose-50/80 shadow-[1px_0_0_#fecdd3]',
    totalDot: 'bg-rose-500',
    totalMonthCell: 'border-rose-100',
    totalAnnualCell: 'border-rose-200 bg-rose-100/60 text-rose-950 shadow-[-1px_0_0_#fecdd3]'
  },
  other: {
    icon: 'fa-solid fa-folder text-slate-500',
    sectionRow: 'bg-slate-100/70 border-y border-slate-200 text-slate-700',
    sectionCell: 'bg-slate-100/70',
    categoryRow: 'bg-slate-50 text-slate-700',
    categoryCell: 'bg-slate-50',
    categoryTotalCell: 'border-slate-100',
    labelCell: 'bg-white shadow-[1px_0_0_#f1f5f9] text-slate-700',
    fillBtn: 'hover:text-slate-700 hover:bg-slate-200',
    rowTotalCell: 'text-slate-700 bg-slate-50 shadow-[-1px_0_0_#e2e8f0]',
    totalRow: '',
    totalLabel: '',
    totalDot: '',
    totalMonthCell: '',
    totalAnnualCell: ''
  }
}

const themeOf = (type) => themes[type] || themes.other

// 같은 구간 종류의 마지막 그룹 뒤에 합계 행을 표시
const totalRows = computed(() => {
  const info = {
    income: { label: '총 수입', months: props.totalIncomeByMonth, annual: props.annualIncomeTotal },
    saving: { label: '총 저축액', months: props.totalSavingsByMonth, annual: props.annualSavingsTotal },
    expense: { label: '총 지출', months: props.totalExpensesByMonth, annual: props.annualExpensesTotal }
  }
  const result = {}
  props.sections.forEach((section, idx) => {
    const isLastOfType = !props.sections.slice(idx + 1).some((s) => s.type === section.type)
    if (isLastOfType && info[section.type]) result[section.key] = { type: section.type, ...info[section.type] }
  })
  return result
})

const hasAccounts = computed(() =>
  props.sections.some((s) => s.categories.some((c) => c.rows.length > 0))
)
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <div class="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50/50">
      <div>
        <h3 class="font-bold text-slate-800 flex items-center gap-2">
          <i class="fa-solid fa-table-list text-slate-500"></i> 연간 수입 / 저축 / 지출 명세표
        </h3>
        <p class="text-[11px] text-slate-500 mt-0.5">
          카테고리 관리에 등록된 그룹 &rsaquo; 카테고리 &rsaquo; 계좌 기준으로 표시됩니다. 금액을 수정한 뒤 <b>저장</b> 버튼을 눌러야 서버에 반영됩니다.
          항목별 1월 금액 입력 후
          <i class="fa-solid fa-angles-right text-indigo-500 text-[10px]"></i> 버튼을 누르면 12개월 전체에 동일 금액이 자동 채워집니다.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <label class="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          연도
          <select
            :value="year"
            @change="emit('change-year', Number($event.target.value))"
            class="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 cursor-pointer"
          >
            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}년</option>
          </select>
        </label>
        <span v-if="dirtyCount > 0" class="text-[11px] font-semibold text-amber-600">
          변경된 계좌 {{ dirtyCount }}개
        </span>
        <button
          @click="emit('save')"
          :disabled="dirtyCount === 0 || saving"
          :class="[
            'px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm',
            dirtyCount > 0 && !saving
              ? 'text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
              : 'text-slate-400 bg-slate-100 cursor-not-allowed'
          ]"
        >
          <span
            v-if="saving"
            class="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"
          ></span>
          <i v-else class="fa-solid fa-floppy-disk"></i>
          저장
        </button>
        <span class="hidden md:inline text-xs text-slate-400 font-medium">단위: 원</span>
      </div>
    </div>

    <div v-if="saveError" class="px-5 py-3 text-xs text-rose-600 bg-rose-50 border-b border-rose-100">
      <i class="fa-solid fa-triangle-exclamation mr-1"></i> {{ saveError }}
    </div>
    <div v-else-if="saveMessage" class="px-5 py-3 text-xs text-emerald-700 bg-emerald-50 border-b border-emerald-100">
      <i class="fa-solid fa-circle-check mr-1"></i> {{ saveMessage }}
    </div>

    <div v-if="error" class="px-5 py-3 text-xs text-rose-600 bg-rose-50 border-b border-rose-100">
      <i class="fa-solid fa-triangle-exclamation mr-1"></i> {{ error }}
    </div>
    <div v-else-if="(loading || yearLoading) && sections.length === 0" class="px-5 py-10 text-center text-xs text-slate-400">
      카테고리와 계좌를 불러오는 중입니다...
    </div>
    <div v-else-if="!hasAccounts" class="px-5 py-10 text-center text-xs text-slate-400">
      등록된 계좌가 없습니다. '카테고리 관리' 탭에서 그룹, 카테고리, 계좌를 등록해주세요.
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
          <template v-for="section in sections" :key="section.key">
            <!-- 그룹(구간) 헤더 -->
            <tr :class="['font-sans font-semibold text-xs', themeOf(section.type).sectionRow]">
              <td colspan="14" :class="['px-4 py-2 sticky left-0 z-10', themeOf(section.type).sectionCell]">
                <span class="flex items-center gap-1.5">
                  <i :class="themeOf(section.type).icon"></i> {{ section.title }}
                </span>
              </td>
            </tr>

            <template v-for="cat in section.categories" :key="cat.id">
              <!-- 카테고리 소제목 + 월별 소계 -->
              <tr :class="['font-sans font-semibold text-xs', themeOf(section.type).categoryRow]">
                <td :class="['px-4 py-1.5 sticky left-0 z-10', themeOf(section.type).categoryCell]">
                  <span class="flex items-center gap-1.5">
                    <i class="fa-solid fa-angle-right text-[10px] opacity-60"></i> {{ cat.name }}
                  </span>
                </td>
                <td
                  v-for="m in 12"
                  :key="m"
                  :class="['p-1.5 text-right border-l font-mono font-medium', themeOf(section.type).categoryTotalCell]"
                >
                  {{ cat.rows.length ? formatNumber(getCategoryMonthTotal(cat, m - 1)) : '' }}
                </td>
                <td :class="['p-1.5 text-right border-l border-slate-200 font-mono sticky right-0 z-10', themeOf(section.type).categoryCell]">
                  {{ cat.rows.length ? formatNumber(getCategoryTotal(cat)) : '' }}
                </td>
              </tr>

              <!-- 계좌 행 -->
              <tr
                v-for="row in cat.rows"
                :key="row.id"
                class="hover:bg-slate-50/80 transition-colors group"
              >
                <td :class="['p-2 pl-7 font-sans font-medium sticky left-0 z-10', themeOf(section.type).labelCell]">
                  <div class="flex items-center justify-between gap-1">
                    <span class="truncate">{{ row.label }}</span>
                    <button
                      @click="fillRowAcrossMonths(row, 0)"
                      title="1월 금액을 12개월 전체에 동일하게 복사"
                      :class="['opacity-0 group-hover:opacity-100 text-slate-400 px-1 py-0.5 rounded text-[10px] bg-slate-100 transition-all flex items-center gap-0.5 cursor-pointer', themeOf(section.type).fillBtn]"
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

                <td :class="['p-2 text-right border-l border-slate-300 font-semibold sticky right-0 z-10', themeOf(section.type).rowTotalCell]">
                  {{ formatNumber(getRowTotal(row)) }}
                </td>
              </tr>

              <tr v-if="cat.rows.length === 0" class="text-slate-400 font-sans">
                <td colspan="14" class="px-4 pl-7 py-1.5 sticky left-0 bg-white text-[11px]">
                  등록된 계좌가 없습니다.
                </td>
              </tr>
            </template>

            <!-- 구간 합계 -->
            <tr
              v-if="totalRows[section.key]"
              :class="['font-sans font-semibold text-xs', themeOf(section.type).totalRow]"
            >
              <td :class="['p-2.5 sticky left-0 z-10 flex items-center gap-1.5', themeOf(section.type).totalLabel]">
                <span :class="['w-1.5 h-1.5 rounded-full', themeOf(section.type).totalDot]"></span>
                {{ totalRows[section.key].label }}
              </td>
              <td
                v-for="(tot, idx) in totalRows[section.key].months"
                :key="idx"
                :class="['p-2 text-right border-l font-mono', themeOf(section.type).totalMonthCell]"
              >
                {{ formatNumber(tot) }}
              </td>
              <td :class="['p-2.5 text-right border-l font-bold font-mono sticky right-0 z-10', themeOf(section.type).totalAnnualCell]">
                {{ formatNumber(totalRows[section.key].annual) }}
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
