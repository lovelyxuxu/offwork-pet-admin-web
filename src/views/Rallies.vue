<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h2 class="page-title">集会管理</h2>
        <p class="page-sub">管理所有集会 · 调整人数上限或解散 · 每 8 秒自动刷新</p>
      </div>
      <div class="head-tools">
        <span class="live" :class="{ off: !fresh }"><span class="beat"></span>{{ fresh ? '实时同步中' : '同步中断' }}</span>
        <el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
      </div>
    </div>

    <div class="toolbar">
      <el-input v-model="search" placeholder="搜索集会名称 / 集会码" :prefix-icon="Search" clearable class="search-input" />
      <el-select v-model="onlineFilter" class="filter-select">
        <el-option label="全部集会" value="all" />
        <el-option label="有成员在线" value="online" />
        <el-option label="全员离线" value="offline" />
      </el-select>
      <div class="spacer"></div>
      <span class="count-pill">显示 {{ filtered.length }} / {{ rallies.length }} 个</span>
    </div>

    <div class="card">
      <el-table :data="filtered" v-loading="loading && !rallies.length" class="rally-table"
                :default-sort="{ prop: 'created', order: 'descending' }" @row-dblclick="openDetail">
        <el-table-column label="集会" min-width="220" prop="name" sortable>
          <template #default="{ row }">
            <div class="r-cell">
              <div class="r-icon"><el-icon :size="18"><ChatDotRound /></el-icon></div>
              <div>
                <div class="r-name">{{ row.name }}</div>
                <div class="r-code mono">{{ row.code }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="成员 / 上限" min-width="180">
          <template #default="{ row }">
            <div class="cap-line">
              <span class="cap-num">{{ row.members }} <span class="cap-sep">/</span> {{ row.limit }}</span>
              <span class="cap-pct">{{ Math.round(row.members / row.limit * 100) }}%</span>
            </div>
            <div class="cap-bar"><span :class="{ full: row.members >= row.limit }" :style="{ width: Math.min(100, row.members / row.limit * 100) + '%' }"></span></div>
          </template>
        </el-table-column>
        <el-table-column label="在线" width="110" prop="online" sortable align="center">
          <template #default="{ row }">
            <span class="online-pill" :class="{ zero: !row.online }">
              <span class="online-dot"></span>{{ row.online }} 在线
            </span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160" prop="created" sortable>
          <template #default="{ row }"><span class="mono r-time">{{ formatTime(row.created) }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="210" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="openDetail(row)">详情</el-button>
            <el-button link type="warning" :icon="SetUp" @click="openLimit(row)">调上限</el-button>
            <el-button link type="danger" :icon="Delete" @click="dissolve(row)">解散</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty-block">
            <el-icon :size="38"><ChatDotRound /></el-icon>
            <p>{{ rallies.length ? '没有符合筛选条件的集会' : '还没有任何集会' }}</p>
          </div>
        </template>
      </el-table>
    </div>

    <el-drawer v-model="drawer" title="集会详情" size="440px" :destroy-on-close="true" append-to-body>
      <template v-if="current">
        <div class="detail-hero">
          <div class="detail-icon"><el-icon :size="26"><ChatDotRound /></el-icon></div>
          <div class="detail-title">
            <div class="detail-name">{{ current.name }}</div>
            <div class="detail-code mono">{{ current.code }}</div>
          </div>
        </div>
        <el-descriptions :column="2" border class="detail-desc">
          <el-descriptions-item label="成员数">{{ current.members }} 人</el-descriptions-item>
          <el-descriptions-item label="在线">{{ current.online }} 人</el-descriptions-item>
          <el-descriptions-item label="人数上限">{{ current.limit }} 人</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatTime(current.created) }}</el-descriptions-item>
        </el-descriptions>
        <div class="member-head">成员列表 <span class="count-pill">{{ current.member_names.length }}</span></div>
        <div class="member-list">
          <div v-for="(m, i) in current.member_names" :key="i" class="member-row">
            <div class="m-avatar" :style="{ background: avatarColor(m.name) }">{{ avatarChar(m.name) }}</div>
            <span class="m-name">{{ m.name }}</span>
            <span class="terminal-label">{{ clientTypeLabel(m.client_type) }}</span>
            <span class="m-status" :class="{ on: m.online }"><span class="m-dot"></span>{{ m.online ? '在线' : '离线' }}</span>
          </div>
        </div>
        <div class="detail-actions">
          <el-button type="warning" :icon="SetUp" @click="openLimit(current)">调整上限</el-button>
          <el-button type="danger" :icon="Delete" @click="dissolve(current)">解散集会</el-button>
        </div>
      </template>
    </el-drawer>

    <el-dialog v-model="limitDialog" title="调整人数上限" width="420px" :close-on-click-modal="false" append-to-body>
      <template v-if="limitRow">
        <p class="limit-tip">
          集会「{{ limitRow.name }}」当前有 <b>{{ limitRow.members }}</b> 名成员。
          上限不能低于当前成员数，最大可设为 <b>{{ limitRow.max_members }}</b> 人。
        </p>
        <el-input-number v-model="limitValue" :min="limitRow.members" :max="limitRow.max_members" :step="1"
                         controls-position="right" class="limit-input" />
      </template>
      <template #footer>
        <el-button @click="limitDialog = false">取消</el-button>
        <el-button type="primary" :loading="limitLoading" @click="saveLimit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, View, SetUp, Delete } from '@element-plus/icons-vue'
import { api } from '../api'
import { formatTime, clientTypeLabel } from '../utils/format'

