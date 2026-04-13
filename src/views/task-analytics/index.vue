<template>
  <div class="task-analytics-page">
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
        <el-form-item label="任务类型">
          <el-select
            v-model="taskType"
            placeholder="全部"
            style="width: 160px"
            clearable
          >
            <el-option label="全部" value="" />
            <el-option label="累积任务" value="ACCUMULATE" />
            <el-option label="连续任务" value="CONTINUOUS" />
            <el-option label="阶梯任务" value="STAIR" />
            <el-option label="时间窗口累积任务" value="WINDOW_ACCUMULATE" />
          </el-select>
        </el-form-item>
        <el-form-item label="TopN">
          <el-input-number v-model="n" :min="5" :max="50" />
        </el-form-item>
        <el-form-item label="粒度">
          <el-select v-model="granularity" style="width: 120px">
            <el-option label="按天" value="DAY" />
            <el-option label="按小时" value="HOUR" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="fetchAll"
            >刷新分析</el-button
          >
        </el-form-item>
      </el-form>
    </el-card>

    <div class="metric-grid">
      <el-card shadow="hover" class="metric-card">
        <div class="metric-title">接取任务数</div>
        <div class="metric-value">
          {{ Number(overview.acceptedCount || 0) }}
        </div>
      </el-card>
      <el-card shadow="hover" class="metric-card">
        <div class="metric-title">完成任务数</div>
        <div class="metric-value">
          {{ Number(overview.completedCount || 0) }}
        </div>
      </el-card>
      <el-card shadow="hover" class="metric-card">
        <div class="metric-title">领奖任务数</div>
        <div class="metric-value">
          {{ Number(overview.rewardedCount || 0) }}
        </div>
      </el-card>
      <el-card shadow="hover" class="metric-card">
        <div class="metric-title">完成率</div>
        <div class="metric-value">
          {{ formatPercent(overview.completionRate) }}
        </div>
      </el-card>
      <el-card shadow="hover" class="metric-card">
        <div class="metric-title">领奖率</div>
        <div class="metric-value">{{ formatPercent(overview.rewardRate) }}</div>
      </el-card>
      <el-card shadow="hover" class="metric-card">
        <div class="metric-title">平均完成时长(分钟)</div>
        <div class="metric-value">
          {{ Number(overview.avgCompletionMinutes || 0).toFixed(2) }}
        </div>
      </el-card>
    </div>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="14">
        <el-card shadow="never" header="任务处理趋势">
          <div ref="trendRef" class="chart-box" />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="10">
        <el-card shadow="never" header="任务投放漏斗">
          <div ref="funnelRef" class="chart-box" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" header="任务类型效果对比">
          <div ref="typeRef" class="chart-box" />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" header="用户分层转化表现">
          <div ref="layerRef" class="chart-box" />
        </el-card>
      </el-col>
    </el-row>

    <el-card v-loading="elasticityLoading" shadow="never">
      <template #header>
        <div class="card-header">
          <span>奖励弹性（全部任务类型）</span>
        </div>
      </template>
      <el-row :gutter="16" class="elasticity-grid">
        <el-col
          v-for="item in elasticityCards"
          :key="item.taskType"
          :xs="24"
          :lg="12"
        >
          <el-card shadow="hover" class="elasticity-card">
            <template #header>
              <div class="elasticity-card-header">
                <span>{{ item.label }}</span>
                <el-tag size="small" type="info">
                  {{
                    item.rows.length
                      ? `${item.rows.length} 个奖励区间`
                      : "暂无数据"
                  }}
                </el-tag>
              </div>
            </template>
            <div
              v-if="item.rows.length"
              :ref="
                element =>
                  setElasticityChartRef(
                    item.taskType,
                    element as HTMLElement | null
                  )
              "
              class="elasticity-chart-box"
            />
            <el-empty
              v-else
              description="该任务类型暂无奖励弹性数据"
              :image-size="64"
            />
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" header="TopN（任务类型）">
          <el-table :data="topTaskTypes" size="small" border>
            <el-table-column label="任务类型" min-width="140">
              <template #default="scope">
                {{
                  getTaskTypeLabel(scope.row.taskType || scope.row.name || "")
                }}
              </template>
            </el-table-column>
            <el-table-column prop="count" label="数量" min-width="90" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" header="TopN（接取最多用户）">
          <el-table :data="topAcceptedUsers" size="small" border>
            <el-table-column prop="userId" label="用户ID" min-width="140" />
            <el-table-column prop="userName" label="用户名" min-width="120" />
            <el-table-column
              prop="acceptedCount"
              label="接取任务数"
              min-width="110"
            />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" header="异常诊断">
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="错误率">{{
              formatPercent(anomaly.errorRate)
            }}</el-descriptions-item>
            <el-descriptions-item label="补偿重放数">{{
              Number(anomaly.replayCount || 0)
            }}</el-descriptions-item>
            <el-descriptions-item label="幂等冲突数">{{
              Number(anomaly.idempotentConflictCount || 0)
            }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" header="成本与ROI">
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="总奖励成本">{{
              Number(costRoi.rewardCost || 0).toFixed(2)
            }}</el-descriptions-item>
            <el-descriptions-item label="总完成数">{{
              Number(costRoi.completedCount || 0)
            }}</el-descriptions-item>
            <el-descriptions-item label="单完成成本">{{
              Number(costRoi.costPerCompletion || 0).toFixed(2)
            }}</el-descriptions-item>
            <el-descriptions-item label="ROI分数">{{
              Number(costRoi.roi || 0).toFixed(2)
            }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import * as echarts from "echarts";
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  getUserTaskAnomaly,
  getUserTaskCostRoi,
  getUserTaskFunnel,
  getUserTaskLayer,
  getUserTaskOverview,
  getUserTaskTopN,
  getUserTaskTopNAccepted,
  getUserTaskTrend,
  getUserTaskTypePerformance,
  type UserTaskAnomaly,
  type UserTaskCostRoi,
  type UserTaskFunnel,
  type UserTaskLayerItem,
  type UserTaskOverview,
  type UserTaskTopNAcceptedItem,
  type UserTaskTopNTaskTypeItem,
  type UserTaskTrendItem,
  type UserTaskTypePerformanceItem
} from "@/api/user-task";
import {
  getTaskConfigRewardElasticity,
  searchTaskConfigs,
  type TaskConfigRewardElasticityItem
} from "@/api/task-config";

const loading = ref(false);
const elasticityLoading = ref(false);
const dateRange = ref<[string, string] | []>([]);
const taskType = ref("");
const n = ref(10);
const granularity = ref<"HOUR" | "DAY">("DAY");

const overview = ref<UserTaskOverview>({});
const funnel = ref<UserTaskFunnel>({});
const trend = ref<UserTaskTrendItem[]>([]);
const typePerformance = ref<UserTaskTypePerformanceItem[]>([]);
const layer = ref<UserTaskLayerItem[]>([]);
const anomaly = ref<UserTaskAnomaly>({});
const costRoi = ref<UserTaskCostRoi>({});
const topTaskTypes = ref<UserTaskTopNTaskTypeItem[]>([]);
const topAcceptedUsers = ref<UserTaskTopNAcceptedItem[]>([]);
const rewardElasticityMap = ref<
  Record<string, TaskConfigRewardElasticityItem[]>
>({});

const trendRef = ref<HTMLElement | null>(null);
const funnelRef = ref<HTMLElement | null>(null);
const typeRef = ref<HTMLElement | null>(null);
const layerRef = ref<HTMLElement | null>(null);

let trendChart: echarts.ECharts | null = null;
let funnelChart: echarts.ECharts | null = null;
let typeChart: echarts.ECharts | null = null;
let layerChart: echarts.ECharts | null = null;
const elasticityChartRefs: Record<string, HTMLElement | null> = {};
const elasticityCharts: Record<string, echarts.ECharts | null> = {};

const TASK_TYPE_LABELS: Record<string, string> = {
  ACCUMULATE: "累积任务",
  CONTINUOUS: "连续任务",
  STAIR: "阶梯任务",
  WINDOW_ACCUMULATE: "时间窗口累积任务"
};

function getTaskTypeLabel(value: string) {
  return TASK_TYPE_LABELS[value] || value || "-";
}

const elasticityCards = computed(() => {
  return Object.keys(TASK_TYPE_LABELS).map(currentTaskType => ({
    taskType: currentTaskType,
    label: getTaskTypeLabel(currentTaskType),
    rows: rewardElasticityMap.value[currentTaskType] || []
  }));
});

function unwrapData<T>(payload: T | { data?: T }): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return ((payload as { data?: T }).data ?? payload) as T;
  }
  return payload as T;
}

