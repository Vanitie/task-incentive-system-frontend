<template>
  <div class="risk-decisions-page">
    <el-card shadow="never">
      <el-form :inline="true" :model="query" class="query-form">
        <el-form-item label="用户ID">
          <el-input
            v-model="query.userId"
            placeholder="请输入用户ID"
            clearable
          />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input
            v-model="query.userName"
            placeholder="请输入用户名"
            clearable
          />
        </el-form-item>
        <el-form-item label="任务名">
          <el-input
            v-model="query.taskName"
            placeholder="请输入任务名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="任务ID">
          <el-input
            v-model="query.taskId"
            placeholder="请输入任务ID"
            clearable
          />
        </el-form-item>
        <el-form-item label="决策结果">
          <el-select
            v-model="query.decision"
            clearable
            placeholder="全部"
            style="width: 160px"
          >
            <el-option label="PASS" value="PASS" />
            <el-option label="REJECT" value="REJECT" />
            <el-option label="DEGRADE_PASS" value="DEGRADE_PASS" />
            <el-option label="REVIEW" value="REVIEW" />
            <el-option label="FREEZE" value="FREEZE" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="query.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="tableData" border>
        <el-table-column prop="decision" label="决策结果" width="130">
          <template #default="scope">
            <el-tag :type="decisionTagType(scope.row.decision)">
              {{ scope.row.decision }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reasonCode" label="原因码" min-width="140" />
        <el-table-column label="命中规则" min-width="220" show-overflow-tooltip>
          <template #default="scope">
            {{ formatHitRules(scope.row.hitRules) }}
          </template>
        </el-table-column>
        <el-table-column prop="latencyMs" label="耗时(ms)" width="100" />
        <el-table-column prop="taskName" label="任务名" min-width="180" />
        <el-table-column prop="taskId" label="任务ID" min-width="160" />
        <el-table-column prop="userName" label="用户名" min-width="140" />
        <el-table-column prop="userId" label="用户ID" min-width="160" />
        <el-table-column prop="createdAt" label="时间" min-width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page.current"
        v-model:page-size="page.size"
        :total="page.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 16px; justify-content: flex-end"
        @current-change="fetchData"
        @size-change="fetchData"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { getRiskDecisions, type RiskDecisionItem } from "@/api/risk";

const loading = ref(false);

const query = ref<{
  userId: string;
  userName: string;
  taskName: string;
  taskId: string;
  decision?: string;
  timeRange: [Date, Date] | [];
}>({
  userId: "",
  userName: "",
  taskName: "",
  taskId: "",
  decision: undefined,
  timeRange: []
});

const page = ref({
  current: 1,
  size: 20,
  total: 0
});

const tableData = ref<RiskDecisionItem[]>([]);

function unwrapData<T>(payload: T | { data?: T; total?: number }): {
  list: T;
  total?: number;
} {
  if (payload && typeof payload === "object" && "data" in payload) {
    const wrapped = payload as { data?: T; total?: number };
    return { list: (wrapped.data ?? payload) as T, total: wrapped.total };
  }
  return { list: payload as T };
}

function toIso(input?: Date) {
  return input ? input.toISOString() : undefined;
}

function decisionTagType(decision: string) {
  if (decision === "PASS") return "success";
  if (decision === "REJECT") return "danger";
  if (decision === "DEGRADE_PASS") return "warning";
  if (decision === "REVIEW") return "info";
  return "warning";
}

function formatHitRules(hitRules?: RiskDecisionItem["hitRules"]) {
  if (!Array.isArray(hitRules) || hitRules.length === 0) return "-";
  return hitRules.map(item => item.ruleName || String(item.ruleId)).join(", ");
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(String(value));
  if (!Number.isNaN(date.getTime())) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mi = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  }
  return String(value)
    .replace("T", " ")
    .replace(/\.\d+([+-]\d{2}:\d{2}|Z)$/, "");
}

async function fetchData() {
  loading.value = true;
  try {
    const [start, end] = query.value.timeRange || [];
    const response = await getRiskDecisions({
      page: page.value.current,
      size: page.value.size,
      userId: query.value.userId || undefined,
      userName: query.value.userName || undefined,
      taskId: query.value.taskId || undefined,
      taskName: query.value.taskName || undefined,
      decision: query.value.decision || undefined,
      start: toIso(start),
      end: toIso(end)
    });

    const { list, total } = unwrapData(response);
    tableData.value = list?.items || [];
    page.value.total = Number(total ?? list?.total ?? 0);
  } catch {
    ElMessage.error("加载决策日志失败");
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  query.value = {
    userId: "",
    userName: "",
    taskName: "",
    taskId: "",
    decision: undefined,
    timeRange: []
  };
  page.value.current = 1;
  fetchData();
}

onMounted(fetchData);
</script>

<style scoped>
.risk-decisions-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.query-form {
  margin-bottom: 8px;
}
</style>
