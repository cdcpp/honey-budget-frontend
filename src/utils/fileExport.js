/**
 * @file fileExport.js
 * @description 예산 데이터 JSON 백업/복원 및 CSV 내보내기 유틸리티
 */

/**
 * 객체 데이터를 JSON 파일로 다운로드
 * @param {object} data
 * @param {string} filename
 */
export const downloadJson = (data, filename = 'honey-budget-backup.json') => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 업로드된 JSON 파일 텍스트 파싱
 * @param {File} file
 * @returns {Promise<any>}
 */
export const readJsonFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result)
        resolve(parsed)
      } catch (err) {
        reject(new Error('JSON 파일을 파싱하는 데 실패했습니다: ' + err.message))
      }
    }
    reader.onerror = () => reject(new Error('파일을 읽는 도중 오류가 발생했습니다.'))
    reader.readAsText(file)
  })
}

/**
 * 2차원 배열 데이터를 UTF-8 CSV 파일로 다운로드
 * @param {string[]} headers 헤더 배열
 * @param {(string|number)[][]} rows 행 데이터 배열
 * @param {string} filename 파일명
 */
export const downloadCsv = (headers, rows, filename = 'honey-budget.csv') => {
  const csvContent =
    '\uFEFF' + [headers, ...rows].map((e) => e.map((val) => '"' + (val ?? '') + '"').join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

