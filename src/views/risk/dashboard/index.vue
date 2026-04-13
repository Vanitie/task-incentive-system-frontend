<template>
  <div class="risk-dashboard">
    <div class="metric-grid">
      <el-card
        v-for="card in metricCards"
        :key="card.key"
        shadow="hover"
        class="metric-card"
      >
        <div class="metric-title">{{ card.title }}</div>
        <div class="metric-value">{{ card.value }}</div>
        <div class="metric-sub-value">{{ card.subValue || "\u00A0" }}</div>
      </el-card>
    </div>

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
type DecisionStatus = "PASS" | "REJECT" | "DEGRADE_PASS" | "REVIEW" | "FREEZE";
type MetricCardExt = MetricCard & { subValue?: string };
type TrendRow = RiskDailyTrendItem & {
  pass: number;
  reject: number;
  degradePass: number;
  review: number;
  freeze: number;
  passRate: number;
  interceptRate: number;
};

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
const trendList = ref<TrendRow[]>([]);
const trendChartRef = ref<HTMLElement | null>(null);
let trendChart: echarts.ECharts | null = null;

const STATUS_ORDER: DecisionStatus[] = [
  "PASS",
  "REJECT",
  "DEGRADE_PASS",
  "REVIEW",
  "FREEZE"
];

const STATUS_LABEL_MAP: Record<DecisionStatus, string> = {
  PASS: "放行",
  REJECT: "拒绝",
  DEGRADE_PASS: "降级放行",
  REVIEW: "人工复核",
  FREEZE: "冻结"
};

const STATUS_COLOR_MAP: Record<DecisionStatus, string> = {
  PASS: "#2d7ff9",
  REJECT: "#f56c6c",
  DEGRADE_PASS: "#e6a23c",
  REVIEW: "#909399",
  FREEZE: "#7c3aed"
};

const metricCards = computed<MetricCardExt[]>(() => {
  const statusCards = STATUS_ORDER.map(status => {
    const count = getStatusCount(
      overview.value.statusCounts,
      status,
      getLegacyOverviewCount(status)
    );
    const rate = Number(overview.value.statusRates?.[status] ?? 0);
    return {
      key: status,
      title: STATUS_LABEL_MAP[status],
      value: String(count),
      subValue: `${formatRate(rate)} · 占比`
    };
  });

  return [
    {
      key: "total",
      title: "决策总数",
      value: String(overview.value.total)
    },
    ...statusCards,
    {
      key: "avgLatency",
      title: "平均耗时",
      value: `${Number(overview.value.avgLatencyMs || 0).toFixed(2)} ms`
    },
    {
      key: "p95Latency",
      title: "P95耗时",
      value: `${Number(overview.value.p95LatencyMs || 0).toFixed(2)} ms`
    },
    {
      key: "p99Latency",
      title: "P99耗时",
      value: `${Number(overview.value.p99LatencyMs || 0).toFixed(2)} ms`
    }
  ];
});

function unwrapData<T>(payload: T | { data?: T }): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    const wrapped = payload as { data?: T };
    return (wrapped.data ?? payload) as T;
  }
  return payload as T;
}

function formatRate(value: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0.00%";
  return `${numeric.toFixed(2)}%`;
}

function getLegacyOverviewCount(status: DecisionStatus) {
  if (status === "PASS") return overview.value.pass;
  if (status === "REJECT") return overview.value.reject;
  if (status === "DEGRADE_PASS") return overview.value.degradePass;
  if (status === "REVIEW") return overview.value.review;
  return overview.value.freeze;
}

function getStatusCount(
  statusCounts: Record<string, number> | undefined,
  key: DecisionStatus,
  fallback: number | undefined
) {
  const count = statusCounts?.[key];
  if (Number.isFinite(Number(count))) return Number(count);
  return Number(fallback || 0);
}

function initTrendChart() {
  if (!trendChartRef.value) return;
  trendChart = echarts.init(trendChartRef.value);
  renderTrendChart();
}

function renderTrendChart() {
  if (!trendChart) return;

  const dateLabels = trendList.value.map(item => item.date.slice(5));
  const series = STATUS_ORDER.map(status => {
    const data = trendList.value.map(item => {
      if (status === "PASS") return item.pass;
      if (status === "REJECT") return item.reject;
      if (status === "DEGRADE_PASS") return item.degradePass;
      if (status === "REVIEW") return item.review;
      return item.freeze;
    });

    return {
      name: STATUS_LABEL_MAP[status],
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 7,
      data,
      lineStyle: {
        width: 3,
        color: STATUS_COLOR_MAP[status]
      },
      areaStyle: {
        color: "transparent"
      }
    };
  });

  trendChart.setOption({
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis"
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
      splitLine: {
        lineStyle: {
          color: "#ebeef5"
        }
      }
    },
    series
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
      const pass = getStatusCount(item.statusCounts, "PASS", item.pass);
      const reject = getStatusCount(item.statusCounts, "REJECT", item.reject);
      const degradePass = getStatusCount(
        item.statusCounts,
        "DEGRADE_PASS",
        item.degradePass
      );
      const review = getStatusCount(item.statusCounts, "REVIEW", item.review);
      const freeze = getStatusCount(item.statusCounts, "FREEZE", item.freeze);
      const interceptCount = reject + degradePass + review + freeze;
      const passRate = total > 0 ? (pass / total) * 100 : 0;
      const interceptRate = total > 0 ? (interceptCount / total) * 100 : 0;
      return {
        ...item,
        pass,
        reject,
        degradePass,
        review,
        freeze,
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

.metric-grid {
  display: grid;
  grid-template-columns: repeat(9, minmax(0, 1fr));
  gap: 12px;
}

.metric-card {
  min-height: 110px;
}

.metric-card :deep(.el-card__body) {
  padding: 12px;
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

.metric-sub-value {
  margin-top: 6px;
  min-height: 18px;
  line-height: 18px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
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

@media (max-width: 1680px) {
  .metric-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

@media (max-width: 1280px) {
  .metric-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }

  .metric-value {
    font-size: 22px;
  }
}
</style>
