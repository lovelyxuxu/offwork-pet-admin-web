import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import * as icons from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import { onUnauthorized } from './api'
import { useAuth } from './store'
import './styles/theme.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus, { locale: zhCn })
for (const [name, comp] of Object.entries(icons)) app.component(name, comp)

onUnauthorized(() => {
  const auth = useAuth()
  auth.setLoggedIn(false)
  router.replace({ name: 'login' })
})

app.mount('#app')