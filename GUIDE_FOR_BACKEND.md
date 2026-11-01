# 🍯 백엔드 개발자를 위한 허니버짓(Honey Budget) 프론트엔드 완벽 가이드

> **작성자**: 10년차 프론트엔드 테크리드  
> **대상**: 프론트엔드가 낯설지만 직접 화면과 API를 수정해야 하는 백엔드 개발자

---

## 1. 한눈에 보는 아키텍처 매핑 (Spring vs Vue 3)

프론트엔드 폴더 구조는 백엔드의 **Spring Boot 레이어드 아키텍처(Layered Architecture)**와 정확히 1:1로 대응됩니다.

| Spring Boot (백엔드) | Honey Budget Frontend | 역할 및 설명 |
| :--- | :--- | :--- |
| **`@RestController` / Client** | `src/api/*Api.js` | 백엔드 REST API를 `fetch`로 호출하는 HTTP 클라이언트 계층 |
| **`@Service` (비즈니스 로직)** | `src/composables/use*.js` | 상태(State), 계산식(Computed), 데이터 가공 및 CRUD 비즈니스 로직 |
| **`Entity` / `DTO`** | `src/constants/` & API 파라미터 | 데이터 스키마, 기본값 및 전송 객체 형태 |
| **`Util` (포맷터, 헬퍼)** | `src/utils/*.js` | 숫자/원화 포맷팅, 일자 변환, 파일 입출력 등 순수 함수 |
| **`View` (Thymeleaf/JSP)** | `src/components/**/*View.vue` | 사용자가 보는 HTML/CSS 템플릿과 이벤트 바인딩 |
| **`DispatcherServlet`** | `src/App.vue` | 상단 탭에 따라 3대 도메인 뷰를 분기 렌더링하는 라우팅 허브 |

---

## 2. 프로젝트 디렉터리 구조

```text
honey-budget-frontend/
├── src/
│   ├── api/                        # [API Client Layer] Spring RestController 호출부
│   │   ├── accountClassificationApi.js   # 카테고리 그룹 / 카테고리 / 계좌 API
│   │   ├── accountTransactionApi.js      # 소비내역 (생활비/고정비/차량비) API
│   │   └── accountYearMonthApi.js        # 연간 1~12월 계좌별 금액 API
│   │
│   ├── composables/                # [Service Layer] Vue 3 리액티브 상태 및 비즈니스 로직
│   │   ├── useAccountClassification.js   # 카테고리 계층 트리 상태 및 CRUD
│   │   ├── useAccountTransactions.js     # 월별 소비내역, 엑셀 급여주기 계산, 필터링
│   │   └── useBudget.js                  # 1~12월 명세표 금액 집계, 자동합산, dirty 관리
│   │
│   ├── components/                 # [Presentation Layer] 화면 컴포넌트
│   │   ├── budget/                       # [기능 1] 월간 예산 플래너 도메인
│   │   │   └── BudgetPlannerView.vue     # 예산 플래너 메인 최상위 뷰
│   │   ├── transactions/                 # [기능 2] 월별 소비내역 도메인
│   │   │   ├── MonthlyTransactionsView.vue # 소비내역 메인 뷰 (요약카드, 인라인입력, 테이블)
│   │   │   └── TransactionModal.vue      # 소비내역 등록/수정 팝업 모달
│   │   ├── account-hierarchy/            # [기능 3] 카테고리 관리 도메인
│   │   │   ├── AccountClassificationView.vue # 3단계 트리 뷰
│   │   │   └── ClassificationModal.vue   # 계층 항목 등록/수정 모달
│   │   ├── AppHeader.vue                 # 헤더 및 백업/초기화 버튼
│   │   ├── BudgetTable.vue               # 연간 1~12월 입력 그리드 테이블
│   │   ├── SummaryCards.vue              # 수입/저축/지출 요약 KPI 카드
│   │   ├── BalanceSection.vue            # 비상금 및 계좌 잔액 현황
│   │   ├── GuideSection.vue              # 사용 가이드 박스
│   │   └── NumberInput.vue               # 3자리 콤마 자동 서식 숫자 입력 필드
│   │
│   ├── constants/                  # [Constants] 전역 설정 및 비즈니스 상수
│   │   └── budgetDefaults.js             # 스토리지 키, 기본 계좌 프리셋, 초기값
│   │
│   ├── utils/                      # [Utilities] 순수 유틸리티 함수
│   │   ├── formatters.js                 # formatCurrency, toMonthArray 등
│   │   └── fileExport.js                 # JSON 백업/복원 및 CSV 다운로드
│   │
│   ├── App.vue                     # 최상위 탭 네비게이션 및 뷰 스위처
│   └── main.js                     # 프론트엔드 엔트리포인트
│
└── test/                           # [Test Layer] Vitest 단위/컴포넌트 테스트
    ├── accountClassification.spec.js
    ├── AccountClassificationView.spec.js
    ├── accountTransactions.spec.js
    └── useBudget.spec.js
```

