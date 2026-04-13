<template>
  <div class="reward-reconcile-page">
    <el-card shadow="never" class="guide-card">
      <el-steps :active="1" finish-status="success" align-center>
        <el-step title="查看对账总览" description="先确认异常规模和风险" />
        <el-step title="差异预览" description="检查差异用户样本" />
        <el-step title="补偿执行" description="执行并完成收敛复核" />
      </el-steps>
      <div class="guide-actions">
        <el-button type="primary" @click="goToPointsWorkbench">
          进入积分补偿工作台
        </el-button>
      </div>
    </el-card>

    <el-card shadow="never" class="query-card">
      <div class="toolbar">
        <el-input-number
          v-model="sampleLimit"
          :min="1"
          :max="200"
          label="样本数量"
          controls-position="right"
        />
        <el-button type="primary" :loading="loading" @click="fetchSummary">
          一键刷新
        </el-button>
        <el-button type="warning" @click="goToPointsWorkbench">
          去工作台处理差异与补偿
        </el-button>
      </div>
    </el-card>

    <el-row :gutter="12" class="status-cards">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <div class="metric-title">缺失 message_id</div>
          <div class="metric-value danger">{{ summary.withoutMessageId }}</div>
        </el-card>
      </el-col>
      <el-col
        v-for="item in grantStatusItems"
        :key="item.code"
        :xs="24"
        :sm="12"
        :md="6"
      >
        <el-card shadow="hover">
          <div class="metric-title">{{ item.label }}</div>
          <div class="metric-value">{{ item.count }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12" class="main-panel">
      <el-col :xs="24" :lg="10">
        <el-card shadow="never" header="grant_status 分布">
          <div ref="pieRef" class="pie-chart" />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="14">
        <el-card shadow="never" header="重复 message_id TopN">
          <el-table :data="summary.duplicateMessageIds" size="small" border>
            <el-table-column
              prop="messageId"
              label="message_id"
              min-width="220"
              show-overflow-tooltip
            />
            <el-table-column prop="cnt" label="重复次数" width="120" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" header="异常记录样本（grant_status in 0/1/3）">
      <el-table :data="summary.abnormalSamples" size="small" border>
        <el-table-column prop="id" label="记录ID" min-width="160" />
        <el-table-column prop="userId" label="用户ID" min-width="120" />
        <el-table-column prop="taskId" label="任务ID" min-width="120" />
        <el-table-column prop="rewardType" label="奖励类型" min-width="120" />
        <el-table-column prop="rewardValue" label="数值" width="100" />
        <el-table-column label="发奖状态" width="130">
          <template #default="scope">
            <el-tag :type="grantStatusTagType(scope.row.grantStatus)">
              {{ grantStatusLabel(scope.row.grantStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="messageId"
          label="message_id"
          min-width="210"
          show-overflow-tooltip
        />
        <el-table-column
          prop="errorMsg"
          label="错误信息"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column label="创建时间" min-width="180">
          <template #default="scope">
            {{ normalizeDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useDark, useECharts } from "@pureadmin/utils";
import {
  getRewardReconcileSummary,
  unwrapApiResponse,
  type RewardReconcileSummary,
  type UserRewardItem
} from "@/api/user-reward";

const loading = ref(false);
const sampleLimit = ref(20);
const router = useRouter();
const pieRef = ref();
const { isDark } = useDark();

const summary = ref<RewardReconcileSummary>({
  statusCount: [],
  withoutMessageId: 0,
  duplicateMessageIds: [],
  abnormalSamples: [],
  grantStatusRef: {
    "0": "INIT",
    "1": "PROCESSING",
    "2": "SUCCESS",
    "3": "FAILED"
  }
});

const { setOptions } = useECharts(pieRef, {
  theme: computed(() => (isDark.value ? "dark" : "light")),
  renderer: "svg"
});

const grantStatusItems = computed(() => {
  return [0, 1, 2, 3].map(code => {
    const found = summary.value.statusCount.find(
      item => Number(item.grantStatus) === code
    );
    return {
      code,
      label: summary.value.grantStatusRef[String(code)] || String(code),
      count: Number(found?.cnt || 0)
    };
  });
});

function grantStatusLabel(value?: number) {
  return (
    summary.value.grantStatusRef[String(value ?? "")] || String(value ?? "-")
  );
}

function grantStatusTagType(value?: number) {
  if (value === 2) return "success";
  if (value === 3) return "danger";
  if (value === 1) return "warning";
  return "info";
}

function normalizeDateTime(input: string | Date) {
  if (!input) return "";
  return String(input)
    .replace("T", " ")
    .replace(/\.\d+\+00:00$/, "");
}

function renderStatusPie() {
  const data = grantStatusItems.value.map(item => ({
    name: item.label,
    value: item.count
  }));
  setOptions({
    tooltip: {
      trigger: "item"
    },
    legend: {
      bottom: 0
    },
    series: [
      {
        name: "grant_status",
        type: "pie",
        radius: ["44%", "72%"],
        center: ["50%", "44%"],
        label: {
          formatter: "{b}: {d}%"
        },
        data
      }
    ]
  });
}

function normalizeSummary(
  payload: RewardReconcileSummary
): RewardReconcileSummary {
  return {
    ...payload,
    withoutMessageId: Number(payload.withoutMessageId || 0),
    statusCount: (payload.statusCount || []).map(item => ({
      grantStatus: Number(item.grantStatus),
      cnt: Number(item.cnt)
    })),
    duplicateMessageIds: (payload.duplicateMessageIds || []).map(item => ({
      messageId: String(item.messageId || ""),
      cnt: Number(item.cnt || 0)
    })),
    abnormalSamples: (payload.abnormalSamples || []) as UserRewardItem[]
  };
}

async function fetchSummary() {
  loading.value = true;
  try {
    const res = await getRewardReconcileSummary({
      sampleLimit: sampleLimit.value
    });
    summary.value = normalizeSummary(unwrapApiResponse(res));
    await nextTick();
    renderStatusPie();
  } finally {
    loading.value = false;
  }
}

function goToPointsWorkbench() {
  router.push("/reward/points-workbench");
}

onMounted(fetchSummary);
</script>

<style scoped>
.reward-reconcile-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.guide-actions {
  margin-top: 14px;
  display: flex;
  justify-content: center;
}

.query-card .toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.status-cards {
  margin-top: 0;
}

.metric-title {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.metric-value {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.metric-value.danger {
  color: var(--el-color-danger);
}

.main-panel {
  margin-top: 0;
}

.pie-chart {
  width: 100%;
  height: 280px;
}
</style>