function queryParams() {
  const params: Record<string, any> = {
    n: n.value,
    taskType: taskType.value || undefined,
    granularity: granularity.value
  };
  if (dateRange.value.length === 2) {
    params.startTime = dateRange.value[0];
    params.endTime = dateRange.value[1];
  }
  return params;
}

function formatPercent(v?: number) {
  return `${Number(v || 0).toFixed(2)}%`;
}

function renderTrendChart() {
  if (!trendChart) return;
  trendChart.setOption({
    tooltip: { trigger: "axis" },
    legend: { top: 0 },
    grid: { left: 40, right: 20, top: 36, bottom: 36 },
    xAxis: {
      type: "category",
      data: trend.value.map(i => String(i.bucket || "-"))
    },
    yAxis: { type: "value" },
    series: [
      {
        name: "接取",
        type: "line",
        smooth: true,
        data: trend.value.map(i => Number(i.acceptedCount || 0))
      },
      {
        name: "完成",
        type: "line",
        smooth: true,
        data: trend.value.map(i => Number(i.completedCount || 0))
      },
      {
        name: "领奖",
        type: "line",
        smooth: true,
        data: trend.value.map(i => Number(i.rewardedCount || 0))
      },
      {
        name: "失败",
        type: "line",
        smooth: true,
        data: trend.value.map(i => Number(i.failedCount || 0))
      }
    ]
  });
}

