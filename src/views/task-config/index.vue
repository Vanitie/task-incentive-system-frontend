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
          v-model="search.status"
          placeholder="任务状态"
          style="width: 150px; margin-right: 8px"
        >
          <el-option label="全部" value="" />
          <el-option label="启用" value="1" />
          <el-option label="停用" value="0" />
        </el-select>
        <el-button type="primary" @click="fetchData">搜索</el-button>
        <el-button @click="openDialog">新增任务</el-button>
      </el-row>
      <el-table :data="tableData" style="margin-top: 16px">
        <el-table-column prop="id" label="任务ID" width="80" />
        <el-table-column prop="taskName" label="任务名称" />
        <el-table-column prop="taskType" label="任务类型" />
        <el-table-column prop="triggerEvent" label="触发事件" />
        <el-table-column prop="rewardType" label="奖励类型" />
        <el-table-column prop="rewardValue" label="奖励数值" />
        <el-table-column prop="totalStock" label="库存" />
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
              {{ scope.row.status === 1 ? "启用" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" />
        <el-table-column prop="endTime" label="结束时间" />
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
    </el-card>
    <el-dialog v-model="dialogVisible" title="任务配置" width="500px">
      <el-form :model="form">
        <el-form-item label="任务名称">
          <el-input v-model="form.taskName" />
        </el-form-item>
        <el-form-item label="任务类型">
          <el-select v-model="form.taskType">
            <el-option label="行为" value="TASK_TYPE_BEHAVIOR" />
            <el-option label="阶梯" value="TASK_TYPE_STAIR" />
            <el-option label="限量" value="TASK_TYPE_LIMITED" />
          </el-select>
        </el-form-item>
        <el-form-item label="触发事件">
          <el-input v-model="form.triggerEvent" />
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
            <el-option label="启用" value="1" />
            <el-option label="停用" value="0" />
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

const search = ref({ taskName: "", status: "" });
const tableData = ref([]);
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

function fetchData() {
  // TODO: 调用后端API获取数据
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
  dialogVisible.value = true;
}
function deleteTask(id: number) {
  // TODO: 调用后端API删除
}
function submitForm() {
  // TODO: 调用后端API保存
  dialogVisible.value = false;
}
</script>
