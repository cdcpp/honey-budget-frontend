<template>
  <div v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto bg-[#141413]/45 flex items-center justify-center p-4"
    @click.self="handleClose">
    <div
      class="ts-card bg-white shadow-lg w-full max-w-lg overflow-hidden"
      role="dialog" aria-modal="true">
      <!-- 모달 헤더 -->
      <div class="px-6 py-4 border-b border-[#141413]/12 flex items-center justify-between bg-[#F7F6F2]">
        <h3 class="text-[16px] font-bold text-[#141413]">
          {{ modalTitle }}
        </h3>
        <button @click="handleClose"
          class="text-[#575653] hover:text-[#141413] text-[14px] font-medium px-2 py-1 rounded-[4px] hover:bg-[#EFECE6] transition-colors cursor-pointer"
          title="닫기">
          닫기
        </button>
      </div>

      <!-- 모달 바디 / 폼 -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4 text-[13px]">
        <!-- 1. 그룹 등록/수정 폼 -->
        <template v-if="isGroupMode">
          <div>
            <label class="block font-semibold text-[#141413] mb-1.5">
              그룹 코드 (자동생성) <span class="text-[#b91c1c]">*</span>
            </label>
            <input v-model="groupForm.categoryGroupCode" type="text" maxlength="10" required
              placeholder="예: 100(수입), 200(지출), 300(투자)" readonly
              class="w-full ts-input font-mono bg-[#F7F6F2]" />
          </div>

          <div>
            <label class="block font-semibold text-[#141413] mb-1.5">
              그룹명 (최대 10자) <span class="text-[#b91c1c]">*</span>
            </label>
            <input v-model="groupForm.categoryGroupName" type="text" maxlength="10" required placeholder="예: 수입, 지출"
              class="w-full ts-input" />
          </div>
        </template>

        <!-- 2. 카테고리 등록/수정 폼 -->
        <template v-else-if="isCategoryMode">
          <div>
            <label class="block font-semibold text-[#141413] mb-1.5">
              소속 그룹 <span class="text-[#b91c1c]">*</span>
            </label>
            <select v-model="categoryForm.categoryGroupId" required
              class="w-full ts-input font-medium cursor-pointer">
              <option v-for="grp in groups" :key="grp.id" :value="grp.id">
                [{{ grp.categoryGroupCode }}] {{ grp.categoryGroupName }}
              </option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-[#141413] mb-1.5">
              카테고리 코드 (최대 10자) <span class="text-[#b91c1c]">*</span>
            </label>
            <input v-model="categoryForm.categoryCode" type="text" maxlength="10" required
              :disabled="mode === 'category-create'" placeholder="예: 101, 102, 103"
              class="w-full ts-input font-mono"
              @input="categoryForm.categoryCode = categoryForm.categoryCode.toUpperCase()" />
          </div>

          <div>
            <label class="block font-semibold text-[#141413] mb-1.5">
              카테고리명 (최대 20자) <span class="text-[#b91c1c]">*</span>
            </label>
            <input v-model="categoryForm.categoryName" type="text" maxlength="20" required
              placeholder="예: 급여, 고정지출, 생활비"
              class="w-full ts-input" />
          </div>
        </template>

        <!-- 3. 계좌 등록/수정 폼 -->
        <template v-else-if="isAccountMode">
          <div>
            <label class="block font-semibold text-[#141413] mb-1.5">
              소속 카테고리 <span class="text-[#b91c1c]">*</span>
            </label>
            <select v-model="accountForm.categoryId" required
              class="w-full ts-input font-medium cursor-pointer">
              <optgroup v-for="grp in groups" :key="grp.id" :label="grp.categoryGroupName">
                <option v-for="cat in grp.categories || []" :key="cat.id" :value="cat.id">
                  {{ cat.categoryName }} ({{ cat.categoryCode }})
                </option>
              </optgroup>
            </select>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-[#141413] mb-1.5">
                계좌명 <span class="text-[#b91c1c]">*</span>
              </label>
              <input v-model="accountForm.accountName" type="text" maxlength="50" required placeholder="예: 급여 지급 계좌"
                class="w-full ts-input" />
            </div>
            <div>
              <label class="block font-semibold text-[#141413] mb-1.5">
                금융기관명 <span class="text-[#b91c1c]">*</span>
              </label>
              <input v-model="accountForm.institutionName" type="text" maxlength="30" required
                placeholder="예: 국민은행, 카카오뱅크"
                class="w-full ts-input" />
            </div>
          </div>

          <div class="flex items-center gap-6 pt-1">
            <span class="font-semibold text-[#141413]">계좌 상태:</span>
            <label class="inline-flex items-center gap-2 cursor-pointer text-[14px]">
              <input type="radio" :value="true" v-model="accountForm.useYn"
                class="accent-[#0a4b49]" />
              <span class="text-[#141413] font-medium">사용</span>
            </label>
            <label class="inline-flex items-center gap-2 cursor-pointer text-[14px]">
              <input type="radio" :value="false" v-model="accountForm.useYn"
                class="accent-[#0a4b49]" />
              <span class="text-[#575653]">해지</span>
            </label>
          </div>

          <div>
            <label class="block font-semibold text-[#141413] mb-1.5">
              메모 (최대 200자)
            </label>
            <textarea v-model="accountForm.memo" rows="2" maxlength="200" placeholder="계좌 용도, 이체일 등 특이사항 기록"
              class="w-full ts-input !h-auto py-2 resize-none"></textarea>
          </div>
        </template>

        <!-- 4. 입금/출금 폼 -->
        <template v-else-if="isTransactionMode">
          <div class="p-3.5 bg-[#F7F6F2] rounded-[6px] border border-[#141413]/12 space-y-1 text-[14px]">
            <div class="text-[#575653] text-[13px]">대상 계좌</div>
            <div class="font-bold text-[#141413]">{{ transactionTarget.accountName }}</div>
            <div class="text-[13px] text-[#575653]">
              {{ transactionTarget.institutionName }} · {{ transactionTarget.accountNumber }}
            </div>
            <div class="text-[13px] font-semibold text-[#0a4b49] pt-1 tabular-nums">
              현재 잔액: {{ (transactionTarget.balance || 0).toLocaleString() }}원
            </div>
          </div>

          <div>
            <label class="block font-semibold text-[#141413] mb-1.5">
              {{ mode === 'account-deposit' ? '입금할 금액' : '출금할 금액' }} (원) <span class="text-[#b91c1c]">*</span>
            </label>
            <input v-model.number="transactionAmount" type="number" min="1" required placeholder="0"
              class="w-full ts-input font-mono font-bold text-[15px] tabular-nums" />
          </div>

          <!-- 빠른 금액 추가 버튼 -->
          <div class="flex flex-wrap gap-1.5 pt-1">
            <button v-for="amt in [10000, 50000, 100000, 500000, 1000000]" :key="amt" type="button"
              @click="addTransactionAmount(amt)"
              class="btn btn--secondary !min-h-[30px] !px-2.5">
              +{{ (amt / 10000) >= 1 ? (amt / 10000) + '만' : amt.toLocaleString() }}
            </button>
            <button v-if="mode === 'account-withdraw'" type="button"
              @click="transactionAmount = transactionTarget.balance || 0"
              class="btn btn--danger-outline !min-h-[30px] !px-2.5">
              전액
            </button>
          </div>
        </template>

        <!-- 에러 메시지 -->
        <p v-if="errorMessage" class="text-[13px] text-[#b91c1c] font-semibold">
          {{ errorMessage }}
        </p>

        <!-- 모달 푸터 버튼 -->
        <div class="pt-4 flex items-center justify-end gap-2 border-t border-[#141413]/12">
          <button type="button" @click="handleClose"
            class="btn btn--secondary">
            취소
          </button>
          <button type="submit" :disabled="isSubmitting"
            class="btn btn--primary">
            <span v-if="isSubmitting"
              class="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
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
 * @layer       UI Component (Presentation Layer - Modal)
 * @role        Level 1(그룹), Level 2(카테고리), Level 3(계좌)의 신규 등록/수정 및 입출금 통합 모달
 * @parent      AccountClassificationView.vue
 * @note        mode 값('group-create', 'category-create', 'account-create' 등)에 따라
 *              하나의 모달 안에서 서로 다른 입력 폼(<template v-if="isGroupMode"> 등)을 보여줍니다.
 * ============================================================================
 */
import { ref, computed, watch } from 'vue'

// ============================================================================
// [SECTION 1] Props & Emits (모달 열림 상태, 동작 모드, 초기 데이터, 닫기/제출 이벤트)
// ============================================================================
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'group-create'
  },
  initialData: {
    type: Object,
    default: () => ({})
  },
  groups: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'submit'])

