<template>
  <div class="stat-card" :style="{ '--accent': accent, '--accent-soft': accentSoft }">
    <div class="stat-icon">
      <el-icon :size="22"><component :is="icon" /></el-icon>
    </div>
    <div class="stat-body">
      <div class="stat-value">{{ display }}</div>
      <div class="stat-label">{{ label }}</div>
    </div>
    <div class="stat-glow"></div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  label: { type: String, default: '' },
  value: { type: Number, default: 0 },
  icon: { type: [String, Object], default: 'DataLine' },
  accent: { type: String, default: '#6c5ce7' },
  accentSoft: { type: String, default: '#e9e5ff' },
})

const display = ref(0)
let frame = null

function animate(to) {
  if (frame) cancelAnimationFrame(frame)
  if (document.hidden) { display.value = to; return }
  const from = display.value
  const start = performance.now()
  const duration = 600
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration)
    const eased = 1 - Math.pow(1 - t, 3)
    display.value = Math.round(from + (to - from) * eased)
    if (t < 1) frame = requestAnimationFrame(step)
  }
  frame = requestAnimationFrame(step)
}

function onVisibility() {
  if (document.hidden) {
    if (frame) cancelAnimationFrame(frame)
    display.value = props.value
  }
}

watch(() => props.value, (v) => animate(v))
onMounted(() => {
  animate(props.value)
  document.addEventListener('visibilitychange', onVisibility)
})
onBeforeUnmount(() => {
  if (frame) cancelAnimationFrame(frame)
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<style scoped>
.stat-card {
  position: relative; overflow: hidden;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 20px 22px;
  display: flex; align-items: center; gap: 16px;
  box-shadow: var(--shadow-sm); transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.stat-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
.stat-icon {
  width: 50px; height: 50px; border-radius: 14px; flex: none;
  display: grid; place-items: center; color: var(--accent);
  background: var(--accent-soft);
}
.stat-body { min-width: 0; }
.stat-value { font-size: 30px; font-weight: 750; color: var(--ink-900); line-height: 1.1; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.stat-label { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
.stat-glow {
  position: absolute; right: -30px; top: -30px; width: 110px; height: 110px;
  border-radius: 50%; background: var(--accent); opacity: 0.08; filter: blur(6px); pointer-events: none;
}
</style>