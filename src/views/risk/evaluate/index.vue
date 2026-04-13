<template>
  <div class="risk-evaluate-page">
    <el-card shadow="never">
      <template #header>
        <span>任务引擎实时处理</span>
      </template>

      <transition name="result-float-fade">
        <div v-if="resultFloat.visible" class="result-float">
          <div class="result-float-title">处理完成</div>
          <div class="result-float-content">
            mode={{ mode }} | code={{ resultFloat.code }} | status={{
              resultFloat.status
            }}
          </div>
        </div>
      </transition>

      <el-form :model="form" label-width="110px" class="evaluate-form">
        <el-row :gutter="16">
          <el-col :xs="24" :md="12">
            <el-form-item label="处理模式">
              <el-select v-model="mode" style="width: 100%">
                <el-option label="异步（async）" value="async" />
                <el-option label="同步（sync）" value="sync" />
                <el-option label="直连（direct）" value="direct" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="messageId">
              <el-input
                v-model="form.messageId"
                placeholder="建议填写，用于去重"
              />
            </el-form-item>
          </el-col>
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
              <el-input
                v-model="form.userId"
                placeholder="支持雪花ID（最大 9223372036854775807）"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="事件类型">
              <el-input
                v-model="form.eventType"
                placeholder="必填，例如 USER_SIGN"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="事件值">
              <el-input-number v-model="form.value" :step="1" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="事件时间(time)">
              <el-date-picker
                v-model="form.time"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm:ss"
                placeholder="请选择事件时间"
                style="width: 100%"
              />
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
            提交事件
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="result" shadow="never">
      <template #header>
        <span>处理结果</span>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="模式">
          {{ mode }}
        </el-descriptions-item>
        <el-descriptions-item label="返回码">{{
          result.code ?? "-"
        }}</el-descriptions-item>
        <el-descriptions-item label="返回信息">{{
          result.msg || "-"
        }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{
          result.data?.status || "-"
        }}</el-descriptions-item>
        <el-descriptions-item label="原始返回data" :span="2">
          <pre class="result-json">{{
            JSON.stringify(result.data || {}, null, 2)
          }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import {
  processEventByMode,
  type TaskEngineMode,
  type TaskEngineProcessEventRequest,
  type ApiResponse
} from "@/api/task-engine";

const loading = ref(false);
const mode = ref<TaskEngineMode>("async");
const LONG_MAX = BigInt("9223372036854775807");
const resultFloatTimer = ref<number | null>(null);
const resultFloat = ref({
  visible: false,
  code: "-",
  status: "-"
});

const form = ref<TaskEngineProcessEventRequest>({
  messageId: `msg-${Date.now()}`,
  requestId: `req-${Date.now()}`,
  eventId: `evt-${Date.now()}`,
  userId: "10001",
  eventType: "USER_SIGN",
  value: 1,
  time: "",
  deviceId: "device-001",
  ip: "127.0.0.1",
  channel: "web",
  ext: {}
});

const result = ref<ApiResponse<Record<string, any>> | null>(null);

function resetForm() {
  form.value = {
    messageId: `msg-${Date.now()}`,
    requestId: `req-${Date.now()}`,
    eventId: `evt-${Date.now()}`,
    userId: "10001",
    eventType: "USER_SIGN",
    value: 1,
    time: "",
    deviceId: "device-001",
    ip: "127.0.0.1",
    channel: "web",
    ext: {}
  };
  result.value = null;
}

function normalizeAndValidateUserId(input: string | number) {
  const text = String(input ?? "").trim();
  if (!/^\d+$/.test(text)) {
    return { valid: false, message: "用户ID必须为纯数字" };
  }
  const bigintValue = BigInt(text);
  if (bigintValue <= 0n || bigintValue > LONG_MAX) {
    return {
      valid: false,
      message: "用户ID超出范围（1 ~ 9223372036854775807）"
    };
  }
  return { valid: true, value: text };
}

function showResultFloat(code?: number, status?: string) {
  resultFloat.value.visible = true;
  resultFloat.value.code = String(code ?? "-");
  resultFloat.value.status = status || "-";
  if (resultFloatTimer.value) {
    window.clearTimeout(resultFloatTimer.value);
  }
  resultFloatTimer.value = window.setTimeout(() => {
    resultFloat.value.visible = false;
  }, 2600);
}

async function handleEvaluate() {
  if (!form.value.userId || !form.value.eventType?.trim()) {
    ElMessage.warning("请先填写必填参数：用户ID、事件类型");
    return;
  }

  const userIdCheck = normalizeAndValidateUserId(form.value.userId);
  if (!userIdCheck.valid) {
    ElMessage.warning(userIdCheck.message);
    return;
  }

  loading.value = true;
  try {
    const payload: TaskEngineProcessEventRequest = {
      ...form.value,
      userId: userIdCheck.value as string
    };
    result.value = await processEventByMode(mode.value, payload);
    showResultFloat(result.value?.code, result.value?.data?.status);
    ElMessage.success("任务引擎调用成功");
  } catch {
    ElMessage.error("任务引擎调用失败");
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

.result-float {
  position: fixed;
  top: 70px;
  left: 50%;
  z-index: 2000;
  min-width: 340px;
  padding: 10px 14px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color-overlay);
  box-shadow: var(--el-box-shadow-light);
  transform: translateX(-50%);
}

.result-float-title {
  margin-bottom: 4px;
  font-weight: 600;
}

.result-float-content {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.result-float-fade-enter-active,
.result-float-fade-leave-active {
  transition: all 0.25s ease;
}

.result-float-fade-enter-from,
.result-float-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}

.result-json {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
}
</style>
