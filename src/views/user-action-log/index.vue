<template>
  <div>
    <el-card>
      <el-row>
        <el-input
          v-model="search.userId"
          placeholder="用户ID"
          style="width: 200px; margin-right: 8px"
        />
        <el-select
          v-model="search.actionType"
          placeholder="行为类型"
          style="width: 150px; margin-right: 8px"
        >
          <el-option label="全部" value="" />
          <el-option label="学习" value="USER_LEARN" />
          <el-option label="签到" value="USER_SIGN" />
          <el-option label="其他" value="OTHER" />
        </el-select>
        <el-date-picker
          v-model="search.dateRange"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="margin-right: 8px"
        />
        <el-button type="primary" @click="fetchData">搜索</el-button>
        <el-button @click="openDialog">新增行为</el-button>
      </el-row>
      <el-table :data="tableData" style="margin-top: 16px">
        <el-table-column prop="id" label="日志ID" width="80" />
        <el-table-column prop="userId" label="用户ID" />
        <el-table-column prop="actionType" label="行为类型">
          <template #default="scope">
            <el-tag>
              {{ actionTypeMap[scope.row.actionType] || scope.row.actionType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="actionValue" label="行为数值" />
        <el-table-column prop="createTime" label="行为发生时间" />
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button size="small" @click="editLog(scope.row)">编辑</el-button>
            <el-button
              size="small"
              type="danger"
              @click="deleteLog(scope.row.id)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" title="用户行为日志" width="500px">
      <el-form :model="form">
        <el-form-item label="用户ID">
          <el-input v-model="form.userId" />
        </el-form-item>
        <el-form-item label="行为类型">
          <el-select v-model="form.actionType">
            <el-option label="学习" value="USER_LEARN" />
            <el-option label="签到" value="USER_SIGN" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="行为数值">
          <el-input v-model="form.actionValue" type="number" />
        </el-form-item>
        <el-form-item label="行为发生时间">
          <el-date-picker v-model="form.createTime" type="datetime" />
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

const actionTypeMap = {
  USER_LEARN: "学习",
  USER_SIGN: "签到",
  OTHER: "其他"
};

const search = ref({ userId: "", actionType: "", dateRange: [] });
const tableData = ref([
  // 示例数据
  {
    id: 1,
    userId: 1001,
    actionType: "USER_LEARN",
    actionValue: 30,
    createTime: "2026-03-17 10:00:00"
  },
  {
    id: 2,
    userId: 1002,
    actionType: "USER_SIGN",
    actionValue: 1,
    createTime: "2026-03-17 09:00:00"
  }
]);
const dialogVisible = ref(false);
const form = ref({
  id: null,
  userId: "",
  actionType: "",
  actionValue: 0,
  createTime: ""
});

function fetchData() {
  // TODO: 调用后端API获取数据
}
function openDialog() {
  form.value = {
    id: null,
    userId: "",
    actionType: "",
    actionValue: 0,
    createTime: ""
  };
  dialogVisible.value = true;
}
function editLog(row: any) {
  form.value = { ...row };
  dialogVisible.value = true;
}
function deleteLog(id: number) {
  // TODO: 调用后端API删除
}
function submitForm() {
  // TODO: 调用后端API保存
  dialogVisible.value = false;
}
</script>
