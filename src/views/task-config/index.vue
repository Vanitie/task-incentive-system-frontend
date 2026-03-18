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
          <el-option label="行为" value="TASK_TYPE_BEHAVIOR" />
          <el-option label="阶梯" value="TASK_TYPE_STAIR" />
          <el-option label="限量" value="TASK_TYPE_LIMITED" />
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
    <el-dialog v-model="dialogVisible" title="任务配置" width="500px">
      <el-form :model="form">
        <el-form-item label="任务名称">
          <el-input v-model="form.taskName" />
        </el-form-item>
        <el-form-item label="任务类型">
          <el-select v-model="form.taskType" @change="handleTaskTypeChange">
            <el-option label="行为" value="TASK_TYPE_BEHAVIOR" />
            <el-option label="阶梯" value="TASK_TYPE_STAIR" />
            <el-option label="限量" value="TASK_TYPE_LIMITED" />
          </el-select>
        </el-form-item>
        <el-form-item label="触发事件">
          <el-select v-model="form.triggerEvent" placeholder="请选择触发事件">
            <el-option
              v-for="item in getTriggerEventOptions(form.taskType)"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="奖励类型">
          <el-select v-model="form.rewardType">
            <el-option label="积分" value="REWARD_POINT" />
            <el-option label="徽章" value="REWARD_BADGE" />
            <el-option label="实物" value="REWARD_PHYSICAL" />
          </el-select>
        </el-form-item>
        <el-form-item label="奖励数值">
          <el-input v-model="form.rewardValue" type="number" />
        </el-form-item>
        <el-form-item label="库存">
          <el-input v-model="form.totalStock" type="number" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker v-model="form.startTime" type="datetime" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker v-model="form.endTime" type="datetime" />
        </el-form-item>
        <el-form-item label="任务策略配置">
          <el-input v-model="form.ruleConfig" type="textarea" />
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
  triggerEvent: string;
  rewardType: string;
  rewardValue: number;
  totalStock: number;
  status: number;
  startTime: string | Date;
  endTime: string | Date;
  ruleConfig: string;
}

interface TaskConfigItem {
  id: number;
  taskName: string;
  taskType: string;
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
  triggerEvent: "",
  rewardType: "",
  rewardValue: 0,
  totalStock: 0,
  status: 1,
  startTime: "",
  endTime: "",
  ruleConfig: ""
});
const editId = ref<number | null>(null);

const TASK_TYPE_LABELS: Record<string, string> = {
  TASK_TYPE_BEHAVIOR: "行为任务",
  TASK_TYPE_STAIR: "阶梯任务",
  TASK_TYPE_LIMITED: "限量任务"
};

const REWARD_TYPE_LABELS: Record<string, string> = {
  REWARD_POINT: "积分",
  REWARD_BADGE: "徽章",
  REWARD_PHYSICAL: "实物"
};

const TRIGGER_EVENT_OPTIONS: Record<
  string,
  Array<{ label: string; value: string }>
> = {
  TASK_TYPE_BEHAVIOR: [
    { label: "学习", value: "USER_LEARN" },
    { label: "登录", value: "USER_SIGN" },
    { label: "其他", value: "OTHER" }
  ],
  TASK_TYPE_STAIR: [
    { label: "学习", value: "USER_LEARN" },
    { label: "登录", value: "USER_SIGN" },
    { label: "其他", value: "OTHER" }
  ],
  TASK_TYPE_LIMITED: [
    { label: "学习", value: "USER_LEARN" },
    { label: "登录", value: "USER_SIGN" },
    { label: "其他", value: "OTHER" }
  ]
};

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
    triggerEvent: "",
    rewardType: "",
    rewardValue: 0,
    totalStock: 0,
    status: 1,
    startTime: "",
    endTime: "",
    ruleConfig: ""
  };
  editId.value = null;
  dialogVisible.value = true;
}

function editTask(row: any) {
  form.value = {
    taskName: row.taskName ?? "",
    taskType: row.taskType ?? "",
    triggerEvent: row.triggerEvent ?? "",
    rewardType: row.rewardType ?? "",
    rewardValue: row.rewardValue ?? 0,
    totalStock: row.totalStock ?? 0,
    status: row.status ?? 1,
    startTime: row.startTime ?? "",
    endTime: row.endTime ?? "",
    ruleConfig: row.ruleConfig ?? ""
  };
  editId.value = row.id;
  dialogVisible.value = true;
}

function handleTaskTypeChange(value: string) {
  const options = getTriggerEventOptions(value);
  const valid = options.some(item => item.value === form.value.triggerEvent);
  if (!valid) {
    form.value.triggerEvent = options[0]?.value ?? "";
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
  const payload = {
    ...form.value,
    startTime:
      typeof form.value.startTime === "string"
        ? form.value.startTime
        : (form.value.startTime as Date).toISOString(),
    endTime:
      typeof form.value.endTime === "string"
        ? form.value.endTime
        : (form.value.endTime as Date).toISOString()
  };
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
