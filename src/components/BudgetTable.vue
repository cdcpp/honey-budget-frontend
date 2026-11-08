<script setup>
/**
 * ============================================================================
 * @file        BudgetTable.vue
 * @layer       UI Component (Presentation Layer)
 * @role        연간 수입/저축/지출 명세표 (12개월 전체 그리드 뷰 + 모바일/월별 집중 편집 뷰 지원)
 * @parent      BudgetPlannerView.vue
 * @children    NumberInput.vue
 * @spring      AccountYearMonthController (/api/v1/account-year-months) 데이터와 1:1 매핑
 * ============================================================================
 */
import { ref, computed } from 'vue'
import NumberInput from './NumberInput.vue'

// ============================================================================
// [SECTION 1] Props & Emits
// ============================================================================
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

// ============================================================================
// [SECTION 2] Local UI State (월별 집중 뷰 vs 12개월 전체 표 전환)
// ============================================================================
const focusedMonth = ref(null)

// ============================================================================
// [SECTION 3] Computed Properties
// ============================================================================
const yearOptions = computed(() => {
  const current = new Date().getFullYear()
  const years = new Set([props.year])
  for (let y = current - 5; y <= current + 5; y++) years.add(y)
  return [...years].sort((a, b) => b - a)
})

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
  <section class="ts-card overflow-hidden" aria-label="연간 수입 저축 지출 명세표">
    <!-- ================================================================== -->
    <!-- [UI 영역 1] 토스 다크 상단 컨트롤 헤더 (회계연도 선택 + 월별 칩 + 저장) -->
    <!-- ================================================================== -->
    <div class="p-5 sm:p-6 border-b border-white/[0.07] space-y-4 bg-[#151821]">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-[19px] sm:text-[20px] font-extrabold text-[#F9FAFB] tracking-tight">
            연간 수입 / 저축 / 지출 명세표
          </h2>
          <p class="text-[13px] text-[#8B95A1] mt-1 m-0">
            숫자를 눌러 바로 수정하세요. 1월 금액 입력 후 <span class="font-mono font-bold text-[#64A8FF]">&raquo;</span> 버튼을 누르면 12개월 전체에 복사됩니다.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <!-- 회계연도 선택 셀렉트 -->
          <label class="inline-flex items-center gap-2 text-[13px] font-bold text-[#8B95A1] bg-[#1C202B] border border-white/[0.08] pl-3 pr-1 py-1 rounded-[12px]">
            <span>연도</span>
            <select
              :value="year"
              @change="emit('change-year', Number($event.target.value))"
              class="bg-[#151821] text-[#F9FAFB] font-extrabold text-[14px] px-2.5 py-1.5 rounded-[9px] border-0 outline-none cursor-pointer"
            >
              <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}년</option>
            </select>
          </label>

          <!-- 미저장 변경 계좌 수 배지 -->
          <span
            v-if="dirtyCount > 0"
            class="px-3 py-1.5 rounded-full text-[13px] font-bold bg-[#3182F6]/20 text-[#64A8FF] tabular-nums"
          >
            {{ dirtyCount }}건 변경됨
          </span>

          <!-- 서버 저장 버튼 -->
          <button
            @click="emit('save')"
            :disabled="dirtyCount === 0 || saving"
            class="btn btn--primary"
          >
            <span
              v-if="saving"
              class="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"
            ></span>
            <span>저장</span>
          </button>
        </div>
      </div>

      <!-- 월별 빠른 전환 칩 바 (모바일에서도 스크롤 없이 특정 월만 집중 편집 가능) -->
      <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
        <button
          type="button"
          @click="focusedMonth = null"
          :class="[
            'px-3.5 py-1.5 rounded-full text-[13px] font-bold transition-colors cursor-pointer shrink-0 border-0',
            focusedMonth === null
              ? 'bg-[#F9FAFB] text-[#0B0D11]'
              : 'bg-[#1C202B] text-[#8B95A1] hover:text-[#F9FAFB]'
          ]"
        >
          12개월 전체 표
        </button>

        <button
          v-for="m in 12"
          :key="m"
          type="button"
          @click="focusedMonth = m"
          :class="[
            'px-3 py-1.5 rounded-full text-[13px] font-bold transition-colors cursor-pointer shrink-0 tabular-nums border-0',
            focusedMonth === m
              ? 'bg-[#3182F6] text-white'
              : 'bg-[#1C202B] text-[#8B95A1] hover:text-[#F9FAFB]'
          ]"
        >
          {{ m }}월
        </button>
      </div>
    </div>

    <!-- ================================================================== -->
    <!-- [UI 영역 2] 저장 결과 / 에러 / 로딩 / 빈 계좌 상태 안내 배너           -->
    <!-- ================================================================== -->
    <div v-if="saveError" class="px-6 py-3.5 text-[13px] font-semibold text-[#FF6B76] bg-[#F04452]/15 border-b border-[#F04452]/25">
      {{ saveError }}
    </div>
    <div v-else-if="saveMessage" class="px-6 py-3.5 text-[13px] font-bold text-[#64A8FF] bg-[#3182F6]/15 border-b border-[#3182F6]/25">
      {{ saveMessage }}
    </div>

    <div v-if="error" class="px-6 py-3.5 text-[13px] font-semibold text-[#FF6B76] bg-[#F04452]/15 border-b border-[#F04452]/25">
      {{ error }}
    </div>
    <div v-else-if="(loading || yearLoading) && sections.length === 0" class="px-6 py-14 text-center text-[14px] text-[#8B95A1]">
      카테고리와 계좌 데이터를 불러오는 중입니다...
    </div>
    <div v-else-if="!hasAccounts" class="px-6 py-14 text-center text-[14px] text-[#8B95A1]">
      등록된 계좌가 없습니다. 상단 '카테고리 관리' 탭에서 그룹, 카테고리, 계좌를 먼저 등록하세요.
    </div>

    <!-- ================================================================== -->
    <!-- [UI 영역 3-A] 월별 집중 뷰 (모바일/태블릿에서 특정 월 선택 시 토스 다크 리스트형 편집) -->
    <!-- ================================================================== -->
    <div v-if="focusedMonth !== null && hasAccounts" class="p-4 sm:p-6 bg-[#0B0D11]/50 space-y-5">
      <!-- 선택된 월의 3대 요약 배너 -->
      <div class="grid grid-cols-3 gap-2.5 sm:gap-4">
        <div class="p-3.5 sm:p-4 rounded-[14px] bg-[#1C202B] border border-white/[0.06]">
          <div class="text-[13px] font-bold text-[#8B95A1]">{{ focusedMonth }}월 총 수입</div>
          <div class="text-[16px] sm:text-[20px] font-extrabold font-mono text-[#F9FAFB] mt-1 tabular-nums truncate">
            {{ formatNumber(totalIncomeByMonth[focusedMonth - 1] || 0) }}원
          </div>
        </div>
        <div class="p-3.5 sm:p-4 rounded-[14px] bg-[#1C202B] border border-white/[0.06]">
          <div class="text-[13px] font-bold text-[#8B95A1]">{{ focusedMonth }}월 총 저축액</div>
          <div class="text-[16px] sm:text-[20px] font-extrabold font-mono text-[#64A8FF] mt-1 tabular-nums truncate">
            {{ formatNumber(totalSavingsByMonth[focusedMonth - 1] || 0) }}원
          </div>
        </div>
        <div class="p-3.5 sm:p-4 rounded-[14px] bg-[#1C202B] border border-white/[0.06]">
          <div class="text-[13px] font-bold text-[#8B95A1]">{{ focusedMonth }}월 총 지출</div>
          <div class="text-[16px] sm:text-[20px] font-extrabold font-mono text-[#F9FAFB] mt-1 tabular-nums truncate">
            {{ formatNumber(totalExpensesByMonth[focusedMonth - 1] || 0) }}원
          </div>
        </div>
      </div>

      <!-- 그룹별 계좌 리스트 카드 -->
      <div
        v-for="section in sections"
        :key="`focus-${section.key}`"
        class="bg-[#151821] rounded-[16px] border border-white/[0.07] overflow-hidden"
      >
        <div class="px-5 py-3.5 bg-[#1C202B] flex items-center justify-between">
          <span class="font-extrabold text-[15px] text-[#F9FAFB]">{{ section.title }}</span>
          <span class="text-[13px] font-bold text-[#8B95A1]">{{ focusedMonth }}월 금액 입력</span>
        </div>

        <div class="divide-y divide-white/[0.06]">
          <template v-for="cat in section.categories" :key="`focus-cat-${cat.id}`">
            <div class="px-5 py-2.5 bg-[#181C26] flex items-center justify-between text-[13px]">
              <span class="font-bold text-[#D1D6DB]">{{ cat.name }}</span>
              <span class="font-mono font-bold text-[#8B95A1] tabular-nums">
                소계 {{ formatNumber(getCategoryMonthTotal(cat, focusedMonth - 1)) }}원
              </span>
            </div>

            <div
              v-for="row in cat.rows"
              :key="`focus-row-${row.id}`"
              class="px-5 py-3 flex items-center justify-between gap-4 hover:bg-[#1C202B]"
            >
              <div class="min-w-0 flex-1">
                <div class="font-bold text-[14px] text-[#F9FAFB] truncate">{{ row.label }}</div>
                <div class="text-[13px] text-[#6B7684] font-mono tabular-nums">
                  연간 합계 {{ formatNumber(getRowTotal(row)) }}원
                </div>
              </div>

              <div class="flex items-center gap-2 w-44 shrink-0">
                <div class="flex-1 bg-[#1C202B] border border-white/[0.08] rounded-[10px] px-2 py-0.5">
                  <NumberInput
                    v-model="row.values[focusedMonth - 1]"
                    placeholder="0"
                    class-name="text-[14px] font-bold tabular-nums"
                  />
                </div>
                <button
                  @click="fillRowAcrossMonths(row, focusedMonth - 1)"
                  title="이 달의 금액을 12개월 전체에 채우기"
                  class="btn btn--secondary !min-h-[34px] !px-2.5 !text-[13px]"
                >
                  &raquo;
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- ================================================================== -->
    <!-- [UI 영역 3-B] 연간 1~12월 전체 명세표 (Toss 다크 데이터 그리드)      -->
    <!-- ================================================================== -->
    <div v-show="focusedMonth === null" class="overflow-x-auto">
      <table class="w-full text-left text-[13px] border-collapse">
        <thead>
          <tr class="bg-[#1C202B] text-[#8B95A1] font-bold text-center border-b border-white/[0.08] select-none">
            <th class="py-3.5 px-4 w-52 min-w-[200px] sticky left-0 bg-[#1C202B] z-20 shadow-[1px_0_0_rgba(255,255,255,0.06)] text-left">
              구분 / 계좌명 (+1개월)
            </th>
            <th v-for="m in 12" :key="m" class="py-3 px-2 min-w-[98px] tabular-nums">
              {{ m }}월
            </th>
            <th class="py-3 px-3.5 min-w-[124px] bg-[#202634] text-[#F9FAFB] font-extrabold sticky right-0 z-10 shadow-[-1px_0_0_rgba(255,255,255,0.08)] text-right">
              연간 합계
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-white/[0.05] font-mono tabular-nums">
          <template v-for="section in sections" :key="section.key">
            <!-- [행 타입 A] Level 1 대분류 그룹 헤더 -->
            <tr class="font-sans font-extrabold text-[13px] bg-[#1C202B] text-[#F9FAFB]">
              <td colspan="14" class="px-4 py-2.5 sticky left-0 z-10 bg-[#1C202B]">
                <span class="inline-flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-[#3182F6] inline-block"></span>
                  <span>{{ section.title }}</span>
                </span>
              </td>
            </tr>

            <template v-for="cat in section.categories" :key="cat.id">
              <!-- [행 타입 B] Level 2 중분류 카테고리 소제목 + 소계 -->
              <tr class="font-sans font-bold text-[13px] bg-[#181C26] text-[#D1D6DB]">
                <td class="px-4 py-2 sticky left-0 z-10 bg-[#181C26] shadow-[1px_0_0_rgba(255,255,255,0.05)]">
                  <span class="inline-flex items-center gap-1.5">
                    <span class="text-[#64A8FF] font-bold">&rsaquo;</span>
                    <span>{{ cat.name }}</span>
                  </span>
                </td>
                <td
                  v-for="m in 12"
                  :key="m"
                  class="p-2 text-right font-mono font-semibold text-[#8B95A1]"
                >
                  {{ cat.rows.length ? formatNumber(getCategoryMonthTotal(cat, m - 1)) : '' }}
                </td>
                <td class="p-2 px-3.5 text-right font-mono font-bold text-[#D1D6DB] bg-[#181C26] sticky right-0 z-10 shadow-[-1px_0_0_rgba(255,255,255,0.06)]">
                  {{ cat.rows.length ? formatNumber(getCategoryTotal(cat)) : '' }}
                </td>
              </tr>

              <!-- [행 타입 C] Level 3 소분류 개별 계좌 1~12월 입력 행 -->
              <tr
                v-for="row in cat.rows"
                :key="row.id"
                class="bg-[#151821] hover:bg-[#1C202B] transition-colors group"
              >
                <td class="py-2 px-4 pl-7 font-sans font-semibold text-[#F9FAFB] sticky left-0 z-10 bg-[#151821] group-hover:bg-[#1C202B] shadow-[1px_0_0_rgba(255,255,255,0.05)]">
                  <div class="flex items-center justify-between gap-1.5">
                    <span class="truncate">{{ row.label }}</span>
                    <button
                      @click="fillRowAcrossMonths(row, 0)"
                      title="1월 금액을 12개월 전체에 동일하게 채우기"
                      class="opacity-75 sm:opacity-0 group-hover:opacity-100 text-[#64A8FF] bg-[#3182F6]/20 hover:bg-[#3182F6] hover:text-white px-2 py-0.5 rounded-[6px] text-[13px] font-mono font-bold transition-all cursor-pointer shrink-0"
                    >
                      &raquo;
                    </button>
                  </div>
                </td>

                <!-- 1월~12월 금액 입력 셀 -->
                <td v-for="(val, cIdx) in row.values" :key="cIdx" class="p-1">
                  <NumberInput
                    v-model="row.values[cIdx]"
                    placeholder="-"
                    class-name="py-1.5 px-2 text-[13px] tabular-nums"
                  />
                </td>

                <!-- 해당 계좌의 연간 합계 셀 -->
                <td class="p-2 px-3.5 text-right font-bold text-[#F9FAFB] bg-[#181C26] sticky right-0 z-10 shadow-[-1px_0_0_rgba(255,255,255,0.06)]">
                  {{ formatNumber(getRowTotal(row)) }}
                </td>
              </tr>

              <!-- 카테고리에 속한 계좌가 없을 때 -->
              <tr v-if="cat.rows.length === 0" class="text-[#6B7684] font-sans">
                <td colspan="14" class="px-4 pl-7 py-2.5 sticky left-0 bg-[#151821] text-[13px]">
                  등록된 계좌가 없습니다.
                </td>
              </tr>
            </template>

            <!-- [행 타입 D] 구간별 총합계 행 (총 수입 / 총 저축액 / 총 지출) -->
            <tr
              v-if="totalRows[section.key]"
              class="font-sans font-extrabold text-[13px] bg-[#1A2438] border-y border-[#3182F6]/25 text-[#F9FAFB]"
            >
              <td class="py-3 px-4 sticky left-0 z-10 bg-[#1A2438] shadow-[1px_0_0_rgba(255,255,255,0.08)] flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-[#3182F6]"></span>
                <span>{{ totalRows[section.key].label }}</span>
              </td>
              <td
                v-for="(tot, idx) in totalRows[section.key].months"
                :key="idx"
                class="p-2 text-right font-mono font-extrabold text-[#F9FAFB]"
              >
                {{ formatNumber(tot) }}
              </td>
              <td class="py-3 px-3.5 text-right font-extrabold font-mono bg-[#1E2C46] text-[#64A8FF] sticky right-0 z-10 shadow-[-1px_0_0_rgba(255,255,255,0.1)]">
                {{ formatNumber(totalRows[section.key].annual) }}
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </section>
</template>
