<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import * as echarts from 'echarts'

let chart: echarts.ECharts
const monthCount = ref()

const { data } = defineProps<{
  data: Record<string, number>
}>()

const xAxisData = computed(() => Object.keys(data))
const seriesData = computed(() => Object.values(data))

const updateChart = () => {
  if (!chart) return
  chart.setOption({
    title: {
      text: '每月监测统计',
      textStyle: {
        color: '#ededed',
      },
      top: 20,
      left: 20,
    },
    tooltip: {},
    grid: {
      bottom: 40,
      top: 70,
    },
    xAxis: {
      data: xAxisData.value,
      boundaryGap: false,
      axisLabel: {
        color: '#ededed',
      },
    },
    yAxis: {
      axisLabel: {
        color: '#ededed',
      },
    },
    series: [
      {
        name: '监测统计',
        type: 'line',
        data: seriesData.value,
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
  if (monthCount.value) {
    chart = echarts.init(monthCount.value)
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
  <div ref="monthCount" class="month-count"></div>
</template>
<style scoped>
.month-count {
  width: 100%;
  height: 100%;
}
</style>
