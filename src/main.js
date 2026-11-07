/**
 * ============================================================================
 * @file        main.js
 * @layer       Application Bootstrap (Spring의 @SpringBootApplication main() 역할)
 * @role        Vue 3 애플리케이션 인스턴스를 생성하고 전역 CSS를 로드한 뒤 index.html의 #app에 마운트합니다.
 * ============================================================================
 */
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// 최상위 루트 컴포넌트(App.vue)를 DOM의 <div id="app"> 영역에 연결
createApp(App).mount('#app')
