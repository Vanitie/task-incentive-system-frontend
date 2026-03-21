<template>
  <div>
    <el-card>
      <el-row>
        <el-input
          v-model="search.taskName"
          placeholder="任务名称"
          style="width: 200px; margin-right: 8px"
        />
        <el-select
          v-model="search.taskType"
          placeholder="任务类型"
          style="width: 150px; margin-right: 8px"
        >
          <el-option label="全部" value="" />
          <el-option label="累积任务" value="ACCUMULATE" />
          <el-option label="连续任务" value="CONTINUOUS" />
          <el-option label="阶梯任务" value="STAIR" />
          <el-option label="时间窗口累积任务" value="WINDOW_ACCUMULATE" />
        </el-select>
        <el-select
          v-model="search.status"
          placeholder="任务状态"
          style="width: 150px; margin-right: 8px"
        >
          <el-option label="全部" value="" />
          <el-option label="启用" :value="1" />
          <el-option label="停用" :value="0" />
        </el-select>
        <el-select
          v-model="search.rewardType"
          placeholder="奖励类型"
          style="width: 150px; margin-right: 8px"
        >
          <el-option label="全部" value="" />
          <el-option label="积分" value="REWARD_POINT" />
          <el-option label="徽章" value="REWARD_BADGE" />
          <el-option label="实物" value="REWARD_PHYSICAL" />
        </el-select>
        <el-select
          v-model="search.sortOrder"
          placeholder="结束时间排序"
          style="width: 150px; margin-right: 8px"
        >
          <el-option label="默认" value="" />
          <el-option label="结束时间升序" value="asc" />
          <el-option label="结束时间降序" value="desc" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="openDialog">新增任务</el-button>
      </el-row>
      <el-table v-loading="loading" :data="tableData" style="margin-top: 16px">
        <el-table-column prop="id" label="任务ID" width="110">
          <template #default="scope">
            <el-tooltip :content="String(scope.row.id)" placement="top">
              <span>{{ formatShortId(scope.row.id) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="taskName" label="任务名称" />
        <el-table-column prop="taskType" label="任务类型">
          <template #default="scope">
            {{ getTaskTypeLabel(scope.row.taskType) }}
          </template>
        </el-table-column>
        <el-table-column prop="stockType" label="库存类型">
          <template #default="scope">
            {{ getStockTypeLabel(scope.row.stockType) }}
          </template>
        </el-table-column>
        <el-table-column prop="triggerEvent" label="触发事件">
          <template #default="scope">
            {{ getTriggerEventLabel(scope.row.triggerEvent) }}
          </template>
        </el-table-column>
        <el-table-column prop="rewardType" label="奖励类型">
          <template #default="scope">
            {{ getRewardTypeLabel(scope.row.rewardType) }}
          </template>
        </el-table-column>
        <el-table-column prop="rewardValue" label="奖励数值" />
        <el-table-column prop="totalStock" label="库存" />
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
              {{ scope.row.status === 1 ? "启用" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="150">
          <template #default="scope">
            <div>{{ formatDateTime(scope.row.startTime).date }}</div>
            <div>{{ formatDateTime(scope.row.startTime).time }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="endTime" label="结束时间" width="150">
          <template #default="scope">
            <div>{{ formatDateTime(scope.row.endTime).date }}</div>
            <div>{{ formatDateTime(scope.row.endTime).time }}</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button size="small" @click="editTask(scope.row)"
              >编辑</el-button
            >
            <el-button
              size="small"
              type="danger"
              @click="deleteTask(scope.row.id)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="page.current"
        v-model:page-size="page.size"
        :page-sizes="[10, 20, 50, 100]"
        :total="page.total"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 16px; justify-content: flex-end"
        @current-change="fetchData"
        @size-change="handleSizeChange"
      />
    </el-card>
    <el-dialog v-model="dialogVisible" title="任务配置" width="680px">
      <el-form :model="form" label-width="96px" class="task-config-form">
        <el-form-item label="任务名称">
          <el-input v-model="form.taskName" class="form-control" />
        </el-form-item>
        <el-form-item label="任务类型">
          <el-select
            v-model="form.taskType"
            class="form-control"
            @change="handleTaskTypeChange"
          >
            <el-option label="累积任务" value="ACCUMULATE" />
            <el-option label="连续任务" value="CONTINUOUS" />
            <el-option label="阶梯任务" value="STAIR" />
            <el-option label="时间窗口累积任务" value="WINDOW_ACCUMULATE" />
          </el-select>
        </el-form-item>
        <el-form-item label="库存类型">
          <el-select v-model="form.stockType" class="form-control">
            <el-option label="无限" value="STOCK_TYPE_UNLIMITED" />
            <el-option label="限量" value="STOCK_TYPE_LIMITED" />
          </el-select>
        </el-form-item>
        <el-form-item label="触发事件">
          <el-select
            v-model="form.triggerEvent"
            class="form-control"
            placeholder="请选择触发事件"
          >
            <el-option
              v-for="item in getTriggerEventOptions(form.taskType)"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="奖励类型">
          <el-select v-model="form.rewardType" class="form-control">
            <el-option label="积分" value="REWARD_POINT" />
            <el-option label="徽章" value="REWARD_BADGE" />
            <el-option label="实物" value="REWARD_PHYSICAL" />
          </el-select>
        </el-form-item>
        <el-form-item label="奖励数值">
          <el-input
            v-model="form.rewardValue"
            class="form-control"
            type="number"
          />
        </el-form-item>
        <el-form-item label="库存">
          <el-input
            v-model="form.totalStock"
            class="form-control"
            type="number"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" class="form-control">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="form.startTime"
            class="form-control"
            type="datetime"
          />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker
            v-model="form.endTime"
            class="form-control"
            type="datetime"
          />
        </el-form-item>
        <el-form-item label="任务策略配置">
          <div class="strategy-config-wrap">
            <template v-if="form.taskType === 'ACCUMULATE'">
              <el-form-item label="目标值" label-width="96px">
                <el-input-number
                  v-model="form.strategyConfig.accumulate.targetValue"
                  class="form-control"
                  :min="1"
                />
              </el-form-item>
            </template>

            <template v-else-if="form.taskType === 'CONTINUOUS'">
              <el-form-item label="目标天数" label-width="96px">
                <el-input-number
                  v-model="form.strategyConfig.continuous.targetDays"
                  class="form-control"
                  :min="1"
                />
              </el-form-item>
            </template>

            <template v-else-if="form.taskType === 'STAIR'">
              <div class="stair-grid stair-header">
                <span>阶梯</span>
                <span>目标值</span>
                <span>奖励值</span>
                <span>操作</span>
              </div>
              <el-space direction="vertical" fill class="stair-space">
                <div
                  v-for="(stage, index) in form.strategyConfig.stair.stages"
                  :key="index"
                  class="stair-grid stair-row"
                >
                  <span>第{{ index + 1 }}阶梯</span>
                  <el-input-number
                    v-model="form.strategyConfig.stair.stages[index]"
                    class="stair-input"
                    :min="1"
                    placeholder="目标值"
                  />
                  <el-input-number
                    v-model="form.strategyConfig.stair.rewards[index]"
                    class="stair-input"
                    :min="1"
                    placeholder="奖励值"
                  />
                  <el-button
                    v-if="form.strategyConfig.stair.stages.length > 1"
                    type="danger"
                    text
                    @click="removeStair(index)"
                  >
                    删除
                  </el-button>
                </div>
                <el-button
                  type="primary"
                  class="stair-add"
                  link
                  @click="addStair"
                  >+ 新增阶梯</el-button
                >
              </el-space>
            </template>

            <template v-else-if="form.taskType === 'WINDOW_ACCUMULATE'">
              <el-form-item label="窗口目标值" label-width="96px">
                <el-input-number
                  v-model="form.strategyConfig.windowAccumulate.targetValue"
                  class="form-control"
                  :min="1"
                />
              </el-form-item>
              <el-form-item label="窗口分钟数" label-width="96px">
                <el-input-number
                  v-model="form.strategyConfig.windowAccumulate.windowMinutes"
                  class="form-control window-minutes-input"
                  :min="1"
                />
              </el-form-item>
            </template>

            <template v-else>
              <el-empty description="请先选择任务类型" :image-size="72" />
            </template>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  searchTaskConfigs,
  createTaskConfig,
  updateTaskConfig,
  deleteTaskConfig
} from "../../api/task-config";

interface TaskConfigForm {
  taskName: string;
  taskType: string;
  stockType: string;
  triggerEvent: string;
  rewardType: string;
  rewardValue: number;
  totalStock: number;
  status: number;
  startTime: string | Date;
  endTime: string | Date;
  strategyConfig: {
    accumulate: { targetValue: number };
    continuous: { targetDays: number };
    stair: { stages: number[]; rewards: number[] };
    windowAccumulate: { targetValue: number; windowMinutes: number };
  };
}

interface TaskConfigItem {
  id: number;
  taskName: string;
  taskType: string;
  stockType: string;
  triggerEvent: string;
  rewardType: string;
  rewardValue: number;
  totalStock: number | null;
  status: number;
  startTime: string;
  endTime: string;
  ruleConfig: string;
}

const search = ref({
  taskName: "",
  taskType: "",
  status: "" as "" | number,
  rewardType: "",
  sortOrder: ""
});
const tableData = ref<TaskConfigItem[]>([]);
const loading = ref(false);
const page = ref({
  current: 1,
  size: 20,
  total: 0
});
const dialogVisible = ref(false);
const form = ref<TaskConfigForm>({
  taskName: "",
  taskType: "",
  stockType: "STOCK_TYPE_UNLIMITED",
  triggerEvent: "",
  rewardType: "",
  rewardValue: 0,
  totalStock: 0,
  status: 1,
  startTime: "",
  endTime: "",
  strategyConfig: {
    accumulate: { targetValue: 1 },
    continuous: { targetDays: 1 },
    stair: { stages: [1], rewards: [1] },
    windowAccumulate: { targetValue: 1, windowMinutes: 60 }
  }
});
const editId = ref<number | null>(null);

const TASK_TYPE_LABELS: Record<string, string> = {
  ACCUMULATE: "累积任务",
  CONTINUOUS: "连续任务",
  STAIR: "阶梯任务",
  WINDOW_ACCUMULATE: "时间窗口累积任务"
};

const STOCK_TYPE_LABELS: Record<string, string> = {
  STOCK_TYPE_UNLIMITED: "无限",
  STOCK_TYPE_LIMITED: "限量"
};

function getStockTypeLabel(value: string) {
  return STOCK_TYPE_LABELS[value] ?? value;
}

const REWARD_TYPE_LABELS: Record<string, string> = {
  REWARD_POINT: "积分",
  REWARD_BADGE: "徽章",
  REWARD_PHYSICAL: "实物"
};

const TRIGGER_EVENT_OPTIONS: Record<
  string,
  Array<{ label: string; value: string }>
> = {
  ACCUMULATE: [
    { label: "学习", value: "USER_LEARN" },
    { label: "登录", value: "USER_SIGN" },
    { label: "其他", value: "OTHER" }
  ],
  CONTINUOUS: [
    { label: "学习", value: "USER_LEARN" },
    { label: "登录", value: "USER_SIGN" },
    { label: "其他", value: "OTHER" }
  ],
  STAIR: [
    { label: "学习", value: "USER_LEARN" },
    { label: "登录", value: "USER_SIGN" },
    { label: "其他", value: "OTHER" }
  ],
  WINDOW_ACCUMULATE: [
    { label: "学习", value: "USER_LEARN" },
    { label: "登录", value: "USER_SIGN" },
    { label: "其他", value: "OTHER" }
  ]
};

function buildRuleConfigByTaskType(taskType: string) {
  if (taskType === "ACCUMULATE") {
    return {
      targetValue: form.value.strategyConfig.accumulate.targetValue
    };
  }
  if (taskType === "CONTINUOUS") {
    return {
      targetDays: form.value.strategyConfig.continuous.targetDays
    };
  }
  if (taskType === "STAIR") {
    return {
      stages: form.value.strategyConfig.stair.stages,
      rewards: form.value.strategyConfig.stair.rewards
    };
  }
  if (taskType === "WINDOW_ACCUMULATE") {
    return {
      targetValue: form.value.strategyConfig.windowAccumulate.targetValue,
      windowMinutes: form.value.strategyConfig.windowAccumulate.windowMinutes
    };
  }
  return {};
}

function parseRuleConfigByTaskType(taskType: string, ruleConfig: string) {
  let parsed: any = {};
  try {
    parsed = ruleConfig ? JSON.parse(ruleConfig) : {};
  } catch {
    parsed = {};
  }

  if (taskType === "ACCUMULATE") {
    form.value.strategyConfig.accumulate.targetValue = Number(
      parsed.targetValue || 1
    );
  }
  if (taskType === "CONTINUOUS") {
    form.value.strategyConfig.continuous.targetDays = Number(
      parsed.targetDays || 1
    );
  }
  if (taskType === "STAIR") {
    const stages = Array.isArray(parsed.stages)
      ? parsed.stages
          .map((v: any) => Number(v || 0))
          .filter((v: number) => v > 0)
      : [1];
    const rewards = Array.isArray(parsed.rewards)
      ? parsed.rewards
          .map((v: any) => Number(v || 0))
          .filter((v: number) => v > 0)
      : [];
    form.value.strategyConfig.stair.stages = stages.length ? stages : [1];
    form.value.strategyConfig.stair.rewards =
      rewards.length === form.value.strategyConfig.stair.stages.length
        ? rewards
        : form.value.strategyConfig.stair.stages.map(() => 1);
  }
  if (taskType === "WINDOW_ACCUMULATE") {
    form.value.strategyConfig.windowAccumulate.targetValue = Number(
      parsed.targetValue || 1
    );
    form.value.strategyConfig.windowAccumulate.windowMinutes = Number(
      parsed.windowMinutes || 60
    );
  }
}

function addStair() {
  form.value.strategyConfig.stair.stages.push(1);
  form.value.strategyConfig.stair.rewards.push(1);
}

function removeStair(index: number) {
  form.value.strategyConfig.stair.stages.splice(index, 1);
  form.value.strategyConfig.stair.rewards.splice(index, 1);
}

function formatShortId(id: number | string) {
  const text = String(id);
  return text.length > 7 ? `${text.slice(0, 7)}...` : text;
}

function getTaskTypeLabel(value: string) {
  return TASK_TYPE_LABELS[value] ?? value;
}

function getRewardTypeLabel(value: string) {
  return REWARD_TYPE_LABELS[value] ?? value;
}

function getTriggerEventOptions(taskType: string) {
  return TRIGGER_EVENT_OPTIONS[taskType] ?? [{ label: "其他", value: "OTHER" }];
}

function getTriggerEventLabel(value: string) {
  const all = Object.values(TRIGGER_EVENT_OPTIONS).flat();
  return all.find(item => item.value === value)?.label ?? value;
}

function formatDateTime(input: string) {
  if (!input) {
    return { date: "", time: "" };
  }
  const text = input.replace("T", " ").replace(/\.\d+\+00:00$/, "");
  const [date, time] = text.split(" ");
  return {
    date: date ?? "",
    time: time ?? ""
  };
}

async function fetchData() {
  loading.value = true;
  // 处理排序参数
  let orderByEndTime = "endTime";
  let asc = undefined;
  if (search.value.sortOrder === "asc") asc = true;
  if (search.value.sortOrder === "desc") asc = false;
  const params = {
    taskName: search.value.taskName || undefined,
    taskType: search.value.taskType || undefined,
    status: search.value.status === "" ? undefined : search.value.status,
    rewardType: search.value.rewardType || undefined,
    page: page.value.current,
    size: page.value.size,
    orderByEndTime,
    asc
  };
  try {
    const res = await searchTaskConfigs(params);
    tableData.value = res?.data?.items || res?.data?.records || [];
    page.value.total = res?.data?.total || 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  page.value.current = 1;
  fetchData();
}

function handleSizeChange() {
  page.value.current = 1;
  fetchData();
}

function openDialog() {
  form.value = {
    taskName: "",
    taskType: "",
    stockType: "STOCK_TYPE_UNLIMITED",
    triggerEvent: "",
    rewardType: "",
    rewardValue: 0,
    totalStock: 0,
    status: 1,
    startTime: "",
    endTime: "",
    strategyConfig: {
      accumulate: { targetValue: 1 },
      continuous: { targetDays: 1 },
      stair: { stages: [1], rewards: [1] },
      windowAccumulate: { targetValue: 1, windowMinutes: 60 }
    }
  };
  editId.value = null;
  dialogVisible.value = true;
}

function editTask(row: any) {
  form.value = {
    taskName: row.taskName ?? "",
    taskType: row.taskType ?? "",
    stockType: row.stockType ?? "STOCK_TYPE_UNLIMITED",
    triggerEvent: row.triggerEvent ?? "",
    rewardType: row.rewardType ?? "",
    rewardValue: row.rewardValue ?? 0,
    totalStock: row.totalStock ?? 0,
    status: row.status ?? 1,
    startTime: row.startTime ?? "",
    endTime: row.endTime ?? "",
    strategyConfig: {
      accumulate: { targetValue: 1 },
      continuous: { targetDays: 1 },
      stair: { stages: [1], rewards: [1] },
      windowAccumulate: { targetValue: 1, windowMinutes: 60 }
    }
  };
  parseRuleConfigByTaskType(form.value.taskType, row.ruleConfig ?? "");
  editId.value = row.id;
  dialogVisible.value = true;
}

function handleTaskTypeChange(value: string) {
  const options = getTriggerEventOptions(value);
  const valid = options.some(item => item.value === form.value.triggerEvent);
  if (!valid) {
    form.value.triggerEvent = options[0]?.value ?? "";
  }

  if (value === "STAIR") {
    if (!form.value.strategyConfig.stair.stages.length) {
      form.value.strategyConfig.stair.stages = [1];
      form.value.strategyConfig.stair.rewards = [1];
    }
  }
}

async function deleteTask(id: number) {
  await deleteTaskConfig(id);
  if (tableData.value.length === 1 && page.value.current > 1) {
    page.value.current -= 1;
  }
  fetchData();
}

async function submitForm() {
  const ruleConfigObject = buildRuleConfigByTaskType(form.value.taskType);
  const payload = {
    ...form.value,
    ruleConfig: JSON.stringify(ruleConfigObject),
    startTime:
      typeof form.value.startTime === "string"
        ? form.value.startTime
        : (form.value.startTime as Date).toISOString(),
    endTime:
      typeof form.value.endTime === "string"
        ? form.value.endTime
        : (form.value.endTime as Date).toISOString()
  };
  delete (payload as any).strategyConfig;
  if (editId.value) {
    await updateTaskConfig({ ...payload, id: editId.value });
  } else {
    await createTaskConfig(payload);
  }
  dialogVisible.value = false;
  fetchData();
}

fetchData();
</script>

<style scoped>
.task-config-form :deep(.el-form-item__content) {
  margin-left: 16px;
  flex: 1;
}

.form-control {
  width: 100%;
  max-width: 460px;
}

.strategy-config-wrap {
  width: 100%;
}

.stair-space {
  width: 100%;
}

.stair-grid {
  display: grid;
  grid-template-columns: 84px 140px 140px 72px;
  align-items: center;
  gap: 8px;
}

.stair-header {
  margin-bottom: 8px;
  padding: 0 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.stair-row {
  padding-right: 12px;
}

.stair-input {
  width: 132px;
}

.stair-add {
  margin-left: 4px;
}

.window-minutes-input {
  margin-left: 0;
}
</style>