const rallies = ref([])
const loading = ref(false)
const fresh = ref(true)
const search = ref('')
const onlineFilter = ref('all')
const drawer = ref(false)
const current = ref(null)
const limitDialog = ref(false)
const limitRow = ref(null)
const limitValue = ref(12)
const limitLoading = ref(false)
let timer = null

const PALETTE = ['#6c5ce7', '#f59e0b', '#fb7185', '#14b8a6', '#3b82f6', '#10b981']
function avatarChar(name) { return (name || '?').trim().charAt(0).toUpperCase() || '?' }
function avatarColor(seed) {
  let h = 0
  for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return PALETTE[h % PALETTE.length]
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return rallies.value.filter((r) => {
    if (onlineFilter.value === 'online' && !r.online) return false
    if (onlineFilter.value === 'offline' && r.online) return false
    if (q && !(r.name + ' ' + r.code).toLowerCase().includes(q)) return false
    return true
  })
})

async function load() {
  loading.value = true
  try {
    rallies.value = await api.rallies()
    fresh.value = true
    if (current.value) {
      const match = rallies.value.find((r) => r.code === current.value.code)
      if (match) current.value = match
      else drawer.value = false
    }
  } catch (e) {
    fresh.value = false
  } finally {
    loading.value = false
  }
}

function openDetail(row) { current.value = row; drawer.value = true }

function openLimit(row) {
  limitRow.value = row
  limitValue.value = row.limit
  limitDialog.value = true
}

async function saveLimit() {
  limitLoading.value = true
  try {
    await api.setLimit(limitRow.value.code, limitValue.value)
    ElMessage.success('人数上限已更新')
    limitDialog.value = false
    await load()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    limitLoading.value = false
  }
}

async function dissolve(row) {
  try {
    await ElMessageBox.confirm(
      `确定解散集会「${row.name}」（${row.code}）吗？${row.members} 名成员将被移出，此操作不可撤销。`,
      '解散集会',
      { type: 'error', confirmButtonText: '确认解散', cancelButtonText: '取消', confirmButtonClass: 'el-button--danger' }
    )
  } catch (e) { return }
  try {
    await api.dissolve(row.code)
    ElMessage.success('集会已解散')
    if (current.value && current.value.code === row.code) drawer.value = false
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
  await load()
}

onMounted(() => { load(); timer = setInterval(load, 8000) })
onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
.terminal-label { color: #7560a5; font-size: 12px; }
.head-tools { display: flex; align-items: center; gap: 12px; }
.search-input { width: 300px; }
.filter-select { width: 150px; }
.rally-table { width: 100%; }
.r-cell { display: flex; align-items: center; gap: 12px; }
.r-icon { width: 38px; height: 38px; border-radius: 11px; flex: none; display: grid; place-items: center; color: var(--brand-600); background: var(--brand-50); }
.r-name { font-size: 13.5px; font-weight: 650; color: var(--ink-900); }
.r-code { font-size: 11px; color: var(--text-faint); margin-top: 2px; }
.cap-line { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
.cap-num { font-size: 13px; font-weight: 650; color: var(--text); font-variant-numeric: tabular-nums; }
.cap-sep { color: var(--text-faint); font-weight: 400; }
.cap-pct { font-size: 11px; color: var(--text-faint); }
.cap-bar { height: 6px; border-radius: 4px; background: var(--border); overflow: hidden; }
.cap-bar span { display: block; height: 100%; border-radius: 4px; background: linear-gradient(90deg, var(--brand-500), var(--brand-600)); transition: width 0.3s ease; }
.cap-bar span.full { background: linear-gradient(90deg, var(--amber), var(--coral)); }
.online-pill { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--success); background: #e7f8f1; padding: 3px 11px; border-radius: 20px; }
.online-pill.zero { color: var(--text-faint); background: var(--surface-2); }
.online-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.r-time { font-size: 12px; color: var(--text-muted); }
.empty-block { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 46px 0; color: var(--text-faint); }
.empty-block p { margin: 0; font-size: 13px; }

.detail-hero { display: flex; align-items: center; gap: 15px; margin-bottom: 22px; }
.detail-icon { width: 56px; height: 56px; border-radius: 16px; flex: none; display: grid; place-items: center; color: #fff; background: linear-gradient(135deg, var(--brand-500), var(--brand-700)); }
.detail-name { font-size: 18px; font-weight: 750; color: var(--ink-900); }
.detail-code { font-size: 12px; color: var(--text-faint); margin-top: 4px; }
.detail-desc { margin-bottom: 24px; }
.member-head { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 650; color: var(--ink-900); margin-bottom: 12px; }
.member-list { display: flex; flex-direction: column; gap: 4px; max-height: 300px; overflow-y: auto; margin-bottom: 24px; }
.member-row { display: flex; align-items: center; gap: 11px; padding: 9px 10px; border-radius: 11px; transition: background 0.15s ease; }
.member-row:hover { background: var(--brand-50); }
.m-avatar { width: 32px; height: 32px; border-radius: 9px; flex: none; display: grid; place-items: center; color: #fff; font-weight: 700; font-size: 13px; }
.m-name { flex: 1; font-size: 13px; font-weight: 600; color: var(--text); }
.m-status { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-faint); }
.m-status.on { color: var(--success); font-weight: 600; }
.m-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.detail-actions { display: flex; justify-content: flex-end; gap: 10px; }
.limit-tip { font-size: 13.5px; color: var(--text-muted); line-height: 1.8; margin: 0 0 18px; }
.limit-tip b { color: var(--ink-900); }
.limit-input { width: 100%; }
</style>
