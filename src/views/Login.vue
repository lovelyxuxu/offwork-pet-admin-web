<template>
  <div class="login-stage">
    <div class="aurora aurora-a"></div>
    <div class="aurora aurora-b"></div>
    <div class="aurora aurora-c"></div>
    <div class="stars">
      <span v-for="(s, i) in stars" :key="i" class="star"
            :style="{ left: s.x + '%', top: s.y + '%', animationDelay: s.d + 's', animationDuration: s.t + 's' }"></span>
    </div>
    <div class="grain"></div>

    <div class="login-card">
      <aside class="login-hero">
        <div class="moon-wrap">
          <div class="moon"><el-icon :size="34"><Moon /></el-icon></div>
          <div class="moon-ring"></div>
        </div>
        <div class="hero-brand">下班搭子</div>
        <div class="hero-sub">管理控制台</div>
        <p class="hero-line">夜幕降临，搭子们各就各位。<br />在这里照看整片陪伴网络。</p>
        <ul class="hero-feats">
          <li><el-icon :size="16"><Odometer /></el-icon><span>实时在线与趋势监控</span></li>
          <li><el-icon :size="16"><ChatDotRound /></el-icon><span>集会、搭子一站式管理</span></li>
          <li><el-icon :size="16"><Lock /></el-icon><span>授权访问 · 操作审计留痕</span></li>
        </ul>
        <div class="hero-foot">单进程 Relay · 实时同步</div>
      </aside>

      <section class="login-panel">
        <div class="panel-head">
          <h1 class="panel-title">欢迎回来</h1>
          <p class="panel-sub">登录以管理你的搭子网络</p>
        </div>

        <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon class="login-error" />

        <el-form ref="formRef" :model="form" :rules="rules" size="large" @submit.prevent="submit">
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="管理员账号" :prefix-icon="User"
                      autocomplete="username" clearable @keyup.enter="submit" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" placeholder="登录密码" :prefix-icon="Lock"
                      autocomplete="current-password" show-password @keyup.enter="submit" />
          </el-form-item>
          <el-button type="primary" class="login-btn" :loading="loading" native-type="submit" @click="submit">
            <span v-if="!loading">进入控制台</span>
            <span v-else>正在验证…</span>
            <el-icon v-if="!loading" class="btn-arrow"><Right /></el-icon>
          </el-button>
        </el-form>

        <div class="panel-foot">
          <el-icon :size="13"><InfoFilled /></el-icon>
          仅限授权管理员访问，管理操作将记录审计日志
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Right } from '@element-plus/icons-vue'
import { api } from '../api'
import { useAuth } from '../store'

const router = useRouter()
const auth = useAuth()
const formRef = ref(null)
const loading = ref(false)
const error = ref('')
const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入管理员账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入登录密码', trigger: 'blur' }],
}

const stars = Array.from({ length: 46 }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  d: Math.random() * 4,
  t: 2.5 + Math.random() * 3.5,
}))

