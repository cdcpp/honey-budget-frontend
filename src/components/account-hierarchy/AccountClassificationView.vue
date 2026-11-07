<template>
  <div class="space-y-6">
    <!-- ================================================================== -->
    <!-- [UI 영역 1] 상단 헤더 및 브레드크럼(전체 > 그룹 > 카테고리) 경로 바     -->
    <!-- ================================================================== -->
    <header class="pb-6 border-b border-[#141413]/12">
      <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p class="text-[13px] font-medium text-[#575653] mb-1">계좌 분류 체계 (3단계)</p>
          <h1 class="text-[28px] sm:text-[32px] font-bold tracking-tight text-[#141413] leading-tight">
            카테고리 관리
          </h1>
          <p class="text-[15px] text-[#575653] mt-1.5">
            그룹 &rsaquo; 카테고리 &rsaquo; 계좌 순으로 선택해 조회하고, 각 단계에서 등록·수정·삭제합니다.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="loadHierarchy"
            class="btn btn--secondary"
            title="백엔드에서 최신 데이터를 다시 불러옵니다"
          >
            <span>새로고침</span>
          </button>
        </div>
      </div>

      <!-- 현재 선택된 그룹과 카테고리 경로를 보여주는 브레드크럼 -->
      <nav class="flex items-center gap-2 text-[14px] font-medium mt-5 pt-4 border-t border-[#141413]/10 text-[#575653]">
        <button
          @click="resetToAll"
          class="hover:text-[#141413] hover:underline transition-colors cursor-pointer"
        >
          <span>전체</span>
        </button>
        <span class="text-[#141413]/30">&rsaquo;</span>

        <span
          v-if="selectedGroup"
          class="cursor-pointer hover:text-[#141413] font-semibold text-[#141413] transition-colors"
          @click="selectGroup(selectedGroup)"
        >
          {{ selectedGroup.categoryGroupName }}
          <span class="text-[13px] font-normal text-[#575653] font-mono tabular-nums">({{ selectedGroup.categoryGroupCode }})</span>
        </span>
        <span v-else class="text-[#575653]">그룹 미선택</span>

        <template v-if="selectedCategory">
          <span class="text-[#141413]/30">&rsaquo;</span>
          <span class="text-[#0a4b49] font-bold">
            {{ selectedCategory.categoryName }}
            <span class="text-[13px] font-normal text-[#575653] font-mono tabular-nums">({{ selectedCategory.categoryCode }})</span>
          </span>
        </template>
      </nav>
    </header>

    <!-- 서버 통신 오류 배너 -->
    <div
      v-if="error"
      class="p-4 bg-[#fef2f2] border border-[#b91c1c]/25 rounded-[8px] text-[#b91c1c] text-[14px] flex items-center justify-between"
    >
      <span>{{ error }}</span>
      <button @click="loadHierarchy" class="text-[13px] font-semibold underline cursor-pointer">
        다시 시도
      </button>
    </div>

    <!-- ================================================================== -->
    <!-- [UI 영역 2] 3단계 컬럼 그리드 (Level 1 그룹 / Level 2 카테고리 / Level 3 계좌) -->
    <!-- ================================================================== -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <!-- ==================== [컬럼 1] LEVEL 1: 그룹 (Group) ==================== -->
      <section class="lg:col-span-3 ts-card p-5 flex flex-col min-h-[580px]">
        <!-- 컬럼 1 헤더: 제목 + 개수 뱃지 + 등록/삭제 버튼 -->
        <div class="flex items-center justify-between mb-4 pb-3.5 border-b border-[#141413]/12">
          <div class="flex items-center gap-2">
            <h2 class="text-[15px] font-bold text-[#141413] tracking-tight">레벨 1 · 그룹</h2>
            <span class="px-2 py-0.5 rounded-[4px] text-[13px] font-semibold font-mono bg-[#F7F6F2] text-[#575653] tabular-nums">
              {{ groups.length }}
            </span>
          </div>

          <div class="flex items-center gap-1.5">
            <button
              @click="openModal('group-create')"
              class="btn btn--primary bg-brand-primary !min-h-[32px] !px-3"
              title="새 그룹 등록"
            >
              <span>등록</span>
            </button>
            <button
              @click="selectedGroup && handleDeleteGroup(selectedGroup)"
              :disabled="!selectedGroup"
              class="btn btn--danger-outline !min-h-[32px] !px-3"
              title="선택된 그룹 삭제"
            >
              <span>삭제</span>
            </button>
          </div>
        </div>

        <!-- 컬럼 1 본문: 대분류 그룹 카드 리스트 -->
        <div class="space-y-2.5 flex-1 overflow-y-auto max-h-[720px] pr-1">
          <div
            v-if="groups.length === 0"
            class="h-64 flex flex-col items-center justify-center text-[#575653] text-center p-4 border border-dashed border-[#141413]/20 rounded-[8px]"
          >
            <p class="text-[13px]">등록된 그룹이 없습니다.</p>
            <button @click="openModal('group-create')" class="mt-3 text-[13px] text-[#0a4b49] font-semibold underline cursor-pointer">
              그룹 추가하기
            </button>
          </div>

          <div
            v-for="grp in groups"
            :key="grp.id"
            @click="selectGroup(grp)"
            :class="[
              'p-4 rounded-[8px] cursor-pointer border relative group flex flex-col justify-between gap-3 ts-card-interactive',
              selectedGroupId === grp.id
                ? '!bg-[#0a4b49] text-white !border-[#0a4b49]'
                : 'bg-white text-[#141413]'
            ]"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0">
                <span
                  :class="[
                    'px-2 py-0.5 rounded-[4px] text-[13px] font-semibold font-mono tabular-nums shrink-0',
                    selectedGroupId === grp.id
                      ? 'bg-white/15 text-white border border-white/25'
                      : 'bg-[#F7F6F2] text-[#575653] border border-[#141413]/10'
                  ]"
                >
                  {{ grp.categoryGroupCode }}
                </span>
                <span class="font-bold text-[15px] tracking-tight truncate">
                  {{ grp.categoryGroupName }}
                </span>
              </div>

              <!-- 그룹 수정/삭제 액션 (@click.stop으로 카드 선택 이벤트 전파 차단) -->
              <div class="flex items-center gap-2 shrink-0" @click.stop>
                <button
                  @click="openModal('group-edit', grp)"
                  :class="[
                    'text-[13px] font-medium hover:underline cursor-pointer',
                    selectedGroupId === grp.id ? 'text-white/90 hover:text-white' : 'text-[#575653] hover:text-[#141413]'
                  ]"
                  title="그룹 수정"
                >
                  수정
                </button>
                <button
                  @click="handleDeleteGroup(grp)"
                  :class="[
                    'text-[13px] font-medium hover:underline cursor-pointer',
                    selectedGroupId === grp.id ? 'text-white/80 hover:text-white' : 'text-[#b91c1c]'
                  ]"
                  title="그룹 삭제"
                >
                  삭제
                </button>
              </div>
            </div>

            <div
              :class="[
                'text-[13px] flex items-center justify-between pt-2 border-t tabular-nums',
                selectedGroupId === grp.id
                  ? 'border-white/20 text-white/85'
                  : 'border-[#141413]/8 text-[#575653]'
              ]"
            >
              <span>{{ (grp.categories || []).length }}개 카테고리</span>
              <span>계좌 {{ getGroupAccountCount(grp) }}개</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== [컬럼 2] LEVEL 2: 카테고리 (Category) ==================== -->
      <section class="lg:col-span-4 ts-card p-5 flex flex-col min-h-[580px]">
        <!-- 컬럼 2 헤더: 제목 + 개수 뱃지 + 등록/삭제 버튼 -->
        <div class="flex items-center justify-between mb-4 pb-3.5 border-b border-[#141413]/12">
          <div class="flex items-center gap-2">
            <h2 class="text-[15px] font-bold text-[#141413] tracking-tight">레벨 2 · 카테고리</h2>
            <span class="px-2 py-0.5 rounded-[4px] text-[13px] font-semibold font-mono bg-[#F7F6F2] text-[#575653] tabular-nums">
              {{ currentCategories.length }}
            </span>
          </div>

          <div class="flex items-center gap-1.5">
            <button
              @click="openModal('category-create')"
              :disabled="!selectedGroup"
              class="btn btn--primary !min-h-[32px] !px-3"
              title="새 카테고리 등록"
            >
              <span>등록</span>
            </button>
            <button
              @click="selectedCategory && handleDeleteCategory(selectedCategory)"
              :disabled="!selectedCategory"
              class="btn btn--danger-outline !min-h-[32px] !px-3"
              title="선택된 카테고리 삭제"
            >
              <span>삭제</span>
            </button>
          </div>
        </div>

        <!-- 컬럼 2 본문: 선택된 그룹에 속한 중분류 카테고리 카드 리스트 -->
        <div class="space-y-2.5 flex-1 overflow-y-auto max-h-[720px] pr-1">
          <div
            v-if="!selectedGroup"
            class="h-64 flex flex-col items-center justify-center text-[#575653] text-center p-4 border border-dashed border-[#141413]/20 rounded-[8px]"
          >
            <p class="text-[13px] font-medium">왼쪽에서 그룹을 먼저 선택해주세요.</p>
          </div>

          <div
            v-else-if="currentCategories.length === 0"
            class="h-64 flex flex-col items-center justify-center text-[#575653] text-center p-4 border border-dashed border-[#141413]/20 rounded-[8px]"
          >
            <p class="text-[13px] font-medium">[{{ selectedGroup.categoryGroupName }}] 그룹에 등록된 카테고리가 없습니다.</p>
            <button
              @click="openModal('category-create')"
              class="mt-3 text-[13px] text-[#0a4b49] font-semibold underline cursor-pointer"
            >
              새 카테고리 등록하기
            </button>
          </div>

          <div
            v-for="cat in currentCategories"
            :key="cat.id"
            @click="selectCategory(cat)"
            :class="[
              'p-4 rounded-[8px] cursor-pointer border relative group flex flex-col justify-between gap-3 ts-card-interactive',
              selectedCategoryId === cat.id
                ? '!bg-[#F7F6F2] !border-[#0a4b49] ring-1 ring-[#0a4b49]'
                : 'bg-white text-[#141413]'
            ]"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0">
                <span
                  :class="[
                    'px-2 py-0.5 rounded-[4px] text-[13px] font-semibold font-mono tabular-nums shrink-0',
                    selectedCategoryId === cat.id
                      ? 'bg-[#0a4b49] text-white'
                      : 'bg-[#F7F6F2] text-[#575653] border border-[#141413]/10'
                  ]"
                >
                  {{ cat.categoryCode }}
                </span>
                <span class="font-bold text-[15px] tracking-tight text-[#141413] truncate">
                  {{ cat.categoryName }}
                </span>
              </div>

              <div class="flex items-center gap-2 shrink-0" @click.stop>
                <button
                  @click="openModal('category-edit', cat)"
                  class="text-[13px] font-medium text-[#575653] hover:text-[#141413] hover:underline cursor-pointer"
                  title="카테고리 수정"
                >
                  수정
                </button>
                <button
                  @click="handleDeleteCategory(cat)"
                  class="text-[13px] font-medium text-[#b91c1c] hover:underline cursor-pointer"
                  title="카테고리 삭제"
                >
                  삭제
                </button>
              </div>
            </div>

            <div class="text-[13px] flex items-center justify-between pt-2 border-t border-[#141413]/8 text-[#575653] tabular-nums">
              <span>계좌 {{ (cat.accounts || []).length }}개</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== [컬럼 3] LEVEL 3: 계좌 (Account) ==================== -->
      <section class="lg:col-span-5 ts-card p-5 flex flex-col min-h-[580px]">
        <!-- 컬럼 3 헤더: 제목 + 개수 뱃지 + 등록/삭제 버튼 -->
        <div class="flex items-center justify-between mb-4 pb-3.5 border-b border-[#141413]/12">
          <div class="flex items-center gap-2">
            <h2 class="text-[15px] font-bold text-[#141413] tracking-tight">레벨 3 · 계좌</h2>
            <span class="px-2 py-0.5 rounded-[4px] text-[13px] font-semibold font-mono bg-[#F7F6F2] text-[#575653] tabular-nums">
              {{ currentAccounts.length }}
            </span>
          </div>

          <div class="flex items-center gap-1.5">
            <button
              @click="openModal('account-create')"
              :disabled="!selectedCategory"
              class="btn btn--primary !min-h-[32px] !px-3"
              title="새 계좌 등록"
            >
              <span>등록</span>
            </button>
            <button
              @click="handleHeaderDeleteAccount"
              :disabled="!selectedCategory || currentAccounts.length === 0"
              class="btn btn--danger-outline !min-h-[32px] !px-3"
              title="선택된 계좌 삭제"
            >
              <span>삭제</span>
            </button>
          </div>
        </div>

        <!-- 컬럼 3 본문: 선택된 카테고리에 속한 소분류 계좌 카드 리스트 -->
        <div class="space-y-3 flex-1 overflow-y-auto max-h-[720px] pr-1">
          <div
            v-if="!selectedCategory"
            class="h-64 flex flex-col items-center justify-center text-[#575653] text-center p-4 border border-dashed border-[#141413]/20 rounded-[8px]"
          >
            <p class="text-[13px] font-medium">카테고리를 먼저 선택해주세요.</p>
          </div>

          <div
            v-else-if="currentAccounts.length === 0"
            class="h-64 flex flex-col items-center justify-center text-[#575653] text-center p-4 border border-dashed border-[#141413]/20 rounded-[8px]"
          >
            <p class="text-[13px] font-medium">[{{ selectedCategory.categoryName }}]에 등록된 계좌가 없습니다.</p>
            <button
              @click="openModal('account-create')"
              class="mt-3 text-[13px] text-[#0a4b49] font-semibold underline cursor-pointer"
            >
              새 계좌 등록하기
            </button>
          </div>

          <div
            v-for="acc in currentAccounts"
            :key="acc.id"
            @click="selectAccount(acc)"
            :class="[
              'p-4 rounded-[8px] border space-y-3 cursor-pointer ts-card-interactive',
              selectedAccountId === acc.id
                ? '!bg-[#F7F6F2] !border-[#0a4b49] ring-1 ring-[#0a4b49]'
                : 'bg-white'
            ]"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-bold text-[15px] text-[#141413] tracking-tight">{{ acc.accountName }}</h3>
                  <span
                    :class="[
                      'px-2 py-0.5 rounded-[4px] text-[13px] font-medium border',
                      acc.useYn !== false
                        ? 'bg-[#F7F6F2] text-[#0a4b49] border-[#0a4b49]/30'
                        : 'bg-[#F7F6F2] text-[#575653] border-[#141413]/15'
                    ]"
                  >
                    {{ acc.useYn !== false ? '사용' : '해지' }}
                  </span>
                </div>
                <p class="text-[13px] text-[#575653] mt-1 flex items-center gap-1.5">
                  <span class="font-medium text-[#141413]">{{ acc.institutionName }}</span>
                  <span v-if="acc.accountNumber && acc.accountNumber !== '-'" class="font-mono tabular-nums">
                    · {{ acc.accountNumber }}
                  </span>
                </p>
              </div>

              <div class="flex items-center gap-2 shrink-0" @click.stop>
                <button
                  @click="openModal('account-edit', acc)"
                  class="text-[13px] font-medium text-[#575653] hover:text-[#141413] hover:underline cursor-pointer"
                >
                  수정
                </button>
                <span class="text-[#141413]/20">|</span>
                <button
                  @click="handleDeleteAccount(acc)"
                  class="text-[13px] font-medium text-[#b91c1c] hover:underline cursor-pointer"
                >
                  삭제
                </button>
              </div>
            </div>

            <div
              v-if="acc.memo"
              class="pt-2 border-t border-[#141413]/8 text-[13px] text-[#575653]"
            >
              {{ acc.memo }}
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- ================================================================== -->
    <!-- [UI 영역 3] 그룹 / 카테고리 / 계좌 통합 등록·수정 팝업 모달          -->
    <!-- ================================================================== -->
    <ClassificationModal
      :is-open="modalState.isOpen"
      :mode="modalState.mode"
      :initial-data="modalState.data"
      :groups="groups"
      @close="closeModal"
      @submit="handleModalSubmit"
    />

    <!-- ================================================================== -->
    <!-- [UI 영역 4] 우측 하단 작업 완료 토스트 알림 메시지                   -->
    <!-- ================================================================== -->
    <transition name="toast">
      <div
        v-if="toastMessage"
        class="fixed bottom-6 right-6 z-50 px-4 py-3 bg-[#141413] text-white text-[14px] font-medium rounded-[6px] shadow-lg flex items-center gap-2"
      >
        <span>{{ toastMessage }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
/**
 * ============================================================================
 * @file        AccountClassificationView.vue
 * @layer       Domain View Layer (카테고리 관리 최상위 메인 화면)
 * @role        Level 1(그룹) -> Level 2(카테고리) -> Level 3(계좌) 3단 컬럼 조회 및 등록/수정/삭제 UI 제어
 * @parent      App.vue
 * @children    ClassificationModal.vue
 * @spring      CategoryGroupController, CategoryController, AccountController 연동
 * ============================================================================
 */
import { ref, onMounted } from 'vue'
import { useAccountClassification } from '../../composables/useAccountClassification'
import ClassificationModal from './ClassificationModal.vue'

// ============================================================================
// [SECTION 1] Composable State & Actions (useAccountClassification 연동)
// ============================================================================
const {
  groups,
  selectedGroupId,
  selectedCategoryId,
  selectedGroup,
  currentCategories,
  selectedCategory,
  currentAccounts,
  loading,
  error,
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
  removeAccount
} = useAccountClassification()

// ============================================================================
// [SECTION 2] Local UI State (토스트 알림, 선택된 계좌 ID, 통합 모달 상태)
// ============================================================================
const toastMessage = ref('')
let toastTimer = null

const selectedAccountId = ref(null) // Level 3 컬럼에서 클릭하여 선택된 계좌 ID

/** ClassificationModal 열림 상태 및 동작 모드('group-create', 'category-edit' 등) */
const modalState = ref({
  isOpen: false,
  mode: 'group-create',
  data: {}
})

// ============================================================================
// [SECTION 3] Lifecycle & Event Handlers (모달 오픈, 제출 분기, 단계별 삭제)
// ============================================================================

/** Level 3 계좌 카드 클릭 시 선택 상태 저장 */
const selectAccount = (acc) => {
  selectedAccountId.value = acc.id
}

/** 우측 하단에 2.5초간 토스트 알림을 띄웁니다. */
const showToast = (msg) => {
  toastMessage.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 2500)
}