---

## 3. 도메인별 매핑 테이블 (어떤 파일들이 한 세트인가?)

### ① 월간 예산 플래너 (Budget Planner)
* **백엔드 매핑**: `AccountYearMonthController.java` (`/api/v1/account-year-months`)
* **API 호출부**: [`src/api/accountYearMonthApi.js`](file:///src/api/accountYearMonthApi.js)
* **비즈니스 로직**: [`src/composables/useBudget.js`](file:///src/composables/useBudget.js)
* **화면 뷰**: [`src/components/budget/BudgetPlannerView.vue`](file:///src/components/budget/BudgetPlannerView.vue), [`BudgetTable.vue`](file:///src/components/BudgetTable.vue)

### ② 월별 소비내역 (Monthly Transactions)
* **백엔드 매핑**: `AccountTransaction.java` (`/api/v1/account-transactions`)
* **API 호출부**: [`src/api/accountTransactionApi.js`](file:///src/api/accountTransactionApi.js) (백엔드 미구현 시 localStorage 자동 폴백)
* **비즈니스 로직**: [`src/composables/useAccountTransactions.js`](file:///src/composables/useAccountTransactions.js)
* **화면 뷰**: [`src/components/transactions/MonthlyTransactionsView.vue`](file:///src/components/transactions/MonthlyTransactionsView.vue)

### ③ 카테고리 관리 (Account Classification)
* **백엔드 매핑**: `CategoryGroupController`, `CategoryController`, `AccountController`
* **API 호출부**: [`src/api/accountClassificationApi.js`](file:///src/api/accountClassificationApi.js)
* **비즈니스 로직**: [`src/composables/useAccountClassification.js`](file:///src/composables/useAccountClassification.js)
* **화면 뷰**: [`src/components/account-hierarchy/AccountClassificationView.vue`](file:///src/components/account-hierarchy/AccountClassificationView.vue)

---

## 4. 백엔드 개발자 실전 수정 시나리오 (FAQ)

### Q1. 백엔드 API URL이나 DTO 필드명이 바뀌었습니다. 어디를 수정하나요?
1. **`src/api/*Api.js`** 파일을 엽니다.
2. `BASE_URL` 또는 해당 함수(`fetchByYear`, `create`, `update` 등) 내부의 요청 body 객체 필드명을 백엔드 DTO와 일치하도록 수정합니다.
3. 예시:
   ```javascript
   // src/api/accountYearMonthApi.js
   async create({ accountId, year, amounts }) {
     return request(BASE_URL, {
       method: 'POST',
       body: JSON.stringify({ accountId, year, amounts }) // DTO 필드 매핑
     })
   }
   ```

### Q2. 금액 집계 방식이나 연산 공식을 바꾸고 싶습니다.
* **`src/composables/use*.js`** 파일을 수정합니다.
* Vue의 `computed(() => ...)`는 Spring의 Getter 메소드나 DB 집계 쿼리와 동일합니다. 의존하는 데이터가 변경되면 자동으로 재계산되어 화면에 즉시 반영됩니다.
* 예: 총 지출 합계 공식 수정 시 `useBudget.js`의 `totalExpensesByMonth`를 확인합니다.

### Q3. 화면에 새 컬럼이나 입력 칸을 추가하고 싶습니다.
* 해당 화면의 `.vue` 파일을 엽니다.
  - `<template>`: HTML 태그 영역 (화면 마크업)
  - `<script setup>`: 변수와 함수 바인딩 영역
* Tailwind CSS 클래스가 적용되어 있으므로 `class="p-4 bg-white rounded-xl"` 등의 유틸리티 클래스로 쉽게 스타일을 조정할 수 있습니다.

### Q4. 수정한 코드가 깨지지 않았는지 어떻게 검증하나요?
터미널에서 아래 2개 명령어를 실행합니다:
```bash
# 1. Vitest 단위 및 컴포넌트 테스트 실행 (모든 비즈니스 로직 및 렌더링 검증)
npm test

# 2. 프로덕션 빌드 문법/타입 에러 검증
npm run build
```
모두 녹색 체크(`✓ passed`)가 뜨면 안심하고 커밋하시면 됩니다!

