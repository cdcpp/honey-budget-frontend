/**
 * ============================================================================
 * @file        accountClassificationApi.js
 * @layer       API Client Layer (Spring의 FeignClient / RestTemplate 역할)
 * @role        3단계 계좌 분류 체계(Level 1 그룹 -> Level 2 카테고리 -> Level 3 계좌) REST API 클라이언트
 * @spring      백엔드 연동 정보:
 *              - CategoryGroupController : /api/v1/category-groups
 *              - CategoryController      : /api/v1/categories
 *              - AccountController       : /api/v1/accounts
 * ============================================================================
 */

/**
 * [공통 HTTP Fetch 래퍼 함수]
 * @description 백엔드의 공통 응답 포맷(ApiResponse { success, data, message })을 파싱하고
 *              오류 발생 시 표준 Error 객체를 발생시킵니다.
 * @param       {string} url - 요청 엔드포인트 경로
 * @param       {RequestInit} options - fetch 옵션 (method, headers, body)
 * @returns     {Promise<any>} 응답 JSON의 data 본문
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
  // ==========================================================================
  // [1] 전체 3단계 계층 트리(Hierarchy) 통합 조회
  // ==========================================================================

  /**
   * [그룹 -> 카테고리 -> 계좌 3단계 트리 조립 조회]
   * @description 백엔드의 3개 목록 API를 병렬(Promise.all)로 호출한 뒤,
   *              외래키(categoryGroupId, categoryId)를 기준으로 중첩 트리 구조로 조립합니다.
   * @http        GET /api/v1/category-groups, /api/v1/categories, /api/v1/accounts
   * @returns     {Promise<Array<object>>} 조립된 3단계 그룹 배열
   */
  async fetchHierarchy() {
    const [groupsRes, categoriesRes, accountsRes] = await Promise.all([
      request("/api/v1/category-groups"),
      request("/api/v1/categories"),
      request("/api/v1/accounts"),
    ]);

    const groups = Array.isArray(groupsRes) ? groupsRes : [];
    const categories = Array.isArray(categoriesRes) ? categoriesRes : [];
    const accounts = Array.isArray(accountsRes) ? accountsRes : [];

    // 1단계: 카테고리 ID 맵 및 그룹별 카테고리 리스트 맵 생성
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

    // 2단계: 각 계좌를 소속 카테고리(categoryId)의 accounts 배열에 삽입
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

    // 3단계: 각 대분류 그룹에 조립된 카테고리 목록을 연결하여 최종 반환
    return groups.map((g) => ({
      id: g.id,
      categoryGroupCode: g.categoryGroupCode,
      categoryGroupName: g.categoryGroupName,
      categories: groupCategoriesMap.get(g.id) || [],
    }));
  },

  // ==========================================================================
  // [2] Level 1: 대분류 그룹(CategoryGroup) CRUD
  // ==========================================================================

  /**
   * [대분류 그룹 등록]
   * @http POST /api/v1/category-groups
   */
  async createGroup({ categoryGroupCode, categoryGroupName }) {
    return request("/api/v1/category-groups", {
      method: "POST",
      body: JSON.stringify({ categoryGroupCode, categoryGroupName }),
    });
  },

  /**
   * [대분류 그룹 명칭 수정]
   * @http PUT /api/v1/category-groups/{id}
   */
  async updateGroup(id, { categoryGroupName }) {
    return request(`/api/v1/category-groups/${id}`, {
      method: "PUT",
      body: JSON.stringify({ categoryGroupName }),
    });
  },

  /**
   * [대분류 그룹 삭제]
   * @http DELETE /api/v1/category-groups/{id}
   */
  async deleteGroup(id) {
    return request(`/api/v1/category-groups/${id}`, {
      method: "DELETE",
    });
  },

  // ==========================================================================
  // [3] Level 2: 중분류 카테고리(Category) CRUD
  // ==========================================================================

  /**
   * [중분류 카테고리 등록]
   * @http POST /api/v1/categories
   */
  async createCategory({ categoryGroupId, categoryCode, categoryName }) {
    return request("/api/v1/categories", {
      method: "POST",
      body: JSON.stringify({ categoryGroupId, categoryCode, categoryName }),
    });
  },

  /**
   * [중분류 카테고리 수정]
   * @http PUT /api/v1/categories/{id}
   */
  async updateCategory(id, { categoryGroupId, categoryName }) {
    return request(`/api/v1/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify({ categoryGroupId, categoryName }),
    });
  },

  /**
   * [중분류 카테고리 삭제]
   * @http DELETE /api/v1/categories/{id}
   */
  async deleteCategory(id) {
    return request(`/api/v1/categories/${id}`, {
      method: "DELETE",
    });
  },

  // ==========================================================================
  // [4] Level 3: 소분류 계좌(Account) CRUD 및 입출금
  // ==========================================================================

  /**
   * [신규 계좌 등록]
   * @http POST /api/v1/accounts
   */
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

  /**
   * [계좌 정보 수정]
   * @http PUT /api/v1/accounts/{id}
   */
  async updateAccount(id, { accountName, categoryId, memo }) {
    return request(`/api/v1/accounts/${id}`, {
      method: "PUT",
      body: JSON.stringify({ accountName, categoryId, memo }),
    });
  },

  /**
   * [계좌 입금 처리]
   * @http POST /api/v1/accounts/{id}/deposit
   */
  async depositAccount(id, amount) {
    return request(`/api/v1/accounts/${id}/deposit`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  },

  /**
   * [계좌 출금 처리]
   * @http POST /api/v1/accounts/{id}/withdraw
   */
  async withdrawAccount(id, amount) {
    return request(`/api/v1/accounts/${id}/withdraw`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  },

  /**
   * [계좌 삭제 / 해지 처리]
   * @http DELETE /api/v1/accounts/{id}
   */
  async deleteAccount(id) {
    return request(`/api/v1/accounts/${id}`, {
      method: "DELETE",
    });
  },
};

// 개별 함수 Named Export (하위 호환 및 단위 테스트 모킹 지원)
export const fetchHierarchy = () => accountClassificationApi.fetchHierarchy();
export const createCategoryGroupApi = (d) =>
  accountClassificationApi.createGroup(d);
export const updateCategoryGroupApi = (id, d) =>
  accountClassificationApi.updateGroup(id, d);
export const deleteCategoryGroupApi = (id, d) =>
  accountClassificationApi.deleteGroup(id, d);
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
