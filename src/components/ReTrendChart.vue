<script setup lang="ts">
import { ref, watch, onMounted, type PropType } from "vue";
import { useDark, useECharts } from "@pureadmin/utils";

const props = defineProps({
  xAxis: {
    type: Array as PropType<string[]>,
    required: true
  },
  series: {
    type: Array as PropType<Array<{ name: string; data: number[] }>>,
    required: true
  },
  height: {
    type: String,
    default: "320px"
  }
});

const chartRef = ref();
const { isDark } = useDark();
const theme = ref(isDark.value ? "dark" : "light");

const renderChart = () => {
  const option = {
    tooltip: {
      trigger: "axis" as const
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
      type: "category" as const,
      boundaryGap: false,
      data: props.xAxis
    },
    yAxis: {
      type: "value" as const
    },
    series: props.series.map(s => ({
      name: s.name,
      type: "line" as const,
      data: s.data,
      smooth: true
    }))
  };
  useECharts(chartRef, { theme }).setOptions(option);
};

watch(() => [props.xAxis, props.series], renderChart, { deep: true });
onMounted(renderChart);
</script>
<template>
  <div ref="chartRef" :style="`width:100%;height:${height}`" />
</template>
