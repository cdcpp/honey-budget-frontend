<template>
  <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
    <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
      <i class="fa-solid fa-circle-info text-blue-500"></i> 지출 및 수입 분류 기준
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
      <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2 hover:bg-slate-100/50 transition-colors">
        <span class="font-semibold text-indigo-600 whitespace-nowrap">부수입 :</span>
        <span class="text-slate-600">상여금, 성과급, 금융 소득, 포인트 등 월급 이외의 수익</span>
      </div>
      <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2 hover:bg-slate-100/50 transition-colors">
        <span class="font-semibold text-rose-600 whitespace-nowrap">고정지출 :</span>
        <span class="text-slate-600">이자, 대출상환, 세금, 통신비, 보험료, 청약, OTT 구독료 등</span>
      </div>
      <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2 hover:bg-slate-100/50 transition-colors">
        <span class="font-semibold text-amber-600 whitespace-nowrap">비고정지출 :</span>
        <span class="text-slate-600">화장품, 생필품, 유류비/교통비, 계절성 의류 구입 등</span>
      </div>
      <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2 hover:bg-slate-100/50 transition-colors">
        <span class="font-semibold text-emerald-600 whitespace-nowrap">차량비상금 :</span>
        <span class="text-slate-600">자동차 보험료, 정기점검 및 소모품 수리비</span>
      </div>
      <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2 md:col-span-2 hover:bg-slate-100/50 transition-colors">
        <span class="font-semibold text-purple-600 whitespace-nowrap">행사비 :</span>
        <span class="text-slate-600">결혼/장례 경조사비, 명절 부모님 용돈, 가족 외식/기념일 경비</span>
      </div>
    </div>
  </div>
</template>