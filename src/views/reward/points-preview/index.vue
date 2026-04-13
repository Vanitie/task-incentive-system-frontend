<template>
  <div class="points-preview-page">
    <el-card shadow="never">
      <div class="toolbar">
        <el-input-number
          v-model="sampleLimit"
          :min="1"
          :max="500"
          controls-position="right"
          label="样本数量"
        />
        <el-button type="primary" :loading="loading" @click="fetchPreview">
          预览差异
        </el-button>
        <el-button :disabled="!preview.samples.length" @click="exportCsv">
          导出样本 CSV
        </el-button>
      </div>
    </el-card>

    <el-row :gutter="12">
      <el-col :xs="24" :md="8">
        <el-card shadow="hover">
          <div class="metric-title">差异用户总数</div>
          <div class="metric-value">{{ preview.totalDiffUsers }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="16">
        <el-alert
          type="warning"
          show-icon
          :closable="false"
          title="风险提示：执行补偿将按重算结果覆盖写用户积分余额，请在低峰期进行，并先导出样本核对。"
        />
      </el-col>
    </el-row>

    <el-card
      shadow="never"
      header="差异样本（currentPoints / expectedPoints / delta）"
    >
      <template #header>
        <div class="table-header">
          <span>差异样本（currentPoints / expectedPoints / delta）</span>
          <span class="hint"
            >重算口径：grant_status=SUCCESS 且 reward_type in
            POINT/REWARD_POINT/OP_POINT/POINT_CONSUME</span
          >
        </div>
      </template>
      <el-table :data="preview.samples" border size="small" v-loading="loading">
        <el-table-column prop="userId" label="用户ID" min-width="140" />
        <el-table-column
          prop="currentPoints"
          label="当前积分"
          min-width="130"
        />
        <el-table-column
          prop="expectedPoints"
          label="期望积分"
          min-width="130"
        />
        <el-table-column
          prop="delta"
          label="差值(current-expected)"
          min-width="180"
        >
          <template #default="scope">
            <el-tag
              :type="
                scope.row.delta === 0
                  ? 'success'
                  : scope.row.delta > 0
                    ? 'warning'
                    : 'danger'
              "
            >
              {{ scope.row.delta }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import {
  getPointReplayPreview,
  unwrapApiResponse,
  type PointReplayPreview
} from "@/api/user-reward";

const loading = ref(false);
const sampleLimit = ref(20);

const preview = ref<PointReplayPreview>({
  totalDiffUsers: 0,
  sampleLimit: 20,
  samples: [],
  replayRule: ""
});

function normalizePreview(raw: PointReplayPreview): PointReplayPreview {
  return {
    ...raw,
    totalDiffUsers: Number(raw.totalDiffUsers || 0),
    sampleLimit: Number(raw.sampleLimit || 20),
    samples: (raw.samples || []).map(item => ({
      userId: Number(item.userId),
      currentPoints:
        item.currentPoints === null || item.currentPoints === undefined
          ? null
          : Number(item.currentPoints),
      expectedPoints: Number(item.expectedPoints || 0),
      delta: Number(item.delta || 0)
    }))
  };
}

async function fetchPreview() {
  loading.value = true;
  try {
    const res = await getPointReplayPreview({ sampleLimit: sampleLimit.value });
    preview.value = normalizePreview(unwrapApiResponse(res));
  } finally {
    loading.value = false;
  }
}

function exportCsv() {
  if (!preview.value.samples.length) {
    ElMessage.warning("暂无可导出的差异样本");
    return;
  }

  const headers = ["userId", "currentPoints", "expectedPoints", "delta"];
  const lines = [
    headers.join(","),
    ...preview.value.samples.map(item =>
      [
        item.userId,
        item.currentPoints ?? "",
        item.expectedPoints,
        item.delta
      ].join(",")
    )
  ];
  const csvContent = `\uFEFF${lines.join("\n")}`;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const time = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
  link.href = url;
  link.download = `point-replay-preview-${time}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

fetchPreview();
</script>

<style scoped>
.points-preview-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
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

.table-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
