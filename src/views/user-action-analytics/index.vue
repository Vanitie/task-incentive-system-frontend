<template>
  <div class="user-action-analytics-page">
    <el-card shadow="never">
      <el-form :inline="true" class="toolbar">
        <el-form-item label="统计区间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
          />
        </el-form-item>
        <el-form-item label="趋势粒度">
          <el-select v-model="granularity" style="width: 120px">
            <el-option label="按天" value="DAY" />
            <el-option label="按小时" value="HOUR" />
          </el-select>
        </el-form-item>
        <el-button type="primary" :loading="loading" @click="fetchAll"
          >刷新分析</el-button
        >
      </el-form>
    </el-card>

    <div class="metric-grid">
      <el-card shadow="hover" class="metric-card">
        <div class="metric-title">完成率</div>
        <div class="metric-value">
          {{ formatPercent(conversion.completionRate) }}
        </div>
      </el-card>
      <el-card shadow="hover" class="metric-card">
        <div class="metric-title">领奖率</div>
        <div class="metric-value">
          {{ formatPercent(resolveRewardClaimRate(conversion)) }}
        </div>
      </el-card>
      <el-card shadow="hover" class="metric-card">
        <div class="metric-title">人均行为次数</div>
        <div class="metric-value">
          {{ Number(conversion.avgActionsPerUser || 0).toFixed(2) }}
        </div>
      </el-card>
    </div>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="16">
        <el-card shadow="never" header="行为总量趋势">
          <div ref="trendRef" class="chart-box" />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card shadow="never" header="行为类型占比">
          <div ref="ratioRef" class="chart-box" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" header="用户分层行为（堆叠柱状图）">
          <div ref="layerRef" class="chart-box" />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" header="时间热力图（7x24）">
          <div ref="heatmapRef" class="chart-box" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import * as echarts from "echarts";
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import { ElMessage } from "element-plus";
import {
  getActionTrend,
  getActionTypeRatio,
  getActionUserLayer,
  getActionHeatmap,
  getActionConversion,
  type ConversionDashboard,
  type TrendPoint,
  type TypeRatioItem,
  type UserLayerItem,
  type HeatmapCell
} from "@/api/user-action-log";

const loading = ref(false);
const dateRange = ref<[string, string] | []>([]);
const granularity = ref<"DAY" | "HOUR">("DAY");

const conversion = ref<ConversionDashboard>({
  completionRate: 0,
  rewardClaimRate: 0,
  avgActionsPerUser: 0
});

const trendData = ref<TrendPoint[]>([]);
const ratioData = ref<TypeRatioItem[]>([]);
const layerData = ref<UserLayerItem[]>([]);
const heatmapData = ref<HeatmapCell[]>([]);

const trendRef = ref<HTMLElement | null>(null);
const ratioRef = ref<HTMLElement | null>(null);
const layerRef = ref<HTMLElement | null>(null);
const heatmapRef = ref<HTMLElement | null>(null);

let trendChart: echarts.ECharts | null = null;
let ratioChart: echarts.ECharts | null = null;
let layerChart: echarts.ECharts | null = null;
let heatmapChart: echarts.ECharts | null = null;

const actionTypeLabelMap: Record<string, string> = {
  USER_SIGN: "签到",
  USER_LEARN: "学习",
  USER_TASK_ACCEPT: "接任务",
  USER_TASK_COMPLETE: "完成任务",
  USER_REWARD_CLAIM: "领奖",
  OTHER: "其他"
};

function unwrapData<T>(payload: T | { data?: T }): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return ((payload as { data?: T }).data ?? payload) as T;
  }
  return payload as T;
}

function buildQuery() {
  const params: Record<string, any> = { granularity: granularity.value };
  if (dateRange.value.length === 2) {
    params.startTime = dateRange.value[0];
    params.endTime = dateRange.value[1];
  }
  return params;
}

function formatPercent(value?: number) {
  const n = Number(value || 0);
  return `${n.toFixed(2)}%`;
}

function resolveTrendLabel(item: TrendPoint) {
  return String(item.time || item.bucket || "-");
}

function resolveTrendCount(item: TrendPoint) {
  return Number(item.count ?? item.value ?? 0);
}

function resolveType(item: TypeRatioItem) {
  const raw = String(item.actionType || item.type || "OTHER");
  return actionTypeLabelMap[raw] || raw;
}

function resolveRatioCount(item: TypeRatioItem) {
  return Number(item.count || 0);
}

function resolveLayer(item: UserLayerItem) {
  return String(item.layer || item.layerType || "未知层");
}

function resolveHeatmapDay(item: HeatmapCell) {
  return Number(item.dayOfWeek ?? item.day ?? 0);
}

function resolveHeatmapHour(item: HeatmapCell) {
  return Number(item.hourOfDay ?? item.hour ?? 0);
}

function resolveHeatmapCount(item: HeatmapCell) {
  return Number(item.count ?? item.value ?? 0);
}

function resolveRewardClaimRate(item: ConversionDashboard) {
  return Number(item.rewardClaimRate ?? item.rewardRate ?? 0);
}

