<script setup>
/**
 * ============================================================================
 * @file        AppHeader.vue
 * @layer       UI Component (Presentation Layer)
 * @role        월간 예산 플래너 상단 타이틀 및 데이터 백업(JSON)/복원/초기화/CSV 내보내기 버튼 바
 * @parent      BudgetPlannerView.vue
 * ============================================================================
 */
import { ref } from 'vue'

// ============================================================================
// [SECTION 1] Props (부모 컴포넌트로부터 전달받는 콜백 함수들)
// ============================================================================
const props = defineProps({
  onReset: Function,      // '0원 초기화' 버튼 클릭 시 실행할 함수
  onExportJson: Function, // '백업(JSON)' 버튼 클릭 시 실행할 함수
  onImportJson: Function, // '불러오기' 파일 선택 시 실행할 함수
  onExportCsv: Function   // 'CSV 내보내기' 버튼 클릭 시 실행할 함수
})

// ============================================================================
// [SECTION 2] Reactive State & Event Handlers (파일 업로드 트리거)
// ============================================================================
const fileInput = ref(null) // 숨겨진 <input type="file"> DOM 엘리먼트 참조

/** '불러오기' 버튼 클릭 시 숨겨진 파일 선택 창을 엽니다. */
const triggerFileInput = () => fileInput.value?.click()

/** 사용자가 JSON 파일을 선택했을 때 부모의 onImportJson(file) 함수를 호출합니다. */
const handleFileChange = (e) => {
  const file = e.target.files?.[0]
  if (file && props.onImportJson) {
    props.onImportJson(file)
  }
  // 동일한 파일을 연속으로 다시 선택할 수 있도록 input 값을 비워줍니다.
  e.target.value = ''
}
</script>

<template>
  <!-- ==================================================================== -->
  <!-- [UI 영역] 페이지 타이틀 및 우측 유틸리티 액션 버튼 그룹                -->
  <!-- ==================================================================== -->
  <header class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-6 border-b border-[#141413]/12">
    <div>
      <p class="text-[13px] font-medium text-[#575653] mb-1">연간 가계 재무 명세</p>
      <h1 class="text-[28px] sm:text-[32px] font-bold tracking-tight text-[#141413] leading-tight">
        월간 수입 & 지출 플래너
      </h1>
      <p class="text-[15px] text-[#575653] mt-1.5">
        급여 익월(+1개월) 기준 12개월 수입, 저축, 지출 예산과 보유 잔액을 한 화면에서 관리합니다.
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <!-- 숨겨진 JSON 파일 업로드 input -->
      <input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleFileChange" />

      <button @click="onExportJson" title="JSON 백업 파일 다운로드" class="btn btn--secondary">
        백업(JSON)
      </button>
      <button @click="triggerFileInput" title="JSON 백업 파일 불러오기" class="btn btn--secondary">
        불러오기
      </button>
      <button @click="onReset" title="모든 수치 0원 초기화" class="btn btn--secondary">
        0원 초기화
      </button>
      <button @click="onExportCsv" title="엑셀 호환 CSV 파일 내보내기" class="btn btn--primary">
        CSV 내보내기
      </button>
    </div>
  </header>
</template>
