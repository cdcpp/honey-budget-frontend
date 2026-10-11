<template>
  <div class="space-y-6">
    <!-- 헤더 섹션 & 브레드크럼 -->
    <header class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span
              class="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-brand-primary text-white text-base">
              🏦
            </span>
            카테고리 관리
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            그룹 &rsaquo; 카테고리 &rsaquo; 계좌 순으로 선택해 조회하고, 각 단계에서 등록·수정·삭제할 수 있습니다.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button @click="loadHierarchy"
            class="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
            title="백엔드에서 최신 데이터를 다시 불러옵니다">
            <i class="fa-solid fa-arrows-rotate" :class="{ 'animate-spin': loading }"></i>
            <span>새로고침</span>
          </button>
        </div>
      </div>

      <!-- 브레드크럼 네비게이션 -->
      <nav class="flex items-center gap-2 text-sm font-medium mt-5 pt-4 border-t border-slate-100 text-slate-600">
        <button @click="resetToAll"
          class="hover:text-brand-primary hover:underline transition-colors flex items-center gap-1">
          <span>전체</span>
        </button>
        <span class="text-slate-400 font-light">&rsaquo;</span>

        <span v-if="selectedGroup"
          class="cursor-pointer hover:text-brand-primary font-semibold text-slate-800 transition-colors"
          @click="selectGroup(selectedGroup)">
          {{ selectedGroup.categoryGroupName }}
          <span class="text-xs font-normal text-slate-400 font-mono">({{ selectedGroup.categoryGroupCode }})</span>
        </span>
        <span v-else class="text-slate-400 italic">그룹 미선택</span>

        <template v-if="selectedCategory">
          <span class="text-slate-400 font-light">&rsaquo;</span>
          <span class="text-brand-primary font-bold">
            {{ selectedCategory.categoryName }}
            <span class="text-xs font-normal opacity-70 font-mono">({{ selectedCategory.categoryCode }})</span>
          </span>
        </template>
      </nav>
    </header>

    <!-- 에러 배너 -->
    <div v-if="error"
      class="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm flex items-center justify-between">
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span>{{ error }}</span>
      </div>
      <button @click="loadHierarchy" class="text-xs font-semibold underline hover:text-rose-900">
        다시 시도
      </button>
    </div>

    <!-- 3단 계층형 컬럼 컨테이너 (Level 1 / Level 2 / Level 3) -->
    <main class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <!-- ==================== LEVEL 1: 그룹 (Group) ==================== -->
      <section
        class="lg:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col min-h-[580px]">
        <!-- 컬럼 헤더: 등록 및 삭제 버튼 나란히 배치 -->
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-brand-primary"></span>
            <h2 class="text-sm font-bold text-slate-800 tracking-tight">레벨 1 · 그룹</h2>
            <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
              {{ groups.length }}
            </span>
          </div>

          <!-- 등록 및 삭제 버튼 그룹 -->
          <div class="flex items-center gap-1.5">
            <button @click="openModal('group-create')"
              class="px-2.5 py-1.5 text-xs font-bold text-white bg-brand-primary hover:bg-brand-primaryHover rounded-lg transition-colors flex items-center gap-1 shadow-sm"
              title="새 그룹 등록">
              <i class="fa-solid fa-plus text-[10px]"></i>
              <span>등록</span>
            </button>
            <button @click="selectedGroup && handleDeleteGroup(selectedGroup)" :disabled="!selectedGroup" :class="[
              'px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm',
              selectedGroup
                ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer'
                : 'text-slate-300 bg-slate-50 border border-slate-100 cursor-not-allowed'
            ]" title="선택된 그룹 삭제">
              <i class="fa-solid fa-trash-can text-[10px]"></i>
              <span>삭제</span>
            </button>
          </div>
        </div>

        <!-- 그룹 목록 -->
        <div class="space-y-2.5 flex-1 overflow-y-auto max-h-[720px] pr-1">
          <div v-if="groups.length === 0"
            class="h-64 flex flex-col items-center justify-center text-slate-400 text-center p-4 border-2 border-dashed border-slate-200 rounded-xl">
            <i class="fa-regular fa-folder-open text-3xl mb-2 text-slate-300"></i>
            <p class="text-xs">등록된 그룹이 없습니다.</p>
            <button @click="openModal('group-create')" class="mt-3 text-xs text-brand-primary font-semibold underline">
              그룹 추가하기
            </button>
          </div>

          <div v-for="grp in groups" :key="grp.id" @click="selectGroup(grp)" :class="[
            'p-4 rounded-xl cursor-pointer transition-all border relative group flex flex-col justify-between gap-3',
            selectedGroupId === grp.id
              ? 'bg-brand-primary text-white border-brand-primary shadow-md'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
          ]">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2">
                <span :class="[
                  'px-2 py-0.5 rounded text-[11px] font-bold font-mono tracking-wider',
                  selectedGroupId === grp.id
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-slate-100 text-slate-600'
                ]">
                  {{ grp.categoryGroupCode }}
                </span>
                <span class="font-bold text-base tracking-tight">
                  {{ grp.categoryGroupName }}
                </span>
              </div>

              <!-- 카드 액션 (수정 / 삭제) -->
              <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity" @click.stop>
                <button @click="openModal('group-edit', grp)" :class="[
                  'w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors',
                  selectedGroupId === grp.id
                    ? 'text-white hover:bg-white/20'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                ]" title="그룹 수정">
                  <i class="fa-solid fa-pen text-[11px]"></i>
                </button>
                <button @click="handleDeleteGroup(grp)" :class="[
                  'w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors',
                  selectedGroupId === grp.id
                    ? 'text-rose-200 hover:bg-rose-500/30 hover:text-white'
                    : 'text-rose-500 hover:bg-rose-50'
                ]" title="그룹 삭제">
                  <i class="fa-solid fa-trash-can text-[11px]"></i>
                </button>
              </div>
            </div>

            <!-- 하단 통계 정보 -->
            <div :class="[
              'text-xs flex items-center justify-between pt-1 border-t',
              selectedGroupId === grp.id
                ? 'border-white/20 text-emerald-100'
                : 'border-slate-100 text-slate-500'
            ]">
              <span>{{ (grp.categories || []).length }}개 카테고리</span>
              <span>계좌 {{ getGroupAccountCount(grp) }}개</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== LEVEL 2: 카테고리 (Category) ==================== -->
      <section
        class="lg:col-span-4 bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col min-h-[580px]">
        <!-- 컬럼 헤더: 등록 및 삭제 버튼 나란히 배치 -->
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-teal-500"></span>
            <h2 class="text-sm font-bold text-slate-800 tracking-tight">레벨 2 · 카테고리</h2>
            <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
              {{ currentCategories.length }}
            </span>
          </div>

          <!-- 등록 및 삭제 버튼 그룹 -->
          <div class="flex items-center gap-1.5">
            <button @click="openModal('category-create')" :disabled="!selectedGroup" :class="[
              'px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm',
              selectedGroup
                ? 'text-white bg-slate-800 hover:bg-slate-900 cursor-pointer'
                : 'text-slate-400 bg-slate-100 cursor-not-allowed'
            ]" title="새 카테고리 등록">
              <i class="fa-solid fa-plus text-[10px]"></i>
              <span>등록</span>
            </button>
            <button @click="selectedCategory && handleDeleteCategory(selectedCategory)" :disabled="!selectedCategory"
              :class="[
                'px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm',
                selectedCategory
                  ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer'
                  : 'text-slate-300 bg-slate-50 border border-slate-100 cursor-not-allowed'
              ]" title="선택된 카테고리 삭제">
              <i class="fa-solid fa-trash-can text-[10px]"></i>
              <span>삭제</span>
            </button>
          </div>
        </div>

        <!-- 카테고리 목록 -->
        <div class="space-y-2.5 flex-1 overflow-y-auto max-h-[720px] pr-1">
          <!-- 그룹 미선택 안내 -->
          <div v-if="!selectedGroup"
            class="h-64 flex flex-col items-center justify-center text-slate-400 text-center p-4 border-2 border-dashed border-slate-200 rounded-xl">
            <i class="fa-solid fa-arrow-left text-2xl mb-2 text-slate-300"></i>
            <p class="text-xs font-medium">왼쪽에서 그룹을 먼저 선택해주세요.</p>
          </div>

          <!-- 카테고리 없음 안내 -->
          <div v-else-if="currentCategories.length === 0"
            class="h-64 flex flex-col items-center justify-center text-slate-400 text-center p-4 border-2 border-dashed border-slate-200 rounded-xl">
            <i class="fa-regular fa-folder-open text-3xl mb-2 text-slate-300"></i>
            <p class="text-xs font-medium">[{{ selectedGroup.categoryGroupName }}] 그룹에 등록된 카테고리가 없습니다.</p>
            <button @click="openModal('category-create')"
              class="mt-3 text-xs text-brand-primary font-semibold underline">
              새 카테고리 등록하기
            </button>
          </div>

          <!-- 카테고리 카드들 -->
          <div v-for="cat in currentCategories" :key="cat.id" @click="selectCategory(cat)" :class="[
            'p-4 rounded-xl cursor-pointer transition-all border relative group flex flex-col justify-between gap-3',
            selectedCategoryId === cat.id
              ? 'bg-brand-lightMint border-brand-mintBorder text-brand-mintDarkText shadow-sm'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
          ]">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2">
                <span :class="[
                  'px-2 py-0.5 rounded text-[11px] font-bold font-mono tracking-wider',
                  selectedCategoryId === cat.id
                    ? 'bg-white/80 text-brand-mintDarkText border border-brand-mintBorder'
                    : 'bg-slate-100 text-slate-600'
                ]">
                  {{ cat.categoryCode }}
                </span>
                <span class="font-bold text-base tracking-tight">
                  {{ cat.categoryName }}
                </span>
              </div>

              <!-- 카드 액션 (수정 / 삭제) -->
              <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity" @click.stop>
                <button @click="openModal('category-edit', cat)"
                  class="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-slate-500 hover:bg-black/5 hover:text-slate-800 transition-colors"
                  title="카테고리 수정">
                  <i class="fa-solid fa-pen text-[11px]"></i>
                </button>
                <button @click="handleDeleteCategory(cat)"
                  class="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-rose-500 hover:bg-rose-50 transition-colors"
                  title="카테고리 삭제">
                  <i class="fa-solid fa-trash-can text-[11px]"></i>
                </button>
              </div>
            </div>

            <!-- 하단 통계 정보 (계좌 수 & 잔액 합계) -->
            <div :class="[
              'text-xs flex items-center justify-between pt-1 border-t',
              selectedCategoryId === cat.id
                ? 'border-brand-mintBorder/60 text-emerald-800'
                : 'border-slate-100 text-slate-500'
            ]">
              <span>계좌 {{ (cat.accounts || []).length }}개</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== LEVEL 3: 계좌 (Account) ==================== -->
      <section
        class="lg:col-span-5 bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col min-h-[580px]">
        <!-- 컬럼 헤더: 등록 및 삭제 버튼 나란히 배치 -->
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <h2 class="text-sm font-bold text-slate-800 tracking-tight">레벨 3 · 계좌</h2>
            <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
              {{ currentAccounts.length }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <!-- 선택된 카테고리 잔액 합계 표시 -->
            <div v-if="selectedCategory"
              class="hidden sm:inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            </div>

            <!-- 등록 및 삭제 버튼 그룹 -->
            <div class="flex items-center gap-1.5">
              <button @click="openModal('account-create')" :disabled="!selectedCategory" :class="[
                'px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm',
                selectedCategory
                  ? 'text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                  : 'text-slate-400 bg-slate-100 cursor-not-allowed'
              ]" title="새 계좌 등록">
                <i class="fa-solid fa-plus text-[10px]"></i>
                <span>등록</span>
              </button>
              <button @click="handleHeaderDeleteAccount" :disabled="!selectedCategory || currentAccounts.length === 0"
                :class="[
                  'px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm',
                  selectedCategory && currentAccounts.length > 0
                    ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer'
                    : 'text-slate-300 bg-slate-50 border border-slate-100 cursor-not-allowed'
                ]" title="선택된 계좌 삭제">
                <i class="fa-solid fa-trash-can text-[10px]"></i>
                <span>삭제</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 계좌 목록 -->
        <div class="space-y-3 flex-1 overflow-y-auto max-h-[720px] pr-1">
          <!-- 카테고리 미선택 안내 -->
          <div v-if="!selectedCategory"
            class="h-64 flex flex-col items-center justify-center text-slate-400 text-center p-4 border-2 border-dashed border-slate-200 rounded-xl">
            <i class="fa-solid fa-arrow-left text-2xl mb-2 text-slate-300"></i>
            <p class="text-xs font-medium">카테고리를 먼저 선택해주세요.</p>
          </div>

          <!-- 계좌 없음 안내 -->
          <div v-else-if="currentAccounts.length === 0"
            class="h-64 flex flex-col items-center justify-center text-slate-400 text-center p-4 border-2 border-dashed border-slate-200 rounded-xl">
            <i class="fa-regular fa-credit-card text-3xl mb-2 text-slate-300"></i>
            <p class="text-xs font-medium">[{{ selectedCategory.categoryName }}]에 등록된 계좌가 없습니다.</p>
            <button @click="openModal('account-create')" class="mt-3 text-xs text-emerald-600 font-semibold underline">
              새 계좌 등록하기
            </button>
          </div>

          <!-- 계좌 카드 목록 -->
          <div v-for="acc in currentAccounts" :key="acc.id" @click="selectAccount(acc)" :class="[
            'p-4 rounded-xl border transition-all space-y-3 cursor-pointer',
            selectedAccountId === acc.id
              ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500/40 shadow-sm'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
          ]">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-bold text-base text-slate-900 tracking-tight">{{ acc.accountName }}</h3>
                  <!-- 상태 배지 (사용 / 해지) -->
                  <span :class="[
                    'px-2 py-0.5 rounded text-[11px] font-semibold',
                    acc.useYn !== false
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  ]">
                    {{ acc.useYn !== false ? '사용' : '해지' }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <span class="font-semibold text-slate-700">{{ acc.institutionName }}</span>
                  <span class="text-slate-300">·</span>
                  <span class="font-mono text-slate-600">{{ acc.accountNumber }}</span>
                </p>
              </div>

              <!-- 잔액 표시 -->
              <div class="text-right">
                <div class="text-lg font-black text-slate-900 tracking-tight">
                  {{ (Number(acc.balance) || 0).toLocaleString() }}
                  <span class="text-xs font-normal text-slate-500">원</span>
                </div>
              </div>
            </div>

            <!-- 메모 (있을 경우) -->
            <div v-if="acc.memo"
              class="p-2.5 rounded-lg bg-slate-50 text-xs text-slate-600 border border-slate-100 flex items-start gap-1.5">
              <i class="fa-regular fa-comment-dots text-slate-400 mt-0.5"></i>
              <span>{{ acc.memo }}</span>
            </div>

            <!-- 액션 버튼들 (수정 / 삭제) -->
            <div class="flex items-center justify-end pt-2 border-t border-slate-100" @click.stop>

              <div class="flex items-center gap-1">
                <button @click="openModal('account-edit', acc)"
                  class="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1">
                  <i class="fa-solid fa-pen text-[10px]"></i>
                  <span>수정</span>
                </button>
                <button @click="handleDeleteAccount(acc)"
                  class="px-2.5 py-1 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1">
                  <i class="fa-solid fa-trash-can text-[10px]"></i>
                  <span>삭제</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 분류 / 계좌 통합 관리 모달 -->
    <ClassificationModal :is-open="modalState.isOpen" :mode="modalState.mode" :initial-data="modalState.data"
      :groups="groups" @close="closeModal" @submit="handleModalSubmit" />

    <!-- 토스트 알림 메시지 -->
    <transition name="toast">
      <div v-if="toastMessage"
        class="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 text-white text-sm font-medium rounded-xl shadow-lg flex items-center gap-2 border border-slate-800">
        <i class="fa-solid fa-circle-check text-emerald-400"></i>
        <span>{{ toastMessage }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAccountClassification } from '../../composables/useAccountClassification'
import ClassificationModal from './ClassificationModal.vue'

const {
  groups,
  selectedGroupId,
  selectedCategoryId,
  selectedGroup,
  currentCategories,
  selectedCategory,
  currentAccounts,
  currentCategoryTotal,
  loading,
  error,
  getCategoryTotal,
  getGroupAccountCount,
  selectGroup,
  selectCategory,
  resetToAll,
  loadHierarchy,
  addGroup,
  updateGroup,
  removeGroup,
  addCategory,
  updateCategory,
  removeCategory,
  addAccount,
  updateAccount,
  removeAccount,
  depositAccount,
  withdrawAccount,
  refresh
} = useAccountClassification()

const toastMessage = ref('')
let toastTimer = null

const selectedAccountId = ref(null)

const selectAccount = (acc) => {
  selectedAccountId.value = acc.id
}

const showToast = (msg) => {
  toastMessage.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 2500)
}

