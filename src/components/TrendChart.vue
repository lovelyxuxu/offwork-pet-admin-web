<template>
  <div class="trend-wrap">
    <div ref="el" class="trend-chart"></div>
    <div v-if="!points.length" class="trend-empty">
      <el-icon :size="26"><TrendCharts /></el-icon>
      <span>正在采集在线数据，稍候片刻…</span>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

const props = defineProps({ points: { type: Array, default: () => [] } })
const el = ref(null)
let chart = null
let observer = null

function render() {
  if (!chart) return
  const data = props.points.map((p) => [p.t * 1000, p.online])
  chart.setOption({
    grid: { left: 40, right: 18, top: 24, bottom: 30 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(30,27,58,0.92)',
      borderWidth: 0,
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (params) => {
        const p = params[0]
        const d = new Date(p.value[0])
        const pad = (n) => String(n).padStart(2, '0')
        return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}<br/>在线 <b>${p.value[1]}</b> 台`
      },
    },
    xAxis: {
      type: 'time',
      axisLine: { lineStyle: { color: '#e8e4da' } },
      axisLabel: { color: '#837d92', fontSize: 11, hideOverlap: true },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value', minInterval: 1, min: 0,
      axisLabel: { color: '#837d92', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f0ede6' } },
    },
    series: [{
      type: 'line', data, smooth: true, showSymbol: false, symbolSize: 6,
      lineStyle: { width: 3, color: '#6c5ce7' },
      itemStyle: { color: '#6c5ce7' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(124,108,240,0.32)' },
          { offset: 1, color: 'rgba(124,108,240,0.02)' },
        ]),
      },
    }],
  })
}

onMounted(() => {
  chart = echarts.init(el.value)
  render()
  observer = new ResizeObserver(() => chart && chart.resize())
  observer.observe(el.value)
})
watch(() => props.points, render, { deep: true })
onBeforeUnmount(() => {
  observer && observer.disconnect()
  chart && chart.dispose()
  chart = null
})
</script>

<style scoped>
.trend-wrap { position: relative; }
.trend-chart { width: 100%; height: 260px; }
.trend-empty {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 10px;
  color: var(--text-faint); font-size: 13px; pointer-events: none;
}
</style>