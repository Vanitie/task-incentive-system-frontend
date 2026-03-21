<template>
  <div class="risk-dashboard">
    <el-row :gutter="16">
      <el-col
        v-for="card in metricCards"
        :key="card.key"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="4"
      >
        <el-card shadow="hover" class="metric-card">
          <div class="metric-title">{{ card.title }}</div>
          <div class="metric-value">{{ card.value }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="trend-card" shadow="never">
      <template #header>
        <div class="header-row">
          <span>风控趋势图（最近7天）</span>
          <el-button
            :loading="loadingTrend"
            text
            type="primary"
            @click="fetchTrend"
            >刷新</el-button
          >
        </div>
      </template>
      <div ref="trendChartRef" class="chart-wrap" />
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="header-row">
          <span>日趋势明细</span>
        </div>
      </template>
      <el-table v-loading="loadingTrend" :data="trendList" border>
        <el-table-column prop="date" label="日期" width="130" />
        <el-table-column prop="total" label="总决策数" min-width="120" />
        <el-table-column prop="pass" label="放行数" min-width="100" />
        <el-table-column prop="reject" label="拒绝数" min-width="100" />
        <el-table-column prop="degradePass" label="降级放行" min-width="110" />
        <el-table-column prop="review" label="人工复核" min-width="100" />
        <el-table-column prop="freeze" label="冻结" min-width="100" />
        <el-table-column prop="interceptRate" label="拦截率" min-width="100">
          <template #default="scope">{{
            formatRate(scope.row.interceptRate)
          }}</template>
        </el-table-column>
        <el-table-column prop="passRate" label="放行率" min-width="100">
          <template #default="scope">{{
            formatRate(scope.row.passRate)
          }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import * as echarts from "echarts";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from "vue";
import { ElMessage } from "element-plus";
import {
  getRiskDashboardDailyTrend,
  getRiskDashboardOverview,
  type RiskDashboardOverview,
  type RiskDailyTrendItem
} from "@/api/risk";

type MetricCard = { key: string; title: string; value: string };

const loadingOverview = ref(false);
const loadingTrend = ref(false);
const overview = ref<RiskDashboardOverview>({
  total: 0,
  pass: 0,
  reject: 0,
  degradePass: 0,
  review: 0,
  freeze: 0,
  interceptRate: 0,
  passRate: 0,
  avgLatencyMs: 0,
  p95LatencyMs: 0,
  p99LatencyMs: 0
});
const trendList = ref<
  Array<RiskDailyTrendItem & { passRate: number; interceptRate: number }>
>([]);
const trendChartRef = ref<HTMLElement | null>(null);
let trendChart: echarts.ECharts | null = null;

const metricCards = computed<MetricCard[]>(() => [
  {
    key: "totalDecisions",
    title: "总决策数",
    value: String(overview.value.total)
  },
  {
    key: "interceptRate",
    title: "拦截率",
    value: formatRate(overview.value.interceptRate)
  },
  {
    key: "passRate",
    title: "放行率",
    value: formatRate(overview.value.passRate)
  },
  {
    key: "p95",
    title: "P95耗时",
    value: `${overview.value.p95LatencyMs} ms`
  },
  {
    key: "p99",
    title: "P99耗时",
    value: `${overview.value.p99LatencyMs} ms`
  }
]);

function unwrapData<T>(payload: T | { data?: T }): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    const wrapped = payload as { data?: T };
    return (wrapped.data ?? payload) as T;
  }
  return payload as T;
}

function formatRate(value: number) {
  return `${(Number(value) * 100).toFixed(2)}%`;
}

function initTrendChart() {
  if (!trendChartRef.value) return;
  trendChart = echarts.init(trendChartRef.value);
  renderTrendChart();
}

function renderTrendChart() {
  if (!trendChart) return;

  const dateLabels = trendList.value.map(item => item.date.slice(5));
  const passRateData = trendList.value.map(item =>
    Number((item.passRate * 100).toFixed(2))
  );
  const interceptRateData = trendList.value.map(item =>
    Number((item.interceptRate * 100).toFixed(2))
  );

  trendChart.setOption({
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      valueFormatter: (value: number | string) => `${value}%`
    },
    legend: {
      top: 0,
      right: 0,
      itemWidth: 12,
      itemHeight: 8,
      textStyle: {
        color: "#606266"
      }
    },
    grid: {
      left: 42,
      right: 24,
      top: 48,
      bottom: 28
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: dateLabels,
      axisLine: {
        lineStyle: {
          color: "#dcdfe6"
        }
      },
      axisTick: {
        show: false
      }
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLabel: {
        formatter: "{value}%"
      },
      splitLine: {
        lineStyle: {
          color: "#ebeef5"
        }
      }
    },
    series: [
      {
        name: "放行率",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 7,
        data: passRateData,
        lineStyle: {
          width: 3,
          color: "#2d7ff9"
        },
        areaStyle: {
          color: "rgba(45,127,249,0.16)"
        }
      },
      {
        name: "拦截率",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 7,
        data: interceptRateData,
        lineStyle: {
          width: 3,
          color: "#f56c6c"
        },
        areaStyle: {
          color: "rgba(245,108,108,0.16)"
        }
      }
    ]
  });
}

function resizeTrendChart() {
  trendChart?.resize();
}

async function fetchOverview() {
  loadingOverview.value = true;
  try {
    const response = await getRiskDashboardOverview();
    overview.value = unwrapData(response);
  } catch {
    ElMessage.error("加载风控看板概览失败");
  } finally {
    loadingOverview.value = false;
  }
}

async function fetchTrend() {
  loadingTrend.value = true;
  try {
    const response = await getRiskDashboardDailyTrend();
    const data = unwrapData(response);
    const list = Array.isArray(data) ? data : [];
    trendList.value = list.map(item => {
      const total = Number(item.total) || 0;
      const passRate = total > 0 ? Number(item.pass || 0) / total : 0;
      const interceptCount =
        Number(item.reject || 0) +
        Number(item.degradePass || 0) +
        Number(item.review || 0) +
        Number(item.freeze || 0);
      const interceptRate = total > 0 ? interceptCount / total : 0;
      return {
        ...item,
        passRate,
        interceptRate
      };
    });
  } catch {
    ElMessage.error("加载风控趋势数据失败");
  } finally {
    loadingTrend.value = false;
  }
}

onMounted(() => {
  nextTick(() => {
    initTrendChart();
    window.addEventListener("resize", resizeTrendChart);
  });
  fetchOverview();
  fetchTrend();
});

watch(trendList, () => {
  renderTrendChart();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeTrendChart);
  trendChart?.dispose();
  trendChart = null;
});
</script>

<style scoped>
.risk-dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.metric-card {
  min-height: 110px;
}

.metric-title {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.metric-value {
  margin-top: 16px;
  font-size: 26px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.trend-card {
  overflow: hidden;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chart-wrap {
  width: 100%;
  height: 320px;
}

@media (max-width: 768px) {
  .metric-value {
    font-size: 22px;
  }
}
</style>
