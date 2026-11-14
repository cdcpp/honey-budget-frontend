<template>
  <!-- ==================================================================== -->
  <!-- [UI 영역] 토스 다크 바텀시트(모바일) / 센터 다이얼로그(데스크톱)       -->
  <!-- ==================================================================== -->
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
    @click.self="handleClose"
  >
    <div
      class="bg-[#151821] shadow-2xl w-full max-w-lg rounded-t-[24px] sm:rounded-[22px] overflow-hidden border border-white/[0.12]"
      role="dialog"
      aria-modal="true"
    >
      <!-- 모달 헤더 -->
      <div class="px-6 pt-5 pb-4 border-b border-white/[0.08] flex items-center justify-between">
        <h3 class="text-[18px] font-extrabold text-[#F9FAFB] tracking-tight">
          {{ modalTitle }}
        </h3>
        <button
          @click="handleClose"
          class="btn btn--secondary !min-h-[32px] !px-3 !text-[13px]"
          title="닫기"
        >
          닫기
        </button>
      </div>

      <!-- 모달 바디 / 폼 -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4 text-[14px]">
        <!-- 1. 그룹 등록/수정 폼 -->
        <template v-if="isGroupMode">
          <div>
            <label class="block text-[13px] font-bold text-[#8B95A1] mb-1.5">
              그룹 코드 (자동생성) <span class="text-[#FF6B76]">*</span>
            </label>
            <input
              v-model="groupForm.categoryGroupCode"
              type="text"
              maxlength="10"
              required
              placeholder="예: 100(수입), 200(지출), 300(투자)"
              readonly
              class="w-full ts-input font-mono font-bold !bg-[#0B0D11] text-[#8B95A1]"
            />
          </div>

          <div>
            <label class="block text-[13px] font-bold text-[#8B95A1] mb-1.5">
              그룹명 (최대 10자) <span class="text-[#FF6B76]">*</span>
            </label>
            <input
              v-model="groupForm.categoryGroupName"
              type="text"
              maxlength="10"
              required
              placeholder="예: 수입, 지출"
              class="w-full ts-input"
            />
          </div>
        </template>

        <!-- 2. 카테고리 등록/수정 폼 -->
        <template v-else-if="isCategoryMode">
          <div>
            <label class="block text-[13px] font-bold text-[#8B95A1] mb-1.5">
              소속 그룹 <span class="text-[#FF6B76]">*</span>
            </label>
            <select
              v-model="categoryForm.categoryGroupId"
              required
              class="w-full ts-input font-bold cursor-pointer"
            >
              <option v-for="grp in groups" :key="grp.id" :value="grp.id">
                [{{ grp.categoryGroupCode }}] {{ grp.categoryGroupName }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-[13px] font-bold text-[#8B95A1] mb-1.5">
              카테고리 코드 (최대 10자) <span class="text-[#FF6B76]">*</span>
            </label>
            <input
              v-model="categoryForm.categoryCode"
              type="text"
              maxlength="10"
              required
              :disabled="mode === 'category-create'"
              placeholder="예: 101, 102, 103"
              class="w-full ts-input font-mono font-bold"
              @input="categoryForm.categoryCode = categoryForm.categoryCode.toUpperCase()"
            />
          </div>

          <div>
            <label class="block text-[13px] font-bold text-[#8B95A1] mb-1.5">
              카테고리명 (최대 20자) <span class="text-[#FF6B76]">*</span>
            </label>
            <input
              v-model="categoryForm.categoryName"
              type="text"
              maxlength="20"
              required
              placeholder="예: 급여, 고정지출, 생활비"
              class="w-full ts-input"
            />
          </div>
        </template>

        <!-- 3. 계좌 등록/수정 폼 (Account.java 엔티티 필드 기준) -->
        <template v-else-if="isAccountMode">
          <!-- 소속 카테고리 (category) -->
          <div>
            <label class="block text-[13px] font-bold text-[#8B95A1] mb-1.5">
              소속 카테고리 <span class="text-[#FF6B76]">*</span>
            </label>
            <select
              v-model="accountForm.categoryId"
              required
              class="w-full ts-input font-bold cursor-pointer"
            >
              <optgroup v-for="grp in groups" :key="grp.id" :label="grp.categoryGroupName">
                <option v-for="cat in grp.categories || []" :key="cat.id" :value="cat.id">
                  {{ cat.categoryName }} ({{ cat.categoryCode }})
                </option>
              </optgroup>
            </select>
          </div>

          <!-- 계좌명 (accountName) & 금융기관명 (institutionName) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label class="block text-[13px] font-bold text-[#8B95A1] mb-1.5">
                계좌명 <span class="text-[#FF6B76]">*</span>
              </label>
              <input
                v-model="accountForm.accountName"
                type="text"
                maxlength="50"
                required
                placeholder="예: 토스 생활비 통장"
                class="w-full ts-input"
              />
            </div>
            <div>
              <label class="block text-[13px] font-bold text-[#8B95A1] mb-1.5">
                금융기관명 <span class="text-[#FF6B76]">*</span>
              </label>
              <input
                v-model="accountForm.institutionName"
                type="text"
                maxlength="30"
                required
                placeholder="예: 토스뱅크, 국민은행"
                class="w-full ts-input"
              />
            </div>
          </div>

          <!-- 계좌 현재 잔액 (balance: BigDecimal, precision 15, scale 0) -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-[13px] font-bold text-[#8B95A1]">
                계좌 현재 잔액 (원) <span class="text-[#FF6B76]">*</span>
              </label>
              <span class="text-[13px] font-mono font-bold text-[#64A8FF] tabular-nums">
                {{ Number(accountForm.balance || 0).toLocaleString('ko-KR') }}원
              </span>
            </div>
            <input
              v-model.number="accountForm.balance"
              type="number"
              min="0"
              step="1"
              required
              placeholder="0"
              class="w-full ts-input font-mono font-extrabold text-[15px] tabular-nums"
            />
          </div>

          <!-- 노출 여부 설정 (isDashboardVisible / isSpendingVisible: Boolean, default false) -->
          <div
            v-for="field in visibilityToggleFields"
            :key="field.key"
            class="p-3.5 rounded-[14px] bg-[#1C202B] border border-white/[0.06] flex items-center justify-between gap-4"
          >
            <div>
              <div class="text-[14px] font-bold text-[#F9FAFB]">{{ field.title }}</div>
              <p class="text-[13px] text-[#8B95A1] mt-0.5 m-0">
                {{ field.description }}
              </p>
            </div>

            <div class="inline-flex rounded-[10px] bg-[#0B0D11] p-1 border border-white/[0.08] shrink-0">
              <button
                type="button"
                @click="accountForm[field.key] = true"
                :class="[
                  'px-3 py-1.5 rounded-[8px] text-[13px] font-bold transition-colors cursor-pointer border-0',
                  accountForm[field.key]
                    ? 'bg-[#3182F6] text-white'
                    : 'bg-transparent text-[#8B95A1] hover:text-[#F9FAFB]'
                ]"
              >
                노출
              </button>
              <button
                type="button"
                @click="accountForm[field.key] = false"
                :class="[
                  'px-3 py-1.5 rounded-[8px] text-[13px] font-bold transition-colors cursor-pointer border-0',
                  !accountForm[field.key]
                    ? 'bg-[#242938] text-[#F9FAFB]'
                    : 'bg-transparent text-[#8B95A1] hover:text-[#F9FAFB]'
                ]"
              >
                숨김
              </button>
            </div>
          </div>

          <!-- 계좌 활성 여부 (useYn: Boolean) -->
          <div class="flex items-center gap-6 pt-1">
            <span class="text-[13px] font-bold text-[#8B95A1]">계좌 상태</span>
            <label class="inline-flex items-center gap-2 cursor-pointer text-[14px]">
              <input type="radio" :value="true" v-model="accountForm.useYn" class="accent-[#3182F6]" />
              <span class="text-[#F9FAFB] font-bold">사용</span>
            </label>
            <label class="inline-flex items-center gap-2 cursor-pointer text-[14px]">
              <input type="radio" :value="false" v-model="accountForm.useYn" class="accent-[#3182F6]" />
              <span class="text-[#8B95A1] font-semibold">해지</span>
            </label>
          </div>

          <!-- 비고/메모 (memo: length 200) -->
          <div>
            <label class="block text-[13px] font-bold text-[#8B95A1] mb-1.5">
              메모 (최대 200자)
            </label>
            <textarea
              v-model="accountForm.memo"
              rows="2"
              maxlength="200"
              placeholder="계좌 용도, 이체일 등 특이사항 기록"
              class="w-full ts-input !h-auto py-2.5 resize-none"
            ></textarea>
          </div>
        </template>

        <!-- 4. 입금/출금 폼 -->
        <template v-else-if="isTransactionMode">
          <div class="p-4 bg-[#1C202B] border border-white/[0.06] rounded-[14px] space-y-1 text-[14px]">
            <div class="text-[#8B95A1] text-[13px] font-semibold">대상 계좌</div>
            <div class="font-extrabold text-[#F9FAFB]">{{ transactionTarget.accountName }}</div>
            <div class="text-[13px] text-[#8B95A1]">
              {{ transactionTarget.institutionName }} · {{ transactionTarget.accountNumber }}
            </div>
            <div class="text-[13px] font-bold text-[#64A8FF] pt-1 tabular-nums">
              현재 잔액: {{ (transactionTarget.balance || 0).toLocaleString() }}원
            </div>
          </div>

          <div>
            <label class="block text-[13px] font-bold text-[#8B95A1] mb-1.5">
              {{ mode === 'account-deposit' ? '입금할 금액' : '출금할 금액' }} (원) <span class="text-[#FF6B76]">*</span>
            </label>
            <input
              v-model.number="transactionAmount"
              type="number"
              min="1"
              required
              placeholder="0"
              class="w-full ts-input font-mono font-extrabold text-[16px] tabular-nums"
            />
          </div>

          <div class="flex flex-wrap gap-1.5 pt-1">
            <button
              v-for="amt in [10000, 50000, 100000, 500000, 1000000]"
              :key="amt"
              type="button"
              @click="addTransactionAmount(amt)"
              class="btn btn--secondary !min-h-[32px] !px-3 !text-[13px]"
            >
              +{{ (amt / 10000) >= 1 ? (amt / 10000) + '만' : amt.toLocaleString() }}
            </button>
            <button
              v-if="mode === 'account-withdraw'"
              type="button"
              @click="transactionAmount = transactionTarget.balance || 0"
              class="btn btn--danger-outline !min-h-[32px] !px-3 !text-[13px]"
            >
              전액
            </button>
          </div>
        </template>

        <!-- 에러 메시지 -->
        <p v-if="errorMessage" class="text-[13px] text-[#FF6B76] font-bold">
          {{ errorMessage }}
        </p>

        <!-- 모달 푸터 버튼 -->
        <div class="pt-3 grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2.5">
          <button type="button" @click="handleClose" class="btn btn--secondary !min-h-[44px]">
            취소
          </button>
          <button type="submit" :disabled="isSubmitting" class="btn btn--primary !min-h-[44px] sm:min-w-[120px]">
            <span
              v-if="isSubmitting"
              class="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"
            ></span>
            <span>{{ submitButtonText }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
/**
 * ============================================================================
 * @file        ClassificationModal.vue
 * @layer       UI Component (Presentation Layer - Modal / Mobile Bottom Sheet)
 * @role        Level 1(그룹), Level 2(카테고리), Level 3(계좌: Account.java)의 신규 등록/수정 및 입출금 통합 모달
 * @parent      AccountClassificationView.vue
 * ============================================================================
 */
import { ref, computed, watch } from 'vue'

// ============================================================================
// [SECTION 1] Props & Emits
// ============================================================================
const props = defineProps({
  isOpen: { type: Boolean, default: false },
  mode: { type: String, default: 'group-create' },
  initialData: { type: Object, default: () => ({}) },
  groups: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'submit'])

// ============================================================================
// [SECTION 2] Reactive State
// ============================================================================
const isSubmitting = ref(false)
const errorMessage = ref('')

const groupForm = ref({
  categoryGroupCode: '',
  categoryGroupName: ''
})

const categoryForm = ref({
  categoryGroupId: null,
  categoryCode: '',
  categoryName: ''
})

/**
 * 3. 소분류 계좌 입력 폼 데이터 (Account.java 필드 매핑)
 * - balance            : 계좌 현재 잔액 (기본 0)
 * - isDashboardVisible : 대시보드 잔액관리 노출 여부 (기본 false)
 * - isSpendingVisible  : 월별 소비내역 소비계좌 출력 여부 (기본 false)
 */
const visibilityToggleFields = [
  {
    key: 'isDashboardVisible',
    title: '대시보드 잔액관리 노출',
    description: '활성화하면 대시보드 잔액 현황 계좌로 출력됩니다.'
  },
  {
    key: 'isSpendingVisible',
    title: '소비내역 소비계좌 출력',
    description: '활성화하면 월별 소비내역 화면의 소비 계좌로 출력됩니다.'
  }
]

const accountForm = ref({
  categoryId: null,
  accountName: '',
  institutionName: '',
  accountNumber: '',
  balance: 0,
  isDashboardVisible: false,
  isSpendingVisible: false,
  useYn: true,
  memo: ''
})

const transactionTarget = ref({})
const transactionAmount = ref(0)

// ============================================================================
// [SECTION 3] Computed Properties
// ============================================================================
const isGroupMode = computed(() => props.mode.startsWith('group'))
const isCategoryMode = computed(() => props.mode.startsWith('category'))
const isAccountMode = computed(() => props.mode.startsWith('account-create') || props.mode.startsWith('account-edit'))
const isTransactionMode = computed(() => props.mode === 'account-deposit' || props.mode === 'account-withdraw')

const modalTitle = computed(() => {
  switch (props.mode) {
    case 'group-create':
      return '새 그룹 등록'
    case 'group-edit':
      return '그룹 수정'
    case 'category-create':
      return '새 카테고리 등록'
    case 'category-edit':
      return '카테고리 수정'
    case 'account-create':
      return '새 계좌 등록'
    case 'account-edit':
      return '계좌 정보 수정'
    case 'account-deposit':
      return '계좌 입금'
    case 'account-withdraw':
      return '계좌 출금'
    default:
      return '관리'
  }
})

const submitButtonText = computed(() => {
  if (props.mode.endsWith('create')) return '등록하기'
  if (props.mode.endsWith('edit')) return '수정하기'
  if (props.mode === 'account-deposit') return '입금 완료'
  if (props.mode === 'account-withdraw') return '출금 완료'
  return '확인'
})

// ============================================================================
// [SECTION 4] Watchers & Code Auto-Generation
// ============================================================================
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      errorMessage.value = ''
      isSubmitting.value = false
      initFormData()
    }
  }
)