function renderTrendChart() {
  if (!trendChart) return;
  trendChart.setOption({
    tooltip: { trigger: "axis" },
    grid: { left: 46, right: 20, top: 30, bottom: 40 },
    xAxis: {
      type: "category",
      data: trendData.value.map(resolveTrendLabel),
      axisLabel: { rotate: granularity.value === "HOUR" ? 35 : 0 }
    },
    yAxis: { type: "value" },
    series: [
      {
        name: "行为总量",
        type: "line",
        smooth: true,
        data: trendData.value.map(resolveTrendCount),
        lineStyle: { width: 3, color: "#2d7ff9" },
        areaStyle: { color: "rgba(45,127,249,0.12)" }
      }
    ]
  });
}

function renderRatioChart() {
  if (!ratioChart) return;
  const data = ratioData.value.map(item => ({
    name: resolveType(item),
    value: resolveRatioCount(item)
  }));
  ratioChart.setOption({
    tooltip: { trigger: "item" },
    legend: { bottom: 0 },
    series: [
      {
        type: "pie",
        radius: ["42%", "70%"],
        center: ["50%", "42%"],
        data,
        label: { formatter: "{b}: {d}%" }
      }
    ]
  });
}

function renderLayerChart() {
  if (!layerChart) return;
  const xAxis = layerData.value.map(resolveLayer);
  layerChart.setOption({
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { top: 0 },
    grid: { left: 46, right: 20, top: 40, bottom: 30 },
    xAxis: { type: "category", data: xAxis },
    yAxis: { type: "value" },
    series: [
      {
        name: "学习",
        type: "bar",
        stack: "total",
        data: layerData.value.map(item => Number(item.learnCount || 0))
      },
      {
        name: "签到",
        type: "bar",
        stack: "total",
        data: layerData.value.map(item => Number(item.signCount || 0))
      },
      {
        name: "接任务",
        type: "bar",
        stack: "total",
        data: layerData.value.map(item => Number(item.taskAcceptCount || 0))
      },
      {
        name: "领奖",
        type: "bar",
        stack: "total",
        data: layerData.value.map(item => Number(item.rewardClaimCount || 0))
      }
    ]
  });
}

function renderHeatmapChart() {
  if (!heatmapChart) return;
  const days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  const hours = Array.from({ length: 24 }, (_, i) => `${i}`);
  const data = heatmapData.value.map(item => [
    resolveHeatmapHour(item),
    Math.max(resolveHeatmapDay(item) - 1, 0),
    resolveHeatmapCount(item)
  ]);
  const maxValue = Math.max(1, ...data.map(d => Number(d[2] || 0)));

  heatmapChart.setOption({
    tooltip: {
      position: "top",
      formatter: params => {
        const v = params.value as [number, number, number];
        return `${days[v[1]]} ${v[0]}:00 - ${v[2]} 次`;
      }
    },
    grid: { left: 60, right: 20, top: 20, bottom: 40 },
    xAxis: { type: "category", data: hours, splitArea: { show: true } },
    yAxis: { type: "category", data: days, splitArea: { show: true } },
    visualMap: {
      min: 0,
      max: maxValue,
      calculable: true,
      orient: "horizontal",
      left: "center",
      bottom: 0
    },
    series: [
      {
        name: "行为次数",
        type: "heatmap",
        data,
        label: { show: false },
        emphasis: {
          itemStyle: { shadowBlur: 8, shadowColor: "rgba(0,0,0,0.35)" }
        }
      }
    ]
  });
}

function initCharts() {
  if (trendRef.value) trendChart = echarts.init(trendRef.value);
  if (ratioRef.value) ratioChart = echarts.init(ratioRef.value);
  if (layerRef.value) layerChart = echarts.init(layerRef.value);
  if (heatmapRef.value) heatmapChart = echarts.init(heatmapRef.value);
}

function renderCharts() {
  renderTrendChart();
  renderRatioChart();
  renderLayerChart();
  renderHeatmapChart();
}

function resizeCharts() {
  trendChart?.resize();
  ratioChart?.resize();
  layerChart?.resize();
  heatmapChart?.resize();
}

async function fetchAll() {
  loading.value = true;
  try {
    const params = buildQuery();
    const [trendRes, ratioRes, layerRes, heatmapRes, conversionRes] =
      await Promise.all([
        getActionTrend(params),
        getActionTypeRatio(params),
        getActionUserLayer(params),
        getActionHeatmap(params),
        getActionConversion(params)
      ]);

    trendData.value = unwrapData(trendRes) || [];
    ratioData.value = unwrapData(ratioRes) || [];
    layerData.value = unwrapData(layerRes) || [];
    heatmapData.value = unwrapData(heatmapRes) || [];
    conversion.value = unwrapData(conversionRes) || {};

    await nextTick();
    renderCharts();
  } catch {
    ElMessage.error("加载用户行为分析失败");
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  initCharts();
  await fetchAll();
  window.addEventListener("resize", resizeCharts);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeCharts);
  trendChart?.dispose();
  ratioChart?.dispose();
  layerChart?.dispose();
  heatmapChart?.dispose();
});
</script>

<style scoped>
.user-action-analytics-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar {
  margin-bottom: -18px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.metric-title {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.metric-value {
  margin-top: 6px;
  font-size: 26px;
  font-weight: 600;
}

.chart-box {
  width: 100%;
  height: 320px;
}

@media (max-width: 900px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
