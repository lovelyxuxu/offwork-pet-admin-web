<template>
  <span class="status-tag" :class="status">
    <span class="dot"></span>{{ meta.label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { statusMeta } from '../utils/format'

const props = defineProps({ status: { type: String, default: 'offline' } })
const meta = computed(() => statusMeta(props.status))
</script>

<style scoped>
.status-tag { display: inline-flex; align-items: center; gap: 6px; padding: 3px 11px; border-radius: 20px; font-size: 12px; font-weight: 600; line-height: 1.6; white-space: nowrap; }
.dot { width: 7px; height: 7px; border-radius: 50%; flex: none; }
.available { background: #e7f8f1; color: #0b8a5f; }
.available .dot { background: #10b981; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.16); }
.paused { background: #fdf3e0; color: #b06f08; }
.paused .dot { background: #f59e0b; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.16); }
.offline { background: #f1eff2; color: #8b8595; }
.offline .dot { background: #b3adbd; }
</style>