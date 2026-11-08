<script setup>
/**
 * ============================================================================
 * @file        TransactionModal.vue
 * @layer       UI Component (Presentation Layer - Modal / Mobile Bottom Sheet)
 * @role        월별 소비내역 단건 신규 작성('create') 및 기존 내역 수정('edit') 모달
 * @parent      MonthlyTransactionsView.vue
 * ============================================================================
 */
import { ref, watch } from 'vue'

// ============================================================================
// [SECTION 1] Props & Emits
// ============================================================================
const props = defineProps({
  isOpen: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  initialData: { type: Object, default: () => ({}) },
  availableAccounts: { type: Array, default: () => [] },
  defaultDate: { type: String, default: '' }
})

const emit = defineEmits(['close', 'submit'])

// ============================================================================
// [SECTION 2] Reactive State
// ============================================================================
const form = ref({
  id: null,
  accountId: null,
  accountName: '',
  transactionDate: '',
  amount: '',
  description: '',
  memo: ''
})

const errorMessage = ref('')
const isSubmitting = ref(false)

// ============================================================================
// [SECTION 3] Watchers & Helpers
// ============================================================================
const getToday = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const initForm = () => {
  errorMessage.value = ''
  isSubmitting.value = false
  const d = props.initialData || {}
  const defaultAccount = props.availableAccounts[0] || {}

  form.value = {
    id: d.id || null,
    accountId: d.accountId || defaultAccount.id || null,
    accountName: d.accountName || defaultAccount.name || '생활비(식비)',
    transactionDate: d.transactionDate || props.defaultDate || getToday(),
    amount: d.amount !== undefined ? Number(d.amount) : '',
    description: d.description || '',
    memo: d.memo || ''
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) initForm()
  }
)

// ============================================================================
// [SECTION 4] Event Handlers
// ============================================================================
const handleAccountChange = (e) => {
  const selectedName = e.target.value
  const found = props.availableAccounts.find((a) => a.name === selectedName)
  form.value.accountName = selectedName
  form.value.accountId = found ? found.id : null
}

const handleSubmit = async () => {
  errorMessage.value = ''
  if (!form.value.transactionDate) {
    errorMessage.value = '거래 일자를 입력해주세요.'
    return
  }
  if (!form.value.description.trim()) {
    errorMessage.value = '사용처 또는 내용을 입력해주세요.'
    return
  }
  const amt = Number(form.value.amount)
  if (!amt || amt <= 0) {
    errorMessage.value = '올바른 금액을 입력해주세요.'
    return
  }

  try {
    isSubmitting.value = true
    emit('submit', { ...form.value, amount: amt })
  } catch (err) {
    errorMessage.value = err.message || '저장 중 오류가 발생했습니다.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <!-- ==================================================================== -->
  <!-- [UI 영역] 토스 다크 바텀시트(모바일) / 센터 다이얼로그(데스크톱)       -->
  <!-- ==================================================================== -->
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
    @click.self="emit('close')"
  >
    <div
      class="bg-[#151821] w-full max-w-lg rounded-t-[24px] sm:rounded-[22px] overflow-hidden shadow-2xl border border-white/[0.12]"
      role="dialog"
      aria-modal="true"
    >
      <!-- 모달 상단 헤더 -->
      <div class="px-6 pt-5 pb-4 border-b border-white/[0.08] flex items-center justify-between">
        <h3 class="text-[18px] font-extrabold text-[#F9FAFB] tracking-tight">
          {{ mode === 'create' ? '새 소비 내역 작성' : '소비 내역 수정' }}
        </h3>
        <button
          @click="emit('close')"
          class="btn btn--secondary !min-h-[32px] !px-3 !text-[13px]"
          title="닫기"
        >
          닫기
        </button>
      </div>

      <!-- 모달 입력 폼 본문 -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4 text-[14px] font-sans">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-[13px] font-bold text-[#8B95A1] mb-1.5">
              거래 일자 <span class="text-[#FF6B76]">*</span>
            </label>
            <input
              v-model="form.transactionDate"
              type="date"
              required
              class="w-full ts-input tabular-nums"
            />
          </div>

          <div>
            <label class="block text-[13px] font-bold text-[#8B95A1] mb-1.5">
              소비 항목 (계좌) <span class="text-[#FF6B76]">*</span>
            </label>
            <select
              :value="form.accountName"
              @change="handleAccountChange"
              required
              class="w-full ts-input font-bold cursor-pointer"
            >
              <option
                v-for="acc in availableAccounts"
                :key="acc.id || acc.name"
                :value="acc.name"
              >
                {{ acc.name }}
              </option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-[13px] font-bold text-[#8B95A1] mb-1.5">
            사용처 / 내용 <span class="text-[#FF6B76]">*</span>
          </label>
          <input
            v-model="form.description"
            type="text"
            maxlength="100"
            required
            placeholder="예: 이마트 장보기, GS칼텍스 주유, 감기약 구매"
            class="w-full ts-input"
          />
        </div>

        <div>
          <label class="block text-[13px] font-bold text-[#8B95A1] mb-1.5">
            금액 (원) <span class="text-[#FF6B76]">*</span>
          </label>
          <input
            v-model.number="form.amount"
            type="number"
            min="1"
            required
            placeholder="0"
            class="w-full ts-input font-mono font-extrabold text-[16px] tabular-nums"
          />
        </div>

        <div>
          <label class="block text-[13px] font-bold text-[#8B95A1] mb-1.5">
            세부 내용 / 메모
          </label>
          <textarea
            v-model="form.memo"
            rows="2"
            maxlength="255"
            placeholder="예: 쿠폰 5,000원 할인 적용, 주말 가족 외식 등"
            class="w-full ts-input !h-auto py-2.5 resize-none"
          ></textarea>
        </div>

        <p v-if="errorMessage" class="text-[13px] text-[#FF6B76] font-bold">
          {{ errorMessage }}
        </p>

        <!-- 하단 취소 / 제출 버튼 -->
        <div class="pt-3 grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2.5">
          <button
            type="button"
            @click="emit('close')"
            class="btn btn--secondary !min-h-[44px]"
          >
            취소
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="btn btn--primary !min-h-[44px] sm:min-w-[120px]"
          >
            <span
              v-if="isSubmitting"
              class="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"
            ></span>
            <span>{{ mode === 'create' ? '등록하기' : '수정 완료' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
