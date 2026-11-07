<script setup>
/**
 * ============================================================================
 * @file        TransactionModal.vue
 * @layer       UI Component (Presentation Layer - Modal)
 * @role        월별 소비내역 단건 신규 작성('create') 및 기존 내역 수정('edit') 팝업 모달
 * @parent      MonthlyTransactionsView.vue
 * ============================================================================
 */
import { ref, watch } from 'vue'

// ============================================================================
// [SECTION 1] Props & Emits (모달 열림 상태, 초기 데이터, 닫기/제출 이벤트)
// ============================================================================
const props = defineProps({
  isOpen: { type: Boolean, default: false },          // 모달 표시 여부 (true면 화면에 노출)
  mode: { type: String, default: 'create' },          // 'create'(신규) | 'edit'(수정)
  initialData: { type: Object, default: () => ({}) }, // 수정 모드이거나 기본값 주입 시 전달되는 객체
  availableAccounts: { type: Array, default: () => [] }, // 드롭다운에 표시할 선택 가능 계좌 목록
  defaultDate: { type: String, default: '' }          // 기본 거래 일자 ('YYYY-MM-DD')
})

const emit = defineEmits(['close', 'submit'])

// ============================================================================
// [SECTION 2] Reactive State (모달 내부 입력 폼 데이터 및 에러 상태)
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

const errorMessage = ref('')     // 유효성 검사 실패 시 표시할 에러 문구
const isSubmitting = ref(false)  // 저장 버튼 중복 클릭 방지용 플래그

// ============================================================================
// [SECTION 3] Watchers & Helpers (모달 오픈 시 폼 초기화)
// ============================================================================

/** 오늘 날짜를 'YYYY-MM-DD' 형식으로 반환 */
const getToday = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 모달이 열릴 때마다 initialData를 기반으로 폼 입력값을 초기화합니다. */
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

// isOpen 값이 false -> true로 바뀔 때 폼 초기화 실행
watch(
  () => props.isOpen,
  (open) => {
    if (open) initForm()
  }
)

// ============================================================================
// [SECTION 4] Event Handlers (계좌 변경 및 폼 제출 검증)
// ============================================================================

/** 드롭다운에서 소비 항목(계좌)을 변경했을 때 accountName과 accountId를 동시에 매핑 */
const handleAccountChange = (e) => {
  const selectedName = e.target.value
  const found = props.availableAccounts.find((a) => a.name === selectedName)
  form.value.accountName = selectedName
  form.value.accountId = found ? found.id : null
}

/** '등록하기 / 수정 완료' 버튼 클릭 시 필수값 검증 후 부모에게 submit 이벤트 전달 */
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
  <!-- [UI 영역] 모달 배경 오버레이 및 다이얼로그 카드 (isOpen일 때만 렌더링) -->
  <!-- ==================================================================== -->
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto bg-[#141413]/45 flex items-center justify-center p-4"
    @click.self="emit('close')"
  >
    <div
      class="ts-card bg-white w-full max-w-lg overflow-hidden shadow-lg"
      role="dialog"
      aria-modal="true"
    >
      <!-- 모달 상단 헤더 -->
      <div class="px-6 py-4 border-b border-[#141413]/12 flex items-center justify-between bg-[#F7F6F2]">
        <h3 class="text-[16px] font-bold text-[#141413]">
          {{ mode === 'create' ? '새 소비 내역 작성' : '소비 내역 수정' }}
        </h3>
        <button
          @click="emit('close')"
          class="text-[#575653] hover:text-[#141413] text-[14px] font-medium px-2 py-1 rounded-[4px] hover:bg-[#EFECE6] transition-colors cursor-pointer"
          title="닫기"
        >
          닫기
        </button>
      </div>

      <!-- 모달 입력 폼 본문 -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4 text-[13px] font-sans">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- 1. 거래 일자 -->
          <div>
            <label class="block font-semibold text-[#141413] mb-1.5">
              거래 일자 <span class="text-[#b91c1c]">*</span>
            </label>
            <input
              v-model="form.transactionDate"
              type="date"
              required
              class="w-full ts-input tabular-nums"
            />
          </div>

          <!-- 2. 소비 항목 (계좌) 선택 -->
          <div>
            <label class="block font-semibold text-[#141413] mb-1.5">
              소비 항목 (계좌) <span class="text-[#b91c1c]">*</span>
            </label>
            <select
              :value="form.accountName"
              @change="handleAccountChange"
              required
              class="w-full ts-input font-medium cursor-pointer"
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

        <!-- 3. 사용처 / 내용 -->
        <div>
          <label class="block font-semibold text-[#141413] mb-1.5">
            사용처 / 내용 <span class="text-[#b91c1c]">*</span>
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

        <!-- 4. 금액 (원) -->
        <div>
          <label class="block font-semibold text-[#141413] mb-1.5">
            금액 (원) <span class="text-[#b91c1c]">*</span>
          </label>
          <input
            v-model.number="form.amount"
            type="number"
            min="1"
            required
            placeholder="0"
            class="w-full ts-input font-mono font-bold text-[15px] tabular-nums"
          />
        </div>

        <!-- 5. 세부 내용 / 메모 (선택) -->
        <div>
          <label class="block font-semibold text-[#141413] mb-1.5">
            세부 내용 / 메모
          </label>
          <textarea
            v-model="form.memo"
            rows="2"
            maxlength="255"
            placeholder="예: 쿠폰 5,000원 할인 적용, 주말 가족 외식 등"
            class="w-full ts-input !h-auto py-2 resize-none"
          ></textarea>
        </div>

        <!-- 유효성 에러 메시지 -->
        <p v-if="errorMessage" class="text-[#b91c1c] font-semibold">
          {{ errorMessage }}
        </p>

        <!-- 하단 취소 / 제출 버튼 -->
        <div class="pt-4 flex items-center justify-end gap-2 border-t border-[#141413]/12">
          <button
            type="button"
            @click="emit('close')"
            class="btn btn--secondary"
          >
            취소
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="btn btn--primary"
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
