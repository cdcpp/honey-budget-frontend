<script setup>
/**
 * ============================================================================
 * @file        BudgetTable.vue
 * @layer       UI Component (Presentation Layer)
 * @role        연간 수입/저축/지출 명세표 메인 그리드 테이블 (1월~12월 금액 입력, 소계/총계 자동 표시, 서버 저장)
 * @parent      BudgetPlannerView.vue
 * @children    NumberInput.vue
 * @spring      AccountYearMonthController (/api/v1/account-year-months) 데이터와 1:1 매핑
 * ============================================================================
 */
import { computed } from 'vue'
import NumberInput from './NumberInput.vue'

// ============================================================================
// [SECTION 1] Props & Emits (부모 BudgetPlannerView로부터 받는 상태와 이벤트)
// ============================================================================
const props = defineProps({
  sections: { type: Array, required: true },            // 3단계 계층 배열 (그룹 -> 카테고리 -> 계좌 행)
  loading: { type: Boolean, default: false },           // 계층 트리 로딩 중 여부
  error: { type: String, default: null },               // 계층 조회 에러 메시지
  year: { type: Number, required: true },               // 현재 선택된 회계연도
  yearLoading: { type: Boolean, default: false },       // 연도별 금액 조회 중 여부
  saving: { type: Boolean, default: false },            // '저장' 버튼 처리 중 여부
  saveError: { type: String, default: null },           // 저장 실패 에러 메시지
  saveMessage: { type: String, default: '' },           // 저장 성공 안내 메시지
  dirtyCount: { type: Number, default: 0 },             // 값이 변경된(미저장) 계좌 개수
  totalIncomeByMonth: { type: Array, required: true },  // 월별 총 수입 (1~12월 배열)
  totalSavingsByMonth: { type: Array, required: true }, // 월별 총 저축액 (1~12월 배열)
  totalExpensesByMonth: { type: Array, required: true },// 월별 총 지출 (1~12월 배열)
  annualIncomeTotal: { type: Number, required: true },  // 연간 총 수입 합계
  annualSavingsTotal: { type: Number, required: true }, // 연간 총 저축액 합계
  annualExpensesTotal: { type: Number, required: true },// 연간 총 지출 합계
  getRowTotal: { type: Function, required: true },      // 개별 계좌 행의 연간 합계 계산 함수
  getCategoryMonthTotal: { type: Function, required: true }, // 카테고리의 월별 소계 계산 함수
  getCategoryTotal: { type: Function, required: true }, // 카테고리의 연간 소계 계산 함수
  fillRowAcrossMonths: { type: Function, required: true },   // 1월 금액을 12개월 전체로 복사하는 함수
  formatNumber: { type: Function, required: true }      // 숫자 3자리 콤마 포맷팅 함수
})

/**
 * 부모(BudgetPlannerView -> useBudget)로 올려보내는 이벤트:
 * - 'change-year': 회계연도 셀렉트 박스 변경 시 호출
 * - 'save'       : '저장' 버튼 클릭 시 호출
 */
const emit = defineEmits(['change-year', 'save'])

// ============================================================================
// [SECTION 2] Computed Properties (파생 계산 속성)
// ============================================================================

/** 회계연도 드롭다운 옵션 배열 (현재 연도 기준 전후 5년, 내림차순 정렬) */
const yearOptions = computed(() => {
  const current = new Date().getFullYear()
  const years = new Set([props.year])
  for (let y = current - 5; y <= current + 5; y++) years.add(y)
  return [...years].sort((a, b) => b - a)
})

/**
 * [구간별 총계 행(총 수입 / 총 저축액 / 총 지출) 매핑]
 * - 동일한 구간 타입(income/saving/expense)의 가장 마지막 그룹 하단에 총계 행을 표시합니다.
 */
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

/** 전체 섹션에 등록된 계좌가 최소 1개 이상 있는지 여부 (빈 화면 안내 표시용) */
const hasAccounts = computed(() =>
  props.sections.some((s) => s.categories.some((c) => c.rows.length > 0))
)
</script>

