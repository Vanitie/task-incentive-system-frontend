<template>
  <div class="points-execute-page">
    <el-card shadow="never">
      <el-alert
        type="error"
        show-icon
        :closable="false"
        title="强提醒：该操作会根据成功积分日志覆盖用户余额，请确保已完成差异预览和结果备份。"
      />
      <div class="actions">
        <el-button type="danger" :loading="executing" @click="confirmExecute">
          执行积分补偿
        </el-button>
        <el-button :loading="previewLoading" @click="runPostCheckPreview">
          再次预览校验
        </el-button>
      </div>
    </el-card>

    <el-row :gutter="12">
      <el-col :xs="24" :sm="12">
        <el-card shadow="hover">
          <div class="metric-title">已更新用户数</div>
          <div class="metric-value success">{{ result.updatedUsers }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12">
        <el-card shadow="hover">
          <div class="metric-title">失败用户数</div>
          <div class="metric-value danger">{{ result.failedUsers }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" header="执行结果 - 失败样本">
      <el-table :data="result.failedSamples" size="small" border>
        <el-table-column prop="userId" label="用户ID" min-width="180" />
        <el-table-column prop="error" label="错误信息" min-width="260" />
      </el-table>
    </el-card>

    <el-card shadow="never" header="执行后校验">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="差异用户总数">
          {{ postCheck.totalDiffUsers }}
        </el-descriptions-item>
        <el-descriptions-item label="收敛状态">
          <el-tag
            :type="postCheck.totalDiffUsers === 0 ? 'success' : 'warning'"
          >
            {{ postCheck.totalDiffUsers === 0 ? "已收敛到 0" : "仍有差异" }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <div class="post-check-tip">
        执行后会自动触发一次 /replay/points/preview 复核。
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  executePointReplay,
  getPointReplayPreview,
  unwrapApiResponse,
  type PointReplayExecuteResult,
  type PointReplayPreview
} from "@/api/user-reward";

const executing = ref(false);
const previewLoading = ref(false);

const result = ref<PointReplayExecuteResult>({
  updatedUsers: 0,
  failedUsers: 0,
  failedSamples: [],
  rule: ""
});

const postCheck = ref<PointReplayPreview>({
  totalDiffUsers: 0,
  sampleLimit: 20,
  samples: [],
  replayRule: ""
});

function normalizeExecuteResult(
  raw: PointReplayExecuteResult
): PointReplayExecuteResult {
  return {
    ...raw,
    updatedUsers: Number(raw.updatedUsers || 0),
    failedUsers: Number(raw.failedUsers || 0),
    failedSamples: (raw.failedSamples || []).map(item => ({
      userId: Number(item.userId),
      error: String(item.error || "")
    }))
  };
}

function normalizePreview(raw: PointReplayPreview): PointReplayPreview {
  return {
    ...raw,
    totalDiffUsers: Number(raw.totalDiffUsers || 0),
    sampleLimit: Number(raw.sampleLimit || 20),
    samples: raw.samples || []
  };
}

async function runPostCheckPreview() {
  previewLoading.value = true;
  try {
    const previewRes = await getPointReplayPreview({ sampleLimit: 20 });
    postCheck.value = normalizePreview(unwrapApiResponse(previewRes));
  } finally {
    previewLoading.value = false;
  }
}

async function doExecute() {
  executing.value = true;
  try {
    const res = await executePointReplay();
    result.value = normalizeExecuteResult(unwrapApiResponse(res));
    ElMessage.success("补偿执行完成，正在进行自动复核...");
    await runPostCheckPreview();
  } finally {
    executing.value = false;
  }
}

async function confirmExecute() {
  await ElMessageBox.confirm(
    "确认执行积分补偿？该操作将覆盖写差异用户积分余额，建议在低峰期操作。",
    "二次确认",
    {
      confirmButtonText: "确认执行",
      cancelButtonText: "取消",
      type: "warning"
    }
  );
  await doExecute();
}

runPostCheckPreview();
</script>

<style scoped>
.points-execute-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
}

.metric-title {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.metric-value {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 600;
}

.metric-value.success {
  color: var(--el-color-success);
}

.metric-value.danger {
  color: var(--el-color-danger);
}

.post-check-tip {
  margin-top: 10px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