// ============================================================================
// [SECTION 2] Reactive State (각 레벨별 입력 폼 객체 및 에러 상태)
// ============================================================================
const isSubmitting = ref(false)
const errorMessage = ref('')

/** 1. 대분류 그룹 입력 폼 데이터 */
const groupForm = ref({
  categoryGroupCode: '',
  categoryGroupName: ''
})

/** 2. 중분류 카테고리 입력 폼 데이터 */
const categoryForm = ref({
  categoryGroupId: null,
  categoryCode: '',
  categoryName: ''
})

/** 3. 소분류 계좌 입력 폼 데이터 */
const accountForm = ref({
  categoryId: null,
  accountName: '',
  institutionName: '',
  accountNumber: '',
  balance: 0,
  useYn: true,
  memo: ''
})

/** 4. 입출금 처리 대상 계좌 및 금액 */
const transactionTarget = ref({})
const transactionAmount = ref(0)

// ============================================================================
// [SECTION 3] Computed Properties (현재 mode에 따른 화면 분기 플래그 및 타이틀)
// ============================================================================
const isGroupMode = computed(() => props.mode.startsWith('group'))
const isCategoryMode = computed(() => props.mode.startsWith('category'))
const isAccountMode = computed(() => props.mode.startsWith('account-create') || props.mode.startsWith('account-edit'))
const isTransactionMode = computed(() => props.mode === 'account-deposit' || props.mode === 'account-withdraw')

/** 모달 상단 헤더에 표시할 제목 */
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

/** 모달 하단 제출 버튼 라벨 */
const submitButtonText = computed(() => {
  if (props.mode.endsWith('create')) return '등록하기'
  if (props.mode.endsWith('edit')) return '수정하기'
  if (props.mode === 'account-deposit') return '입금 완료'
  if (props.mode === 'account-withdraw') return '출금 완료'
  return '확인'
})

// ============================================================================
// [SECTION 4] Watchers & Code Auto-Generation (모달 오픈 시 자동 코드 채번 조회)
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

// 선택된 소속 그룹의 코드(CategoryGroupCode)로 다음 카테고리 코드 조회
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

// 등록 모드에서 소속 그룹을 변경하면 코드 재조회
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
    // 신규 등록 모드인 경우 서버에서 다음 그룹 코드(next-seq)를 조회하여 자동 채움
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
              // 목록이 반환되는 경우 최댓값 + 100 계산
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
    // 신규 등록 모드인 경우 선택된 그룹 코드로 다음 카테고리 코드 조회
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
      balance: Number(d.balance) || 0,
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
      emit('submit', {
        ...accountForm.value,
        accountNumber: accountForm.value.accountNumber || '-',
        balance: Number(accountForm.value.balance) || 0
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
