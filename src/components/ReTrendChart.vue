<script setup lang="ts">
import { ref, watch, nextTick, computed, type PropType } from "vue";
import { useDark, useECharts } from "@pureadmin/utils";

const props = defineProps({
  xAxis: {
    type: Array as PropType<string[]>,
    default: () => []
  },
  series: {
    type: Array as PropType<Array<{ name: string; data: number[] }>>,
    default: () => []
  },
  height: {
    type: String,
    default: "320px"
  }
});

const { isDark } = useDark();
const theme = computed(() => (isDark.value ? "dark" : "light"));
const chartRef = ref();
const { setOptions } = useECharts(chartRef, {
  theme,
  renderer: "svg"
});

watch(
  () => [props.xAxis, props.series],
  async () => {
    await nextTick();
    setOptions({
      tooltip: {
        trigger: "axis"
      },
      legend: {
        data: props.series.map(s => s.name),
        top: 10
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "10%",
        containLabel: true
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: props.xAxis
      },
      yAxis: {
        type: "value"
      },
      series: props.series.map(s => ({
        name: s.name,
        type: "line",
        data: s.data,
        smooth: true,
        animation: false // 关闭逐点动画，整体刷新
      }))
    });
  },
  {
    deep: true,
    immediate: true
  }
);
</script>
<template>
  <div ref="chartRef" :style="`width:100%;height:${height}`" />
</template>
