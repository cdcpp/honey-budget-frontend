<template>
  <div v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
    @click.self="handleClose">
    <div
      class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all border border-slate-100 animate-fadeIn"
      role="dialog" aria-modal="true">
      <!-- 모달 헤더 -->
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-brand-primary"></span>
          {{ modalTitle }}
        </h3>
        <button @click="handleClose"
          class="text-slate-400 hover:text-slate-600 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
          title="닫기">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 모달 바디 / 폼 -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <!-- 1. 그룹 등록/수정 폼 -->
        <template v-if="isGroupMode">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">
              그룹 코드 (자동생성) <span class="text-rose-500">*</span>
            </label>
            <input v-model="groupForm.categoryGroupCode" type="text" maxlength="10" required
              placeholder="예: 100(수입), 200(지출), 300(투자)" readonly
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none uppercase transition-all" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">
              그룹명 (최대 10자) <span class="text-rose-500">*</span>
            </label>
            <input v-model="groupForm.categoryGroupName" type="text" maxlength="10" required placeholder="예: 수입, 지출"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all" />
          </div>
        </template>

        <!-- 2. 카테고리 등록/수정 폼 -->
        <template v-else-if="isCategoryMode">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">
              소속 그룹 <span class="text-rose-500">*</span>
            </label>
            <select v-model="categoryForm.categoryGroupId" required
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all">
              <option v-for="grp in groups" :key="grp.id" :value="grp.id">
                [{{ grp.categoryGroupCode }}] {{ grp.categoryGroupName }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">
              카테고리 코드 (최대 10자) <span class="text-rose-500">*</span>
            </label>
            <input v-model="categoryForm.categoryCode" type="text" maxlength="10" required
              :disabled="mode === 'category-create'" placeholder="예: 101, 102, 103"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none uppercase transition-all"
              @input="categoryForm.categoryCode = categoryForm.categoryCode.toUpperCase()" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">
              카테고리명 (최대 20자) <span class="text-rose-500">*</span>
            </label>
            <input v-model="categoryForm.categoryName" type="text" maxlength="20" required
              placeholder="예: 급여, 고정지출, 생활비"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all" />
          </div>
        </template>

        <!-- 3. 계좌 등록/수정 폼 -->
        <template v-else-if="isAccountMode">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">
              소속 카테고리 <span class="text-rose-500">*</span>
            </label>
            <select v-model="accountForm.categoryId" required
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all">
              <optgroup v-for="grp in groups" :key="grp.id" :label="grp.categoryGroupName">
                <option v-for="cat in grp.categories || []" :key="cat.id" :value="cat.id">
                  {{ cat.categoryName }} ({{ cat.categoryCode }})
                </option>
              </optgroup>
            </select>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">
                계좌명 <span class="text-rose-500">*</span>
              </label>
              <input v-model="accountForm.accountName" type="text" maxlength="50" required placeholder="예: 급여 지급 계좌"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">
                금융기관명 <span class="text-rose-500">*</span>
              </label>
              <input v-model="accountForm.institutionName" type="text" maxlength="30" required
                placeholder="예: 국민은행, 카카오뱅크"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all" />
            </div>
          </div>



          <div class="flex items-center gap-6 pt-1">
            <span class="text-xs font-semibold text-slate-600">계좌 상태:</span>
            <label class="inline-flex items-center gap-2 cursor-pointer text-sm">
              <input type="radio" :value="true" v-model="accountForm.useYn"
                class="text-brand-primary focus:ring-brand-primary" />
              <span class="text-slate-800 font-medium">사용</span>
            </label>
            <label class="inline-flex items-center gap-2 cursor-pointer text-sm">
              <input type="radio" :value="false" v-model="accountForm.useYn"
                class="text-brand-primary focus:ring-brand-primary" />
              <span class="text-slate-500">해지</span>
            </label>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">
              메모 (최대 200자)
            </label>
            <textarea v-model="accountForm.memo" rows="2" maxlength="200" placeholder="계좌 용도, 이체일 등 특이사항 기록"
              class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all resize-none"></textarea>
          </div>
        </template>

        <!-- 4. 입금/출금 폼 -->
        <template v-else-if="isTransactionMode">
          <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-sm">
            <div class="text-slate-500 text-xs">대상 계좌</div>
            <div class="font-bold text-slate-900">{{ transactionTarget.accountName }}</div>
            <div class="text-xs text-slate-600">
              {{ transactionTarget.institutionName }} · {{ transactionTarget.accountNumber }}
            </div>
            <div class="text-xs font-semibold text-brand-primary pt-1">
              현재 잔액: {{ (transactionTarget.balance || 0).toLocaleString() }}원
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">
              {{ mode === 'account-deposit' ? '입금할 금액' : '출금할 금액' }} (원) <span class="text-rose-500">*</span>
            </label>
            <input v-model.number="transactionAmount" type="number" min="1" required placeholder="0"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all" />
          </div>

          <!-- 빠른 금액 추가 버튼 -->
          <div class="flex flex-wrap gap-1.5 pt-1">
            <button v-for="amt in [10000, 50000, 100000, 500000, 1000000]" :key="amt" type="button"
              @click="addTransactionAmount(amt)"
              class="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
              +{{ (amt / 10000) >= 1 ? (amt / 10000) + '만' : amt.toLocaleString() }}
            </button>
            <button v-if="mode === 'account-withdraw'" type="button"
              @click="transactionAmount = transactionTarget.balance || 0"
              class="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors">
              전액
            </button>
          </div>
        </template>

        <!-- 에러 메시지 -->
        <p v-if="errorMessage" class="text-xs text-rose-500 font-medium">
          {{ errorMessage }}
        </p>

        <!-- 모달 푸터 버튼 -->
        <div class="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
          <button type="button" @click="handleClose"
            class="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
            취소
          </button>
          <button type="submit" :disabled="isSubmitting"
            class="px-5 py-2 text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primaryHover rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5">
            <span v-if="isSubmitting"
              class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span>{{ submitButtonText }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

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

const accountForm = ref({
  categoryId: null,
  accountName: '',
  institutionName: '',
  accountNumber: '',
  balance: 0,
  useYn: true,
  memo: ''
})

const transactionTarget = ref({})
const transactionAmount = ref(0)

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