/**
 * [등록/수정 모달 열기]
 * @param {'group-create'|'group-edit'|'category-create'|'category-edit'|'account-create'|'account-edit'} mode
 * @param {object} data - 수정 시 기존 항목 데이터
 */
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

/** 모달 닫기 */
const closeModal = () => {
  modalState.value.isOpen = false
}

/** 모달에서 '등록하기 / 수정 완료' 제출 시 mode에 따라 알맞은 API 액션을 호출합니다. */
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
    }
    closeModal()
  } catch (err) {
    alert(err.message || '작업 처리 중 오류가 발생했습니다.')
  }
}

/** [Level 1 그룹 삭제 확인 및 처리] */
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

/** [Level 2 카테고리 삭제 확인 및 처리] */
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

/** [Level 3 계좌 삭제 확인 및 처리] */
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

/** Level 3 컬럼 상단 헤더의 '삭제' 버튼 클릭 시 선택된 계좌(또는 첫 번째 계좌) 삭제 실행 */
const handleHeaderDeleteAccount = () => {
  if (!currentAccounts.value || currentAccounts.value.length === 0) {
    alert('삭제할 계좌가 없습니다.')
    return
  }
  const target = currentAccounts.value.find((a) => a.id === selectedAccountId.value) || currentAccounts.value[0]
  handleDeleteAccount(target)
}

// 화면 최초 진입 시 서버에서 3단계 계층 데이터 로드
onMounted(() => {
  loadHierarchy()
})
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
