/**
 * ============================================================================
 * @file        useAccountClassification.js
 * @layer       Service / State Layer (Spring의 @Service + 전역 캐시 스토어 역할)
 * @role        3단계 계좌 분류(그룹 -> 카테고리 -> 계좌) 트리 상태 관리 및 CRUD 비즈니스 로직
 * @flow        [AccountClassificationView / BudgetPlannerView]
 *                    <---> [useAccountClassification]
 *                    <---> [accountClassificationApi]
 *                    <---> [Spring Backend]
 * ============================================================================
 */
import { ref, computed } from "vue";
import {
  fetchHierarchy,
  createCategoryGroupApi,
  updateCategoryGroupApi,
  deleteCategoryGroupApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
  createAccountApi,
  updateAccountApi,
  deleteAccountApi,
  depositAccountApi,
  withdrawAccountApi,
} from "../api/accountClassificationApi";

// ============================================================================
// [SECTION 1] Global Singleton State (전역 공유 반응형 상태)
// - 함수 바깥에 선언되어 있어, '카테고리 관리' 탭에서 계좌를 추가/삭제하면
//   '월간 예산 플래너'와 '월별 소비내역' 탭에도 새로고침 없이 즉시 반영됩니다.
// ============================================================================
const groups = ref([]);               // 전체 3단계 트리 배열 (Group -> Categories -> Accounts)
const selectedGroupId = ref(null);    // 현재 선택된 Level 1 그룹 ID
const selectedCategoryId = ref(null); // 현재 선택된 Level 2 카테고리 ID
const loading = ref(false);           // 서버 통신 중 여부 (로딩 스피너 표시용)
const error = ref(null);              // 서버 에러 메시지 문자열

