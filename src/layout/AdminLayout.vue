<template>
  <el-container class="shell">
    <el-aside :width="collapsed ? '72px' : '236px'" class="sidebar" :class="{ 'mobile-open': mobileOpen }">
      <div class="brand" :class="{ mini: collapsed && !mobile }">
        <div class="brand-mark"><el-icon :size="22"><Moon /></el-icon></div>
        <div v-if="!collapsed || mobile" class="brand-text">
          <div class="brand-name">下班搭子</div>
          <div class="brand-sub">管理控制台</div>
        </div>
      </div>

      <el-menu :default-active="route.path" router :collapse="collapsed && !mobile" :collapse-transition="false" class="nav">
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon><template #title>仪表盘</template>
        </el-menu-item>
        <el-menu-item index="/devices">
          <el-icon><Monitor /></el-icon><template #title>设备管理</template>
        </el-menu-item>
        <el-menu-item index="/rallies">
          <el-icon><ChatDotRound /></el-icon><template #title>集会管理</template>
        </el-menu-item>
      </el-menu>

      <div class="side-foot">
        <div v-if="!collapsed || mobile" class="relay-card">
          <span class="live"><span class="beat"></span>Relay 运行中</span>
          <span class="relay-sub">单进程 · 实时在线</span>
        </div>
        <button v-if="!mobile" class="collapse-btn" @click="collapsed = !collapsed">
          <el-icon :size="16"><component :is="collapsed ? 'Expand' : 'Fold'" /></el-icon>
        </button>
      </div>
    </el-aside>

    <div v-if="mobile && mobileOpen" class="scrim" @click="mobileOpen = false"></div>

    <el-container class="main">
      <el-header class="topbar">
        <div class="top-left">
          <button class="menu-btn" @click="mobileOpen = true"><el-icon :size="20"><Menu /></el-icon></button>
          <div class="crumb">
            <span class="crumb-root">控制台</span>
            <el-icon :size="13" class="crumb-arrow"><ArrowRight /></el-icon>
            <span class="crumb-cur">{{ route.meta.title || '仪表盘' }}</span>
          </div>
        </div>
        <div class="top-right">
          <div class="online-badge" title="当前在线设备">
            <el-icon :size="15"><Connection /></el-icon>
            <span>在线 <b>{{ onlineCount }}</b></span>
          </div>
          <div class="clock mono" title="服务器时间">
            <el-icon :size="15"><Clock /></el-icon>{{ clock }}
          </div>
          <el-dropdown trigger="click" @command="onCommand">
            <div class="admin-chip">
              <div class="avatar">管</div>
              <span class="admin-name">管理员</span>
              <el-icon :size="13"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { api } from '../api'
import { useAuth } from '../store'
import { formatClock } from '../utils/format'

const route = useRoute()
const router = useRouter()
const auth = useAuth()

const collapsed = ref(false)
const mobile = ref(false)
const mobileOpen = ref(false)
const onlineCount = ref(0)
const clock = ref(formatClock())
let offset = 0
let tickTimer = null
let pollTimer = null

function onResize() {
  mobile.value = window.innerWidth < 900
  if (!mobile.value) mobileOpen.value = false
}

watch(() => route.path, () => { mobileOpen.value = false })

async function poll() {
  try {
    const data = await api.overview()
    onlineCount.value = data.totals.online
    offset = data.server_time - Date.now() / 1000
  } catch (e) { /* 401 handled globally */ }
}

function tick() {
  clock.value = formatClock(Date.now() / 1000 + offset)
}

async function onCommand(cmd) {
  if (cmd === 'logout') {
    try { await api.logout() } catch (e) { /* ignore */ }
    auth.setLoggedIn(false)
    ElMessage.success('已退出登录')
    router.replace({ name: 'login' })
  }
}

onMounted(() => {
  onResize()
  window.addEventListener('resize', onResize)
  poll()
  tick()
  tickTimer = setInterval(tick, 1000)
  pollTimer = setInterval(poll, 10000)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  clearInterval(tickTimer)
  clearInterval(pollTimer)
})
</script>

