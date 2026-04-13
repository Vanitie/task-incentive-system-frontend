<template>
  <div>
    <el-card>
      <el-row>
        <el-input
          v-model="search.userName"
          placeholder="用户名"
          style="width: 200px; margin-right: 8px"
        />
        <el-input
          v-model="search.userId"
          placeholder="用户ID"
          style="width: 200px; margin-right: 8px"
        />
        <el-input
          v-model="search.taskName"
          placeholder="任务名"
          style="width: 200px; margin-right: 8px"
        />
        <el-input
          v-model="search.taskId"
          placeholder="任务ID"
          style="width: 200px; margin-right: 8px"
        />
        <el-select
          v-model="search.status"
          placeholder="任务状态"
          style="width: 150px; margin-right: 8px"
        >
          <el-option label="全部" value="" />
          <el-option label="已领取" value="1" />
          <el-option label="进行中" value="2" />
          <el-option label="已完成" value="3" />
          <el-option label="已取消" value="4" />
        </el-select>
        <el-button type="primary" @click="fetchData">搜索</el-button>
      </el-row>
      <el-table :data="tableData" style="margin-top: 16px">
        <el-table-column prop="userName" label="用户名" min-width="140" />
        <el-table-column prop="taskName" label="任务名" min-width="160" />
        <el-table-column prop="progress" label="进度">
          <template #default="scope">
            <el-progress :percentage="scope.row.progress" />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间">
          <template #default="scope">
            {{ normalizeDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间">
          <template #default="scope">
            {{ normalizeDateTime(scope.row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button size="small" @click="showDetail(scope.row)"
              >详情</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top: 16px; text-align: right">
        <el-pagination
          background
          layout="sizes, prev, pager, next, jumper, ->, total"
          :current-page="page"
          :page-size="size"
          :page-sizes="pageSizes"
          :total="total"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
    <el-dialog v-model="dialogVisible" title="任务详情" width="400px">
      <el-descriptions :column="1">
        <el-descriptions-item label="实例ID">{{
          detail.id
        }}</el-descriptions-item>
        <el-descriptions-item label="用户ID">{{
          detail.userId
        }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{
          detail.userName
        }}</el-descriptions-item>
        <el-descriptions-item label="任务ID">{{
          detail.taskId
        }}</el-descriptions-item>
        <el-descriptions-item label="任务名">{{
          detail.taskName
        }}</el-descriptions-item>
        <el-descriptions-item label="进度">{{
          detail.progress
        }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{
          getStatusLabel(detail.status)
        }}</el-descriptions-item>
        <el-descriptions-item label="扩展数据">{{
          detail.extraData
        }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{
          normalizeDateTime(detail.createTime)
        }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{
          normalizeDateTime(detail.updateTime)
        }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
const pageSizes = [10, 20, 50, 100];

function handleSizeChange(newSize: number) {
  size.value = newSize;
  page.value = 1;
  fetchData();
}
interface UserTaskInstanceForm {
  id: number;
  userId: number;
  userName: string;
  taskId: number;
  taskName: string;
  progress: number;
  status: number;
  version: number;
  extraData: string;
  createTime: string | Date;
  updateTime: string | Date;
}

import {
  getUserTaskList,
  type UserTaskListItem,
  type UserTaskListPage
} from "@/api/user-task";

const search = ref({
  userName: "",
  userId: "",
  taskName: "",
  taskId: "",
  status: ""
});
const tableData = ref<UserTaskListItem[]>([]);
const page = ref(1);
const size = ref(20);
const total = ref(0);
const dialogVisible = ref(false);
const detail = ref<UserTaskInstanceForm>({
  id: 0,
  userId: 0,
  userName: "",
  taskId: 0,
  taskName: "",
  progress: 0,
  status: 0,
  version: 0,
  extraData: "",
  createTime: "",
  updateTime: ""
});

async function fetchData() {
  const params: Record<string, string | number> = {};
  if (search.value.userName) params.userName = search.value.userName;
  if (search.value.userId) params.userId = search.value.userId;
  if (search.value.taskName) params.taskName = search.value.taskName;
  if (search.value.taskId) params.taskId = search.value.taskId;
  if (search.value.status) params.status = search.value.status;
  params.page = page.value;
  params.size = size.value;
  const res = await getUserTaskList(params);
  const r = res as any;
  const pageData = (r?.data?.data ||
    r?.data ||
    {}) as UserTaskListPage<UserTaskListItem>;
  tableData.value = pageData.items || [];
  total.value = Number(pageData.total || 0);
}

function handlePageChange(newPage: number) {
  page.value = newPage;
  fetchData();
}

function showDetail(row: UserTaskListItem) {
  detail.value = {
    id: Number(row.id || 0),
    userId: Number(row.userId || 0),
    userName: String(row.userName || ""),
    taskId: Number(row.taskId || 0),
    taskName: String(row.taskName || ""),
    progress: Number(row.progress || 0),
    status: Number(row.status || 0),
    version: Number(row.version || 0),
    extraData: String(row.extraData || ""),
    createTime: row.createTime || "",
    updateTime: row.updateTime || ""
  };
  dialogVisible.value = true;
}

function normalizeDateTime(input: string | Date) {
  if (!input) return "";
  const text = String(input);
  return text.replace("T", " ").replace(/\.\d+\+00:00$/, "");
}

fetchData();

function getStatusLabel(status: number) {
  switch (status) {
    case 1:
      return "已领取";
    case 2:
      return "进行中";
    case 3:
      return "已完成";
    case 4:
      return "已取消";
    default:
      return "未知";
  }
}

function getStatusTagType(status: number) {
  switch (status) {
    case 1:
      return "warning";
    case 2:
      return "primary";
    case 3:
      return "success";
    case 4:
      return "danger";
    default:
      return "info";
  }
}
</script>
