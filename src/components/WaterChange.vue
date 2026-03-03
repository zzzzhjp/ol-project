<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import * as echarts from 'echarts'

let chart: echarts.ECharts
const waterChange = ref()

const { data } = defineProps<{
  data: Record<string, number>
}>()

const xAxisData = computed(() => Object.keys(data))
const seriesData = computed(() => Object.values(data))

const updateChart = () => {
  if (!chart) return
  chart.setOption({
    title: {
      text: '24小时水情变化',
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
        name: '水位(米)',
        type: 'line',
        smooth: true,
        data: seriesData.value,
        areaStyle: {
          color: 'rgba(0, 136, 212, 0.2)',
        },
        lineStyle: {
          color: '#00c0ff',
        },
        itemStyle: {
          color: '#00eaff',
        },
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
  if (waterChange.value) {
    chart = echarts.init(waterChange.value)
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
  <div ref="waterChange" class="water-change"></div>
</template>
<style scoped>
.water-change {
  width: 100%;
  height: 100%;
}
</style>
