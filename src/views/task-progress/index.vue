<template>
  <div>
    <el-card>
      <el-row>
        <el-input
          v-model="search.userId"
          placeholder="用户ID"
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
          <el-option label="未完成" value="0" />
          <el-option label="已完成" value="1" />
        </el-select>
        <el-button type="primary" @click="fetchData">搜索</el-button>
      </el-row>
      <el-table :data="tableData" style="margin-top: 16px">
        <el-table-column prop="id" label="实例ID" width="80" />
        <el-table-column prop="userId" label="用户ID" />
        <el-table-column prop="taskId" label="任务ID" />
        <el-table-column prop="progress" label="进度">
          <template #default="scope">
            <el-progress :percentage="scope.row.progress" />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
              {{ scope.row.status === 1 ? "已完成" : "未完成" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" />
        <el-table-column prop="updateTime" label="更新时间" />
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
        <el-descriptions-item label="任务ID">{{
          detail.taskId
        }}</el-descriptions-item>
        <el-descriptions-item label="进度">{{
          detail.progress
        }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{
          detail.status === 1 ? "已完成" : "未完成"
        }}</el-descriptions-item>
        <el-descriptions-item label="扩展数据">{{
          detail.extraData
        }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{
          detail.createTime
        }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{
          detail.updateTime
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
  taskId: number;
  progress: number;
  status: number;
  version: number;
  extraData: string;
  createTime: string | Date;
  updateTime: string | Date;
}

import { getUserTaskList } from "@/api/user-task";

const search = ref({ userId: "", taskId: "", status: "" });
const tableData = ref([]);
const page = ref(1);
const size = ref(20);
const total = ref(0);
const dialogVisible = ref(false);
const detail = ref<UserTaskInstanceForm>({
  id: 0,
  userId: 0,
  taskId: 0,
  progress: 0,
  status: 0,
  version: 0,
  extraData: "",
  createTime: "",
  updateTime: ""
});

async function fetchData() {
  const params: any = {};
  if (search.value.userId) params.userId = search.value.userId;
  if (search.value.taskId) params.taskId = search.value.taskId;
  if (search.value.status) params.status = search.value.status;
  params.page = page.value;
  params.size = size.value;
  const res = await getUserTaskList(params);
  const r = res as any;
  const items = r?.data?.data?.items || r?.data?.items || [];
  tableData.value = items;
  total.value = r?.data?.data?.total || r?.data?.total || 0;
}

function handlePageChange(newPage: number) {
  page.value = newPage;
  fetchData();
}

function showDetail(row: any) {
  detail.value = { ...row };
  dialogVisible.value = true;
}

fetchData();
</script>