const modalState = ref({
  isOpen: false,
  mode: 'group-create',
  data: {}
})

const openModal = (mode, data = {}) => {
  modalState.value = {
    isOpen: true,
    mode,
    data: {
      ...data,
      categoryGroupId: data.categoryGroupId || (selectedGroup.value ? selectedGroup.value.id : null),
      categoryId: data.categoryId || (selectedCategory.value ? selectedCategory.value.id : null)
    }
  }
}

const closeModal = () => {
  modalState.value.isOpen = false
}

const handleModalSubmit = async (formData) => {
  try {
    const { mode, data } = modalState.value
    if (mode === 'group-create') {
      await addGroup(formData)
      showToast('새 대분류 그룹이 등록되었습니다.')
    } else if (mode === 'group-edit') {
      await updateGroup(data.id, formData)
      showToast('대분류 그룹 명칭이 수정되었습니다.')
    } else if (mode === 'category-create') {
      await addCategory(formData)
      showToast('새 중분류 카테고리가 등록되었습니다.')
    } else if (mode === 'category-edit') {
      await updateCategory(data.id, formData)
      showToast('중분류 카테고리 정보가 수정되었습니다.')
    } else if (mode === 'account-create') {
      await addAccount(formData)
      showToast('새 계좌가 등록되었습니다.')
    } else if (mode === 'account-edit') {
      await updateAccount(data.id, formData)
      showToast('계좌 정보가 수정되었습니다.')
    } else if (mode === 'account-deposit') {
      await depositAccount(formData.accountId, formData.amount)
      showToast(`${formData.amount.toLocaleString()}원이 입금되었습니다.`)
    } else if (mode === 'account-withdraw') {
      await withdrawAccount(formData.accountId, formData.amount)
      showToast(`${formData.amount.toLocaleString()}원이 출금되었습니다.`)
    }
    closeModal()
  } catch (err) {
    alert(err.message || '작업 처리 중 오류가 발생했습니다.')
  }
}