const fetchNextCategoryCode = async (groupId) => {
  const group = props.groups.find((g) => g.id === groupId)
  if (!group || !group.categoryGroupCode) return
  try {
    const res = await fetch(
      `/api/v1/categories/next-code?CategoryGroupCode=${encodeURIComponent(group.categoryGroupCode)}`
    )
    if (!res.ok) return
    const json = await res.json()
    const data = json?.data !== undefined ? json.data : json
    const code =
      typeof data === 'string' || typeof data === 'number'
        ? String(data)
        : String(data?.nextCode || data?.categoryCode || '')
    if (code) categoryForm.value.categoryCode = code
  } catch (err) {
    console.error('다음 카테고리 코드 조회 실패:', err)
  }
}

watch(
  () => categoryForm.value.categoryGroupId,
  (newId, oldId) => {
    if (props.isOpen && props.mode === 'category-create' && oldId !== null && newId !== oldId) {
      fetchNextCategoryCode(newId)
    }
  }
)

const initFormData = async () => {
  const d = props.initialData || {}
  if (isGroupMode.value) {
    let nextCode = d.categoryGroupCode || ''
    if (!nextCode) {
      try {
        let res = await fetch('/api/v1/category-groups/next-code')
        if (res.ok) {
          const json = await res.json()
          const data = json?.data !== undefined ? json.data : json
          if (typeof data === 'string' || typeof data === 'number') {
            nextCode = String(data)
          } else if (data && typeof data === 'object') {
            if (Array.isArray(data)) {
              const maxCode = data.reduce((max, item) => {
                const num = parseInt(item.categoryGroupCode || item.code, 10)
                return !isNaN(num) && num > max ? num : max
              }, 0)
              nextCode = String(maxCode > 0 ? maxCode + 100 : '100')
            } else {
              nextCode = String(data.nextCode || data.nextSeq || data.code || '')
            }
          }
        }
      } catch (err) {
        console.error('다음 그룹 코드 조회 실패:', err)
      }
    }
    groupForm.value = {
      categoryGroupCode: nextCode,
      categoryGroupName: d.categoryGroupName || ''
    }
  } else if (isCategoryMode.value) {
    const groupId = d.categoryGroupId || (props.groups[0] ? props.groups[0].id : null)
    categoryForm.value = {
      categoryGroupId: groupId,
      categoryCode: d.categoryCode || '',
      categoryName: d.categoryName || ''
    }
    if (props.mode === 'category-create') {
      await fetchNextCategoryCode(groupId)
    }
  } else if (isAccountMode.value) {
    let defaultCatId = d.categoryId || null
    if (!defaultCatId && props.groups.length > 0) {
      for (const g of props.groups) {
        if (g.categories && g.categories.length > 0) {
          defaultCatId = g.categories[0].id
          break
        }
      }
    }
    accountForm.value = {
      categoryId: defaultCatId,
      accountName: d.accountName || '',
      institutionName: d.institutionName || '',
      accountNumber: d.accountNumber || '',
      balance: d.balance !== undefined && d.balance !== null ? Number(d.balance) : 0,
      isDashboardVisible: Boolean(d.isDashboardVisible ?? d.dashboardVisible ?? false),
      isSpendingVisible: Boolean(d.isSpendingVisible ?? d.spendingVisible ?? false),
      useYn: d.useYn !== undefined ? d.useYn : true,
      memo: d.memo || ''
    }
  } else if (isTransactionMode.value) {
    transactionTarget.value = { ...d }
    transactionAmount.value = 0
  }
}

