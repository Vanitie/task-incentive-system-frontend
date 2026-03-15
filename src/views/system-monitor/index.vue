<template>
  <div>
    <!-- 顶部卡片展示核心指标 -->
    <el-row :gutter="20" class="mb-6">
      <el-col :span="6">
        <el-card>
          <div class="text-md font-bold mb-2">实时QPS</div>
          <div class="text-2xl text-blue-600">{{ realtimeQps }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="text-md font-bold mb-2">单日请求量</div>
          <div class="text-2xl text-green-600">{{ dailyRequest }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="text-md font-bold mb-2">小时成功率</div>
          <div class="text-2xl text-success">{{ hourlySuccessRate }}%</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="text-md font-bold mb-2">小时失败率</div>
          <div class="text-2xl text-danger">{{ hourlyFailRate }}%</div>
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
import { ref } from "vue";
import ReFlop from "@/components/ReFlop";
import ReFlowChart from "@/components/ReFlowChart";
import ReTrendChart from "@/components/ReTrendChart.vue";

// 顶部核心指标
const realtimeQps = ref(320);
const dailyRequest = ref(123456);
const hourlySuccessRate = ref(98.7);
const hourlyFailRate = ref(1.3);

// 响应时间分布（分钟级模拟数据，折线图，含图例）
const responseLineChartData = ref({
  xAxis: [
    "10:00",
    "10:01",
    "10:02",
    "10:03",
    "10:04",
    "10:05",
    "10:06",
    "10:07",
    "10:08",
    "10:09"
  ],
  series: [
    {
      name: "tp90",
      data: [120, 110, 130, 125, 115, 140, 135, 128, 132, 138]
    },
    {
      name: "tp95",
      data: [180, 170, 190, 185, 175, 200, 195, 188, 192, 198]
    },
    {
      name: "tp99",
      data: [250, 240, 260, 255, 245, 270, 265, 258, 262, 268]
    }
  ]
});

// 服务器资源监控（新增服务器名称列）
const resourceColumns = [
  { prop: "server", label: "服务器名称" },
  { prop: "cpu", label: "CPU使用率" },
  { prop: "memory", label: "内存使用率" },
  { prop: "disk", label: "磁盘使用率" },
  { prop: "timestamp", label: "时间" }
];
const resourceData = ref([
  {
    server: "server-01",
    cpu: "45%",
    memory: "60%",
    disk: "70%",
    timestamp: "2026-03-15 10:00"
  },
  {
    server: "server-02",
    cpu: "50%",
    memory: "65%",
    disk: "72%",
    timestamp: "2026-03-15 10:05"
  }
]);

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
</script>