const handleDeleteGroup = async (grp) => {
  if (!grp) return
  const catCnt = (grp.categories || []).length
  const msg = catCnt > 0
    ? `[${grp.categoryGroupName}] 그룹을 삭제하시겠습니까?\n하위 ${catCnt}개의 카테고리와 계좌들도 함께 삭제됩니다.`
    : `[${grp.categoryGroupName}] 그룹을 삭제하시겠습니까?`
  if (!confirm(msg)) return
  try {
    await removeGroup(grp.id)
    showToast('대분류 그룹이 삭제되었습니다.')
  } catch (err) {
    alert(err.message || '그룹 삭제에 실패했습니다.')
  }
}

const handleDeleteCategory = async (cat) => {
  if (!cat) return
  const accCnt = (cat.accounts || []).length
  const msg = accCnt > 0
    ? `[${cat.categoryName}] 카테고리를 삭제하시겠습니까?\n하위 ${accCnt}개의 계좌도 함께 삭제됩니다.`
    : `[${cat.categoryName}] 카테고리를 삭제하시겠습니까?`
  if (!confirm(msg)) return
  try {
    await removeCategory(cat.id)
    showToast('중분류 카테고리가 삭제되었습니다.')
  } catch (err) {
    alert(err.message || '카테고리 삭제에 실패했습니다.')
  }
}

const handleDeleteAccount = async (acc) => {
  if (!acc) return
  if (!confirm(`[${acc.accountName}] 계좌를 삭제(해지)하시겠습니까?`)) return
  try {
    await removeAccount(acc.id)
    showToast('계좌가 성공적으로 삭제(비활성화)되었습니다.')
  } catch (err) {
    alert(err.message || '계좌 삭제에 실패했습니다.')
  }
}

const handleHeaderDeleteAccount = () => {
  if (!currentAccounts.value || currentAccounts.value.length === 0) {
    alert('삭제할 계좌가 없습니다.')
    return
  }
  const target = currentAccounts.value.find((a) => a.id === selectedAccountId.value) || currentAccounts.value[0]
  handleDeleteAccount(target)
}

onMounted(() => {
  loadHierarchy()
})
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease-out;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
</style>