export function useAccountClassification() {
  // ==========================================================================
  // [SECTION 2] Computed Properties (파생 계산 속성 - Java Getter 역할)
  // - 선택된 ID(selectedGroupId, selectedCategoryId)가 바뀌면 자동으로 하위 목록을 찾아 반환합니다.
  // ==========================================================================

  /** 현재 선택된 Level 1 그룹 객체 */
  const selectedGroup = computed(() => {
    return groups.value.find((g) => g.id === selectedGroupId.value) || null;
  });

  /** 현재 선택된 그룹에 속한 Level 2 카테고리 배열 */
  const currentCategories = computed(() => {
    if (
      !selectedGroup.value ||
      !Array.isArray(selectedGroup.value.categories)
    ) {
      return [];
    }
    return selectedGroup.value.categories;
  });

  /** 현재 선택된 Level 2 카테고리 객체 */
  const selectedCategory = computed(() => {
    return (
      currentCategories.value.find((c) => c.id === selectedCategoryId.value) ||
      null
    );
  });

  /** 현재 선택된 카테고리에 속한 Level 3 계좌 배열 */
  const currentAccounts = computed(() => {
    if (
      !selectedCategory.value ||
      !Array.isArray(selectedCategory.value.accounts)
    ) {
      return [];
    }
    return selectedCategory.value.accounts;
  });

  /** 현재 선택된 카테고리 내 모든 계좌의 잔액 합계 */
  const currentCategoryTotal = computed(() => {
    if (!currentAccounts.value || currentAccounts.value.length === 0) return 0;
    return currentAccounts.value.reduce(
      (sum, acc) => sum + (Number(acc.balance) || 0),
      0,
    );
  });

  // ==========================================================================
  // [SECTION 3] Helper Calculators & Selection Actions (집계 헬퍼 및 선택 변경)
  // ==========================================================================

  /** 특정 카테고리 내 계좌 잔액 총합 계산 */
  const getCategoryTotal = (category) => {
    if (!category || !Array.isArray(category.accounts)) return 0;
    return category.accounts.reduce(
      (sum, acc) => sum + (Number(acc.balance) || 0),
      0,
    );
  };

  /** 특정 그룹 산하의 전체 계좌 개수 합산 */
  const getGroupAccountCount = (group) => {
    if (!group || !Array.isArray(group.categories)) return 0;
    return group.categories.reduce(
      (cnt, cat) => cnt + ((cat.accounts && cat.accounts.length) || 0),
      0,
    );
  };

  /** 특정 그룹 산하의 모든 계좌 잔액 총합 계산 */
  const getGroupTotal = (group) => {
    if (!group || !Array.isArray(group.categories)) return 0;
    return group.categories.reduce(
      (sum, cat) => sum + getCategoryTotal(cat),
      0,
    );
  };

  /** Level 1 그룹 카드 클릭 시 선택 상태 변경 (하위 첫 번째 카테고리 자동 선택) */
  const selectGroup = (group) => {
    if (!group) {
      selectedGroupId.value = null;
      selectedCategoryId.value = null;
      return;
    }
    selectedGroupId.value = group.id;
    if (group.categories && group.categories.length > 0) {
      selectedCategoryId.value = group.categories[0].id;
    } else {
      selectedCategoryId.value = null;
    }
  };

  /** Level 2 카테고리 카드 클릭 시 선택 상태 변경 */
  const selectCategory = (category) => {
    if (!category) {
      selectedCategoryId.value = null;
      return;
    }
    selectedCategoryId.value = category.id;
  };

  /** 브레드크럼 '전체' 클릭 시 선택 초기화 */
  const resetToAll = () => {
    selectedGroupId.value = null;
    selectedCategoryId.value = null;
  };

  // ==========================================================================
  // [SECTION 4] API Business Actions (서버 조회 및 그룹/카테고리/계좌 CRUD)
  // ==========================================================================

  /**
   * [전체 계층 트리 서버 조회]
   * @description 백엔드에서 그룹/카테고리/계좌를 조회하여 groups 상태를 갱신하고,
   *              선택된 그룹/카테고리가 유효하지 않으면 첫 번째 항목을 자동 선택합니다.
   */
  const loadHierarchy = async () => {
    loading.value = true;
    error.value = null;
    try {
      const data = await fetchHierarchy();
      groups.value = data;
      if (groups.value.length > 0) {
        if (
          !selectedGroupId.value ||
          !groups.value.some((g) => g.id === selectedGroupId.value)
        ) {
          selectedGroupId.value = groups.value[0].id;
        }
        const currentGrp = groups.value.find(
          (g) => g.id === selectedGroupId.value,
        );
        if (
          currentGrp &&
          currentGrp.categories &&
          currentGrp.categories.length > 0
        ) {
          if (
            !selectedCategoryId.value ||
            !currentGrp.categories.some(
              (c) => c.id === selectedCategoryId.value,
            )
          ) {
            selectedCategoryId.value = currentGrp.categories[0].id;
          }
        } else {
          selectedCategoryId.value = null;
        }
      } else {
        selectedGroupId.value = null;
        selectedCategoryId.value = null;
      }
    } catch (err) {
      error.value = err.message || "데이터를 불러오는 중 오류가 발생했습니다.";
    } finally {
      loading.value = false;
    }
  };

  /** [Level 1 그룹 신규 등록 후 트리 재조회] */
  const addGroup = async (groupData) => {
    loading.value = true;
    error.value = null;
    try {
      const created = await createCategoryGroupApi(groupData);
      await loadHierarchy();
      selectedGroupId.value = created.id;
      const newGrp = groups.value.find((g) => g.id === created.id);
      if (newGrp && newGrp.categories && newGrp.categories.length > 0) {
        selectedCategoryId.value = newGrp.categories[0].id;
      } else {
        selectedCategoryId.value = null;
      }
      return created;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /** [Level 1 그룹 수정 후 트리 재조회] */
  const updateGroup = async (id, groupData) => {
    loading.value = true;
    error.value = null;
    try {
      const updated = await updateCategoryGroupApi(id, groupData);
      await loadHierarchy();
      return updated;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /** [Level 1 그룹 삭제 후 트리 재조회] */
  const removeGroup = async (id) => {
    loading.value = true;
    error.value = null;
    try {
      await deleteCategoryGroupApi(id);
      await loadHierarchy();
      return true;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /** [Level 2 카테고리 신규 등록 후 트리 재조회] */
  const addCategory = async (categoryData) => {
    loading.value = true;
    error.value = null;
    try {
      const targetGroupId =
        categoryData.categoryGroupId || selectedGroupId.value;
      const created = await createCategoryApi({
        ...categoryData,
        categoryGroupId: targetGroupId,
      });
      await loadHierarchy();
      selectedGroupId.value = targetGroupId;
      selectedCategoryId.value = created.id;
      return created;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /** [Level 2 카테고리 수정 후 트리 재조회] */
  const updateCategory = async (id, categoryData) => {
    loading.value = true;
    error.value = null;
    try {
      const updated = await updateCategoryApi(id, categoryData);
      await loadHierarchy();
      return updated;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /** [Level 2 카테고리 삭제 후 트리 재조회] */
  const removeCategory = async (id) => {
    loading.value = true;
    error.value = null;
    try {
      await deleteCategoryApi(id);
      await loadHierarchy();
      return true;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /** [Level 3 계좌 신규 등록 후 트리 재조회] */
  const addAccount = async (accountData) => {
    loading.value = true;
    error.value = null;
    try {
      const targetCategoryId =
        accountData.categoryId || selectedCategoryId.value;
      const created = await createAccountApi({
        ...accountData,
        categoryId: targetCategoryId,
      });
      await loadHierarchy();
      return created;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /** [Level 3 계좌 수정 후 트리 재조회] */
  const updateAccount = async (id, accountData) => {
    loading.value = true;
    error.value = null;
    try {
      const updated = await updateAccountApi(id, accountData);
      await loadHierarchy();
      return updated;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /** [Level 3 계좌 삭제(해지) 후 트리 재조회] */
  const removeAccount = async (id) => {
    loading.value = true;
    error.value = null;
    try {
      await deleteAccountApi(id);
      await loadHierarchy();
      return true;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /** [Level 3 계좌 입금 후 트리 재조회] */
  const depositAccount = async (id, amount) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await depositAccountApi(id, amount);
      await loadHierarchy();
      return res;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /** [Level 3 계좌 출금 후 트리 재조회] */
  const withdrawAccount = async (id, amount) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await withdrawAccountApi(id, amount);
      await loadHierarchy();
      return res;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const resetDefaults = async () => {
    await loadHierarchy();
  };

  return {
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
    getGroupTotal,
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
    resetDefaults,
  };
}
