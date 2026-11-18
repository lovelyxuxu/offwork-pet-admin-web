<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h2 class="page-title">仪表盘</h2>
        <p class="page-sub">搭子网络实时总览 · 每 5 秒自动刷新</p>
      </div>
      <div class="head-tools">
        <span class="live" :class="{ off: !fresh }"><span class="beat"></span>{{ fresh ? '实时同步中' : '同步中断' }}</span>
        <span class="count-pill mono">更新于 {{ updatedClock }}</span>
        <el-button :icon="Refresh" circle :loading="loading" @click="refreshAll" />
      </div>
    </div>

    <div class="hero-banner">
      <div class="hero-text">
        <div class="hero-greet">{{ greeting }}，管理员</div>
        <div class="hero-summary">
          当前 <b>{{ totals.online }}</b> 台设备在线，
          <b>{{ totals.rallies }}</b> 个集会进行中，
          已促成 <b>{{ totals.relations }}</b> 对搭子。
        </div>
      </div>
      <div class="hero-moon"><el-icon :size="40"><Moon /></el-icon></div>
      <div class="hero-glow"></div>
    </div>

    <div class="stat-grid">
      <StatCard label="设备总数" :value="totals.devices" icon="Monitor" accent="#6c5ce7" accent-soft="#e9e5ff" />
      <StatCard label="当前在线" :value="totals.online" icon="Connection" accent="#10b981" accent-soft="#e7f8f1" />
      <StatCard label="集会数量" :value="totals.rallies" icon="ChatDotRound" accent="#f59e0b" accent-soft="#fdf3e0" />
      <StatCard label="搭子配对" :value="totals.relations" icon="Link" accent="#fb7185" accent-soft="#ffe9ee" />
    </div>

    <div class="card trend-card">
      <div class="card-pad trend-head">
        <h3 class="card-title"><span class="dot"></span>在线趋势</h3>
        <span class="trend-hint">最近 24 小时 · 每 30 秒采样</span>
      </div>
      <TrendChart :points="points" />
    </div>

    <div class="lower-grid">
      <div class="card">
        <div class="card-pad panel-head">
          <h3 class="card-title"><span class="dot"></span>在线设备</h3>
          <span class="count-pill">{{ overview.online.length }} 台</span>
        </div>
        <div class="online-list" v-if="overview.online.length">
          <div v-for="d in overview.online" :key="d.device" class="online-row">
            <div class="o-avatar" :style="{ background: avatarColor(d.name || d.device) }">{{ avatarChar(d.name || d.device) }}</div>
            <div class="o-main">
              <div class="o-name">{{ d.name || '未命名搭子' }}</div>
              <div class="o-meta mono">{{ d.device }} · {{ clientTypeLabel(d.client_type) }}</div>
            </div>
            <div class="o-right">
              <StatusTag :status="d.status" />
              <span class="o-dur">{{ formatDuration(d.online_seconds) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-mini">
          <el-icon :size="30"><Monitor /></el-icon>
          <span>此刻没有设备在线</span>
        </div>
      </div>

      <div class="card">
        <div class="card-pad panel-head">
          <h3 class="card-title"><span class="dot"></span>集会概览</h3>
          <span class="count-pill">{{ overview.rallies.length }} 个</span>
        </div>
        <el-table v-if="overview.rallies.length" :data="overview.rallies" size="small" class="rally-table">
          <el-table-column label="集会" min-width="140">
            <template #default="{ row }">
              <div class="r-name">{{ row.name }}</div>
              <div class="r-code mono">{{ row.code }}</div>
            </template>
          </el-table-column>
          <el-table-column label="成员" width="150">
            <template #default="{ row }">
              <div class="cap-line"><span>{{ row.members }} / {{ row.limit }}</span><span class="cap-online">{{ row.online }} 在线</span></div>
              <div class="cap-bar"><span :style="{ width: Math.min(100, row.members / row.limit * 100) + '%' }"></span></div>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="150">
            <template #default="{ row }"><span class="mono r-time">{{ formatTime(row.created) }}</span></template>
          </el-table-column>
        </el-table>
        <div v-else class="empty-mini">
          <el-icon :size="30"><ChatDotRound /></el-icon>
          <span>还没有任何集会</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { api } from '../api'
import { formatDuration, formatTime, formatClock, clientTypeLabel } from '../utils/format'
import StatCard from '../components/StatCard.vue'
import TrendChart from '../components/TrendChart.vue'
import StatusTag from '../components/StatusTag.vue'

const overview = ref({ server_time: 0, totals: { devices: 0, online: 0, rallies: 0, relations: 0 }, online: [], rallies: [] })
const points = ref([])
const loading = ref(false)
const fresh = ref(true)
const updatedClock = ref('--:--:--')
let overviewTimer = null
let trendTimer = null

const totals = computed(() => overview.value.totals)
const greeting = computed(() => {
  const h = new Date((overview.value.server_time || Date.now() / 1000) * 1000).getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const PALETTE = ['#6c5ce7', '#f59e0b', '#fb7185', '#14b8a6', '#3b82f6', '#10b981']
function avatarChar(name) { return (name || '?').trim().charAt(0).toUpperCase() || '?' }
function avatarColor(seed) {
  let h = 0
  for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return PALETTE[h % PALETTE.length]
}

async function refreshOverview() {
  try {
    overview.value = await api.overview()
    updatedClock.value = formatClock(overview.value.server_time)
    fresh.value = true
  } catch (e) {
    fresh.value = false
  }
}
async function refreshTrend() {
  try { points.value = (await api.trend()).points } catch (e) { /* 401 handled globally */ }
}
async function refreshAll() {
  loading.value = true
  await Promise.all([refreshOverview(), refreshTrend()])
  loading.value = false
}

onMounted(() => {
  refreshAll()
  overviewTimer = setInterval(refreshOverview, 5000)
  trendTimer = setInterval(refreshTrend, 30000)
})
onBeforeUnmount(() => {
  clearInterval(overviewTimer)
  clearInterval(trendTimer)
})
</script>

<style scoped>
.head-tools { display: flex; align-items: center; gap: 12px; }
.hero-banner {
  position: relative; overflow: hidden; border-radius: var(--radius); padding: 24px 28px; margin-bottom: 20px;
  display: flex; align-items: center; justify-content: space-between; gap: 20px;
  background: linear-gradient(120deg, #1e1b3a 0%, #2d2a55 55%, #3a2f63 100%);
  box-shadow: var(--shadow-md);
}
.hero-greet { color: #fff; font-size: 21px; font-weight: 750; letter-spacing: 0.01em; }
.hero-summary { color: #cfc9e8; font-size: 13.5px; margin-top: 8px; }
.hero-summary b { color: #ffe9c2; font-weight: 750; font-variant-numeric: tabular-nums; }
.hero-moon { position: relative; z-index: 2; width: 64px; height: 64px; border-radius: 18px; display: grid; place-items: center; color: #ffe9c2; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.12); animation: float 6s ease-in-out infinite; }
.hero-glow { position: absolute; right: -40px; top: -60px; width: 220px; height: 220px; border-radius: 50%; background: radial-gradient(circle, rgba(245, 158, 11, 0.4), transparent 70%); filter: blur(20px); }

.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
.trend-card { margin-bottom: 20px; padding-bottom: 8px; }
.trend-head { display: flex; align-items: center; justify-content: space-between; padding-bottom: 6px; }
.trend-hint { font-size: 12px; color: var(--text-faint); }

.lower-grid { display: grid; grid-template-columns: 1fr 1.15fr; gap: 16px; }
.panel-head { display: flex; align-items: center; justify-content: space-between; padding-bottom: 14px; }
.online-list { max-height: 320px; overflow-y: auto; padding: 0 12px 12px; }
.online-row { display: flex; align-items: center; gap: 12px; padding: 11px 10px; border-radius: 12px; transition: background 0.15s ease; }
.online-row:hover { background: var(--brand-50); }
.o-avatar { width: 38px; height: 38px; border-radius: 11px; flex: none; display: grid; place-items: center; color: #fff; font-weight: 700; font-size: 15px; }
.o-main { flex: 1; min-width: 0; }
.o-name { font-size: 13.5px; font-weight: 650; color: var(--ink-900); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.o-meta { font-size: 11px; color: var(--text-faint); margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.o-right { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; flex: none; }
.o-dur { font-size: 11px; color: var(--text-muted); }
.rally-table { width: 100%; }
.r-name { font-weight: 650; color: var(--ink-900); font-size: 13px; }
.r-code { font-size: 11px; color: var(--text-faint); margin-top: 2px; }
.cap-line { display: flex; justify-content: space-between; font-size: 12px; color: var(--text); margin-bottom: 5px; }
.cap-online { color: var(--success); font-weight: 600; }
.cap-bar { height: 5px; border-radius: 4px; background: var(--border); overflow: hidden; }
.cap-bar span { display: block; height: 100%; border-radius: 4px; background: linear-gradient(90deg, var(--brand-500), var(--brand-600)); }
.r-time { font-size: 12px; color: var(--text-muted); }
.empty-mini { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 48px 0; color: var(--text-faint); font-size: 13px; }

@media (max-width: 1100px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } .lower-grid { grid-template-columns: 1fr; } }
@media (max-width: 560px) { .stat-grid { grid-template-columns: 1fr; } .hero-moon { display: none; } }
</style>
