<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  mode: { type: String, default: 'create' }, // 'create' | 'edit'
  initialData: { type: Object, default: () => ({}) },
  availableAccounts: { type: Array, default: () => [] },
  defaultDate: { type: String, default: '' }
})

const emit = defineEmits(['close', 'submit'])

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
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
    @click.self="emit('close')"
  >
    <div
      class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all border border-slate-100"
      role="dialog"
      aria-modal="true"
    >
      <!-- 모달 헤더 -->
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          {{ mode === 'create' ? '새 소비 내역 작성' : '소비 내역 수정' }}
        </h3>
        <button
          @click="emit('close')"
          class="text-slate-400 hover:text-slate-600 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer"
          title="닫기"
        >
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      <!-- 모달 바디 / 폼 -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4 text-xs font-sans">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- 거래 일자 -->
          <div>
            <label class="block font-semibold text-slate-600 mb-1.5">
              거래 일자 <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="form.transactionDate"
              type="date"
              required
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
            />
          </div>

          <!-- 대상 계좌 / 분류 -->
          <div>
            <label class="block font-semibold text-slate-600 mb-1.5">
              소비 항목 (계좌) <span class="text-rose-500">*</span>
            </label>
            <select
              :value="form.accountName"
              @change="handleAccountChange"
              required
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all cursor-pointer"
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

        <!-- 사용처 / 항목 -->
        <div>
          <label class="block font-semibold text-slate-600 mb-1.5">
            사용처 / 내용 <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.description"
            type="text"
            maxlength="100"
            required
            placeholder="예: 이마트 장보기, GS칼텍스 주유, 감기약 구매"
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
          />
        </div>

        <!-- 금액 -->
        <div>
          <label class="block font-semibold text-slate-600 mb-1.5">
            금액 (원) <span class="text-rose-500">*</span>
          </label>
          <input
            v-model.number="form.amount"
            type="number"
            min="1"
            required
            placeholder="0"
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
          />
        </div>

        <!-- 비고 / 세부내용 -->
        <div>
          <label class="block font-semibold text-slate-600 mb-1.5">
            세부 내용 / 메모
          </label>
          <textarea
            v-model="form.memo"
            rows="2"
            maxlength="255"
            placeholder="예: 쿠폰 5,000원 할인 적용, 주말 가족 외식 등"
            class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all resize-none"
          ></textarea>
        </div>

        <!-- 에러 메시지 -->
        <p v-if="errorMessage" class="text-rose-500 font-semibold">
          {{ errorMessage }}
        </p>

        <!-- 버튼 그룹 -->
        <div class="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
          <button
            type="button"
            @click="emit('close')"
            class="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            취소
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
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

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.animate-fadeIn {
  animation: fadeIn 0.15s ease-out forwards;
}
</style>

