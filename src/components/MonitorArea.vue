<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import * as echarts from 'echarts'

let chart: echarts.ECharts
const monitorArea = ref()

const { data } = defineProps<{
  data: Record<string, number>
}>()

const pieData = computed(() => {
  const area = Math.round((data.monitorArea / data.allArea) * 100)
  const unArea = 100 - area
  return [
    { value: area, name: '已监测面积' },
    { value: unArea, name: '未监测面积' },
  ]
})

const updateChart = () => {
  if (!chart) return
  chart.setOption({
    title: {
      text: '监测面积覆盖率',
      textStyle: {
        color: '#ededed',
      },
      top: 20,
      left: 20,
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br />{b}: {d}%',
    },
    series: [
      {
        name: '覆盖率',
        type: 'pie',
        radius: '60%',
        label: {
          fontSize: 14,
          color: '#ededed',
        },
        data: pieData.value,
      },
    ],
  })
}

const resizeChart = () => {
  chart?.resize()
}

watch(
  () => data,
  () => {
    updateChart()
  },
  { deep: true },
)

onMounted(() => {
  if (monitorArea.value) {
    chart = echarts.init(monitorArea.value)
    updateChart()
    window.addEventListener('resize', resizeChart)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeChart)
  chart?.dispose()
})
</script>
<template>
  <div ref="monitorArea" class="monitor-area"></div>
</template>
<style scoped>
.monitor-area {
  width: 100%;
  height: 100%;
}
</style>
