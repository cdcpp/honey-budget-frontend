<script setup>
import { ref } from 'vue'

const props = defineProps({
  onReset: Function,
  onResetSample: Function,
  onExportJson: Function,
  onImportJson: Function,
  onExportCsv: Function
})

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
  <header class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
    <div>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
          <i class="fa-solid fa-wallet text-xl"></i>
        </div>
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            월간 수입 & 지출 플래너
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">Honey Budget</span>
          </h1>
          <p class="text-xs sm:text-sm text-slate-500 mt-0.5">월급 익월 기준 (+1달) 수입, 저축, 지출 및 비상금 관리 대시보드</p>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleFileChange" />
      <button @click="onExportCsv" title="엑셀에서 열 수 있는 CSV 다운로드" class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors shadow-sm cursor-pointer">
        <i class="fa-solid fa-file-csv"></i> CSV 내보내기
      </button>
      <button @click="onExportJson" title="JSON 백업" class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors shadow-sm cursor-pointer">
        <i class="fa-solid fa-download"></i> 백업(JSON)
      </button>
      <button @click="triggerFileInput" title="JSON 복원" class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors shadow-sm cursor-pointer">
        <i class="fa-solid fa-upload"></i> 불러오기
      </button>
      <button @click="onResetSample" title="샘플 복원" class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors shadow-sm cursor-pointer">
        <i class="fa-solid fa-wand-magic-sparkles"></i> 예시 복원
      </button>
      <button @click="onReset" title="0원 초기화" class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors shadow-sm cursor-pointer">
        <i class="fa-solid fa-rotate-left"></i> 0원 초기화
      </button>
    </div>
  </header>
</template>