<style scoped>
.shell { height: 100vh; }
.sidebar {
  background: linear-gradient(180deg, var(--ink-900) 0%, var(--ink-950) 100%);
  display: flex; flex-direction: column; transition: width 0.22s ease;
  border-right: 1px solid rgba(255, 255, 255, 0.04); overflow: hidden;
}
.brand { display: flex; align-items: center; gap: 12px; padding: 22px 20px 18px; }
.brand.mini { justify-content: center; padding: 22px 0 18px; }
.brand-mark {
  width: 42px; height: 42px; border-radius: 13px; flex: none; display: grid; place-items: center;
  color: #ffe9c2; background: linear-gradient(135deg, var(--brand-600), var(--brand-700));
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08), 0 6px 18px rgba(108, 92, 231, 0.45);
}
.brand-name { color: #fff; font-weight: 750; font-size: 16px; letter-spacing: 0.02em; }
.brand-sub { color: var(--brand-300); font-size: 11px; margin-top: 2px; letter-spacing: 0.08em; }

.nav { flex: 1; background: transparent; border-right: none; padding: 8px 12px; --el-menu-bg-color: transparent; --el-menu-text-color: #b9b3d6; --el-menu-hover-bg-color: rgba(255, 255, 255, 0.06); --el-menu-active-color: #fff; }
.nav :deep(.el-menu-item) { border-radius: 11px; margin-bottom: 6px; height: 46px; line-height: 46px; }
.nav :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, var(--brand-600), var(--brand-700));
  color: #fff; box-shadow: 0 6px 16px rgba(108, 92, 231, 0.4);
}
.nav :deep(.el-menu-item.is-active .el-icon) { color: #ffe9c2; }
.nav :deep(.el-menu-tooltip__trigger) { justify-content: center; }

.side-foot { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.relay-card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.07); border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 5px; }
.relay-sub { color: #8f88b0; font-size: 11px; }
.collapse-btn {
  align-self: center; width: 34px; height: 34px; border-radius: 10px; cursor: pointer;
  display: grid; place-items: center; color: #b9b3d6;
  background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.08);
  transition: background 0.15s ease;
}
.collapse-btn:hover { background: rgba(255, 255, 255, 0.12); color: #fff; }

.scrim { position: fixed; inset: 0; z-index: 999; background: rgba(22, 19, 44, 0.55); backdrop-filter: blur(2px); animation: fadeIn 0.2s ease; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.main { background: var(--bg); min-width: 0; }
.topbar {
  height: 64px; display: flex; align-items: center; justify-content: space-between;
  background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border); padding: 0 24px; gap: 12px;
}
.top-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
.menu-btn {
  display: none; width: 38px; height: 38px; border-radius: 11px; cursor: pointer; flex: none;
  place-items: center; color: var(--ink-900); background: var(--surface); border: 1px solid var(--border);
}
.menu-btn:hover { background: var(--brand-50); color: var(--brand-700); }
.crumb { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-muted); min-width: 0; }
.crumb-cur { color: var(--ink-900); font-weight: 650; white-space: nowrap; }
.top-right { display: flex; align-items: center; gap: 16px; flex: none; }
.online-badge { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-muted); background: var(--surface); border: 1px solid var(--border); padding: 6px 12px; border-radius: 20px; white-space: nowrap; }
.online-badge b { color: var(--success); font-weight: 700; }
.clock { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-muted); white-space: nowrap; }
.admin-chip { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px 8px; border-radius: 12px; transition: background 0.15s ease; }
.admin-chip:hover { background: var(--brand-50); }
.avatar { width: 32px; height: 32px; border-radius: 10px; display: grid; place-items: center; color: #fff; font-size: 13px; font-weight: 700; background: linear-gradient(135deg, var(--amber), var(--coral)); }
.admin-name { font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; }
.content { padding: 0; overflow-y: auto; }

@media (max-width: 900px) {
  .sidebar {
    position: fixed; left: 0; top: 0; bottom: 0; width: 236px !important; z-index: 1000;
    transform: translateX(-100%); transition: transform 0.25s ease;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.4);
  }
  .sidebar.mobile-open { transform: translateX(0); }
  .menu-btn { display: grid; }
  .clock { display: none; }
  .crumb-root, .crumb-arrow { display: none; }
  .topbar { padding: 0 16px; }
  .top-right { gap: 10px; }
}
@media (max-width: 480px) {
  .admin-name { display: none; }
  .online-badge span { display: none; }
  .online-badge { padding: 6px 9px; }
}
</style>