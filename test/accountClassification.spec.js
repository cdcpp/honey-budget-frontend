import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAccountClassification } from '../src/composables/useAccountClassification'

describe('계좌 분류 관리 Backend REST API 연동 테스트', () => {
  let mockGroups = []
  let mockCategories = []
  let mockAccounts = []

  beforeEach(() => {
    mockGroups = [
      { id: 1, categoryGroupCode: 'OPS', categoryGroupName: '운영자금' },
      { id: 2, categoryGroupCode: 'INV', categoryGroupName: '투자자금' }
    ]
    mockCategories = [
      { id: 1, categoryGroupId: 1, categoryCode: 'PAY', categoryName: '급여' },
      { id: 2, categoryGroupId: 1, categoryCode: 'EXP', categoryName: '경비' }
    ]
    mockAccounts = [
      {
        id: 1,
        categoryId: 1,
        accountName: '급여 지급 계좌',
        institutionName: '국민은행',
        accountNumber: '123456-01-234567',
        balance: 84200000,
        useYn: true,
        memo: '매월 25일 지급'
      },
      {
        id: 2,
        categoryId: 1,
        accountName: '상여 적립 계좌',
        institutionName: '신한은행',
        accountNumber: '110-234-567890',
        balance: 31500000,
        useYn: true,
        memo: '인센티브'
      }
    ]

    vi.stubGlobal('fetch', vi.fn((url, options = {}) => {
      const method = options.method || 'GET'

      // 1. Category Groups
      if (url.includes('/api/v1/category-groups')) {
        if (method === 'GET') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, data: mockGroups })
          })
        }
        if (method === 'POST') {
          const body = JSON.parse(options.body)
          const newG = { id: 99, ...body }
          mockGroups.push(newG)
          return Promise.resolve({
            ok: true,
            status: 201,
            json: () => Promise.resolve({ success: true, data: newG })
          })
        }
        if (method === 'PUT') {
          const body = JSON.parse(options.body)
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, data: { id: 1, categoryGroupName: body.categoryGroupName } })
          })
        }
        if (method === 'DELETE') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, message: 'Deleted' })
          })
        }
      }

      // 2. Categories
      if (url.includes('/api/v1/categories')) {
        if (method === 'GET') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, data: mockCategories })
          })
        }
        if (method === 'POST') {
          const body = JSON.parse(options.body)
          const newC = { id: 88, ...body }
          mockCategories.push(newC)
          return Promise.resolve({
            ok: true,
            status: 201,
            json: () => Promise.resolve({ success: true, data: newC })
          })
        }
        if (method === 'PUT') {
          const body = JSON.parse(options.body)
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, data: { id: 1, ...body } })
          })
        }
        if (method === 'DELETE') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, message: 'Deleted' })
          })
        }
      }

      // 3. Accounts
      if (url.includes('/api/v1/accounts')) {
        if (url.includes('/deposit')) {
          const body = JSON.parse(options.body)
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, data: { id: 1, balance: 84200000 + body.amount } })
          })
        }
        if (url.includes('/withdraw')) {
          const body = JSON.parse(options.body)
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, data: { id: 1, balance: 84200000 - body.amount } })
          })
        }
        if (method === 'GET') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, data: mockAccounts })
          })
        }
        if (method === 'POST') {
          const body = JSON.parse(options.body)
          const newA = { id: 77, ...body, useYn: true }
          mockAccounts.push(newA)
          return Promise.resolve({
            ok: true,
            status: 201,
            json: () => Promise.resolve({ success: true, data: newA })
          })
        }
        if (method === 'PUT') {
          const body = JSON.parse(options.body)
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, data: { id: 1, ...body } })
          })
        }
        if (method === 'DELETE') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, message: 'Deleted' })
          })
        }
      }

      return Promise.reject(new Error('Unknown url: ' + url))
    }))
  })

  it('1. GET /api/v1/category-groups, categories, accounts 3개 API 병렬 호출 및 계층 트리 합성 검증', async () => {
    const {
      loadHierarchy,
      groups,
      selectedGroup,
      selectedCategory,
      currentCategories,
      currentAccounts,
      currentCategoryTotal
    } = useAccountClassification()

    await loadHierarchy()

    expect(fetch).toHaveBeenCalledWith('/api/v1/category-groups', expect.any(Object))
    expect(fetch).toHaveBeenCalledWith('/api/v1/categories', expect.any(Object))
    expect(fetch).toHaveBeenCalledWith('/api/v1/accounts', expect.any(Object))

    expect(groups.value.length).toBe(2)
    expect(groups.value[0].categoryGroupCode).toBe('OPS')
    expect(groups.value[0].categories.length).toBe(2)

    expect(selectedGroup.value.id).toBe(1)
    expect(selectedCategory.value.id).toBe(1)
    expect(currentAccounts.value.length).toBe(2)
    expect(currentCategoryTotal.value).toBe(84200000 + 31500000)
  })

  it('2. POST /api/v1/category-groups 및 PUT, DELETE 호출 검증', async () => {
    const { addGroup, updateGroup, removeGroup } = useAccountClassification()

    await addGroup({
      categoryGroupCode: 'NEW',
      categoryGroupName: '신규자금'
    })
    expect(fetch).toHaveBeenCalledWith('/api/v1/category-groups', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ categoryGroupCode: 'NEW', categoryGroupName: '신규자금' })
    }))

    await updateGroup(1, { categoryGroupName: '운영자금수정' })
    expect(fetch).toHaveBeenCalledWith('/api/v1/category-groups/1', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ categoryGroupName: '운영자금수정' })
    }))

    await removeGroup(1)
    expect(fetch).toHaveBeenCalledWith('/api/v1/category-groups/1', expect.objectContaining({
      method: 'DELETE'
    }))
  })

  it('3. POST /api/v1/categories 및 PUT, DELETE 호출 검증', async () => {
    const { addCategory, updateCategory, removeCategory } = useAccountClassification()

    await addCategory({
      categoryGroupId: 1,
      categoryCode: 'FOOD',
      categoryName: '식비'
    })
    expect(fetch).toHaveBeenCalledWith('/api/v1/categories', expect.objectContaining({
      method: 'POST'
    }))

    await updateCategory(1, { categoryGroupId: 1, categoryName: '급여수정' })
    expect(fetch).toHaveBeenCalledWith('/api/v1/categories/1', expect.objectContaining({
      method: 'PUT'
    }))

    await removeCategory(1)
    expect(fetch).toHaveBeenCalledWith('/api/v1/categories/1', expect.objectContaining({
      method: 'DELETE'
    }))
  })

  it('4. POST /api/v1/accounts 및 입출금 엔드포인트 호출 검증', async () => {
    const { addAccount, updateAccount, removeAccount, depositAccount, withdrawAccount } = useAccountClassification()

    await addAccount({
      categoryId: 1,
      accountName: '신규통장',
      institutionName: '하나은행',
      accountNumber: '111-222',
      balance: 10000,
      memo: '테스트'
    })
    expect(fetch).toHaveBeenCalledWith('/api/v1/accounts', expect.objectContaining({
      method: 'POST'
    }))

    await updateAccount(1, { accountName: '이름수정', categoryId: 1, memo: '메모수정' })
    expect(fetch).toHaveBeenCalledWith('/api/v1/accounts/1', expect.objectContaining({
      method: 'PUT'
    }))

    await depositAccount(1, 50000)
    expect(fetch).toHaveBeenCalledWith('/api/v1/accounts/1/deposit', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ amount: 50000 })
    }))

    await withdrawAccount(1, 20000)
    expect(fetch).toHaveBeenCalledWith('/api/v1/accounts/1/withdraw', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ amount: 20000 })
    }))

    await removeAccount(1)
    expect(fetch).toHaveBeenCalledWith('/api/v1/accounts/1', expect.objectContaining({
      method: 'DELETE'
    }))
  })
})
