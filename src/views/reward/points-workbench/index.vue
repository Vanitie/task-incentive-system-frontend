<template>
  <div class="points-workbench-page">
    <el-card shadow="never" class="flow-card">
      <div class="flow-header">
        <div>
          <div class="flow-title">奖励对账补偿工作台</div>
          <div class="flow-subtitle">
            保留单一入口，但将总览、执行和复核拆成分步工作区，减少页面拥挤。
          </div>
        </div>
        <el-button :loading="pageLoading" @click="refreshWorkbench">
          刷新工作台
        </el-button>
      </div>

      <el-steps :active="activeStep" finish-status="success" align-center>
        <el-step title="差异规模" description="确认异常体量与差异样本" />
        <el-step title="执行风险确认" description="确认低峰执行与覆盖写风险" />
        <el-step title="执行后收敛结果" description="自动复核并高亮结论" />
      </el-steps>

      <div class="metric-strip">
        <el-card shadow="hover" class="metric-card">
          <div class="metric-title">差异用户数</div>
          <div class="metric-value">
            {{ Number(preview.totalDiffUsers || 0) }}
          </div>
        </el-card>
        <el-card shadow="hover" class="metric-card">
          <div class="metric-title">积分总差异</div>
          <div class="metric-value">
            {{ Number(summary.pointTotalDiff || 0) }}
          </div>
        </el-card>
        <el-card shadow="hover" class="metric-card">
          <div class="metric-title">徽章总差异</div>
          <div class="metric-value">
            {{ Number(summary.badgeTotalDiff || 0) }}
          </div>
        </el-card>
        <el-card shadow="hover" class="metric-card">
          <div class="metric-title">失败发奖数</div>
          <div class="metric-value warning">
            {{ Number(summary.failedGrantTotal || failedSampleMetric || 0) }}
          </div>
        </el-card>
        <el-card shadow="hover" class="metric-card">
          <div class="metric-title">执行后剩余差异</div>
          <div class="metric-value" :class="closureClass">
            {{ remainingDiffMetric }}
          </div>
        </el-card>
      </div>
    </el-card>

    <el-tabs v-model="activePane" class="workbench-tabs">
      <el-tab-pane label="步骤1：总览与预览" name="overview">
        <el-row :gutter="12">
          <el-col :xs="24" :xl="10">
            <el-card
              shadow="never"
              header="风险摘要"
              v-loading="summaryLoading"
            >
              <el-alert
                type="warning"
                show-icon
                :closable="false"
                title="先确认异常来源，再决定是否进入补偿执行。"
              />

              <el-descriptions
                :column="1"
                border
                size="small"
                class="summary-descriptions"
              >
                <el-descriptions-item
                  label="INIT / PROCESSING / FAILED 异常样本数"
                >
                  {{ Number(summary.abnormalSamples.length || 0) }}
                </el-descriptions-item>
                <el-descriptions-item label="grant_status 分布">
                  <div class="status-inline">
                    <el-tag
                      v-for="item in grantStatusItems"
                      :key="item.code"
                      :type="grantStatusTagType(item.code)"
                    >
                      {{ item.label }} {{ item.count }}
                    </el-tag>
                  </div>
                </el-descriptions-item>
                <el-descriptions-item label="主要风险判断">
                  {{ riskSummaryText }}
                </el-descriptions-item>
                <el-descriptions-item label="实物待领取">
                  {{ Number(summary.itemPendingCount || 0) }}
                </el-descriptions-item>
              </el-descriptions>

              <div class="section-title">奖励类型发放状态图</div>
              <div ref="rewardStatusChartRef" class="status-chart" />

              <div class="section-title">重复 message_id TopN</div>
              <el-table
                :data="summary.duplicateMessageIds"
                size="small"
                border
                max-height="220"
              >
                <el-table-column
                  prop="messageId"
                  label="message_id"
                  min-width="220"
                  show-overflow-tooltip
                />
                <el-table-column prop="cnt" label="重复次数" width="110" />
              </el-table>
            </el-card>
          </el-col>

          <el-col :xs="24" :xl="14">
            <el-card shadow="never" v-loading="previewLoading">
              <template #header>
                <div class="section-header">
                  <span>差异预览</span>
                  <div class="section-actions">
                    <el-input-number
                      v-model="sampleLimit"
                      :min="1"
                      :max="500"
                      controls-position="right"
                      label="样本数量"
                    />
                    <el-button type="primary" @click="fetchPreview"
                      >刷新差异</el-button
                    >
                  </div>
                </div>
              </template>

              <el-alert
                type="info"
                show-icon
                :closable="false"
                title="预览阶段只读，不改数据；先确认差异规模和样本结构。"
              />

              <el-table
                :data="preview.samples"
                border
                size="small"
                class="table-gap"
              >
                <el-table-column prop="userId" label="用户ID" min-width="140" />
                <el-table-column
                  prop="currentPoints"
                  label="当前积分"
                  min-width="120"
                />
                <el-table-column
                  prop="expectedPoints"
                  label="期望积分"
                  min-width="120"
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

              <div class="section-title">徽章补发样本</div>
              <el-table
                :data="preview.badgeSamples"
                border
                size="small"
                max-height="220"
              >
                <el-table-column prop="userId" label="用户ID" min-width="120" />
                <el-table-column
                  prop="userName"
                  label="用户名"
                  min-width="120"
                />
                <el-table-column
                  prop="taskName"
                  label="任务名称"
                  min-width="160"
                />
                <el-table-column
                  prop="badgeCode"
                  label="徽章编码"
                  min-width="110"
                />
              </el-table>

              <div class="section-title">失败发奖重试样本</div>
              <el-table
                :data="preview.failedSamples"
                border
                size="small"
                max-height="220"
              >
                <el-table-column
                  prop="recordId"
                  label="记录ID"
                  min-width="130"
                />
                <el-table-column
                  prop="userName"
                  label="用户名"
                  min-width="120"
                />
                <el-table-column
                  prop="taskName"
                  label="任务名称"
                  min-width="160"
                />
                <el-table-column
                  prop="rewardType"
                  label="奖励类型"
                  min-width="110"
                />
                <el-table-column
                  prop="error"
                  label="失败原因"
                  min-width="200"
                  show-overflow-tooltip
                />
              </el-table>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="步骤2：执行确认" name="execute">
        <el-card shadow="never" header="执行风险确认">
          <el-alert
            type="error"
            show-icon
            :closable="false"
            title="执行补偿会处理积分差异、徽章补发并重试失败发奖，请在业务低峰执行，系统会在执行后自动复核。"
          />

          <div class="check-grid">
            <el-form-item label="执行奖励类型" class="reward-type-form-item">
              <el-radio-group v-model="selectedRewardType">
                <el-radio-button
                  v-for="item in rewardTypeOptions"
                  :key="item.value"
                  :label="item.value"
                >
                  {{ item.label }}
                </el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-checkbox v-model="riskChecks.sampleChecked"
              >我已核对差异样本，确认本次补偿范围</el-checkbox
            >
            <el-checkbox v-model="riskChecks.lowPeakConfirmed"
              >我已确认当前属于业务低峰期</el-checkbox
            >
            <el-checkbox v-model="riskChecks.overwriteConfirmed"
              >我已知晓该操作会覆盖写积分余额</el-checkbox
            >
          </div>

          <div class="primary-actions">
            <el-button
              type="danger"
              :disabled="!canExecute"
              :loading="executing"
              @click="confirmExecute"
            >
              执行所选类型补偿
            </el-button>
            <el-button :loading="postCheckLoading" @click="runPostCheckPreview">
              手动复核
            </el-button>
          </div>

          <el-collapse class="advanced-panel">
            <el-collapse-item
              title="高级工具（默认折叠）"
              name="advanced-tools"
            >
              <div class="advanced-actions">
                <el-button
                  :disabled="!preview.samples.length"
                  @click="exportCsv"
                >
                  导出差异样本 CSV
                </el-button>
                <el-button :loading="summaryLoading" @click="fetchSummary">
                  刷新总览摘要
                </el-button>
                <el-button :loading="previewLoading" @click="fetchPreview">
                  刷新预览样本
                </el-button>
              </div>
              <div class="advanced-hint">
                高级工具保留导出与手动刷新能力，避免默认界面被次要操作打断。
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-card>

        <el-card
          shadow="never"
          header="异常记录样本（辅助定位）"
          class="panel-gap"
          v-loading="summaryLoading"
        >
          <el-table
            :data="summary.abnormalSamples"
            size="small"
            border
            max-height="320"
          >
            <el-table-column prop="id" label="记录ID" min-width="150" />
            <el-table-column prop="userId" label="用户ID" min-width="120" />
            <el-table-column prop="taskId" label="任务ID" min-width="120" />
            <el-table-column label="发奖状态" min-width="110">
              <template #default="scope">
                <el-tag :type="grantStatusTagType(scope.row.grantStatus)">
                  {{ grantStatusLabel(scope.row.grantStatus) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              prop="messageId"
              label="message_id"
              min-width="220"
              show-overflow-tooltip
            />
            <el-table-column
              prop="errorMsg"
              label="错误信息"
              min-width="220"
              show-overflow-tooltip
            />
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="步骤3：结果与复核" name="result">
        <el-row :gutter="12">
          <el-col :xs="24" :xl="12">
            <el-card shadow="never" header="执行结果" v-loading="executing">
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="积分校准用户数">
                  {{ Number(result.pointAdjustedUsers || 0) }}
                </el-descriptions-item>
                <el-descriptions-item label="徽章补发用户数">
                  {{ Number(result.badgeCompensatedUsers || 0) }}
                </el-descriptions-item>
                <el-descriptions-item label="失败发奖重试成功数">
                  {{ Number(result.retriedFailedRecords || 0) }}
                </el-descriptions-item>
                <el-descriptions-item label="已更新用户数">
                  {{ Number(result.updatedUsers || 0) }}
                </el-descriptions-item>
                <el-descriptions-item label="失败用户数">
                  {{ Number(result.failedUsers || 0) }}
                </el-descriptions-item>
                <el-descriptions-item label="执行规则">
                  {{ result.rule || preview.replayRule || "-" }}
                </el-descriptions-item>
              </el-descriptions>

              <el-table
                :data="result.failedSamples"
                size="small"
                border
                class="table-gap"
                max-height="260"
              >
                <el-table-column prop="userId" label="用户ID" min-width="140" />
                <el-table-column
                  prop="error"
                  label="错误信息"
                  min-width="220"
                  show-overflow-tooltip
                />
              </el-table>
            </el-card>
          </el-col>

          <el-col :xs="24" :xl="12">
            <el-card
              shadow="never"
              header="执行后自动复核"
              v-loading="postCheckLoading"
            >
              <el-alert
                :type="closureAlertType"
                show-icon
                :closable="false"
                :title="closureTitle"
                :description="closureDescription"
              />

              <el-descriptions
                :column="1"
                border
                size="small"
                class="summary-descriptions"
              >
                <el-descriptions-item label="剩余差异用户数">
                  {{
                    hasExecuted ? Number(postCheck.totalDiffUsers || 0) : "-"
                  }}
                </el-descriptions-item>
                <el-descriptions-item label="复核样本数">
                  {{
                    hasExecuted
                      ? Number(
                          postCheck.pointSamples?.length ||
                            postCheck.samples?.length ||
                            0
                        )
                      : "-"
                  }}
                </el-descriptions-item>
              </el-descriptions>

              <el-table
                :data="
                  hasExecuted
                    ? postCheck.pointSamples || postCheck.samples || []
                    : []
                "
                size="small"
                border
                class="table-gap"
                max-height="260"
              >
                <el-table-column prop="userId" label="用户ID" min-width="140" />
                <el-table-column
                  prop="currentPoints"
                  label="当前积分"
                  min-width="110"
                />
                <el-table-column
                  prop="expectedPoints"
                  label="期望积分"
                  min-width="110"
                />
                <el-table-column prop="delta" label="剩余差值" min-width="120">
                  <template #default="scope">
                    <el-tag
                      :type="scope.row.delta === 0 ? 'success' : 'warning'"
                    >
                      {{ scope.row.delta }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>
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
import { ElMessage, ElMessageBox } from "element-plus";
import {
  executeRewardReplay,
  getRewardReplayPreview,
  getRewardReconcileSummary,
  unwrapApiResponse,
  type RewardReplayExecuteResult,
  type RewardReplayPreview,
  type RewardReconcileSummary,
  type RewardTypeStatusStat,
  type UserRewardItem
} from "@/api/user-reward";

const pageLoading = ref(false);
const summaryLoading = ref(false);
const previewLoading = ref(false);
const executing = ref(false);
const postCheckLoading = ref(false);
const executed = ref(false);
const sampleLimit = ref(20);
const activePane = ref<"overview" | "execute" | "result">("overview");
const rewardStatusChartRef = ref<HTMLElement | null>(null);
let rewardStatusChart: echarts.ECharts | null = null;
type RewardExecuteType = "POINT" | "BADGE" | "ITEM";
const selectedRewardType = ref<RewardExecuteType>("POINT");
const rewardTypeOptions: Array<{ value: RewardExecuteType; label: string }> = [
  { value: "POINT", label: "积分" },
  { value: "BADGE", label: "徽章" },
  { value: "ITEM", label: "实物" }
];

const riskChecks = ref({
  sampleChecked: false,
  lowPeakConfirmed: false,
  overwriteConfirmed: false
});

const summary = ref<RewardReconcileSummary>({
  statusCount: [],
  withoutMessageId: 0,
  duplicateMessageIds: [],
  abnormalSamples: [],
  pointTotalDiff: 0,
  pointDiffUsers: 0,
  badgeTotalDiff: 0,
  itemPendingCount: 0,
  failedGrantTotal: 0,
  rewardTypeStatusStats: [],
  grantStatusRef: {
    "0": "INIT",
    "1": "PROCESSING",
    "2": "SUCCESS",
    "3": "FAILED"
  }
});

const preview = ref<RewardReplayPreview>({
  totalDiffUsers: 0,
  sampleLimit: 20,
  pointTotalDiff: 0,
  pointDiffUsers: 0,
  badgeTotalDiff: 0,
  itemPendingCount: 0,
  failedGrantTotal: 0,
  rewardTypeStatusStats: [],
  pointSamples: [],
  badgeSamples: [],
  failedSamples: [],
  samples: [],
  replayRule: ""
});

const result = ref<RewardReplayExecuteResult>({
  pointAdjustedUsers: 0,
  badgeCompensatedUsers: 0,
  retriedFailedRecords: 0,
  failedRecords: 0,
  updatedUsers: 0,
  failedUsers: 0,
  failedSamples: [],
  rule: ""
});

const postCheck = ref<RewardReplayPreview>({
  totalDiffUsers: 0,
  sampleLimit: 20,
  pointTotalDiff: 0,
  pointDiffUsers: 0,
  badgeTotalDiff: 0,
  itemPendingCount: 0,
  failedGrantTotal: 0,
  rewardTypeStatusStats: [],
  pointSamples: [],
  badgeSamples: [],
  failedSamples: [],
  samples: [],
  replayRule: ""
});

const hasExecuted = computed(
  () =>
    executed.value ||
    Number(result.value.updatedUsers || result.value.failedUsers || 0) > 0
);

const canExecute = computed(() => {
  const selectedPending = selectedRewardPendingCount.value;
  return (
    selectedPending > 0 &&
    riskChecks.value.sampleChecked &&
    riskChecks.value.lowPeakConfirmed &&
    riskChecks.value.overwriteConfirmed
  );
});

const selectedRewardPendingCount = computed(() => {
  const stats = summary.value.rewardTypeStatusStats || [];
  const failed = Number(
    stats.find(item => item.rewardType === selectedRewardType.value)
      ?.failedCount || 0
  );
  if (selectedRewardType.value === "POINT") {
    return Number(summary.value.pointDiffUsers || 0) + failed;
  }
  if (selectedRewardType.value === "BADGE") {
    return Number(summary.value.badgeTotalDiff || 0) + failed;
  }
  return failed;
});

const activeStep = computed(() => {
  if (hasExecuted.value) return 2;
  if (canExecute.value) return 1;
  return 0;
});

const failedSampleMetric = computed(() => {
  return Number(
    hasExecuted.value
      ? result.value.failedUsers || 0
      : summary.value.failedGrantTotal || 0
  );
});

const remainingDiffMetric = computed(() => {
  return hasExecuted.value
    ? String(Number(postCheck.value.totalDiffUsers || 0))
    : "-";
});

const closureClass = computed(() => {
  if (!hasExecuted.value) return "muted";
  return Number(postCheck.value.totalDiffUsers || 0) === 0
    ? "success"
    : "danger";
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

const riskSummaryText = computed(() => {
  const duplicateCount = Number(summary.value.duplicateMessageIds.length || 0);
  const missingCount = Number(summary.value.withoutMessageId || 0);
  const abnormalCount = Number(summary.value.abnormalSamples.length || 0);
  const pointDiff = Number(summary.value.pointTotalDiff || 0);
  const badgeDiff = Number(summary.value.badgeTotalDiff || 0);
  if (!duplicateCount && !missingCount && !abnormalCount) {
    return "当前发奖链路整体稳定，可优先关注积分/徽章差异与失败重试样本。";
  }
  return `当前存在 ${abnormalCount} 条异常样本、${duplicateCount} 组重复 message_id、${missingCount} 条缺失 message_id，积分总差异 ${pointDiff}，徽章总差异 ${badgeDiff}。`;
});

const closureAlertType = computed(() => {
  if (!hasExecuted.value) return "info";
  return Number(postCheck.value.totalDiffUsers || 0) === 0
    ? "success"
    : "warning";
});

const closureTitle = computed(() => {
  if (!hasExecuted.value) return "尚未执行补偿，执行后会自动触发一次复核。";
  return Number(postCheck.value.totalDiffUsers || 0) === 0
    ? "补偿后差异已收敛到 0。"
    : "补偿后仍有残余差异，需要继续排查。";
});

const closureDescription = computed(() => {
  if (!hasExecuted.value) {
    return "复核结果会在补偿执行完成后自动刷新，并将结论高亮展示。";
  }
  if (Number(postCheck.value.totalDiffUsers || 0) === 0) {
    return "工作台已完成差异规模确认、执行与复核三步闭环。";
  }
  return `当前剩余差异用户 ${Number(postCheck.value.totalDiffUsers || 0)} 人，建议结合失败样本和异常记录继续处理。`;
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

function normalizeSummary(
  payload: RewardReconcileSummary
): RewardReconcileSummary {
  return {
    ...payload,
    withoutMessageId: Number(payload.withoutMessageId || 0),
    pointTotalDiff: Number(payload.pointTotalDiff || 0),
    pointDiffUsers: Number(payload.pointDiffUsers || 0),
    badgeTotalDiff: Number(payload.badgeTotalDiff || 0),
    itemPendingCount: Number(payload.itemPendingCount || 0),
    failedGrantTotal: Number(payload.failedGrantTotal || 0),
    rewardTypeStatusStats: (payload.rewardTypeStatusStats || []).map(
      (item: RewardTypeStatusStat) => ({
        rewardType: String(item.rewardType || "UNKNOWN"),
        initCount: Number(item.initCount || 0),
        processingCount: Number(item.processingCount || 0),
        successCount: Number(item.successCount || 0),
        failedCount: Number(item.failedCount || 0),
        abnormalCount: Number(item.abnormalCount || 0)
      })
    ),
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

function normalizePreview(raw: RewardReplayPreview): RewardReplayPreview {
  return {
    ...raw,
    totalDiffUsers: Number(raw.totalDiffUsers || 0),
    sampleLimit: Number(raw.sampleLimit || 20),
    pointTotalDiff: Number(raw.pointTotalDiff || 0),
    pointDiffUsers: Number(raw.pointDiffUsers || 0),
    badgeTotalDiff: Number(raw.badgeTotalDiff || 0),
    itemPendingCount: Number(raw.itemPendingCount || 0),
    failedGrantTotal: Number(raw.failedGrantTotal || 0),
    rewardTypeStatusStats: (raw.rewardTypeStatusStats || []).map(item => ({
      rewardType: String(item.rewardType || "UNKNOWN"),
      initCount: Number(item.initCount || 0),
      processingCount: Number(item.processingCount || 0),
      successCount: Number(item.successCount || 0),
      failedCount: Number(item.failedCount || 0),
      abnormalCount: Number(item.abnormalCount || 0)
    })),
    pointSamples: (raw.pointSamples || raw.samples || []).map(item => ({
      userId: Number(item.userId),
      currentPoints:
        item.currentPoints === null || item.currentPoints === undefined
          ? null
          : Number(item.currentPoints),
      expectedPoints: Number(item.expectedPoints || 0),
      delta: Number(item.delta || 0)
    })),
    samples: (raw.samples || raw.pointSamples || []).map(item => ({
      userId: Number(item.userId),
      currentPoints:
        item.currentPoints === null || item.currentPoints === undefined
          ? null
          : Number(item.currentPoints),
      expectedPoints: Number(item.expectedPoints || 0),
      delta: Number(item.delta || 0)
    })),
    badgeSamples: (raw.badgeSamples || []).map(item => ({
      userId: Number(item.userId),
      userName: item.userName,
      taskId:
        item.taskId === null || item.taskId === undefined
          ? undefined
          : Number(item.taskId),
      taskName: item.taskName,
      badgeCode: Number(item.badgeCode || 0),
      badgeId:
        item.badgeId === null || item.badgeId === undefined
          ? null
          : Number(item.badgeId),
      recordId:
        item.recordId === null || item.recordId === undefined
          ? undefined
          : Number(item.recordId),
      createTime: item.createTime
    })),
    failedSamples: (raw.failedSamples || []).map(item => ({
      recordId: Number(item.recordId || 0),
      userId: Number(item.userId || 0),
      userName: item.userName,
      taskId:
        item.taskId === null || item.taskId === undefined
          ? undefined
          : Number(item.taskId),
      taskName: item.taskName,
      rewardType: String(item.rewardType || "UNKNOWN"),
      rewardValue:
        item.rewardValue === null || item.rewardValue === undefined
          ? undefined
          : Number(item.rewardValue),
      grantStatus:
        item.grantStatus === null || item.grantStatus === undefined
          ? undefined
          : Number(item.grantStatus),
      error: item.error,
      createTime: item.createTime
    }))
  };
}

function normalizeExecuteResult(
  raw: RewardReplayExecuteResult
): RewardReplayExecuteResult {
  return {
    ...raw,
    pointAdjustedUsers: Number(raw.pointAdjustedUsers || 0),
    badgeCompensatedUsers: Number(raw.badgeCompensatedUsers || 0),
    retriedFailedRecords: Number(raw.retriedFailedRecords || 0),
    failedRecords: Number(raw.failedRecords || 0),
    updatedUsers: Number(raw.updatedUsers || 0),
    failedUsers: Number(raw.failedUsers || 0),
    failedSamples: (raw.failedSamples || []).map(item => ({
      recordId: Number(item.recordId || 0),
      userId: Number(item.userId || 0),
      userName: item.userName,
      taskId:
        item.taskId === null || item.taskId === undefined
          ? undefined
          : Number(item.taskId),
      taskName: item.taskName,
      rewardType: String(item.rewardType || "UNKNOWN"),
      rewardValue:
        item.rewardValue === null || item.rewardValue === undefined
          ? undefined
          : Number(item.rewardValue),
      grantStatus:
        item.grantStatus === null || item.grantStatus === undefined
          ? undefined
          : Number(item.grantStatus),
      error: String(item.error || "")
    })),
    postCheck: raw.postCheck ? normalizePreview(raw.postCheck) : undefined
  };
}

async function fetchSummary() {
  summaryLoading.value = true;
  try {
    const res = await getRewardReconcileSummary({
      sampleLimit: sampleLimit.value
    });
    summary.value = normalizeSummary(unwrapApiResponse(res));
    await nextTick();
    ensureRewardStatusChart();
    renderRewardStatusChart();
  } finally {
    summaryLoading.value = false;
  }
}

async function fetchPreview() {
  previewLoading.value = true;
  try {
    const res = await getRewardReplayPreview({
      sampleLimit: sampleLimit.value
    });
    preview.value = normalizePreview(unwrapApiResponse(res));
  } finally {
    previewLoading.value = false;
  }
}

async function runPostCheckPreview() {
  postCheckLoading.value = true;
  try {
    const res = await getRewardReplayPreview({ sampleLimit: 20 });
    postCheck.value = normalizePreview(unwrapApiResponse(res));
  } finally {
    postCheckLoading.value = false;
  }
}

async function refreshWorkbench() {
  pageLoading.value = true;
  try {
    await Promise.all([fetchSummary(), fetchPreview()]);
    if (hasExecuted.value) {
      await runPostCheckPreview();
    }
  } finally {
    pageLoading.value = false;
  }
}

async function doExecute() {
  executing.value = true;
  try {
    const res = await executeRewardReplay({
      rewardType: selectedRewardType.value
    });
    result.value = normalizeExecuteResult(unwrapApiResponse(res));
    executed.value = true;
    ElMessage.success(
      `${selectedRewardTypeLabel.value}补偿执行完成，正在自动复核`
    );
    if (result.value.postCheck) {
      postCheck.value = result.value.postCheck;
    }
    await Promise.all([runPostCheckPreview(), fetchSummary(), fetchPreview()]);
    activePane.value = "result";
  } finally {
    executing.value = false;
  }
}

async function confirmExecute() {
  if (!selectedRewardPendingCount.value) {
    ElMessage.warning(
      `当前所选类型（${selectedRewardTypeLabel.value}）暂无待补偿数据`
    );
    return;
  }
  await ElMessageBox.confirm(
    `确认执行${selectedRewardTypeLabel.value}补偿？<br/>当前类型待补偿量：${Number(selectedRewardPendingCount.value || 0)}<br/>请确保正在低峰期执行。`,
    "二次确认",
    {
      confirmButtonText: "确认执行",
      cancelButtonText: "取消",
      type: "warning",
      dangerouslyUseHTMLString: true
    }
  );
  await doExecute();
}

const selectedRewardTypeLabel = computed(() => {
  return (
    rewardTypeOptions.find(item => item.value === selectedRewardType.value)
      ?.label || selectedRewardType.value
  );
});

function exportCsv() {
  const rows = preview.value.pointSamples || preview.value.samples || [];
  if (!rows.length) {
    ElMessage.warning("暂无可导出的差异样本");
    return;
  }
  const headers = ["userId", "currentPoints", "expectedPoints", "delta"];
  const lines = [
    headers.join(","),
    ...rows.map(item =>
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

function ensureRewardStatusChart() {
  if (rewardStatusChartRef.value && !rewardStatusChart) {
    rewardStatusChart = echarts.init(rewardStatusChartRef.value);
  }
}

function renderRewardStatusChart() {
  if (!rewardStatusChart) {
    return;
  }
  const rows = summary.value.rewardTypeStatusStats || [];
  if (!rows.length) {
    rewardStatusChart.clear();
    return;
  }
  rewardStatusChart.setOption({
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { top: 0 },
    grid: { left: 40, right: 16, top: 34, bottom: 28 },
    xAxis: {
      type: "category",
      data: rows.map(item => item.rewardType)
    },
    yAxis: { type: "value", name: "数量" },
    series: [
      {
        name: "成功",
        type: "bar",
        stack: "status",
        data: rows.map(item => Number(item.successCount || 0))
      },
      {
        name: "处理中",
        type: "bar",
        stack: "status",
        data: rows.map(item => Number(item.processingCount || 0))
      },
      {
        name: "失败",
        type: "bar",
        stack: "status",
        data: rows.map(item => Number(item.failedCount || 0))
      }
    ]
  });
}

watch(canExecute, value => {
  if (value && activePane.value === "overview") {
    activePane.value = "execute";
  }
});

onMounted(refreshWorkbench);

onBeforeUnmount(() => {
  rewardStatusChart?.dispose();
  rewardStatusChart = null;
});
</script>

<style scoped>
.points-workbench-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.flow-card,
.metric-card {
  border-radius: 14px;
}

.flow-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.flow-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.flow-subtitle {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.metric-strip {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.metric-title {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.metric-value {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.metric-value.success {
  color: var(--el-color-success);
}

.metric-value.warning {
  color: var(--el-color-warning);
}

.metric-value.danger {
  color: var(--el-color-danger);
}

.metric-value.muted {
  color: var(--el-text-color-disabled);
}

.workbench-tabs :deep(.el-tabs__content) {
  padding-top: 4px;
}

.summary-descriptions {
  margin-top: 12px;
}

.status-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.reward-type-form-item {
  margin-bottom: 4px;
}

.section-title {
  margin: 14px 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.status-chart {
  width: 100%;
  height: 220px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-gap {
  margin-top: 12px;
}

.check-grid {
  margin-top: 14px;
  display: grid;
  gap: 10px;
}

.primary-actions {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.advanced-panel {
  margin-top: 14px;
}

.advanced-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.advanced-hint {
  margin-top: 10px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.panel-gap {
  margin-top: 12px;
}

@media (max-width: 1200px) {
  .metric-strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .flow-header,
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .section-actions {
    justify-content: space-between;
  }

  .metric-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .metric-strip {
    grid-template-columns: 1fr;
  }
}
</style>
