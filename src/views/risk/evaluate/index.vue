<template>
  <div class="risk-evaluate-page">
    <el-card shadow="never">
      <template #header>
        <span>风控实时决策模拟</span>
      </template>

      <el-form :model="form" label-width="110px" class="evaluate-form">
        <el-row :gutter="16">
          <el-col :xs="24" :md="12">
            <el-form-item label="请求ID">
              <el-input v-model="form.requestId" placeholder="例如 req-001" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="事件ID">
              <el-input v-model="form.eventId" placeholder="例如 evt-001" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="用户ID">
              <el-input v-model="form.userId" placeholder="例如 10001" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="任务ID">
              <el-input v-model="form.taskId" placeholder="例如 7890" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="事件类型">
              <el-input v-model="form.eventType" placeholder="例如 USER_SIGN" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="事件时间">
              <el-date-picker
                v-model="form.eventTime"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                placeholder="请选择事件时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="金额/分值">
              <el-input-number v-model="form.amount" :min="0" :step="1" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="设备ID">
              <el-input v-model="form.deviceId" placeholder="例如 device-001" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="IP">
              <el-input v-model="form.ip" placeholder="例如 192.168.1.1" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="渠道">
              <el-input v-model="form.channel" placeholder="例如 web" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleEvaluate">
            发起决策
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="result" shadow="never">
      <template #header>
        <span>决策结果</span>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="决策动作">
          <el-tag :type="decisionTagType(result.decision)">{{
            result.decision
          }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="原因码">{{
          result.reasonCode || "-"
        }}</el-descriptions-item>
        <el-descriptions-item label="风险分">{{
          result.riskScore ?? "-"
        }}</el-descriptions-item>
        <el-descriptions-item label="TraceId">{{
          result.traceId || "-"
        }}</el-descriptions-item>
        <el-descriptions-item label="降级比例">{{
          result.degradeRatio ?? "-"
        }}</el-descriptions-item>
      </el-descriptions>

      <div class="table-title">命中规则</div>
      <el-table :data="result.hitRules || []" border>
        <el-table-column prop="ruleId" label="规则ID" width="100" />
        <el-table-column prop="ruleName" label="规则名称" min-width="160" />
        <el-table-column prop="ruleType" label="规则类型" width="140" />
        <el-table-column prop="action" label="动作" width="140" />
        <el-table-column prop="reasonCode" label="原因码" min-width="140" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import {
  evaluateRiskDecision,
  type RiskDecisionEvaluateRequest,
  type RiskDecisionEvaluateResponse
} from "@/api/risk";

const loading = ref(false);

const form = ref<RiskDecisionEvaluateRequest>({
  requestId: `req-${Date.now()}`,
  eventId: `evt-${Date.now()}`,
  userId: "10001",
  taskId: "7890",
  eventType: "USER_SIGN",
  eventTime: "",
  amount: 10,
  deviceId: "device-001",
  ip: "127.0.0.1",
  channel: "web",
  ext: {}
});

const result = ref<RiskDecisionEvaluateResponse | null>(null);

function unwrapData<T>(payload: T | { data?: T }): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return ((payload as { data?: T }).data ?? payload) as T;
  }
  return payload as T;
}

function decisionTagType(decision: string) {
  if (decision === "PASS") return "success";
  if (decision === "REJECT") return "danger";
  if (decision === "DEGRADE_PASS") return "warning";
  if (decision === "REVIEW") return "info";
  return "warning";
}

function resetForm() {
  form.value = {
    requestId: `req-${Date.now()}`,
    eventId: `evt-${Date.now()}`,
    userId: "10001",
    taskId: "7890",
    eventType: "USER_SIGN",
    eventTime: "",
    amount: 10,
    deviceId: "device-001",
    ip: "127.0.0.1",
    channel: "web",
    ext: {}
  };
  result.value = null;
}

async function handleEvaluate() {
  if (!form.value.requestId || !form.value.eventId || !form.value.eventTime) {
    ElMessage.warning("请先填写请求ID、事件ID和事件时间");
    return;
  }

  loading.value = true;
  try {
    const response = await evaluateRiskDecision(form.value);
    result.value = unwrapData(response);
    ElMessage.success("实时决策调用成功");
  } catch {
    ElMessage.error("实时决策调用失败");
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.risk-evaluate-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.evaluate-form {
  margin-top: 4px;
}

.table-title {
  margin-top: 14px;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
}
</style>
