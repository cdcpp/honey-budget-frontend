<script setup>
/**
 * ============================================================================
 * @file        MonthlyTransactionsView.vue
 * @layer       Domain View Layer (월별 소비내역 최상위 메인 화면)
 * @role        월별(급여일 5일~익월 4일 기준) 생활비/고정비/자동차·병원비 지출 내역 조회,
 *              4대 요약 카드 표시, 인라인 한 줄 빠른 등록 및 상세 모달 수정/삭제를 담당합니다.
 * @parent      App.vue
 * @children    TransactionModal.vue
 * @spring      com.honeybudget.account.domain.AccountTransaction 연동
 * ============================================================================
 */
import { ref } from 'vue'
import { useAccountTransactions } from '../../composables/useAccountTransactions'
import TransactionModal from './TransactionModal.vue'

// ============================================================================
// [SECTION 1] Composable State & Actions (useAccountTransactions 연동)
// ============================================================================
const {
  selectedYear,
  selectedMonth,
  periodLabel,
  activeTab,
  transactions,
  filteredTransactions,
  availableAccounts,
  totalMonthAmount,
  accountTotals,
  loading,
  error,
  prevMonth,
  nextMonth,
  addTransaction,
  updateTransaction,
  removeTransaction
} = useAccountTransactions()

// ============================================================================
// [SECTION 2] Local UI State (인라인 빠른 등록 폼 & 팝업 모달 상태)
// ============================================================================

/** 테이블 상단 '빠른 소비내역 추가' 한 줄 입력 폼 데이터 */
const quickForm = ref({
  transactionDate: new Date().toISOString().substring(0, 10),
  accountName: '생활비(식비)',
  description: '',
  amount: '',
  memo: ''
})

const isAddingQuick = ref(false) // 인라인 등록 요청 진행 중 여부

/** 상세 등록/수정 팝업 모달(TransactionModal) 열림 상태 및 초기 데이터 */
const modalState = ref({
  isOpen: false,
  mode: 'create', // 'create'(신규 작성) | 'edit'(기존 내역 수정)
  data: {}
})

// ============================================================================
// [SECTION 3] Event Handlers (모달 열기/닫기, 폼 제출, 삭제, 날짜 포맷팅)
// ============================================================================

/** 상단 '+ 내역 작성' 버튼 클릭 시 신규 등록 모드로 모달 오픈 */
const openCreateModal = () => {
  modalState.value = {
    isOpen: true,
    mode: 'create',
    data: {
      accountName: activeTab.value !== 'ALL' ? activeTab.value : (availableAccounts.value[0]?.name || '생활비(식비)'),
      transactionDate: `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-05`
    }
  }
}

/** 테이블 행의 '수정' 버튼 클릭 시 해당 행 데이터를 담아 수정 모드로 모달 오픈 */
const openEditModal = (item) => {
  modalState.value = {
    isOpen: true,
    mode: 'edit',
    data: { ...item }
  }
}

/** 모달 닫기 */
const closeModal = () => {
  modalState.value.isOpen = false
}

/** 모달 내부에서 '등록하기 / 수정 완료' 제출 시 실행 */
const handleModalSubmit = async (formData) => {
  try {
    if (modalState.value.mode === 'create') {
      await addTransaction(formData)
    } else {
      await updateTransaction(formData.id, formData)
    }
    closeModal()
  } catch (err) {
    alert(err.message || '저장 중 오류가 발생했습니다.')
  }
}

/** 인라인 빠른 등록 바에서 '추가' 버튼(또는 엔터) 입력 시 실행 */
const handleQuickSubmit = async () => {
  if (!quickForm.value.description.trim()) {
    alert('사용처/내용을 입력해주세요.')
    return
  }
  const amt = Number(quickForm.value.amount)
  if (!amt || amt <= 0) {
    alert('올바른 금액을 입력해주세요.')
    return
  }

  try {
    isAddingQuick.value = true
    const found = availableAccounts.value.find((a) => a.name === quickForm.value.accountName)
    await addTransaction({
      accountId: found ? found.id : null,
      accountName: quickForm.value.accountName,
      transactionDate: quickForm.value.transactionDate,
      amount: amt,
      description: quickForm.value.description,
      memo: quickForm.value.memo
    })
    // 연속 입력이 편하도록 일자와 소비항목은 유지하고 내용/금액/메모만 비웁니다.
    quickForm.value.description = ''
    quickForm.value.amount = ''
    quickForm.value.memo = ''
  } catch (err) {
    alert(err.message || '등록에 실패했습니다.')
  } finally {
    isAddingQuick.value = false
  }
}