const addTransactionAmount = (amt) => {
  transactionAmount.value = (Number(transactionAmount.value) || 0) + amt
}

const handleClose = () => {
  emit('close')
}

const handleSubmit = async () => {
  errorMessage.value = ''
  try {
    isSubmitting.value = true
    if (isGroupMode.value) {
      if (!groupForm.value.categoryGroupCode.trim()) throw new Error('그룹 코드를 입력해주세요.')
      if (!groupForm.value.categoryGroupName.trim()) throw new Error('그룹명을 입력해주세요.')
      emit('submit', { ...groupForm.value })
    } else if (isCategoryMode.value) {
      if (!categoryForm.value.categoryGroupId) throw new Error('소속 그룹을 선택해주세요.')
      if (!categoryForm.value.categoryCode.trim()) throw new Error('카테고리 코드를 입력해주세요.')
      if (!categoryForm.value.categoryName.trim()) throw new Error('카테고리명을 입력해주세요.')
      emit('submit', { ...categoryForm.value })
    } else if (isAccountMode.value) {
      if (!accountForm.value.categoryId) throw new Error('소속 카테고리를 선택해주세요.')
      if (!accountForm.value.accountName.trim()) throw new Error('계좌명을 입력해주세요.')
      if (!accountForm.value.institutionName.trim()) throw new Error('금융기관명을 입력해주세요.')
      const parsedBalance = Number(accountForm.value.balance)
      if (isNaN(parsedBalance) || parsedBalance < 0) {
        throw new Error('올바른 잔액을 입력해주세요.')
      }
      emit('submit', {
        ...accountForm.value,
        accountNumber: accountForm.value.accountNumber || '-',
        balance: parsedBalance,
        isDashboardVisible: Boolean(accountForm.value.isDashboardVisible),
        isSpendingVisible: Boolean(accountForm.value.isSpendingVisible)
      })
    } else if (isTransactionMode.value) {
      const amt = Number(transactionAmount.value)
      if (!amt || amt <= 0) throw new Error('올바른 금액을 입력해주세요.')
      if (props.mode === 'account-withdraw' && amt > (transactionTarget.value.balance || 0)) {
        throw new Error('잔액이 부족합니다.')
      }
      emit('submit', { amount: amt, accountId: transactionTarget.value.id })
    }
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    isSubmitting.value = false
  }
}
</script>
