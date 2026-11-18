<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h2 class="page-title">设备管理</h2>
        <p class="page-sub">查看与管理所有注册设备 · 每 8 秒自动刷新</p>
      </div>
      <div class="head-tools">
        <span class="live" :class="{ off: !fresh }"><span class="beat"></span>{{ fresh ? '实时同步中' : '同步中断' }}</span>
        <el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
      </div>
    </div>

    <div class="toolbar">
      <el-input v-model="search" placeholder="搜索备注 / 电脑名 / 用户名 / IP" :prefix-icon="Search" clearable class="search-input" />
      <el-select v-model="typeFilter" class="filter-select" aria-label="终端类型">
        <el-option label="全部终端" value="all" />
        <el-option label="手机端" value="mobile" />
        <el-option label="电脑端" value="desktop" />
      </el-select>
      <el-select v-model="statusFilter" class="filter-select">
        <el-option label="全部状态" value="all" />
        <el-option label="在线" value="available" />
        <el-option label="暂停" value="paused" />
        <el-option label="离线" value="offline" />
      </el-select>
      <el-select v-model="rallyFilter" class="filter-select">
        <el-option label="全部集会" value="all" />
        <el-option label="已加入集会" value="joined" />
        <el-option label="未加入集会" value="none" />
      </el-select>
      <el-select v-model="pairFilter" class="filter-select">
        <el-option label="全部配对" value="all" />
        <el-option label="已配对搭子" value="paired" />
        <el-option label="未配对" value="single" />
      </el-select>
      <div class="spacer"></div>
      <span class="count-pill">显示 {{ filtered.length }} / {{ devices.length }} 台</span>
    </div>

    <div class="card">
      <el-table :data="filtered" v-loading="loading && !devices.length" class="dev-table"
                :default-sort="{ prop: 'online_seconds', order: 'descending' }" @row-dblclick="openDetail">
        <el-table-column label="设备" min-width="220" sortable prop="device">
          <template #default="{ row }">
            <div class="dev-cell">
              <div class="dev-avatar" :style="{ background: avatarColor(row.admin_note || row.name || row.device) }">{{ avatarChar(row.admin_note || row.name || row.device) }}</div>
              <div class="dev-id">
                <div class="dev-name">{{ row.admin_note || row.name || '未命名搭子' }}</div>
                <div v-if="row.admin_note" class="dev-hash">{{ row.name || '未命名搭子' }}</div>
                <div class="dev-hash mono">{{ row.device }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="电脑 / 系统用户" min-width="190">
          <template #default="{ row }">
            <div>{{ row.device_info?.computer_name || '未上报' }}</div>
            <div class="dev-hash">{{ row.device_info?.system_user || '未上报' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="内网 IP" min-width="150">
          <template #default="{ row }"><span class="mono ip-text">{{ row.device_info?.lan_ips?.join(' / ') || '未上报' }}</span></template>
        </el-table-column>
        <el-table-column label="终端类型" width="110" prop="client_type" sortable>
          <template #default="{ row }"><span class="terminal-label" :class="{ mobile: row.client_type === 'mobile' }">{{ clientTypeLabel(row.client_type) }}</span></template>
        </el-table-column>
        <el-table-column label="角色" min-width="150" prop="character" sortable>
          <template #default="{ row }"><span class="mono char-text">{{ row.client_type === 'mobile' ? '—' : (row.character || '默认角色') }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="100" prop="status" sortable :sort-method="sortStatus">
          <template #default="{ row }"><StatusTag :status="row.status" /></template>
        </el-table-column>
        <el-table-column label="集会" min-width="130">
          <template #default="{ row }">
            <span v-if="row.rally" class="rally-chip"><el-icon :size="12"><ChatDotRound /></el-icon>{{ row.rally }}</span>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="搭子" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.paired" type="success" size="small" effect="light" round>已配对</el-tag>
            <el-tag v-else type="info" size="small" effect="plain" round>单身</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="连接来源 IP" min-width="130">
          <template #default="{ row }"><span class="mono ip-text">{{ row.ip || '—' }}</span></template>
        </el-table-column>
        <el-table-column label="在线时长" width="130" prop="online_seconds" sortable>
          <template #default="{ row }"><span class="dur-text">{{ row.status === 'offline' ? '—' : formatDuration(row.online_seconds) }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="openDetail(row)">详情</el-button>
            <el-button link type="danger" :icon="SwitchButton" :disabled="row.status === 'offline'" @click="kick(row)">踢下线</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty-block">
            <el-icon :size="38"><Monitor /></el-icon>
            <p>{{ devices.length ? '没有符合筛选条件的设备' : '还没有任何注册设备' }}</p>
          </div>
        </template>
      </el-table>
    </div>

    <el-drawer v-model="drawer" title="设备详情" size="420px" :destroy-on-close="true" append-to-body>
      <template v-if="current">
        <div class="detail-hero">
          <div class="detail-avatar" :style="{ background: avatarColor(current.admin_note || current.name || current.device) }">{{ avatarChar(current.admin_note || current.name || current.device) }}</div>
          <div class="detail-title">
            <div class="detail-name">{{ current.admin_note || current.name || '未命名搭子' }}</div>
            <StatusTag :status="current.status" />
          </div>
        </div>
        <el-form label-position="top" @submit.prevent="saveNote">
          <el-form-item label="使用人 / 管理员备注">
            <el-input v-model="noteDraft" maxlength="200" show-word-limit placeholder="例如：张三 · 财务部" />
          </el-form-item>
          <el-button type="primary" :loading="savingNote" @click="saveNote">保存备注</el-button>
        </el-form>
        <p class="metadata-hint">设备信息由客户端上报，仅管理员可见；离线时展示最后一次上报信息。</p>
        <el-descriptions :column="1" border class="detail-desc">
          <el-descriptions-item label="设备号"><span class="mono">{{ current.device_id || current.device }}</span></el-descriptions-item>
          <el-descriptions-item label="昵称 / 角色名">{{ current.name || '未命名搭子' }}</el-descriptions-item>
          <el-descriptions-item label="电脑名称">{{ current.device_info?.computer_name || '未上报' }}</el-descriptions-item>
          <el-descriptions-item label="系统用户名">{{ current.device_info?.system_user || '未上报' }}</el-descriptions-item>
          <el-descriptions-item label="内网 IP">{{ current.device_info?.lan_ips?.join(' / ') || '未上报' }}</el-descriptions-item>
          <el-descriptions-item label="操作系统">{{ current.device_info?.os_version || '未上报' }}</el-descriptions-item>
          <el-descriptions-item label="客户端版本">{{ current.device_info?.app_version || '未上报' }}</el-descriptions-item>
          <el-descriptions-item label="信息上报时间">{{ current.info_reported_at ? new Date(current.info_reported_at * 1000).toLocaleString() : '未上报' }}</el-descriptions-item>
          <el-descriptions-item label="角色包"><span class="mono">{{ current.character || '默认角色' }}</span></el-descriptions-item>
          <el-descriptions-item label="终端类型">{{ clientTypeLabel(current.client_type) }}</el-descriptions-item>
          <el-descriptions-item label="协议版本">{{ current.protocol ? 'v' + current.protocol : '—' }}</el-descriptions-item>
          <el-descriptions-item label="连接来源 IP"><span class="mono">{{ current.ip || '—' }}</span></el-descriptions-item>
          <el-descriptions-item label="在线时长">{{ current.status === 'offline' ? '—' : formatDuration(current.online_seconds) }}</el-descriptions-item>
          <el-descriptions-item label="所属集会">{{ current.rally || '未加入' }}</el-descriptions-item>
          <el-descriptions-item label="搭子配对">
            <el-tag :type="current.paired ? 'success' : 'info'" size="small" effect="light" round>{{ current.paired ? '已配对' : '未配对' }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <div class="detail-actions">
          <el-button type="danger" :icon="SwitchButton" :disabled="current.status === 'offline'" @click="kick(current)">
            {{ current.status === 'offline' ? '设备已离线' : '踢下线' }}
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, View, SwitchButton } from '@element-plus/icons-vue'
import { api } from '../api'
import { formatDuration, clientTypeLabel } from '../utils/format'
import StatusTag from '../components/StatusTag.vue'

const devices = ref([])
const loading = ref(false)
const fresh = ref(true)
const search = ref('')
const statusFilter = ref('all')
const typeFilter = ref('all')
const rallyFilter = ref('all')
const pairFilter = ref('all')
const drawer = ref(false)
const current = ref(null)
const noteDraft = ref('')
const savingNote = ref(false)
let timer = null

const STATUS_ORDER = { available: 0, paused: 1, offline: 2 }
function sortStatus(a, b) { return (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3) }

const PALETTE = ['#6c5ce7', '#f59e0b', '#fb7185', '#14b8a6', '#3b82f6', '#10b981']
function avatarChar(name) { return (name || '?').trim().charAt(0).toUpperCase() || '?' }
function avatarColor(seed) {
  let h = 0
  for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return PALETTE[h % PALETTE.length]
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return devices.value.filter((d) => {
    if (typeFilter.value !== 'all' && d.client_type !== typeFilter.value) return false
    if (statusFilter.value !== 'all' && d.status !== statusFilter.value) return false
    if (rallyFilter.value === 'joined' && !d.rally) return false
    if (rallyFilter.value === 'none' && d.rally) return false
    if (pairFilter.value === 'paired' && !d.paired) return false
    if (pairFilter.value === 'single' && d.paired) return false
    if (q) {
      const info = d.device_info || {}
      const hay = [d.device, d.device_id, d.name, d.admin_note, info.computer_name, info.system_user,
        ...(info.lan_ips || []), info.os_version, info.app_version, d.character, d.ip, d.rally,
        clientTypeLabel(d.client_type)].filter(Boolean).join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

async function load() {
  loading.value = true
  try {
    devices.value = await api.devices()
    fresh.value = true
    if (current.value) {
      const match = devices.value.find((d) => (d.device_id || d.device) === (current.value.device_id || current.value.device))
      if (match) current.value = match
    }
  } catch (e) {
    fresh.value = false
  } finally {
    loading.value = false
  }
}

function openDetail(row) { current.value = row; noteDraft.value = row.admin_note || ''; drawer.value = true }

async function saveNote() {
  if (!current.value?.device_id || savingNote.value) return
  const device = current.value.device_id
  savingNote.value = true
  try {
    await api.setDeviceNote(device, noteDraft.value)
    ElMessage.success('备注已保存')
    await load()
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    savingNote.value = false
  }
}

async function kick(row) {
  try {
    await ElMessageBox.confirm(
      `确定将设备 ${row.device}（${row.name || '未命名搭子'}）踢下线吗？该设备会立即断开连接。`,
      '踢下线确认',
      { type: 'warning', confirmButtonText: '踢下线', cancelButtonText: '取消', confirmButtonClass: 'el-button--danger' }
    )
  } catch (e) { return }
  try {
    await api.kick(row.device)
    ElMessage.success('已将该设备踢下线')
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
  await load()
}

onMounted(() => { load(); timer = setInterval(load, 8000) })
onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
.terminal-label { display: inline-block; padding: 3px 9px; border-radius: 7px; background: #eeedf3; color: #625c72; font-size: 12px; }
.terminal-label.mobile { background: #e4f4ed; color: #207952; }
.head-tools { display: flex; align-items: center; gap: 12px; }
.search-input { width: 300px; }
.filter-select { width: 140px; }
.dev-table { width: 100%; }
.dev-cell { display: flex; align-items: center; gap: 11px; }
.dev-avatar { width: 36px; height: 36px; border-radius: 10px; flex: none; display: grid; place-items: center; color: #fff; font-weight: 700; font-size: 14px; }
.dev-name { font-size: 13px; font-weight: 650; color: var(--ink-900); }
.dev-hash { font-size: 11px; color: var(--text-faint); margin-top: 2px; }
.char-text { font-size: 12px; color: var(--text-muted); }
.ip-text { font-size: 12px; color: var(--text-muted); }
.dur-text { font-size: 12.5px; color: var(--text); font-variant-numeric: tabular-nums; }
.muted { color: var(--text-faint); }
.rally-chip { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--brand-700); background: var(--brand-50); padding: 3px 10px; border-radius: 8px; font-weight: 600; }
.empty-block { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 46px 0; color: var(--text-faint); }
.empty-block p { margin: 0; font-size: 13px; }

.detail-hero { display: flex; align-items: center; gap: 15px; margin-bottom: 22px; }
.detail-avatar { width: 56px; height: 56px; border-radius: 16px; flex: none; display: grid; place-items: center; color: #fff; font-weight: 750; font-size: 22px; }
.detail-name { font-size: 18px; font-weight: 750; color: var(--ink-900); margin-bottom: 7px; }
.metadata-hint { color: var(--text-muted); font-size: 12px; line-height: 1.7; margin: 18px 0; }
.detail-desc { overflow-wrap: anywhere; }
.detail-desc { margin-bottom: 24px; }
.detail-desc :deep(.el-descriptions__label) { width: 96px; color: var(--text-muted); }
.detail-actions { display: flex; justify-content: flex-end; }
</style>
