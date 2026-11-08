<script setup>
/**
 * ============================================================================
 * @file        AppHeader.vue
 * @layer       UI Component (Presentation Layer)
 * @role        월간 예산 플래너 상단 타이틀 및 데이터 백업(JSON)/복원/초기화/CSV 내보내기 바
 * @parent      BudgetPlannerView.vue
 * ============================================================================
 */
import { ref } from 'vue'

// ============================================================================
// [SECTION 1] Props
// ============================================================================
const props = defineProps({
  onReset: Function,
  onExportJson: Function,
  onImportJson: Function,
  onExportCsv: Function
})

// ============================================================================
// [SECTION 2] Reactive State & Event Handlers
// ============================================================================
const fileInput = ref(null)

const triggerFileInput = () => fileInput.value?.click()

const handleFileChange = (e) => {
  const file = e.target.files?.[0]
  if (file && props.onImportJson) {
    props.onImportJson(file)
  }
  e.target.value = ''
}
</script>

<template>
  <!-- ==================================================================== -->
  <!-- [UI 영역] 토스 다크 스타일 상단 인트로 및 유틸리티 액션 버튼 그룹       -->
  <!-- ==================================================================== -->
  <header class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pt-1 pb-2">
    <div>
      <span class="inline-block text-[13px] font-bold text-[#64A8FF] mb-1">
        내 자산 · 연간 예산 플래너
      </span>
      <h1 class="text-[24px] sm:text-[28px] font-extrabold tracking-tight text-[#F9FAFB] leading-snug">
        올해 수입과 저축, 지출을 한눈에
      </h1>
      <p class="text-[14px] text-[#8B95A1] mt-1">
        급여 익월(+1개월) 기준 12개월 현금흐름과 보유 잔액을 관리해요.
      </p>
    </div>

    <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
      <input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleFileChange" />

      <button @click="onExportJson" title="JSON 백업 파일 다운로드" class="btn btn--secondary !min-h-[36px] !px-3.5 !text-[13px]">
        백업(JSON)
      </button>
      <button @click="triggerFileInput" title="JSON 백업 파일 불러오기" class="btn btn--secondary !min-h-[36px] !px-3.5 !text-[13px]">
        불러오기
      </button>
      <button @click="onReset" title="모든 수치 0원 초기화" class="btn btn--secondary !min-h-[36px] !px-3.5 !text-[13px]">
        0원 초기화
      </button>
      <button @click="onExportCsv" title="엑셀 호환 CSV 파일 내보내기" class="btn btn--primary !min-h-[36px] !px-4 !text-[13px]">
        CSV 내보내기
      </button>
    </div>
  </header>
</template>