function renderFunnelChart() {
  if (!funnelChart) return;
  const data = [
    { name: "曝光", value: Number(funnel.value.exposed || 0) },
    { name: "接取", value: Number(funnel.value.accepted || 0) },
    { name: "完成", value: Number(funnel.value.completed || 0) },
    { name: "领奖", value: Number(funnel.value.rewarded || 0) }
  ];
  funnelChart.setOption({
    tooltip: { trigger: "item" },
    series: [
      {
        type: "funnel",
        left: "10%",
        width: "80%",
        top: 20,
        bottom: 20,
        label: { show: true, formatter: "{b}: {c}" },
        data
      }
    ]
  });
}

function renderTypeChart() {
  if (!typeChart) return;
  typeChart.setOption({
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { top: 0 },
    grid: { left: 40, right: 20, top: 36, bottom: 36 },
    xAxis: {
      type: "category",
      data: typePerformance.value.map(i =>
        getTaskTypeLabel(String(i.taskType || i.name || "-"))
      )
    },
    yAxis: [
      { type: "value", name: "数量" },
      { type: "value", name: "比率(%)" }
    ],
    series: [
      {
        name: "接取",
        type: "bar",
        data: typePerformance.value.map(i => Number(i.acceptedCount || 0))
      },
      {
        name: "完成",
        type: "bar",
        data: typePerformance.value.map(i => Number(i.completedCount || 0))
      },
      {
        name: "完成率",
        type: "line",
        yAxisIndex: 1,
        data: typePerformance.value.map(i => Number(i.completionRate || 0))
      }
    ]
  });
}

function renderLayerChart() {
  if (!layerChart) return;
  layerChart.setOption({
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { top: 0 },
    grid: { left: 40, right: 20, top: 36, bottom: 36 },
    xAxis: {
      type: "category",
      data: layer.value.map(i => String(i.layer || i.name || "未知"))
    },
    yAxis: [
      { type: "value", name: "数量" },
      { type: "value", name: "完成率(%)" }
    ],
    series: [
      {
        name: "接取",
        type: "bar",
        data: layer.value.map(i => Number(i.acceptedCount || 0))
      },
      {
        name: "完成",
        type: "bar",
        data: layer.value.map(i => Number(i.completedCount || 0))
      },
      {
        name: "完成率",
        type: "line",
        yAxisIndex: 1,
        data: layer.value.map(i => Number(i.completionRate || 0))
      }
    ]
  });
}

function setElasticityChartRef(
  taskTypeKey: string,
  element: HTMLElement | null
) {
  elasticityChartRefs[taskTypeKey] = element;
}

function ensureElasticityCharts() {
  Object.keys(TASK_TYPE_LABELS).forEach(taskTypeKey => {
    const element = elasticityChartRefs[taskTypeKey];
    if (element && !elasticityCharts[taskTypeKey]) {
      elasticityCharts[taskTypeKey] = echarts.init(element);
    }
  });
}

function renderElasticityChart(taskTypeKey: string) {
  const elasticityChart = elasticityCharts[taskTypeKey];
  if (!elasticityChart) return;
  const rows = rewardElasticityMap.value[taskTypeKey] || [];
  if (!rows.length) {
    elasticityChart.clear();
    return;
  }
  const xAxis = rows.map(item => item.rewardBucket || "-");
  elasticityChart.setOption({
    tooltip: { trigger: "axis" },
    legend: { top: 0 },
    grid: { left: 40, right: 20, top: 36, bottom: 36 },
    xAxis: { type: "category", data: xAxis },
    yAxis: [
      { type: "value", name: "数量" },
      { type: "value", name: "比率(%)" }
    ],
    series: [
      {
        name: "接取数",
        type: "bar",
        data: rows.map(item => Number(item.acceptedCount || 0))
      },
      {
        name: "完成率",
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        data: rows.map(item => Number(item.completionRate || 0))
      },
      {
        name: "领奖率",
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        data: rows.map(item => Number(item.rewardRate || 0))
      }
    ]
  });
}

