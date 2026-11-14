import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import AccountClassificationView from '../src/components/account-hierarchy/AccountClassificationView.vue'

describe('AccountClassificationView.vue Component UI Test (Header Delete Buttons & Real API)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url.includes('/api/v1/category-groups')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: [
              { id: 1, categoryGroupCode: 'OPS', categoryGroupName: '운영자금' },
              { id: 2, categoryGroupCode: 'INV', categoryGroupName: '투자자금' }
            ]
          })
        })
      }
      if (url.includes('/api/v1/categories')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: [
              { id: 1, categoryGroupId: 1, categoryCode: 'PAY', categoryName: '급여' }
            ]
          })
        })
      }
      if (url.includes('/api/v1/accounts')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: [
              {
                id: 1,
                categoryId: 1,
                accountName: '급여 지급 계좌',
                institutionName: '국민은행',
                accountNumber: '123456-01-234567',
                balance: 84200000,
                useYn: true,
                memo: '매월 25일 지급'
              }
            ]
          })
        })
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ success: true }) })
    }))
  })

  it('1. 화면 렌더링 및 각 레벨별 등록/삭제 버튼 확인', async () => {
    const wrapper = mount(AccountClassificationView)
    await flushPromises()

    expect(wrapper.text()).toContain('카테고리 관리')
    expect(wrapper.text()).toContain('운영자금')
    expect(wrapper.text()).toContain('급여')
    expect(wrapper.text()).toContain('급여 지급 계좌')

    // 1레벨 헤더의 '그룹 등록' & '그룹 삭제' 버튼
    const sec1 = wrapper.find('section:first-of-type')
    expect(sec1.text()).toContain('등록')
    expect(sec1.text()).toContain('삭제')

    // 2레벨 헤더의 '카테고리 등록' & '카테고리 삭제' 버튼
    const sec2 = wrapper.findAll('section')[1]
    expect(sec2.text()).toContain('등록')
    expect(sec2.text()).toContain('삭제')

    // 3레벨 헤더의 '계좌 등록' & '계좌 삭제' 버튼
    const sec3 = wrapper.findAll('section')[2]
    expect(sec3.text()).toContain('등록')
    expect(sec3.text()).toContain('삭제')
  })

  it('2. 모달 열기 및 동작 검증', async () => {
    const wrapper = mount(AccountClassificationView)
    await flushPromises()

    const addButtons = wrapper.findAll('button')
    const addGroupBtn = addButtons.find(b => b.text().includes('등록') && b.classes().includes('bg-brand-primary'))
    expect(addGroupBtn).toBeDefined()

    await addGroupBtn.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('새 그룹 등록')
  })

  it('3. 계좌 등록 모달에서 소비내역 소비계좌 출력 여부(isSpendingVisible) 설정 및 저장 검증', async () => {
    const wrapper = mount(AccountClassificationView)
    await flushPromises()

    const sec3 = wrapper.findAll('section')[2]
    const createAccountBtn = sec3.findAll('button').find(b => b.text().includes('등록'))
    await createAccountBtn.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('새 계좌 등록')
    expect(wrapper.text()).toContain('대시보드 잔액관리 노출')
    expect(wrapper.text()).toContain('소비내역 소비계좌 출력')

    const dialog = wrapper.find('[role="dialog"]')
    const textInputs = dialog.findAll('input[type="text"]')
    await textInputs[0].setValue('토스 생활비 통장')
    await textInputs[1].setValue('토스뱅크')

    const numberInput = dialog.find('input[type="number"]')
    await numberInput.setValue('300000')

    // 두 번째 토글 그룹('소비내역 소비계좌 출력')의 '노출' 버튼 클릭
    const exposeButtons = dialog.findAll('button').filter(b => b.text().trim() === '노출')
    expect(exposeButtons.length).toBe(2)
    await exposeButtons[1].trigger('click')

    await dialog.find('form').trigger('submit')
    await flushPromises()

    const postCall = fetch.mock.calls.find(
      ([url, opts]) => url === '/api/v1/accounts' && opts?.method === 'POST'
    )
    expect(postCall).toBeTruthy()
    const payload = JSON.parse(postCall[1].body)
    expect(payload.accountName).toBe('토스 생활비 통장')
    expect(payload.institutionName).toBe('토스뱅크')
    expect(payload.balance).toBe(300000)
    expect(payload.isDashboardVisible).toBe(false)
    expect(payload.isSpendingVisible).toBe(true)
  })
})
