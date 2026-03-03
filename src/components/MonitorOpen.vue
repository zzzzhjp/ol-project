<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import * as echarts from 'echarts'

let chart: echarts.ECharts
const monitorOpen = ref()

const { data } = defineProps<{
  data: Record<string, number>
}>()

const openNum = computed(() => data.on || 0)
const allNum = computed(() => data.on + data.off || 0)

const updateChart = () => {
  if (!chart) return
  chart.setOption({
    title: {
      text: '已启动设备数',
      textStyle: {
        color: '#ededed',
      },
      top: 20,
      left: 20,
    },
    tooltip: {},
    series: [
      {
        name: '启动设备',
        type: 'gauge',
        center: ['50%', '60%'],
        max: allNum.value,
        splitNumber: 1,
        axisTick: {
          show: false,
        },
        splitLine: {
          distance: 0,
          length: 5,
          lineStyle: {
            width: 1,
            color: '#ededed',
          },
        },
        axisLabel: {
          distance: 15,
          color: '#ededed',
          fontSize: 12,
        },
        progress: {
          show: true,
        },
        detail: {
          valueAnimation: true,
          formatter: '{value}',
          color: '#ededed',
          fontSize: 20,
          offsetCenter: [0, '60%'],
        },
        data: [
          {
            value: openNum.value,
            name: '启动数',
            title: {
              color: '#ededed',
              offsetCenter: [0, '30%'],
            },
          },
        ],
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
  if (monitorOpen.value) {
    chart = echarts.init(monitorOpen.value)
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
  <div ref="monitorOpen" class="monitor-open"></div>
</template>
<style scoped>
.monitor-open {
  width: 100%;
  height: 100%;
}
</style>
