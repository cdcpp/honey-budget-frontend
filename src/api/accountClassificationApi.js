/**
 * 계좌 분류 관리 (Level 1 그룹 -> Level 2 카테고리 -> Level 3 계좌) REST API 클라이언트
 * 백엔드 REST API 명세:
 * - CategoryGroupController: /api/v1/category-groups
 * - CategoryController: /api/v1/categories
 * - AccountController: /api/v1/accounts
 */

const request = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
    ...options,
  });

  let json = null;
  try {
    json = await res.json();
  } catch (err) {
    if (!res.ok) {
      throw new Error(`API 요청 실패 (HTTP ${res.status}): ${url}`);
    }
    return null;
  }

  if (!res.ok || (json && json.success === false)) {
    const errorMsg =
      json?.message || `API 요청 실패 (HTTP ${res.status}): ${url}`;
    throw new Error(errorMsg);
  }

  return json?.data !== undefined ? json.data : json;
};

export const accountClassificationApi = {
  // 1. 전체 계층 트리 조회: 그룹, 카테고리, 계좌 API 병렬 호출 후 계층 구조로 합성
  async fetchHierarchy() {
    const [groupsRes, categoriesRes, accountsRes] = await Promise.all([
      request("/api/v1/category-groups"),
      request("/api/v1/categories"),
      request("/api/v1/accounts"),
    ]);

    const groups = Array.isArray(groupsRes) ? groupsRes : [];
    const categories = Array.isArray(categoriesRes) ? categoriesRes : [];
    const accounts = Array.isArray(accountsRes) ? accountsRes : [];

    const categoryMap = new Map();
    const groupCategoriesMap = new Map();

    for (const c of categories) {
      const catObj = {
        id: c.id,
        categoryGroupId: c.categoryGroupId,
        categoryCode: c.categoryCode,
        categoryName: c.categoryName,
        accounts: [],
      };
      categoryMap.set(c.id, catObj);

      if (!groupCategoriesMap.has(c.categoryGroupId)) {
        groupCategoriesMap.set(c.categoryGroupId, []);
      }
      groupCategoriesMap.get(c.categoryGroupId).push(catObj);
    }

    for (const a of accounts) {
      const targetCat = categoryMap.get(a.categoryId);
      if (targetCat) {
        targetCat.accounts.push({
          id: a.id,
          categoryId: a.categoryId,
          accountName: a.accountName,
          institutionName: a.institutionName,
          accountNumber: a.accountNumber,
          memo: a.memo || "",
          balance: Number(a.balance) || 0,
          useYn: a.useYn !== false,
          status: a.useYn !== false ? "사용" : "해지",
        });
      }
    }

    return groups.map((g) => ({
      id: g.id,
      categoryGroupCode: g.categoryGroupCode,
      categoryGroupName: g.categoryGroupName,
      categories: groupCategoriesMap.get(g.id) || [],
    }));
  },

  // 2. 대분류 그룹 등록
  async createGroup({ categoryGroupCode, categoryGroupName }) {
    return request("/api/v1/category-groups", {
      method: "POST",
      body: JSON.stringify({ categoryGroupCode, categoryGroupName }),
    });
  },

  // 3. 대분류 그룹 명칭 수정
  async updateGroup(id, { categoryGroupName }) {
    return request(`/api/v1/category-groups/${id}`, {
      method: "PUT",
      body: JSON.stringify({ categoryGroupName }),
    });
  },

  // 4. 대분류 그룹 삭제
  async deleteGroup(id) {
    return request(`/api/v1/category-groups/${id}`, {
      method: "DELETE",
    });
  },

  // 5. 중분류 카테고리 등록
  async createCategory({ categoryGroupId, categoryCode, categoryName }) {
    return request("/api/v1/categories", {
      method: "POST",
      body: JSON.stringify({ categoryGroupId, categoryCode, categoryName }),
    });
  },

  // 6. 중분류 카테고리 수정
  async updateCategory(id, { categoryGroupId, categoryName }) {
    return request(`/api/v1/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify({ categoryGroupId, categoryName }),
    });
  },

  // 7. 중분류 카테고리 삭제
  async deleteCategory(id) {
    return request(`/api/v1/categories/${id}`, {
      method: "DELETE",
    });
  },

  // 8. 계좌 등록
  async createAccount({
    categoryId,
    accountName,
    institutionName,
    accountNumber,
    balance,
    memo,
  }) {
    return request("/api/v1/accounts", {
      method: "POST",
      body: JSON.stringify({
        categoryId,
        accountName,
        institutionName,
        accountNumber,
        balance,
        memo,
      }),
    });
  },

  // 9. 계좌 정보 수정
  async updateAccount(id, { accountName, categoryId, memo }) {
    return request(`/api/v1/accounts/${id}`, {
      method: "PUT",
      body: JSON.stringify({ accountName, categoryId, memo }),
    });
  },

  // 10. 계좌 잔액 입금
  async depositAccount(id, amount) {
    return request(`/api/v1/accounts/${id}/deposit`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  },

  // 11. 계좌 잔액 출금
  async withdrawAccount(id, amount) {
    return request(`/api/v1/accounts/${id}/withdraw`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  },

  // 12. 계좌 비활성화 / 삭제
  async deleteAccount(id) {
    return request(`/api/v1/accounts/${id}`, {
      method: "DELETE",
    });
  },
};

export const fetchHierarchy = () => accountClassificationApi.fetchHierarchy();
export const createCategoryGroupApi = (d) =>
  accountClassificationApi.createGroup(d);
export const updateCategoryGroupApi = (id, d) =>
  accountClassificationApi.updateGroup(id, d);
export const deleteCategoryGroupApi = (id) =>
  accountClassificationApi.deleteGroup(id);
export const createCategoryApi = (d) =>
  accountClassificationApi.createCategory(d);
export const updateCategoryApi = (id, d) =>
  accountClassificationApi.updateCategory(id, d);
export const deleteCategoryApi = (id) =>
  accountClassificationApi.deleteCategory(id);
export const createAccountApi = (d) =>
  accountClassificationApi.createAccount(d);
export const updateAccountApi = (id, d) =>
  accountClassificationApi.updateAccount(id, d);
export const deleteAccountApi = (id) =>
  accountClassificationApi.deleteAccount(id);
export const depositAccountApi = (id, amt) =>
  accountClassificationApi.depositAccount(id, amt);
export const withdrawAccountApi = (id, amt) =>
  accountClassificationApi.withdrawAccount(id, amt);
