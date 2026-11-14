<template>
  <div class="space-y-5 sm:space-y-6">
    <!-- ================================================================== -->
    <!-- [UI 영역 1] 토스 다크 스타일 상단 헤더 및 브레드크럼(전체 > 그룹 > 카테고리) -->
    <!-- ================================================================== -->
    <header class="pt-1 pb-2 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <span class="inline-block text-[13px] font-bold text-[#64A8FF] mb-1">
            계좌 분류 체계 (3단계)
          </span>
          <h1 class="text-[24px] sm:text-[28px] font-extrabold tracking-tight text-[#F9FAFB] leading-snug">
            카테고리 관리
          </h1>
          <p class="text-[14px] text-[#8B95A1] mt-1 m-0">
            그룹 &rsaquo; 카테고리 &rsaquo; 계좌 순으로 선택해 조회하고, 각 단계에서 등록·수정·삭제해요.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="loadHierarchy"
            class="btn btn--secondary !min-h-[38px]"
            title="백엔드에서 최신 데이터를 다시 불러옵니다"
          >
            <span>새로고침</span>
          </button>
        </div>
      </div>

      <!-- 현재 선택된 경로 브레드크럼 카드 -->
      <nav class="ts-card px-4 py-3 flex items-center gap-2 text-[14px] font-bold text-[#8B95A1] overflow-x-auto no-scrollbar">
        <button
          @click="resetToAll"
          class="hover:text-[#F9FAFB] transition-colors cursor-pointer shrink-0 bg-transparent border-0 p-0 font-bold text-[#8B95A1]"
        >
          <span>전체</span>
        </button>
        <span class="text-[#6B7684]">&rsaquo;</span>

        <span
          v-if="selectedGroup"
          class="cursor-pointer font-extrabold text-[#F9FAFB] shrink-0"
          @click="selectGroup(selectedGroup)"
        >
          {{ selectedGroup.categoryGroupName }}
          <span class="text-[13px] font-semibold text-[#8B95A1] font-mono tabular-nums">({{ selectedGroup.categoryGroupCode }})</span>
        </span>
        <span v-else class="text-[#6B7684] shrink-0">그룹 미선택</span>

        <template v-if="selectedCategory">
          <span class="text-[#6B7684]">&rsaquo;</span>
          <span class="px-2.5 py-0.5 rounded-full bg-[#3182F6]/20 text-[#64A8FF] font-extrabold shrink-0">
            {{ selectedCategory.categoryName }}
            <span class="text-[13px] font-semibold font-mono tabular-nums">({{ selectedCategory.categoryCode }})</span>
          </span>
        </template>
      </nav>

      <!-- 모바일 전용 단계 빠른 이동 탭 (데스크톱에서는 3컬럼 동시 노출) -->
      <div class="flex lg:hidden items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          type="button"
          @click="mobileStep = 'ALL'"
          :class="[
            'px-3.5 py-1.5 rounded-full text-[13px] font-bold cursor-pointer border shrink-0',
            mobileStep === 'ALL'
              ? 'bg-[#F9FAFB] text-[#0B0D11] border-[#F9FAFB]'
              : 'bg-[#151821] text-[#8B95A1] border-white/[0.08]'
          ]"
        >
          전체 단계 보기
        </button>
        <button
          type="button"
          @click="mobileStep = 1"
          :class="[
            'px-3.5 py-1.5 rounded-full text-[13px] font-bold cursor-pointer border shrink-0',
            mobileStep === 1
              ? 'bg-[#3182F6] text-white border-[#3182F6]'
              : 'bg-[#151821] text-[#8B95A1] border-white/[0.08]'
          ]"
        >
          1. 그룹 ({{ groups.length }})
        </button>
        <button
          type="button"
          @click="mobileStep = 2"
          :class="[
            'px-3.5 py-1.5 rounded-full text-[13px] font-bold cursor-pointer border shrink-0',
            mobileStep === 2
              ? 'bg-[#3182F6] text-white border-[#3182F6]'
              : 'bg-[#151821] text-[#8B95A1] border-white/[0.08]'
          ]"
        >
          2. 카테고리 ({{ currentCategories.length }})
        </button>
        <button
          type="button"
          @click="mobileStep = 3"
          :class="[
            'px-3.5 py-1.5 rounded-full text-[13px] font-bold cursor-pointer border shrink-0',
            mobileStep === 3
              ? 'bg-[#3182F6] text-white border-[#3182F6]'
              : 'bg-[#151821] text-[#8B95A1] border-white/[0.08]'
          ]"
        >
          3. 계좌 ({{ currentAccounts.length }})
        </button>
      </div>
    </header>

    <!-- 서버 통신 오류 배너 -->
    <div
      v-if="error"
      class="p-4 bg-[#F04452]/15 border border-[#F04452]/25 rounded-[16px] text-[#FF6B76] text-[14px] font-semibold flex items-center justify-between"
    >
      <span>{{ error }}</span>
      <button @click="loadHierarchy" class="text-[13px] font-extrabold underline cursor-pointer">
        다시 시도
      </button>
    </div>

    <!-- ================================================================== -->
    <!-- [UI 영역 2] 3단계 컬럼 그리드 (Level 1 그룹 / Level 2 카테고리 / Level 3 계좌) -->
    <!-- ================================================================== -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
      <!-- ==================== [컬럼 1] LEVEL 1: 그룹 (Group) ==================== -->
      <section
        v-show="mobileStep === 'ALL' || mobileStep === 1"
        class="lg:col-span-3 ts-card p-5 flex flex-col lg:min-h-[560px]"
      >
        <div class="flex items-center justify-between mb-4 pb-3.5 border-b border-white/[0.07]">
          <div class="flex items-center gap-2">
            <h2 class="text-[16px] font-extrabold text-[#F9FAFB] tracking-tight">레벨 1 · 그룹</h2>
            <span class="px-2 py-0.5 rounded-full text-[13px] font-extrabold font-mono bg-[#1C202B] text-[#D1D6DB] tabular-nums">
              {{ groups.length }}
            </span>
          </div>

          <div class="flex items-center gap-1.5">
            <button
              @click="openModal('group-create')"
              class="btn btn--primary bg-brand-primary !min-h-[34px] !px-3 !text-[13px]"
              title="새 그룹 등록"
            >
              <span>등록</span>
            </button>
            <button
              @click="selectedGroup && handleDeleteGroup(selectedGroup)"
              :disabled="!selectedGroup"
              class="btn btn--danger-outline !min-h-[34px] !px-3 !text-[13px]"
              title="선택된 그룹 삭제"
            >
              <span>삭제</span>
            </button>
          </div>
        </div>

        <div class="space-y-2.5 flex-1 overflow-y-auto max-h-[680px] pr-0.5">
          <div
            v-if="groups.length === 0"
            class="h-52 flex flex-col items-center justify-center text-[#8B95A1] text-center p-4 bg-[#1C202B]/60 rounded-[16px]"
          >
            <p class="text-[13px] font-semibold">등록된 그룹이 없습니다.</p>
            <button @click="openModal('group-create')" class="mt-2.5 text-[13px] text-[#64A8FF] font-extrabold underline cursor-pointer">
              그룹 추가하기
            </button>
          </div>

          <div
            v-for="grp in groups"
            :key="grp.id"
            @click="handleSelectGroup(grp)"
            :class="[
              'p-4 rounded-[16px] cursor-pointer border relative group flex flex-col justify-between gap-3 ts-card-interactive',
              selectedGroupId === grp.id
                ? '!bg-[#3182F6] text-white !border-[#3182F6]'
                : 'bg-[#1C202B] text-[#F9FAFB] border-white/[0.06]'
            ]"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0">
                <span
                  :class="[
                    'px-2 py-0.5 rounded-[6px] text-[13px] font-bold font-mono tabular-nums shrink-0',
                    selectedGroupId === grp.id
                      ? 'bg-white/20 text-white'
                      : 'bg-[#151821] text-[#8B95A1]'
                  ]"
                >
                  {{ grp.categoryGroupCode }}
                </span>
                <span class="font-extrabold text-[15px] tracking-tight truncate">
                  {{ grp.categoryGroupName }}
                </span>
              </div>

              <div class="flex items-center gap-2 shrink-0" @click.stop>
                <button
                  @click="openModal('group-edit', grp)"
                  :class="[
                    'text-[13px] font-bold hover:underline cursor-pointer',
                    selectedGroupId === grp.id ? 'text-white/90 hover:text-white' : 'text-[#8B95A1] hover:text-[#F9FAFB]'
                  ]"
                  title="그룹 수정"
                >
                  수정
                </button>
                <button
                  @click="handleDeleteGroup(grp)"
                  :class="[
                    'text-[13px] font-bold hover:underline cursor-pointer',
                    selectedGroupId === grp.id ? 'text-white/85 hover:text-white' : 'text-[#FF6B76]'
                  ]"
                  title="그룹 삭제"
                >
                  삭제
                </button>
              </div>
            </div>

            <div
              :class="[
                'text-[13px] font-semibold flex items-center justify-between pt-2 border-t tabular-nums',
                selectedGroupId === grp.id
                  ? 'border-white/20 text-white/90'
                  : 'border-white/[0.06] text-[#8B95A1]'
              ]"
            >
              <span>{{ (grp.categories || []).length }}개 카테고리</span>
              <span>계좌 {{ getGroupAccountCount(grp) }}개</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== [컬럼 2] LEVEL 2: 카테고리 (Category) ==================== -->
      <section
        v-show="mobileStep === 'ALL' || mobileStep === 2"
        class="lg:col-span-4 ts-card p-5 flex flex-col lg:min-h-[560px]"
      >
        <div class="flex items-center justify-between mb-4 pb-3.5 border-b border-white/[0.07]">
          <div class="flex items-center gap-2">
            <h2 class="text-[16px] font-extrabold text-[#F9FAFB] tracking-tight">레벨 2 · 카테고리</h2>
            <span class="px-2 py-0.5 rounded-full text-[13px] font-extrabold font-mono bg-[#1C202B] text-[#D1D6DB] tabular-nums">
              {{ currentCategories.length }}
            </span>
          </div>

          <div class="flex items-center gap-1.5">
            <button
              @click="openModal('category-create')"
              :disabled="!selectedGroup"
              class="btn btn--primary !min-h-[34px] !px-3 !text-[13px]"
              title="새 카테고리 등록"
            >
              <span>등록</span>
            </button>
            <button
              @click="selectedCategory && handleDeleteCategory(selectedCategory)"
              :disabled="!selectedCategory"
              class="btn btn--danger-outline !min-h-[34px] !px-3 !text-[13px]"
              title="선택된 카테고리 삭제"
            >
              <span>삭제</span>
            </button>
          </div>
        </div>

        <div class="space-y-2.5 flex-1 overflow-y-auto max-h-[680px] pr-0.5">
          <div
            v-if="!selectedGroup"
            class="h-52 flex flex-col items-center justify-center text-[#8B95A1] text-center p-4 bg-[#1C202B]/60 rounded-[16px]"
          >
            <p class="text-[13px] font-semibold">왼쪽에서 그룹을 먼저 선택해주세요.</p>
          </div>

          <div
            v-else-if="currentCategories.length === 0"
            class="h-52 flex flex-col items-center justify-center text-[#8B95A1] text-center p-4 bg-[#1C202B]/60 rounded-[16px]"
          >
            <p class="text-[13px] font-semibold">[{{ selectedGroup.categoryGroupName }}] 그룹에 등록된 카테고리가 없습니다.</p>
            <button
              @click="openModal('category-create')"
              class="mt-2.5 text-[13px] text-[#64A8FF] font-extrabold underline cursor-pointer"
            >
              새 카테고리 등록하기
            </button>
          </div>

          <div
            v-for="cat in currentCategories"
            :key="cat.id"
            @click="handleSelectCategory(cat)"
            :class="[
              'p-4 rounded-[16px] cursor-pointer border relative group flex flex-col justify-between gap-3 ts-card-interactive',
              selectedCategoryId === cat.id
                ? '!bg-[#1E2C46] !border-[#3182F6]'
                : 'bg-[#1C202B] text-[#F9FAFB] border-white/[0.06]'
            ]"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0">
                <span
                  :class="[
                    'px-2 py-0.5 rounded-[6px] text-[13px] font-bold font-mono tabular-nums shrink-0',
                    selectedCategoryId === cat.id
                      ? 'bg-[#3182F6] text-white'
                      : 'bg-[#151821] text-[#8B95A1]'
                  ]"
                >
                  {{ cat.categoryCode }}
                </span>
                <span class="font-extrabold text-[15px] tracking-tight text-[#F9FAFB] truncate">
                  {{ cat.categoryName }}
                </span>
              </div>

              <div class="flex items-center gap-2 shrink-0" @click.stop>
                <button
                  @click="openModal('category-edit', cat)"
                  class="text-[13px] font-bold text-[#8B95A1] hover:text-[#F9FAFB] hover:underline cursor-pointer"
                  title="카테고리 수정"
                >
                  수정
                </button>
                <button
                  @click="handleDeleteCategory(cat)"
                  class="text-[13px] font-bold text-[#FF6B76] hover:underline cursor-pointer"
                  title="카테고리 삭제"
                >
                  삭제
                </button>
              </div>
            </div>

            <div class="text-[13px] font-semibold flex items-center justify-between pt-2 border-t border-white/[0.06] text-[#8B95A1] tabular-nums">
              <span>연결된 계좌 {{ (cat.accounts || []).length }}개</span>
              <span v-if="selectedCategoryId === cat.id" class="text-[#64A8FF] font-extrabold">선택됨</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== [컬럼 3] LEVEL 3: 계좌 (Account) ==================== -->
      <section
        v-show="mobileStep === 'ALL' || mobileStep === 3"
        class="lg:col-span-5 ts-card p-5 flex flex-col lg:min-h-[560px]"
      >
        <div class="flex items-center justify-between mb-4 pb-3.5 border-b border-white/[0.07]">
          <div class="flex items-center gap-2">
            <h2 class="text-[16px] font-extrabold text-[#F9FAFB] tracking-tight">레벨 3 · 계좌</h2>
            <span class="px-2 py-0.5 rounded-full text-[13px] font-extrabold font-mono bg-[#1C202B] text-[#D1D6DB] tabular-nums">
              {{ currentAccounts.length }}
            </span>
          </div>

          <div class="flex items-center gap-1.5">
            <button
              @click="openModal('account-create')"
              :disabled="!selectedCategory"
              class="btn btn--primary !min-h-[34px] !px-3 !text-[13px]"
              title="새 계좌 등록"
            >
              <span>등록</span>
            </button>
            <button
              @click="handleHeaderDeleteAccount"
              :disabled="!selectedCategory || currentAccounts.length === 0"
              class="btn btn--danger-outline !min-h-[34px] !px-3 !text-[13px]"
              title="선택된 계좌 삭제"
            >
              <span>삭제</span>
            </button>
          </div>
        </div>

        <div class="space-y-2.5 flex-1 overflow-y-auto max-h-[680px] pr-0.5">
          <div
            v-if="!selectedCategory"
            class="h-52 flex flex-col items-center justify-center text-[#8B95A1] text-center p-4 bg-[#1C202B]/60 rounded-[16px]"
          >
            <p class="text-[13px] font-semibold">카테고리를 먼저 선택해주세요.</p>
          </div>

          <div
            v-else-if="currentAccounts.length === 0"
            class="h-52 flex flex-col items-center justify-center text-[#8B95A1] text-center p-4 bg-[#1C202B]/60 rounded-[16px]"
          >
            <p class="text-[13px] font-semibold">[{{ selectedCategory.categoryName }}]에 등록된 계좌가 없습니다.</p>
            <button
              @click="openModal('account-create')"
              class="mt-2.5 text-[13px] text-[#64A8FF] font-extrabold underline cursor-pointer"
            >
              새 계좌 등록하기
            </button>
          </div>

          <div
            v-for="acc in currentAccounts"
            :key="acc.id"
            @click="selectAccount(acc)"
            :class="[
              'p-4 rounded-[16px] border space-y-2.5 cursor-pointer ts-card-interactive',
              selectedAccountId === acc.id
                ? '!bg-[#1E2C46] !border-[#3182F6]'
                : 'bg-[#1C202B] border-white/[0.06]'
            ]"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="font-extrabold text-[15px] text-[#F9FAFB] tracking-tight">{{ acc.accountName }}</h3>
                  <span
                    :class="[
                      'px-2 py-0.5 rounded-full text-[13px] font-bold',
                      acc.useYn !== false
                        ? 'bg-[#3182F6]/20 text-[#64A8FF]'
                        : 'bg-[#151821] text-[#8B95A1]'
                    ]"
                  >
                    {{ acc.useYn !== false ? '사용' : '해지' }}
                  </span>
                  <span
                    :class="[
                      'px-2 py-0.5 rounded-full text-[13px] font-bold border',
                      acc.isDashboardVisible
                        ? 'bg-[#3182F6]/15 text-[#64A8FF] border-[#3182F6]/30'
                        : 'bg-[#151821] text-[#6B7684] border-white/[0.06]'
                    ]"
                  >
                    {{ acc.isDashboardVisible ? '대시보드 노출' : '대시보드 숨김' }}
                  </span>
                  <span
                    :class="[
                      'px-2 py-0.5 rounded-full text-[13px] font-bold border',
                      acc.isSpendingVisible
                        ? 'bg-[#22C55E]/15 text-[#4ADE80] border-[#22C55E]/30'
                        : 'bg-[#151821] text-[#6B7684] border-white/[0.06]'
                    ]"
                  >
                    {{ acc.isSpendingVisible ? '소비계좌 노출' : '소비계좌 숨김' }}
                  </span>
                </div>
                <p class="text-[13px] text-[#8B95A1] mt-1 flex items-center gap-1.5 m-0">
                  <span class="font-bold text-[#D1D6DB]">{{ acc.institutionName }}</span>
                  <span v-if="acc.accountNumber && acc.accountNumber !== '-'" class="font-mono tabular-nums">
                    · {{ acc.accountNumber }}
                  </span>
                </p>
              </div>

              <div class="flex items-center gap-2 shrink-0" @click.stop>
                <button
                  @click="openModal('account-edit', acc)"
                  class="text-[13px] font-bold text-[#8B95A1] hover:text-[#F9FAFB] hover:underline cursor-pointer"
                >
                  수정
                </button>
                <button
                  @click="handleDeleteAccount(acc)"
                  class="text-[13px] font-bold text-[#FF6B76] hover:underline cursor-pointer"
                >
                  삭제
                </button>
              </div>
            </div>

            <div class="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2 text-[13px]">
              <span class="text-[#8B95A1] truncate">{{ acc.memo || '메모 없음' }}</span>
              <span class="font-mono font-extrabold text-[#64A8FF] tabular-nums shrink-0">
                잔액 {{ Number(acc.balance || 0).toLocaleString('ko-KR') }}원
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- ================================================================== -->
    <!-- [UI 영역 3] 그룹 / 카테고리 / 계좌 통합 등록·수정 모달 (바텀시트 지원) -->
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
    <!-- [UI 영역 4] 토스 다크 하단 플로팅 토스트 알림                        -->
    <!-- ================================================================== -->
    <transition name="toast">
      <div
        v-if="toastMessage"
        class="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-[#242938] border border-white/[0.12] text-[#F9FAFB] text-[14px] font-bold rounded-full shadow-2xl flex items-center gap-2 whitespace-nowrap"
      >
        <span class="w-2 h-2 rounded-full bg-[#3182F6]"></span>
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
// [SECTION 1] Composable State & Actions
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
// [SECTION 2] Local UI State
// ============================================================================
const mobileStep = ref('ALL')
const toastMessage = ref('')
let toastTimer = null

const selectedAccountId = ref(null)

const modalState = ref({
  isOpen: false,
  mode: 'group-create',
  data: {}
})

// ============================================================================
// [SECTION 3] Lifecycle & Event Handlers
// ============================================================================
const handleSelectGroup = (grp) => {
  selectGroup(grp)
  if (mobileStep.value === 1) mobileStep.value = 2
}

const handleSelectCategory = (cat) => {
  selectCategory(cat)
  if (mobileStep.value === 2) mobileStep.value = 3
}

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
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 12px);
}
</style>
