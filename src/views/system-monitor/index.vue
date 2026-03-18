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
      <div class="text-lg font-bold mb-2">压测模块</div>
      <el-form :model="pressureParams" inline class="mb-4">
        <el-form-item label="用例">
          <el-input v-model="pressureParams.case" placeholder="如：登录接口" />
        </el-form-item>
        <el-form-item label="QPS">
          <el-input-number v-model="pressureParams.qps" :min="1" />
        </el-form-item>
        <el-form-item label="时长">
          <el-input-number v-model="pressureParams.duration" :min="1" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="runPressure">执行压测</el-button>
        </el-form-item>
      </el-form>
      <pure-table :columns="pressureColumns" :data="pressureData" />
    </el-card>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import ReTrendChart from "@/components/ReTrendChart.vue";
import {
  getQps,
  getRequestCount,
  getHourSuccessRate,
  getHourFailureRate,
  getTpSeriesLast20min,
  getResourceSeries
} from "@/api/monitor";

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
  { prop: "case", label: "用例" },
  { prop: "qps", label: "QPS" },
  { prop: "success", label: "成功率" },
  { prop: "fail", label: "失败率" },
  { prop: "duration", label: "压测时长" }
];
const pressureData = ref([
  { case: "登录接口", qps: 300, success: "99%", fail: "1%", duration: "60s" },
  { case: "任务领取", qps: 250, success: "98%", fail: "2%", duration: "60s" }
]);

// 压测参数
const pressureParams = ref({
  case: "",
  qps: 100,
  duration: 60
});

function runPressure() {
  // 模拟压测结果
  pressureData.value.push({
    case: pressureParams.value.case || "自定义用例",
    qps: pressureParams.value.qps,
    success: "97%",
    fail: "3%",
    duration: pressureParams.value.duration + "s"
  });
}

function unwrapData(response) {
  const payload = response?.data;
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }
  return payload;
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