<template>
  <section class="ts-card overflow-hidden" aria-label="연간 수입 저축 지출 명세표">
    <!-- ================================================================== -->
    <!-- [UI 영역 1] 테이블 상단 헤더 (회계연도 선택기, 변경 건수, 저장 버튼)     -->
    <!-- ================================================================== -->
    <div class="p-5 sm:p-6 border-b border-[#141413]/12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white">
      <div>
        <h2 class="text-[18px] font-bold text-[#141413] tracking-tight">
          연간 수입 / 저축 / 지출 명세표
        </h2>
        <p class="text-[13px] text-[#575653] mt-1">
          카테고리 관리에 등록된 계좌 기준으로 표시됩니다. 1월 금액 입력 후 우측 화살표(&raquo;)를 누르면 12개월 전체에 동일 금액이 채워집니다.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <!-- 회계연도 변경 드롭다운 -->
        <label class="flex items-center gap-2 text-[13px] font-medium text-[#575653]">
          <span>회계연도</span>
          <select
            :value="year"
            @change="emit('change-year', Number($event.target.value))"
            class="ts-input !h-[36px] font-semibold cursor-pointer"
          >
            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}년</option>
          </select>
        </label>

        <!-- 미저장 변경 계좌 수 표시 -->
        <span v-if="dirtyCount > 0" class="text-[13px] font-semibold text-[#0a4b49] tabular-nums">
          변경된 계좌 {{ dirtyCount }}개
        </span>

        <!-- 서버 저장 버튼 (변경된 계좌가 있을 때만 활성화) -->
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

        <span class="hidden md:inline text-[13px] text-[#575653]">단위: 원</span>
      </div>
    </div>

    <!-- ================================================================== -->
    <!-- [UI 영역 2] 저장 결과 / 에러 / 로딩 / 빈 계좌 상태 안내 배너           -->
    <!-- ================================================================== -->
    <div v-if="saveError" class="px-6 py-3 text-[13px] text-[#b91c1c] bg-[#fef2f2] border-b border-[#b91c1c]/20">
      {{ saveError }}
    </div>
    <div v-else-if="saveMessage" class="px-6 py-3 text-[13px] text-[#0a4b49] bg-[#F7F6F2] border-b border-[#141413]/12 font-medium">
      {{ saveMessage }}
    </div>

    <div v-if="error" class="px-6 py-3 text-[13px] text-[#b91c1c] bg-[#fef2f2] border-b border-[#b91c1c]/20">
      {{ error }}
    </div>
    <div v-else-if="(loading || yearLoading) && sections.length === 0" class="px-6 py-12 text-center text-[14px] text-[#575653]">
      카테고리와 계좌 데이터를 불러오는 중입니다...
    </div>
    <div v-else-if="!hasAccounts" class="px-6 py-12 text-center text-[14px] text-[#575653]">
      등록된 계좌가 없습니다. 상단 '카테고리 관리' 탭에서 그룹, 카테고리, 계좌를 먼저 등록하세요.
    </div>

    <!-- ================================================================== -->
    <!-- [UI 영역 3] 연간 1~12월 그리드 테이블 (좌측 계좌명 & 우측 합계 고정)    -->
    <!-- ================================================================== -->
    <div class="overflow-x-auto">
      <table class="w-full text-left text-[13px] border-collapse">
        <thead>
          <tr class="bg-[#F7F6F2] text-[#141413] font-semibold text-center border-b border-[#141413]/15 select-none">
            <th class="p-3 w-52 min-w-[200px] sticky left-0 bg-[#F7F6F2] z-20 shadow-[1px_0_0_rgba(20,20,19,0.12)] text-left">
              구분 / 계좌명 (+1개월 기준)
            </th>
            <th v-for="m in 12" :key="m" class="p-2.5 min-w-[96px] border-l border-[#141413]/10 tabular-nums">
              {{ m }}월
            </th>
            <th class="p-2.5 min-w-[120px] border-l border-[#141413]/20 bg-[#EFECE6] text-[#141413] font-bold sticky right-0 z-10 shadow-[-1px_0_0_rgba(20,20,19,0.15)]">
              연간 합계
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-[#141413]/8 font-mono tabular-nums">
          <template v-for="section in sections" :key="section.key">
            <!-- [행 타입 A] Level 1 대분류 그룹 헤더 (예: 수입, 저축 및 투자, 지출) -->
            <tr class="font-sans font-bold text-[13px] bg-[#EFECE6] text-[#141413] border-y border-[#141413]/15">
              <td colspan="14" class="px-4 py-2.5 sticky left-0 z-10 bg-[#EFECE6]">
                <span class="inline-flex items-center gap-2">
                  <span class="w-1.5 h-1.5 bg-[#141413] inline-block"></span>
                  <span>{{ section.title }}</span>
                </span>
              </td>
            </tr>

            <template v-for="cat in section.categories" :key="cat.id">
              <!-- [행 타입 B] Level 2 중분류 카테고리 소제목 + 월별/연간 카테고리 소계 -->
              <tr class="font-sans font-semibold text-[13px] bg-[#F7F6F2] text-[#141413]">
                <td class="px-4 py-2 sticky left-0 z-10 bg-[#F7F6F2] shadow-[1px_0_0_rgba(20,20,19,0.08)]">
                  <span class="inline-flex items-center gap-1.5 text-[#575653]">
                    <span>&rsaquo;</span>
                    <span class="text-[#141413]">{{ cat.name }}</span>
                  </span>
                </td>
                <td
                  v-for="m in 12"
                  :key="m"
                  class="p-2 text-right border-l border-[#141413]/8 font-mono font-medium text-[#575653]"
                >
                  {{ cat.rows.length ? formatNumber(getCategoryMonthTotal(cat, m - 1)) : '' }}
                </td>
                <td class="p-2 text-right border-l border-[#141413]/15 font-mono font-semibold text-[#141413] bg-[#F7F6F2] sticky right-0 z-10 shadow-[-1px_0_0_rgba(20,20,19,0.12)]">
                  {{ cat.rows.length ? formatNumber(getCategoryTotal(cat)) : '' }}
                </td>
              </tr>

              <!-- [행 타입 C] Level 3 소분류 개별 계좌 1~12월 입력 행 -->
              <tr
                v-for="row in cat.rows"
                :key="row.id"
                class="bg-white hover:bg-[#F7F6F2]/60 transition-colors group"
              >
                <td class="p-2 pl-7 font-sans font-medium text-[#141413] sticky left-0 z-10 bg-white group-hover:bg-[#F7F6F2] shadow-[1px_0_0_rgba(20,20,19,0.08)]">
                  <div class="flex items-center justify-between gap-1.5">
                    <span class="truncate">{{ row.label }}</span>
                    <button
                      @click="fillRowAcrossMonths(row, 0)"
                      title="1월 금액을 12개월 전체에 동일하게 채우기"
                      class="opacity-0 group-hover:opacity-100 text-[#575653] hover:text-[#141413] hover:bg-[#EFECE6] px-1.5 py-0.5 rounded-[4px] text-[13px] font-mono transition-all cursor-pointer shrink-0"
                    >
                      &raquo;
                    </button>
                  </div>
                </td>

                <!-- 1월(cIdx=0) ~ 12월(cIdx=11) 금액 입력 셀 -->
                <td v-for="(val, cIdx) in row.values" :key="cIdx" class="p-1 border-l border-[#141413]/8">
                  <NumberInput
                    v-model="row.values[cIdx]"
                    placeholder="-"
                    class-name="py-1 px-1.5 text-[13px] tabular-nums"
                  />
                </td>

                <!-- 해당 계좌의 1~12월 연간 합계 셀 -->
                <td class="p-2 text-right border-l border-[#141413]/15 font-semibold text-[#141413] bg-[#F7F6F2]/70 sticky right-0 z-10 shadow-[-1px_0_0_rgba(20,20,19,0.12)]">
                  {{ formatNumber(getRowTotal(row)) }}
                </td>
              </tr>

              <!-- 카테고리에 속한 계좌가 없을 때의 빈 안내 행 -->
              <tr v-if="cat.rows.length === 0" class="text-[#575653] font-sans">
                <td colspan="14" class="px-4 pl-7 py-2 sticky left-0 bg-white text-[13px]">
                  등록된 계좌가 없습니다.
                </td>
              </tr>
            </template>

            <!-- [행 타입 D] 구간별 총합계 행 (총 수입 / 총 저축액 / 총 지출) -->
            <tr
              v-if="totalRows[section.key]"
              class="font-sans font-bold text-[13px] bg-[#F7F6F2] border-y border-[#141413]/25 text-[#141413]"
            >
              <td class="p-2.5 px-4 sticky left-0 z-10 bg-[#F7F6F2] shadow-[1px_0_0_rgba(20,20,19,0.12)] flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-[#0a4b49]"></span>
                <span>{{ totalRows[section.key].label }}</span>
              </td>
              <td
                v-for="(tot, idx) in totalRows[section.key].months"
                :key="idx"
                class="p-2 text-right border-l border-[#141413]/12 font-mono font-bold text-[#141413]"
              >
                {{ formatNumber(tot) }}
              </td>
              <td class="p-2.5 text-right border-l border-[#141413]/20 font-bold font-mono bg-[#EFECE6] text-[#141413] sticky right-0 z-10 shadow-[-1px_0_0_rgba(20,20,19,0.15)]">
                {{ formatNumber(totalRows[section.key].annual) }}
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </section>
</template>