async function submit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }
  loading.value = true
  error.value = ''
  try {
    await api.login(form.username.trim(), form.password)
    auth.username = form.username.trim()
    auth.setLoggedIn(true)
    ElMessage.success('登录成功，欢迎回来')
    router.push({ name: 'dashboard' })
  } catch (e) {
    error.value = e.message || '登录失败，请稍后再试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-stage {
  position: relative; min-height: 100vh; display: grid; place-items: center;
  padding: 32px 20px; overflow: hidden;
  background: radial-gradient(1200px 700px at 18% 12%, #2d2a55 0%, transparent 55%),
              radial-gradient(1000px 800px at 88% 90%, #3a2f63 0%, transparent 50%),
              linear-gradient(150deg, #16132c 0%, #1e1b3a 48%, #241f47 100%);
}
.aurora { position: absolute; border-radius: 50%; filter: blur(90px); opacity: 0.5; pointer-events: none; }
.aurora-a { width: 460px; height: 460px; left: -120px; top: -100px; background: radial-gradient(circle, #6c5ce7, transparent 70%); animation: drift1 18s ease-in-out infinite; }
.aurora-b { width: 420px; height: 420px; right: -100px; bottom: -120px; background: radial-gradient(circle, #f59e0b, transparent 70%); opacity: 0.32; animation: drift2 22s ease-in-out infinite; }
.aurora-c { width: 360px; height: 360px; right: 22%; top: -140px; background: radial-gradient(circle, #fb7185, transparent 70%); opacity: 0.26; animation: drift1 26s ease-in-out infinite reverse; }
@keyframes drift1 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(60px, 40px); } }
@keyframes drift2 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-50px, -36px); } }

.stars { position: absolute; inset: 0; pointer-events: none; }
.star { position: absolute; width: 2px; height: 2px; border-radius: 50%; background: #fff; opacity: 0.5; animation: twinkle 3s ease-in-out infinite; }
@keyframes twinkle { 0%, 100% { opacity: 0.15; transform: scale(0.8); } 50% { opacity: 0.85; transform: scale(1.25); } }
.grain { position: absolute; inset: 0; pointer-events: none; opacity: 0.04; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }

.login-card {
  position: relative; z-index: 2; display: grid; grid-template-columns: 0.92fr 1.08fr;
  width: min(920px, 100%); border-radius: 24px; overflow: hidden;
  background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45); backdrop-filter: blur(18px);
  animation: cardIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes cardIn { from { opacity: 0; transform: translateY(24px) scale(0.98); } to { opacity: 1; transform: none; } }

.login-hero {
  position: relative; padding: 44px 38px; display: flex; flex-direction: column;
  background: linear-gradient(165deg, rgba(108, 92, 231, 0.28), rgba(22, 19, 44, 0.1));
  border-right: 1px solid rgba(255, 255, 255, 0.08); overflow: hidden;
}
.moon-wrap { position: relative; width: 64px; height: 64px; margin-bottom: 26px; }
.moon {
  position: relative; z-index: 2; width: 64px; height: 64px; border-radius: 20px; display: grid; place-items: center;
  color: #ffe9c2; background: linear-gradient(135deg, #7c6cf0, #5a4bd1);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12), 0 12px 30px rgba(108, 92, 231, 0.55);
  animation: float 6s ease-in-out infinite;
}
.moon-ring { position: absolute; inset: -10px; border-radius: 26px; border: 1px solid rgba(255, 233, 194, 0.25); animation: float 6s ease-in-out infinite reverse; }
.hero-brand { color: #fff; font-size: 30px; font-weight: 800; letter-spacing: 0.04em; }
.hero-sub { color: #b9aefc; font-size: 13px; letter-spacing: 0.32em; margin-top: 6px; }
.hero-line { color: #cfc9e8; font-size: 14px; line-height: 1.9; margin: 26px 0 30px; }
.hero-feats { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 15px; }
.hero-feats li { display: flex; align-items: center; gap: 11px; color: #e4e0f5; font-size: 13.5px; }
.hero-feats .el-icon { color: #ffe9c2; flex: none; }
.hero-foot { margin-top: auto; padding-top: 30px; color: #8f88b0; font-size: 11.5px; letter-spacing: 0.06em; }

.login-panel { padding: 48px 44px; display: flex; flex-direction: column; justify-content: center; background: rgba(255, 255, 255, 0.97); }
.panel-head { margin-bottom: 26px; }
.panel-title { font-size: 25px; font-weight: 750; color: var(--ink-900); margin: 0; letter-spacing: -0.01em; }
.panel-sub { color: var(--text-muted); font-size: 13.5px; margin: 8px 0 0; }
.login-error { margin-bottom: 18px; border-radius: 10px; }
.login-panel :deep(.el-input__wrapper) { padding: 4px 14px; box-shadow: 0 0 0 1px var(--border-strong) inset; }
.login-panel :deep(.el-input__wrapper.is-focus) { box-shadow: 0 0 0 1px var(--brand-600) inset, 0 0 0 4px var(--brand-100); }
.login-panel :deep(.el-form-item) { margin-bottom: 22px; }
.login-btn {
  width: 100%; height: 48px; font-size: 15px; border: none; margin-top: 4px;
  background: linear-gradient(135deg, #7c6cf0, #5a4bd1);
  box-shadow: 0 10px 24px rgba(108, 92, 231, 0.4); transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.login-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 30px rgba(108, 92, 231, 0.5); background: linear-gradient(135deg, #8878f2, #6353d8); }
.login-btn:active { transform: translateY(0); }
.btn-arrow { margin-left: 6px; }
.panel-foot { display: flex; align-items: center; gap: 7px; margin-top: 26px; color: var(--text-faint); font-size: 12px; }

@media (max-width: 760px) {
  .login-card { grid-template-columns: 1fr; width: min(440px, 100%); }
  .login-hero { padding: 32px 30px; border-right: none; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
  .hero-line, .hero-feats, .hero-foot { display: none; }
  .moon-wrap { margin-bottom: 16px; }
  .login-panel { padding: 34px 30px; }
}
</style>