async function fetchRewardElasticityAllTypes() {
  elasticityLoading.value = true;
  try {
    const entries = await Promise.all(
      Object.keys(TASK_TYPE_LABELS).map(async currentTaskType => {
        const searchRes = await searchTaskConfigs({
          taskType: currentTaskType,
          page: 1,
          size: 1
        });
        const taskList =
          searchRes?.data?.items || searchRes?.data?.records || [];
        const task = taskList[0];
        if (!task?.id) {
          return [currentTaskType, []] as const;
        }

        const elasticityRes = await getTaskConfigRewardElasticity(task.id, {
          days: 30
        });
        return [currentTaskType, unwrapData(elasticityRes) || []] as const;
      })
    );

    rewardElasticityMap.value = Object.fromEntries(entries);
  } finally {
    elasticityLoading.value = false;
  }
}

function renderCharts() {
  renderTrendChart();
  renderFunnelChart();
  renderTypeChart();
  renderLayerChart();
  Object.keys(TASK_TYPE_LABELS).forEach(renderElasticityChart);
}

function resizeCharts() {
  trendChart?.resize();
  funnelChart?.resize();
  typeChart?.resize();
  layerChart?.resize();
  Object.values(elasticityCharts).forEach(chart => chart?.resize());
}

function initCharts() {
  if (trendRef.value) trendChart = echarts.init(trendRef.value);
  if (funnelRef.value) funnelChart = echarts.init(funnelRef.value);
  if (typeRef.value) typeChart = echarts.init(typeRef.value);
  if (layerRef.value) layerChart = echarts.init(layerRef.value);
}

async function fetchAll() {
  loading.value = true;
  try {
    const params = queryParams();
    const [
      overviewRes,
      funnelRes,
      trendRes,
      typeRes,
      layerRes,
      anomalyRes,
      costRoiRes,
      topnRes,
      acceptedRes
    ] = await Promise.all([
      getUserTaskOverview(params),
      getUserTaskFunnel(params),
      getUserTaskTrend(params),
      getUserTaskTypePerformance(params),
      getUserTaskLayer(params),
      getUserTaskAnomaly(params),
      getUserTaskCostRoi(params),
      getUserTaskTopN(params),
      getUserTaskTopNAccepted(params)
    ]);

    overview.value = unwrapData(overviewRes) || {};
    funnel.value = unwrapData(funnelRes) || {};
    trend.value = unwrapData(trendRes) || [];
    typePerformance.value = unwrapData(typeRes) || [];
    layer.value = unwrapData(layerRes) || [];
    anomaly.value = unwrapData(anomalyRes) || {};
    costRoi.value = unwrapData(costRoiRes) || {};

    const topnData = unwrapData(topnRes) || {};
    const topTypeRaw = topnData.topTaskTypes || topnData.topActionTypes || [];
    topTaskTypes.value = (topTypeRaw || []).map((item: any) => ({
      taskType: String(item.taskType || item.name || ""),
      count: Number(item.count || 0)
    }));

    const acceptedData = unwrapData(acceptedRes);
    topAcceptedUsers.value = Array.isArray(acceptedData)
      ? acceptedData
      : acceptedData?.topAcceptedUsers || [];

    await fetchRewardElasticityAllTypes();

    await nextTick();
    ensureElasticityCharts();
    renderCharts();
  } catch {
    ElMessage.error("加载任务分析失败");
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
  funnelChart?.dispose();
  typeChart?.dispose();
  layerChart?.dispose();
  Object.keys(elasticityCharts).forEach(taskTypeKey => {
    elasticityCharts[taskTypeKey]?.dispose();
    elasticityCharts[taskTypeKey] = null;
  });
});
</script>

<style scoped>
.task-analytics-page {
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
  font-size: 12px;
}

.metric-value {
  margin-top: 8px;
  font-size: 22px;
  font-weight: 600;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-header-tip {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.elasticity-grid {
  margin-top: 4px;
}

.elasticity-card {
  margin-bottom: 4px;
}

.elasticity-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.elasticity-chart-box {
  width: 100%;
  height: 280px;
}

.chart-box {
  width: 100%;
  height: 320px;
}

@media (max-width: 960px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }

  .card-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
