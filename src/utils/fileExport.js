/**
 * ============================================================================
 * @file        fileExport.js
 * @layer       Utility Layer (파일 입출력 I/O 헬퍼)
 * @role        브라우저에서 JSON 백업 파일 다운로드/복원 및 엑셀 호환(UTF-8 BOM) CSV 파일 다운로드 처리
 * ============================================================================
 */

/**
 * [JSON 파일 다운로드]
 * @description 자바스크립트 객체를 들여쓰기(2칸)된 JSON 문자열로 직렬화하여 브라우저 다운로드를 실행합니다.
 * @param       {object} data - 저장할 데이터 객체
 * @param       {string} filename - 다운로드될 파일명 (기본값: 'honey-budget-backup.json')
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
 * [업로드된 JSON 파일 읽기 및 파싱]
 * @description 사용자가 <input type="file">로 선택한 로컬 JSON 파일을 비동기(Promise)로 읽어 객체로 반환합니다.
 * @param       {File} file - 브라우저 File 객체
 * @returns     {Promise<any>} 파싱된 JSON 객체
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
 * [엑셀 호환 UTF-8 CSV 파일 다운로드]
 * @description 한글 깨짐 방지를 위해 UTF-8 BOM('\uFEFF')을 선두에 추가한 뒤 2차원 배열을 CSV로 다운로드합니다.
 * @param       {string[]} headers - 첫 줄에 들어갈 컬럼 제목 배열
 * @param       {(string|number)[][]} rows - 각 행의 데이터 2차원 배열
 * @param       {string} filename - 다운로드될 CSV 파일명
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
