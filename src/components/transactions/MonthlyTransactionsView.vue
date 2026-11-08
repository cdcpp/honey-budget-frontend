<script setup>
/**
 * ============================================================================
 * @file        MonthlyTransactionsView.vue
 * @layer       Domain View Layer (월별 소비내역 최상위 메인 화면)
 * @role        토스 다크 가계부 스타일의 월별(급여일 5일~익월 4일 기준) 소비내역 조회,
 *              카테고리별 요약 카드, 빠른 한 줄 추가, 모바일 카드 피드 & 데스크톱 테이블을 제공합니다.
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
const quickForm = ref({
  transactionDate: new Date().toISOString().substring(0, 10),
  accountName: '생활비(식비)',
  description: '',
  amount: '',
  memo: ''
})

const isAddingQuick = ref(false)

const modalState = ref({
  isOpen: false,
  mode: 'create',
  data: {}
})

// ============================================================================
// [SECTION 3] Event Handlers
// ============================================================================
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

const openEditModal = (item) => {
  modalState.value = {
    isOpen: true,
    mode: 'edit',
    data: { ...item }
  }
}

const closeModal = () => {
  modalState.value.isOpen = false
}

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
    quickForm.value.description = ''
    quickForm.value.amount = ''
    quickForm.value.memo = ''
  } catch (err) {
    alert(err.message || '등록에 실패했습니다.')
  } finally {
    isAddingQuick.value = false
  }
}

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

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0원'
  return Number(val).toLocaleString('ko-KR') + '원'
}
</script>

<template>
  <div class="space-y-5 sm:space-y-6">
    <!-- ================================================================== -->
    <!-- [UI 영역 1] 토스 다크 가계부 스타일 상단 헤더 & 연월 네비게이터       -->
    <!-- ================================================================== -->
    <header class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pt-1 pb-2">
      <div>
        <div class="inline-flex items-center gap-2 text-[13px] font-bold text-[#64A8FF] mb-1">
          <span>월별 소비내역</span>
          <span class="text-[#8B95A1] font-medium">· {{ periodLabel }}</span>
        </div>
        <h1 class="text-[24px] sm:text-[28px] font-extrabold tracking-tight text-[#F9FAFB] leading-snug">
          {{ selectedMonth }}월에 쓴 돈
          <span class="text-[#64A8FF] font-mono tabular-nums ml-1">{{ formatCurrency(totalMonthAmount) }}</span>
        </h1>
        <p class="text-[14px] text-[#8B95A1] mt-1 m-0">
          생활비(식비), 고정비, 자동차/병원비 지출을 날짜별로 기록해요.
        </p>
      </div>

      <!-- 우측: 연월 선택기(< 2026년 1월 >) 및 '+ 내역 작성' 버튼 -->
      <div class="flex items-center justify-between sm:justify-end gap-2.5">
        <div class="inline-flex items-center bg-[#151821] border border-white/[0.1] rounded-[12px] h-[40px] px-1">
          <button
            @click="prevMonth"
            class="w-8 h-8 rounded-[8px] flex items-center justify-center text-[#8B95A1] hover:text-[#F9FAFB] hover:bg-[#1C202B] text-[18px] font-bold transition-colors cursor-pointer"
            title="이전 달"
          >
            &lsaquo;
          </button>

          <div class="px-3 font-extrabold text-[14px] text-[#F9FAFB] min-w-[100px] text-center tabular-nums">
            {{ selectedYear }}년 {{ selectedMonth }}월
          </div>

          <button
            @click="nextMonth"
            class="w-8 h-8 rounded-[8px] flex items-center justify-center text-[#8B95A1] hover:text-[#F9FAFB] hover:bg-[#1C202B] text-[18px] font-bold transition-colors cursor-pointer"
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
    <!-- [UI 영역 2] 이번 달 소비 지출 4대 요약 카드 (모바일 2열 / 데스크톱 4열) -->
    <!-- ================================================================== -->
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" aria-label="이번 달 소비 요약">
      <div class="ts-card p-4 sm:p-5 flex flex-col justify-between gap-2">
        <div class="flex items-center justify-between text-[13px] font-bold text-[#8B95A1]">
          <span>이번 달 총 소비액</span>
          <span class="px-2 py-0.5 rounded-full bg-[#3182F6]/20 text-[#64A8FF] tabular-nums">{{ transactions.length }}건</span>
        </div>
        <div>
          <div class="text-[20px] sm:text-[24px] font-extrabold font-mono text-[#F9FAFB] tracking-tight tabular-nums truncate">
            {{ formatCurrency(totalMonthAmount) }}
          </div>
          <p class="text-[13px] text-[#6B7684] mt-0.5 m-0 truncate">{{ periodLabel }}</p>
        </div>
      </div>

      <div class="ts-card p-4 sm:p-5 flex flex-col justify-between gap-2">
        <div class="text-[13px] font-bold text-[#8B95A1]">생활비(식비)</div>
        <div>
          <div class="text-[20px] sm:text-[24px] font-extrabold font-mono text-[#F9FAFB] tracking-tight tabular-nums truncate">
            {{ formatCurrency(accountTotals['생활비(식비)'] || 0) }}
          </div>
          <p class="text-[13px] text-[#6B7684] mt-0.5 m-0 truncate">장보기 · 외식 · 식재료</p>
        </div>
      </div>

      <div class="ts-card p-4 sm:p-5 flex flex-col justify-between gap-2">
        <div class="text-[13px] font-bold text-[#8B95A1]">고정비</div>
        <div>
          <div class="text-[20px] sm:text-[24px] font-extrabold font-mono text-[#F9FAFB] tracking-tight tabular-nums truncate">
            {{ formatCurrency(accountTotals['고정비'] || 0) }}
          </div>
          <p class="text-[13px] text-[#6B7684] mt-0.5 m-0 truncate">통신비 · 공과금 · 구독료</p>
        </div>
      </div>

      <div class="ts-card p-4 sm:p-5 flex flex-col justify-between gap-2">
        <div class="text-[13px] font-bold text-[#8B95A1]">자동차/병원비</div>
        <div>
          <div class="text-[20px] sm:text-[24px] font-extrabold font-mono text-[#F9FAFB] tracking-tight tabular-nums truncate">
            {{ formatCurrency(accountTotals['자동차/병원비'] || 0) }}
          </div>
          <p class="text-[13px] text-[#6B7684] mt-0.5 m-0 truncate">주유 · 하이패스 · 병원</p>
        </div>
      </div>
    </section>

    <!-- ================================================================== -->
    <!-- [UI 영역 3] 빠른 소비내역 추가 카드 (모바일/데스크톱 반응형 그리드)    -->
    <!-- ================================================================== -->
    <section class="ts-card p-4 sm:p-5 space-y-3" aria-label="빠른 소비내역 추가">
      <div class="flex items-center justify-between gap-2">
        <h2 class="text-[15px] font-extrabold text-[#F9FAFB]">
          빠른 소비내역 추가
        </h2>
        <span class="text-[13px] text-[#8B95A1]">자주 쓰는 내역을 바로 입력해요</span>
      </div>

      <form @submit.prevent="handleQuickSubmit" class="grid grid-cols-2 sm:grid-cols-12 gap-2.5">
        <input
          v-model="quickForm.transactionDate"
          type="date"
          required
          class="col-span-1 sm:col-span-2 ts-input tabular-nums"
        />

        <select
          v-model="quickForm.accountName"
          class="col-span-1 sm:col-span-2 ts-input font-bold cursor-pointer"
        >
          <option v-for="acc in availableAccounts" :key="acc.id || acc.name" :value="acc.name">
            {{ acc.name }}
          </option>
        </select>

        <input
          v-model="quickForm.description"
          type="text"
          placeholder="사용처 / 내용 (예: 네이버 올리브유)"
          required
          class="col-span-2 sm:col-span-3 ts-input"
        />

        <input
          v-model.number="quickForm.amount"
          type="number"
          placeholder="금액 (원)"
          required
          min="1"
          class="col-span-1 sm:col-span-2 ts-input font-mono font-bold tabular-nums"
        />

        <input
          v-model="quickForm.memo"
          type="text"
          placeholder="메모 (선택)"
          class="col-span-1 sm:col-span-2 ts-input"
        />

        <button
          type="submit"
          :disabled="isAddingQuick"
          class="col-span-2 sm:col-span-1 btn btn--primary"
        >
          <span v-if="isAddingQuick" class="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          <span v-else>추가</span>
        </button>
      </form>
    </section>

    <!-- ================================================================== -->
    <!-- [UI 영역 4] 토스 다크 소비 항목(계좌) 필터 칩 바                      -->
    <!-- ================================================================== -->
    <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 select-none">
      <button
        @click="activeTab = 'ALL'"
        :class="[
          'px-4 py-2 rounded-full text-[14px] font-bold transition-colors cursor-pointer shrink-0 border',
          activeTab === 'ALL'
            ? 'bg-[#F9FAFB] text-[#0B0D11] border-[#F9FAFB]'
            : 'bg-[#151821] text-[#8B95A1] border-white/[0.08] hover:bg-[#1C202B] hover:text-[#F9FAFB]'
        ]"
      >
        전체 ({{ transactions.length }})
      </button>

      <button
        v-for="acc in availableAccounts"
        :key="acc.id || acc.name"
        @click="activeTab = acc.name"
        :class="[
          'px-4 py-2 rounded-full text-[14px] font-bold transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5 border',
          activeTab === acc.name
            ? 'bg-[#3182F6] text-white border-[#3182F6]'
            : 'bg-[#151821] text-[#8B95A1] border-white/[0.08] hover:bg-[#1C202B] hover:text-[#F9FAFB]'
        ]"
      >
        <span>{{ acc.name }}</span>
        <span class="opacity-85 font-mono text-[13px] tabular-nums">
          {{ formatCurrency(accountTotals[acc.name] || 0) }}
        </span>
      </button>
    </div>

    <!-- ================================================================== -->
    <!-- [UI 영역 5] 소비내역 피드 (모바일 리스트 뷰 + 데스크톱 클린 테이블)     -->
    <!-- ================================================================== -->
    <section class="ts-card overflow-hidden" aria-label="소비 내역 목록">
      <div class="p-5 border-b border-white/[0.07] flex items-center justify-between bg-[#151821]">
        <div class="flex items-baseline gap-2">
          <h3 class="font-extrabold text-[#F9FAFB] text-[17px]">
            {{ activeTab === 'ALL' ? '전체 소비 내역' : `${activeTab} 내역` }}
          </h3>
          <span class="text-[13px] font-bold text-[#8B95A1] tabular-nums">
            {{ filteredTransactions.length }}건
          </span>
        </div>

        <div class="text-[14px] font-bold text-[#8B95A1]">
          합계
          <span class="font-extrabold font-mono text-[#64A8FF] tabular-nums ml-1">
            {{ formatCurrency(filteredTransactions.reduce((s, t) => s + (Number(t.amount) || 0), 0)) }}
          </span>
        </div>
      </div>

      <!-- 로딩 / 에러 / 빈 내역 안내 -->
      <div v-if="loading" class="p-12 text-center text-[14px] text-[#8B95A1]">
        소비 내역을 불러오는 중입니다...
      </div>
      <div v-else-if="error" class="p-4 bg-[#F04452]/15 text-[#FF6B76] text-[13px] font-semibold text-center">
        {{ error }}
      </div>
      <div v-else-if="filteredTransactions.length === 0" class="py-16 text-center text-[#8B95A1] space-y-3">
        <p class="text-[14px] font-semibold">아직 기록된 소비 내역이 없어요.</p>
        <button
          @click="openCreateModal"
          class="btn btn--secondary"
        >
          새 소비 내역 작성하기
        </button>
      </div>

      <template v-else>
        <!-- [모바일 전용] 토스 다크 가계부 피드 리스트 -->
        <div class="md:hidden divide-y divide-white/[0.06]">
          <div
            v-for="item in filteredTransactions"
            :key="`mob-${item.id}`"
            class="p-4 bg-[#151821] flex items-center justify-between gap-3"
          >
            <div class="min-w-0 flex-1 space-y-1">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded-[6px] text-[13px] font-bold bg-[#1C202B] text-[#D1D6DB] border border-white/[0.06] shrink-0">
                  {{ item.accountName || '미지정' }}
                </span>
                <span class="font-extrabold text-[#F9FAFB] text-[15px] truncate">
                  {{ item.description }}
                </span>
              </div>
              <div class="text-[13px] text-[#8B95A1] flex items-center gap-1.5 tabular-nums">
                <span>{{ formatDateDisplay(item.transactionDate) }}</span>
                <span v-if="item.memo">· {{ item.memo }}</span>
              </div>
            </div>

            <div class="text-right shrink-0 space-y-1">
              <div class="font-extrabold font-mono text-[#F9FAFB] text-[16px] tabular-nums">
                {{ Number(item.amount || 0).toLocaleString('ko-KR') }}원
              </div>
              <div class="flex items-center justify-end gap-2 text-[13px]">
                <button
                  @click="openEditModal(item)"
                  class="font-bold text-[#8B95A1] hover:text-[#F9FAFB] cursor-pointer"
                >
                  수정
                </button>
                <button
                  @click="handleDelete(item)"
                  class="font-bold text-[#FF6B76] cursor-pointer"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- [데스크톱 전용] 클린 다크 소비내역 테이블 -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-left text-[14px] border-collapse font-sans">
            <thead>
              <tr class="bg-[#1C202B] text-[#8B95A1] text-[13px] font-bold border-b border-white/[0.07] select-none">
                <th class="py-3.5 px-5 w-40">거래 일자</th>
                <th class="py-3.5 px-4 w-44">소비 항목(계좌)</th>
                <th class="py-3.5 px-4">사용처 / 내용</th>
                <th class="py-3.5 px-4">세부 내용 / 메모</th>
                <th class="py-3.5 px-5 w-40 text-right">지출 금액</th>
                <th class="py-3.5 px-5 w-28 text-center">관리</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/[0.05]">
              <tr
                v-for="item in filteredTransactions"
                :key="item.id"
                class="bg-[#151821] hover:bg-[#1C202B] transition-colors group"
              >
                <td class="py-3.5 px-5 text-[#8B95A1] font-semibold whitespace-nowrap tabular-nums">
                  {{ formatDateDisplay(item.transactionDate) }}
                </td>

                <td class="py-3.5 px-4 whitespace-nowrap">
                  <span class="px-2.5 py-1 rounded-[8px] text-[13px] font-bold bg-[#1C202B] text-[#D1D6DB] border border-white/[0.06] inline-block">
                    {{ item.accountName || '미지정' }}
                  </span>
                </td>

                <td class="py-3.5 px-4 font-extrabold text-[#F9FAFB] text-[15px]">
                  {{ item.description }}
                </td>

                <td class="py-3.5 px-4 text-[#8B95A1] text-[13px]">
                  {{ item.memo || '-' }}
                </td>

                <td class="py-3.5 px-5 text-right font-extrabold font-mono text-[#F9FAFB] text-[15px] whitespace-nowrap tabular-nums">
                  {{ Number(item.amount || 0).toLocaleString('ko-KR') }}원
                </td>

                <td class="py-3.5 px-5 text-center whitespace-nowrap">
                  <div class="flex items-center justify-center gap-2.5">
                    <button
                      @click="openEditModal(item)"
                      class="text-[13px] font-bold text-[#8B95A1] hover:text-[#F9FAFB] hover:underline cursor-pointer"
                    >
                      수정
                    </button>
                    <button
                      @click="handleDelete(item)"
                      class="text-[13px] font-bold text-[#FF6B76] hover:underline cursor-pointer"
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </section>

    <!-- ================================================================== -->
    <!-- [UI 영역 6] 소비내역 등록 / 수정 모달 (모바일 바텀시트 지원)          -->
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
