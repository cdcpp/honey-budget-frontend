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

// Shared state for classification hierarchy across views if needed
const groups = ref([]);
const selectedGroupId = ref(null);
const selectedCategoryId = ref(null);
const loading = ref(false);
const error = ref(null);

export function useAccountClassification() {
  const selectedGroup = computed(() => {
    return groups.value.find((g) => g.id === selectedGroupId.value) || null;
  });

  const currentCategories = computed(() => {
    if (
      !selectedGroup.value ||
      !Array.isArray(selectedGroup.value.categories)
    ) {
      return [];
    }
    return selectedGroup.value.categories;
  });

  const selectedCategory = computed(() => {
    return (
      currentCategories.value.find((c) => c.id === selectedCategoryId.value) ||
      null
    );
  });

  const currentAccounts = computed(() => {
    if (
      !selectedCategory.value ||
      !Array.isArray(selectedCategory.value.accounts)
    ) {
      return [];
    }
    return selectedCategory.value.accounts;
  });

  const currentCategoryTotal = computed(() => {
    if (!currentAccounts.value || currentAccounts.value.length === 0) return 0;
    return currentAccounts.value.reduce(
      (sum, acc) => sum + (Number(acc.balance) || 0),
      0,
    );
  });

  const getCategoryTotal = (category) => {
    if (!category || !Array.isArray(category.accounts)) return 0;
    return category.accounts.reduce(
      (sum, acc) => sum + (Number(acc.balance) || 0),
      0,
    );
  };

  const getGroupAccountCount = (group) => {
    if (!group || !Array.isArray(group.categories)) return 0;
    return group.categories.reduce(
      (cnt, cat) => cnt + ((cat.accounts && cat.accounts.length) || 0),
      0,
    );
  };

  const getGroupTotal = (group) => {
    if (!group || !Array.isArray(group.categories)) return 0;
    return group.categories.reduce(
      (sum, cat) => sum + getCategoryTotal(cat),
      0,
    );
  };

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

  const selectCategory = (category) => {
    if (!category) {
      selectedCategoryId.value = null;
      return;
    }
    selectedCategoryId.value = category.id;
  };

  const resetToAll = () => {
    selectedGroupId.value = null;
    selectedCategoryId.value = null;
  };

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

  // --- Group Actions ---
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

  // --- Category Actions ---
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

  // --- Account Actions ---
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
    resetHierarchyData();
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
