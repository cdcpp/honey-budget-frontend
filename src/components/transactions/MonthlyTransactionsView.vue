<script setup>
import { ref } from 'vue'
import { useAccountTransactions } from '../../composables/useAccountTransactions'
import TransactionModal from './TransactionModal.vue'

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

// 인라인 간편 등록 폼 상태
const quickForm = ref({
  transactionDate: new Date().toISOString().substring(0, 10),
  accountName: '생활비(식비)',
  description: '',
  amount: '',
  memo: ''
})

const isAddingQuick = ref(false)

// 모달 상태
const modalState = ref({
  isOpen: false,
  mode: 'create', // 'create' | 'edit'
  data: {}
})

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

// 탭 또는 배지 컬러 매핑
const getAccountBadgeClass = (accName) => {
  if (!accName) return 'bg-slate-100 text-slate-700 border-slate-200'
  if (accName.includes('식비') || accName.includes('생활비')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }
  if (accName.includes('고정')) {
    return 'bg-indigo-50 text-indigo-700 border-indigo-200'
  }
  if (accName.includes('차') || accName.includes('병원')) {
    return 'bg-amber-50 text-amber-800 border-amber-200'
  }
  return 'bg-slate-100 text-slate-700 border-slate-200'
}
</script>

<template>
  <div class="space-y-6">
    <!-- 1. 헤더 컨트롤 바 -->
    <header class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
      <div>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
            <i class="fa-solid fa-receipt text-xl"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                월별 소비내역
              </h1>
              <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                가계부
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              엑셀 월별 시트 기준 · 생활비/식비, 고정비, 자동차/병원비 소비 내역을 일자별로 기록합니다.
            </p>
          </div>
        </div>
      </div>

      <!-- 월 네비게이션 & 등록 버튼 -->
      <div class="flex flex-wrap items-center gap-2">
        <!-- 연월 선택기 -->
        <div class="inline-flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 gap-1 shadow-xs">
          <button
            @click="prevMonth"
            class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white transition-colors cursor-pointer"
            title="이전 달"
          >
            <i class="fa-solid fa-chevron-left text-xs"></i>
          </button>
          
          <div class="px-2 font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5 min-w-[105px] justify-center">
            <span>{{ selectedYear }}년 {{ selectedMonth }}월</span>
          </div>

          <button
            @click="nextMonth"
            class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white transition-colors cursor-pointer"
            title="다음 달"
          >
            <i class="fa-solid fa-chevron-right text-xs"></i>
          </button>
        </div>

        <!-- 급여 기간 배지 -->
        <div class="hidden lg:inline-flex items-center px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
          <i class="fa-regular fa-calendar-check mr-1.5 text-indigo-500"></i>
          <span>기준: {{ periodLabel }}</span>
        </div>

        <!-- 새 내역 작성 버튼 -->
        <button
          @click="openCreateModal"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <i class="fa-solid fa-plus text-[10px]"></i>
          <span>내역 작성</span>
        </button>
      </div>
    </header>

    <!-- 2. 소비 지출 요약 카드들 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- 이번 달 총 지출 -->
      <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
        <div class="flex items-center justify-between text-slate-500 mb-2">
          <span class="text-xs font-semibold">이번 달 총 소비액</span>
          <div class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-sm">
            <i class="fa-solid fa-credit-card"></i>
          </div>
        </div>
        <div>
          <div class="text-2xl font-black text-slate-900 tracking-tight">
            {{ formatCurrency(totalMonthAmount) }}
          </div>
          <p class="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>총 {{ filteredTransactions.length }}건 지출 내역</span>
          </p>
        </div>
      </div>

      <!-- 생활비 (식비 등) -->
      <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
        <div class="flex items-center justify-between text-slate-500 mb-2">
          <span class="text-xs font-semibold">생활비 (식비)</span>
          <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">
            <i class="fa-solid fa-basket-shopping"></i>
          </div>
        </div>
        <div>
          <div class="text-xl font-black text-emerald-700 tracking-tight">
            {{ formatCurrency(accountTotals['생활비(식비)'] || 0) }}
          </div>
          <p class="text-[11px] text-slate-400 mt-1">장보기, 마트, 외식, 식재료 등</p>
        </div>
      </div>

      <!-- 고정비 -->
      <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
        <div class="flex items-center justify-between text-slate-500 mb-2">
          <span class="text-xs font-semibold">고정비</span>
          <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">
            <i class="fa-solid fa-house-chimney"></i>
          </div>
        </div>
        <div>
          <div class="text-xl font-black text-indigo-700 tracking-tight">
            {{ formatCurrency(accountTotals['고정비'] || 0) }}
          </div>
          <p class="text-[11px] text-slate-400 mt-1">통신비, 공과금, 구독료 등</p>
        </div>
      </div>

      <!-- 자동차 / 병원비 -->
      <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
        <div class="flex items-center justify-between text-slate-500 mb-2">
          <span class="text-xs font-semibold">자동차 / 병원비</span>
          <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-sm">
            <i class="fa-solid fa-car-side"></i>
          </div>
        </div>
        <div>
          <div class="text-xl font-black text-amber-800 tracking-tight">
            {{ formatCurrency(accountTotals['자동차/병원비'] || 0) }}
          </div>
          <p class="text-[11px] text-slate-400 mt-1">주유, 하이패스, 약국, 병원비 등</p>
        </div>
      </div>
    </div>

    <!-- 3. 빠른 간편 등록 바 (엑셀 스타일 인라인 입력) -->
    <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <i class="fa-solid fa-bolt text-amber-500"></i> 빠른 소비내역 추가
        </span>
        <span class="text-[11px] text-slate-400">자주 쓰는 지출 내역을 한 줄로 빠르게 등록하세요.</span>
      </div>

      <form @submit.prevent="handleQuickSubmit" class="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
        <input
          v-model="quickForm.transactionDate"
          type="date"
          required
          class="sm:col-span-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
        />

        <select
          v-model="quickForm.accountName"
          class="sm:col-span-2 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none cursor-pointer"
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
          class="sm:col-span-3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
        />

        <input
          v-model.number="quickForm.amount"
          type="number"
          placeholder="금액 (원)"
          required
          min="1"
          class="sm:col-span-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
        />

        <input
          v-model="quickForm.memo"
          type="text"
          placeholder="세부내용 / 메모 (선택)"
          class="sm:col-span-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
        />

        <button
          type="submit"
          :disabled="isAddingQuick"
          class="sm:col-span-1 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center cursor-pointer disabled:opacity-60"
        >
          <span v-if="isAddingQuick" class="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          <span v-else>추가</span>
        </button>
      </form>
    </div>

    <!-- 4. 소비 항목별 탭 필터 -->
    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
      <button
        @click="activeTab = 'ALL'"
        :class="[
          'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border',
          activeTab === 'ALL'
            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
        ]"
      >
        전체 보기 ({{ transactions.length }})
      </button>

      <button
        v-for="acc in availableAccounts"
        :key="acc.id || acc.name"
        @click="activeTab = acc.name"
        :class="[
          'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border flex items-center gap-1.5',
          activeTab === acc.name
            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
        ]"
      >
        <span>{{ acc.name }}</span>
        <span
          class="px-1.5 py-0.2 rounded-md text-[10px]"
          :class="activeTab === acc.name ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'"
        >
          {{ formatCurrency(accountTotals[acc.name] || 0) }}
        </span>
      </button>
    </div>

    <!-- 5. 소비 내역 목록 테이블 -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div class="flex items-center gap-2">
          <h3 class="font-bold text-slate-800 text-sm">
            {{ activeTab === 'ALL' ? '전체 소비 목록' : `[${activeTab}] 소비 목록` }}
          </h3>
          <span class="text-xs text-slate-400 font-normal">
            총 {{ filteredTransactions.length }}건
          </span>
        </div>

        <div class="text-xs font-bold text-slate-700">
          합계: <span class="text-rose-600 font-mono">{{ formatCurrency(filteredTransactions.reduce((s, t) => s + (Number(t.amount) || 0), 0)) }}</span>
        </div>
      </div>

      <!-- 로딩 / 에러 안내 -->
      <div v-if="loading" class="p-10 text-center text-xs text-slate-400">
        소비 내역을 불러오는 중입니다...
      </div>
      <div v-else-if="error" class="p-4 bg-rose-50 text-rose-600 text-xs text-center border-b border-rose-100">
        {{ error }}
      </div>
      <div v-else-if="filteredTransactions.length === 0" class="py-16 text-center text-slate-400 space-y-2">
        <i class="fa-regular fa-clipboard text-3xl text-slate-300"></i>
        <p class="text-xs font-medium">등록된 소비 내역이 없습니다.</p>
        <button
          @click="openCreateModal"
          class="text-xs text-rose-600 font-bold underline cursor-pointer hover:text-rose-700"
        >
          새 소비 내역 작성하기
        </button>
      </div>

      <!-- 테이블 -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse font-sans">
          <thead>
            <tr class="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200 select-none">
              <th class="p-3 w-32 min-w-[110px]">거래 일자</th>
              <th class="p-3 w-36 min-w-[120px]">소비 항목(계좌)</th>
              <th class="p-3 min-w-[180px]">사용처 / 내용</th>
              <th class="p-3 min-w-[150px]">세부 내용 / 메모</th>
              <th class="p-3 w-32 min-w-[110px] text-right">지출 금액</th>
              <th class="p-3 w-20 text-center">관리</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="item in filteredTransactions"
              :key="item.id"
              class="hover:bg-slate-50/80 transition-colors group"
            >
              <!-- 거래 일자 -->
              <td class="p-3 text-slate-600 font-medium whitespace-nowrap">
                {{ formatDateDisplay(item.transactionDate) }}
              </td>

              <!-- 소비 항목 (계좌) -->
              <td class="p-3 whitespace-nowrap">
                <span
                  class="px-2 py-0.5 rounded-md text-[11px] font-semibold border inline-block"
                  :class="getAccountBadgeClass(item.accountName)"
                >
                  {{ item.accountName || '미지정' }}
                </span>
              </td>

              <!-- 사용처 / 내용 -->
              <td class="p-3 font-semibold text-slate-900">
                {{ item.description }}
              </td>

              <!-- 세부 내용 / 메모 -->
              <td class="p-3 text-slate-500">
                {{ item.memo || '-' }}
              </td>

              <!-- 지출 금액 -->
              <td class="p-3 text-right font-bold font-mono text-slate-900 text-sm whitespace-nowrap">
                {{ Number(item.amount || 0).toLocaleString('ko-KR') }}원
              </td>

              <!-- 관리 (수정 / 삭제) -->
              <td class="p-3 text-center whitespace-nowrap">
                <div class="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                  <button
                    @click="openEditModal(item)"
                    class="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer"
                    title="수정"
                  >
                    <i class="fa-solid fa-pen text-[10px]"></i>
                  </button>
                  <button
                    @click="handleDelete(item)"
                    class="w-6 h-6 rounded flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                    title="삭제"
                  >
                    <i class="fa-solid fa-trash-can text-[10px]"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 6. 작성 / 수정 모달 -->
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
