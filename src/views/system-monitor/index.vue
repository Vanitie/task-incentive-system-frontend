<template>
  <div>
    <!-- 顶部卡片展示核心指标 -->
    <el-row :gutter="20" class="mb-6">
      <el-col :span="6">
        <el-card>
          <div class="text-md font-bold mb-2">实时QPS</div>
          <div
            class="text-2xl text-blue-600 metric-number"
            :class="{ 'number-pop': numberAnimated }"
          >
            {{ realtimeQps }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="text-md font-bold mb-2">单日请求量</div>
          <div
            class="text-2xl text-green-600 metric-number"
            :class="{ 'number-pop': numberAnimated }"
          >
            {{ dailyRequest }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="text-md font-bold mb-2">小时成功率</div>
          <div
            class="text-2xl text-success metric-number"
            :class="{ 'number-pop': numberAnimated }"
          >
            {{ hourlySuccessRate }}%
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="text-md font-bold mb-2">小时失败率</div>
          <div
            class="text-2xl text-danger metric-number"
            :class="{ 'number-pop': numberAnimated }"
          >
            {{ hourlyFailRate }}%
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 响应时间分布折线图 -->
    <el-card class="mb-6">
      <div class="text-lg font-bold mb-2">
        系统响应时间分布（tp90/tp95/tp99）
      </div>
      <ReTrendChart
        :xAxis="responseLineChartData.xAxis"
        :series="responseLineChartData.series"
        height="320px"
      />
    </el-card>

    <!-- 服务器资源监控 -->
    <el-card class="mb-6">
      <div class="text-lg font-bold mb-2">服务器资源监控</div>
      <pure-table :columns="resourceColumns" :data="resourceData" />
    </el-card>

    <!-- 压测模块 -->
    <el-card>
      <div class="text-lg font-bold mb-2">前端触发压测</div>
      <el-form :model="loadTestForm" inline class="mb-4">
        <el-form-item label="目标链路">
          <el-select v-model="loadTestForm.targetMode" style="width: 120px">
            <el-option label="同步(sync)" value="sync" />
            <el-option label="异步(async)" value="async" />
            <el-option label="直连(direct)" value="direct" />
          </el-select>
        </el-form-item>
        <el-form-item label="压测模式">
          <el-select v-model="loadTestForm.testMode" style="width: 120px">
            <el-option label="基线" value="baseline" />
            <el-option label="极限" value="max" />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="loadTestForm.testMode === 'baseline'"
          label="目标QPS"
        >
          <el-input-number
            v-model="loadTestForm.rate"
            :min="1"
            :max="maxAllowedQps"
          />
        </el-form-item>
        <el-form-item v-if="loadTestForm.testMode === 'max'" label="起始QPS">
          <el-input-number
            v-model="loadTestForm.startRate"
            :min="1"
            :max="maxAllowedQps"
          />
        </el-form-item>
        <el-form-item label="持续时长">
          <el-input v-model="loadTestForm.duration" style="width: 110px" />
        </el-form-item>
        <el-form-item label="预分配VUs">
          <el-input-number v-model="loadTestForm.preVus" :min="1" :max="2000" />
        </el-form-item>
        <el-form-item label="最大VUs">
          <el-input-number v-model="loadTestForm.maxVus" :min="1" :max="5000" />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :loading="loadTestStarting"
            @click="handleStartLoadTest"
            >开始压测</el-button
          >
          <el-button
            :disabled="!lastLoadTestRunId"
            :loading="loadTestStatusLoading"
            @click="handleRefreshLoadTestStatus"
            >刷新状态</el-button
          >
        </el-form-item>
      </el-form>

      <div class="mb-4 text-xs" style="color: var(--el-text-color-secondary)">
        当前链路{{ loadTestForm.targetMode }}最大QPS:
        {{ modeMaxQps }}，压测允许上限(80%):
        {{ maxAllowedQps }}
      </div>

      <el-alert
        v-if="loadTestStatusText"
        :title="loadTestStatusText"
        type="info"
        :closable="false"
        show-icon
        class="mb-4"
      />

      <el-descriptions
        v-if="lastLoadTestReport"
        :column="3"
        border
        size="small"
        class="mb-4"
      >
        <el-descriptions-item label="总请求">
          {{ Number(lastLoadTestReport.totalRequests || 0) }}
        </el-descriptions-item>
        <el-descriptions-item label="成功QPS">
          {{ Number(lastLoadTestReport.bizSuccessQps || 0).toFixed(2) }}
        </el-descriptions-item>
        <el-descriptions-item label="估计极限QPS">
          {{ Number(lastLoadTestReport.estimatedLimitQps || 0).toFixed(2) }}
        </el-descriptions-item>
        <el-descriptions-item label="失败数">
          {{ Number(lastLoadTestReport.bizFailCount || 0) }}
        </el-descriptions-item>
        <el-descriptions-item label="降级数">
          {{ Number(lastLoadTestReport.degradedCount || 0) }}
        </el-descriptions-item>
        <el-descriptions-item label="拐点P95(ms)">
          {{ Number(lastLoadTestReport.p95Ms || 0).toFixed(2) }}
        </el-descriptions-item>
      </el-descriptions>

      <pure-table :columns="pressureColumns" :data="pressureData" />
    </el-card>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import ReTrendChart from "@/components/ReTrendChart.vue";
import { getToken } from "@/utils/auth";
import {
  getQps,
  getRequestCount,
  getHourSuccessRate,
  getHourFailureRate,
  getTpSeriesLast20min,
  getResourceSeries
} from "@/api/monitor";
import { startLoadTest, getLoadTestStatus } from "@/api/benchmark";

// 顶部核心指标
const realtimeQps = ref(0);
const dailyRequest = ref(0);
const hourlySuccessRate = ref(0);
const hourlyFailRate = ref(0);
const numberAnimated = ref(false);
let pollingTimer = null;
let animationTimer = null;
let isPolling = false;

// 响应时间分布（分钟级模拟数据，折线图，含图例）
const responseLineChartData = ref({
  xAxis: [],
  series: []
});

// 服务器资源监控（新增服务器名称列）
const resourceColumns = [
  { prop: "server", label: "服务器名称" },
  { prop: "cpu", label: "CPU使用率" },
  { prop: "memory", label: "内存使用率" },
  { prop: "disk", label: "磁盘使用率" },
  { prop: "timestamp", label: "时间" }
];
const resourceData = ref([]);

// 压测模块
const pressureColumns = [
  { prop: "runId", label: "运行ID" },
  { prop: "targetMode", label: "目标链路" },
  { prop: "testMode", label: "压测模式" },
  { prop: "qps", label: "请求QPS" },
  { prop: "startedAt", label: "开始时间" },
  { prop: "finishedAt", label: "结束时间" },
  { prop: "status", label: "状态" },
  { prop: "summary", label: "摘要" }
];
const pressureData = ref([]);

const loadTestForm = ref({
  targetMode: "sync",
  testMode: "baseline",
  rate: 600,
  startRate: 300,
  duration: "1m",
  preVus: 200,
  maxVus: 1200,
  dataScale: "qps_6000"
});
const loadTestStarting = ref(false);
const loadTestStatusLoading = ref(false);
const loadTestStatusText = ref("");
const lastLoadTestRunId = ref("");
const lastLoadTestReport = ref(null);

const MODE_MAX_QPS = {
  direct: 500,
  sync: 4500,
  async: 4500
};

const modeMaxQps = computed(() => {
  return MODE_MAX_QPS[loadTestForm.value.targetMode] || 4500;
});

const maxAllowedQps = computed(() => {
  return Math.floor(modeMaxQps.value * 0.8);
});

watch(
  () => loadTestForm.value.targetMode,
  () => {
    if (Number(loadTestForm.value.rate || 0) > maxAllowedQps.value) {
      loadTestForm.value.rate = maxAllowedQps.value;
    }
    if (Number(loadTestForm.value.startRate || 0) > maxAllowedQps.value) {
      loadTestForm.value.startRate = maxAllowedQps.value;
    }
  }
);

function upsertPressureRow(row) {
  const index = pressureData.value.findIndex(item => item.runId === row.runId);
  if (index >= 0) {
    pressureData.value[index] = { ...pressureData.value[index], ...row };
  } else {
    pressureData.value.unshift(row);
  }
}

function unwrapData(response) {
  const payload = response?.data;
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }
  return payload;
}

function formatLoadTestStatus(status) {
  const runId = status.runId || lastLoadTestRunId.value || "-";
  const state = status.status || "UNKNOWN";
  const detail = status.summary || "";
  return `运行ID: ${runId} | 状态: ${state}${detail ? ` | ${detail}` : ""}`;
}

async function doStartLoadTest(forcePeak = false) {
  const requestedQps =
    loadTestForm.value.testMode === "max"
      ? Number(loadTestForm.value.startRate || 0)
      : Number(loadTestForm.value.rate || 0);
  if (requestedQps > maxAllowedQps.value) {
    throw new Error(
      `请求QPS超过限制，当前链路允许上限为 ${maxAllowedQps.value}`
    );
  }

  const token = getToken()?.accessToken;
  if (!token) {
    throw new Error("未获取到登录Token，请重新登录后再执行压测");
  }

  const payload = {
    ...loadTestForm.value,
    token,
    forcePeak
  };
  const res = await startLoadTest(payload);
  const data = unwrapData(res) || {};
  if (data.warning && !data.accepted) {
    await ElMessageBox.confirm(
      data.warningMessage ||
        "当前属于业务高峰期，继续压测可能影响线上业务，是否继续？",
      "高峰时段警告",
      {
        type: "warning",
        confirmButtonText: "继续执行",
        cancelButtonText: "取消"
      }
    );
    return doStartLoadTest(true);
  }
  if (!data.accepted) {
    throw new Error(data.message || "压测任务未启动");
  }
  lastLoadTestRunId.value = data.runId || "";
  lastLoadTestReport.value = null;
  loadTestStatusText.value =
    `压测已启动，运行ID: ${lastLoadTestRunId.value || "-"}` +
    (data.maxAllowedQps
      ? `，请求QPS ${Number(data.requestedQps || 0)}，上限 ${Number(data.maxAllowedQps || 0)}`
      : "");

  upsertPressureRow({
    runId: data.runId || "-",
    targetMode: loadTestForm.value.targetMode,
    testMode: loadTestForm.value.testMode,
    qps:
      loadTestForm.value.testMode === "max"
        ? Number(loadTestForm.value.startRate || 0)
        : Number(loadTestForm.value.rate || 0),
    status: data.status || "RUNNING",
    summary: data.message || "压测任务已提交"
  });
}

async function handleStartLoadTest() {
  loadTestStarting.value = true;
  try {
    await doStartLoadTest(false);
    ElMessage.success("压测任务已提交");
  } catch (e) {
    if (e?.message !== "cancel") {
      ElMessage.error(e?.message || "压测启动失败");
    }
  } finally {
    loadTestStarting.value = false;
  }
}

async function handleRefreshLoadTestStatus() {
  if (!lastLoadTestRunId.value) return;
  loadTestStatusLoading.value = true;
  try {
    const res = await getLoadTestStatus(lastLoadTestRunId.value);
    const statusData = unwrapData(res) || {};
    loadTestStatusText.value = formatLoadTestStatus(statusData);
    lastLoadTestReport.value = statusData.report || null;
    upsertPressureRow({
      runId: statusData.runId || lastLoadTestRunId.value,
      targetMode: statusData.targetMode,
      testMode: statusData.testMode,
      qps: Number(statusData.requestedQps || 0),
      startedAt: statusData.startedAt || "-",
      finishedAt: statusData.finishedAt || "-",
      status: statusData.status || "UNKNOWN",
      summary: statusData.summary || ""
    });
  } catch {
    ElMessage.error("获取压测状态失败");
  } finally {
    loadTestStatusLoading.value = false;
  }
}

function triggerRefreshAnimation() {
  numberAnimated.value = false;
  nextTick(() => {
    numberAnimated.value = true;
  });
  if (animationTimer) clearTimeout(animationTimer);
  animationTimer = setTimeout(() => {
    numberAnimated.value = false;
  }, 550);
}

async function fetchMonitorData() {
  if (isPolling) return;
  isPolling = true;
  try {
    const [qpsRes, requestRes, successRes, failRes, tpRes, resourceRes] =
      await Promise.allSettled([
        getQps(),
        getRequestCount(),
        getHourSuccessRate(),
        getHourFailureRate(),
        getTpSeriesLast20min(),
        getResourceSeries()
      ]);

    if (qpsRes.status === "fulfilled") {
      realtimeQps.value = Number(unwrapData(qpsRes.value) ?? 0);
    }
    if (requestRes.status === "fulfilled") {
      dailyRequest.value = Number(unwrapData(requestRes.value) ?? 0);
    }
    if (successRes.status === "fulfilled") {
      hourlySuccessRate.value = Number(unwrapData(successRes.value) ?? 0);
    }
    if (failRes.status === "fulfilled") {
      hourlyFailRate.value = Number(unwrapData(failRes.value) ?? 0);
    }
    if (tpRes.status === "fulfilled") {
      const tpData = unwrapData(tpRes.value) || {};
      responseLineChartData.value = {
        xAxis: Array.isArray(tpData.xAxis) ? tpData.xAxis : [],
        series: Array.isArray(tpData.series) ? tpData.series : []
      };
    }
    if (resourceRes.status === "fulfilled") {
      const resources = unwrapData(resourceRes.value);
      resourceData.value = Array.isArray(resources) ? resources : [];
    }

    triggerRefreshAnimation();
  } finally {
    isPolling = false;
  }
}

onMounted(() => {
  fetchMonitorData();
  pollingTimer = setInterval(fetchMonitorData, 1000);
});

onUnmounted(() => {
  if (pollingTimer) clearInterval(pollingTimer);
  if (animationTimer) clearTimeout(animationTimer);
});
</script>

<style scoped>
.metric-number {
  transition:
    transform 0.28s ease,
    opacity 0.28s ease;
}

.number-pop {
  animation: number-pulse 0.45s ease;
}

@keyframes number-pulse {
  0% {
    opacity: 0.75;
    transform: scale(0.97);
  }

  50% {
    opacity: 1;
    transform: scale(1.03);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