/** 테이블 행의 '삭제' 버튼 클릭 시 확인 창 후 삭제 실행 */
const handleDelete = async (item) => {
  if (!confirm(`[${item.description}] ${Number(item.amount).toLocaleString()}원 내역을 삭제하시겠습니까?`)) {
    return
  }
  try {
    await removeTransaction(item.id)
  } catch (err) {
    alert(err.message || '삭제에 실패했습니다.')
  }
}

/** 'YYYY-MM-DD' 문자열을 '1월 5일 (월)' 형태의 한국어 요일 포함 포맷으로 변환 */
const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
      const days = ['일', '월', '화', '수', '목', '금', '토']
      const dayName = days[d.getDay()]
      return `${Number(parts[1])}월 ${Number(parts[2])}일 (${dayName})`
    }
  } catch (e) {
    // ignore
  }
  return dateStr
}

/** 숫자를 '0,000원' 원화 포맷으로 변환 */
const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0원'
  return Number(val).toLocaleString('ko-KR') + '원'
}
</script>

<template>
  <div class="space-y-6">
    <!-- ================================================================== -->
    <!-- [UI 영역 1] 상단 헤더 (정산 기준 기간, 연월 이동 네비게이터, 내역 작성) -->
    <!-- ================================================================== -->
    <header class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6 border-b border-[#141413]/12">
      <div>
        <p class="text-[13px] font-medium text-[#575653] mb-1">
          정산 기준 기간: {{ periodLabel }}
        </p>
        <h1 class="text-[28px] sm:text-[32px] font-bold tracking-tight text-[#141413] leading-tight">
          월별 소비내역
        </h1>
        <p class="text-[15px] text-[#575653] mt-1.5">
          생활비(식비), 고정비, 자동차/병원비 지출 내역을 일자별로 기록하고 집계합니다.
        </p>
      </div>

      <!-- 우측: 연월 선택기(< 2026년 1월 >) 및 '+ 내역 작성' 모달 오픈 버튼 -->
      <div class="flex flex-wrap items-center gap-2.5">
        <div class="inline-flex items-center bg-white border border-[#141413]/20 rounded-[6px] h-[36px] px-1">
          <button
            @click="prevMonth"
            class="w-7 h-7 rounded-[4px] flex items-center justify-center text-[#575653] hover:text-[#141413] hover:bg-[#F7F6F2] transition-colors cursor-pointer"
            title="이전 달"
          >
            &lsaquo;
          </button>

          <div class="px-3 font-semibold text-[14px] text-[#141413] min-w-[104px] text-center tabular-nums">
            {{ selectedYear }}년 {{ selectedMonth }}월
          </div>

          <button
            @click="nextMonth"
            class="w-7 h-7 rounded-[4px] flex items-center justify-center text-[#575653] hover:text-[#141413] hover:bg-[#F7F6F2] transition-colors cursor-pointer"
            title="다음 달"
          >
            &rsaquo;
          </button>
        </div>

        <button
          @click="openCreateModal"
          class="btn btn--primary"
        >
          <span>+ 내역 작성</span>
        </button>
      </div>
    </header>

    <!-- ================================================================== -->
    <!-- [UI 영역 2] 이번 달 소비 지출 4대 요약 카드                           -->
    <!-- ================================================================== -->
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="이번 달 소비 요약">
      <div class="ts-card p-5 flex flex-col justify-between gap-3">
        <div class="flex items-center justify-between text-[13px] font-medium text-[#575653]">
          <span>이번 달 총 소비액</span>
          <span class="tabular-nums">{{ transactions.length }}건</span>
        </div>
        <div>
          <div class="text-[24px] font-bold font-mono text-[#141413] tracking-tight tabular-nums">
            {{ formatCurrency(totalMonthAmount) }}
          </div>
          <p class="text-[13px] text-[#575653] mt-1">기준: {{ periodLabel }}</p>
        </div>
      </div>

      <div class="ts-card p-5 flex flex-col justify-between gap-3">
        <div class="text-[13px] font-medium text-[#575653]">생활비 (식비)</div>
        <div>
          <div class="text-[24px] font-bold font-mono text-[#141413] tracking-tight tabular-nums">
            {{ formatCurrency(accountTotals['생활비(식비)'] || 0) }}
          </div>
          <p class="text-[13px] text-[#575653] mt-1">장보기, 마트, 외식, 식재료</p>
        </div>
      </div>

      <div class="ts-card p-5 flex flex-col justify-between gap-3">
        <div class="text-[13px] font-medium text-[#575653]">고정비</div>
        <div>
          <div class="text-[24px] font-bold font-mono text-[#141413] tracking-tight tabular-nums">
            {{ formatCurrency(accountTotals['고정비'] || 0) }}
          </div>
          <p class="text-[13px] text-[#575653] mt-1">통신비, 공과금, 정기 구독료</p>
        </div>
      </div>

      <div class="ts-card p-5 flex flex-col justify-between gap-3">
        <div class="text-[13px] font-medium text-[#575653]">자동차 / 병원비</div>
        <div>
          <div class="text-[24px] font-bold font-mono text-[#141413] tracking-tight tabular-nums">
            {{ formatCurrency(accountTotals['자동차/병원비'] || 0) }}
          </div>
          <p class="text-[13px] text-[#575653] mt-1">주유, 하이패스, 진료 및 약국</p>
        </div>
      </div>
    </section>

    <!-- ================================================================== -->
    <!-- [UI 영역 3] 빠른 소비내역 추가 바 (모달 없이 한 줄 즉시 입력)           -->
    <!-- ================================================================== -->
    <section class="ts-card p-5 space-y-3" aria-label="빠른 소비내역 추가">
      <div class="flex items-baseline justify-between gap-2">
        <h2 class="text-[15px] font-bold text-[#141413]">
          빠른 소비내역 추가
        </h2>
        <span class="text-[13px] text-[#575653]">일자·항목·사용처·금액을 한 줄로 즉시 입력합니다.</span>
      </div>

      <form @submit.prevent="handleQuickSubmit" class="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
        <input
          v-model="quickForm.transactionDate"
          type="date"
          required
          class="sm:col-span-2 ts-input tabular-nums"
        />

        <select
          v-model="quickForm.accountName"
          class="sm:col-span-2 ts-input font-medium cursor-pointer"
        >
          <option v-for="acc in availableAccounts" :key="acc.id || acc.name" :value="acc.name">
            {{ acc.name }}
          </option>
        </select>

        <input
          v-model="quickForm.description"
          type="text"
          placeholder="사용처 / 항목 (예: 네이버 올리브유)"
          required
          class="sm:col-span-3 ts-input"
        />

        <input
          v-model.number="quickForm.amount"
          type="number"
          placeholder="금액 (원)"
          required
          min="1"
          class="sm:col-span-2 ts-input font-mono font-semibold tabular-nums"
        />

        <input
          v-model="quickForm.memo"
          type="text"
          placeholder="세부내용 / 메모 (선택)"
          class="sm:col-span-2 ts-input"
        />

        <button
          type="submit"
          :disabled="isAddingQuick"
          class="sm:col-span-1 btn btn--primary"
        >
          <span v-if="isAddingQuick" class="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          <span v-else>추가</span>
        </button>
      </form>
    </section>

    <!-- ================================================================== -->
    <!-- [UI 영역 4] 소비 항목(계좌)별 필터 탭 버튼                           -->
    <!-- ================================================================== -->
    <div class="flex items-center gap-2 overflow-x-auto pb-1 select-none">
      <button
        @click="activeTab = 'ALL'"
        :class="[
          'btn',
          activeTab === 'ALL' ? 'btn--primary' : 'btn--secondary'
        ]"
      >
        전체 보기 ({{ transactions.length }})
      </button>

      <button
        v-for="acc in availableAccounts"
        :key="acc.id || acc.name"
        @click="activeTab = acc.name"
        :class="[
          'btn',
          activeTab === acc.name ? 'btn--primary' : 'btn--secondary'
        ]"
      >
        <span>{{ acc.name }}</span>
        <span class="opacity-75 font-mono tabular-nums">
          {{ formatCurrency(accountTotals[acc.name] || 0) }}
        </span>
      </button>
    </div>

    <!-- ================================================================== -->
    <!-- [UI 영역 5] 소비내역 상세 데이터 테이블                               -->
    <!-- ================================================================== -->
    <section class="ts-card overflow-hidden" aria-label="소비 내역 목록">
      <div class="p-5 border-b border-[#141413]/12 flex items-center justify-between bg-white">
        <div class="flex items-baseline gap-2.5">
          <h3 class="font-bold text-[#141413] text-[16px]">
            {{ activeTab === 'ALL' ? '전체 소비 목록' : `${activeTab} 소비 목록` }}
          </h3>
          <span class="text-[13px] text-[#575653] tabular-nums">
            총 {{ filteredTransactions.length }}건
          </span>
        </div>

        <div class="text-[14px] font-semibold text-[#141413]">
          선택 합계:
          <span class="font-bold font-mono text-[#0a4b49] tabular-nums ml-1">
            {{ formatCurrency(filteredTransactions.reduce((s, t) => s + (Number(t.amount) || 0), 0)) }}
          </span>
        </div>
      </div>

      <!-- 로딩 / 에러 / 빈 내역 안내 -->
      <div v-if="loading" class="p-12 text-center text-[14px] text-[#575653]">
        소비 내역을 불러오는 중입니다...
      </div>
      <div v-else-if="error" class="p-4 bg-[#fef2f2] text-[#b91c1c] text-[13px] text-center border-b border-[#b91c1c]/20">
        {{ error }}
      </div>
      <div v-else-if="filteredTransactions.length === 0" class="py-16 text-center text-[#575653] space-y-3">
        <p class="text-[14px] font-medium">해당 월에 등록된 소비 내역이 없습니다.</p>
        <button
          @click="openCreateModal"
          class="btn btn--secondary"
        >
          새 소비 내역 작성하기
        </button>
      </div>

      <!-- 소비내역 테이블 본문 -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-[13px] border-collapse font-sans">
          <thead>
            <tr class="bg-[#F7F6F2] text-[#141413] font-semibold border-b border-[#141413]/15 select-none">
              <th class="p-3.5 w-36 min-w-[120px]">거래 일자</th>
              <th class="p-3.5 w-40 min-w-[130px]">소비 항목(계좌)</th>
              <th class="p-3.5 min-w-[200px]">사용처 / 내용</th>
              <th class="p-3.5 min-w-[160px]">세부 내용 / 메모</th>
              <th class="p-3.5 w-36 min-w-[120px] text-right">지출 금액</th>
              <th class="p-3.5 w-24 text-center">관리</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#141413]/8">
            <tr
              v-for="item in filteredTransactions"
              :key="item.id"
              class="bg-white hover:bg-[#F7F6F2]/60 transition-colors group"
            >
              <td class="p-3.5 text-[#575653] font-medium whitespace-nowrap tabular-nums">
                {{ formatDateDisplay(item.transactionDate) }}
              </td>

              <td class="p-3.5 whitespace-nowrap">
                <span class="px-2.5 py-1 rounded-[4px] text-[13px] font-medium bg-[#F7F6F2] text-[#141413] border border-[#141413]/15 inline-block">
                  {{ item.accountName || '미지정' }}
                </span>
              </td>

              <td class="p-3.5 font-semibold text-[#141413] text-[14px]">
                {{ item.description }}
              </td>

              <td class="p-3.5 text-[#575653]">
                {{ item.memo || '-' }}
              </td>

              <td class="p-3.5 text-right font-bold font-mono text-[#141413] text-[14px] whitespace-nowrap tabular-nums">
                {{ Number(item.amount || 0).toLocaleString('ko-KR') }}원
              </td>

              <td class="p-3.5 text-center whitespace-nowrap">
                <div class="flex items-center justify-center gap-2">
                  <button
                    @click="openEditModal(item)"
                    class="text-[13px] font-medium text-[#575653] hover:text-[#141413] hover:underline cursor-pointer"
                  >
                    수정
                  </button>
                  <span class="text-[#141413]/20">|</span>
                  <button
                    @click="handleDelete(item)"
                    class="text-[13px] font-medium text-[#b91c1c] hover:underline cursor-pointer"
                  >
                    삭제
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ================================================================== -->
    <!-- [UI 영역 6] 소비내역 등록 / 수정 팝업 모달                           -->
    <!-- ================================================================== -->
    <TransactionModal
      :is-open="modalState.isOpen"
      :mode="modalState.mode"
      :initial-data="modalState.data"
      :available-accounts="availableAccounts"
      @close="closeModal"
      @submit="handleModalSubmit"
    />
  </div>
</template>
