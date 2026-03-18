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
          v-model="search.status"
          placeholder="奖励状态"
          style="width: 150px; margin-right: 8px"
        >
          <el-option label="全部" value="" />
          <el-option label="未领取" value="0" />
          <el-option label="已领取" value="1" />
        </el-select>
        <el-button type="primary" @click="fetchData">搜索</el-button>
      </el-row>
      <el-table :data="tableData" style="margin-top: 16px">
        <el-table-column prop="id" label="记录ID" width="80" />
        <el-table-column prop="userId" label="用户ID" />
        <el-table-column prop="taskId" label="任务ID" />
        <el-table-column prop="rewardType" label="奖励类型">
          <template #default="scope">
            <span v-if="scope.row.rewardType === 'REWARD_POINT'">积分</span>
            <span v-else-if="scope.row.rewardType === 'REWARD_BADGE'"
              >徽章</span
            >
            <span v-else-if="scope.row.rewardType === 'REWARD_PHYSICAL'"
              >实物</span
            >
            <span v-else>未知</span>
          </template>
        </el-table-column>
        <el-table-column prop="rewardValue" label="奖励数值" />
        <el-table-column prop="status" label="奖励状态">
          <template #default="scope">
            <span v-if="scope.row.status === 1">已领取</span>
            <span v-else>未领取</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="发放时间" />
      </el-table>
      <el-pagination
        style="margin-top: 16px; text-align: right"
        background
        layout="sizes, prev, pager, next, jumper, ->, total"
        :current-page="page"
        :page-size="size"
        :page-sizes="pageSizes"
        :total="total"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
const pageSizes = [10, 20, 50, 100];

function handleSizeChange(newSize: number) {
  size.value = newSize;
  page.value = 1;
  fetchData();
}
import { ref } from "vue";
import { getUserRewardList } from "@/api/user-reward";

const search = ref({ userId: "", taskId: "", rewardType: "", status: "" });
const tableData = ref([]);
const page = ref(1);
const size = ref(20);
const total = ref(0);

async function fetchData() {
  const params: any = {};
  if (search.value.userId) params.userId = search.value.userId;
  if (search.value.taskId) params.taskId = search.value.taskId;
  if (search.value.rewardType) params.rewardType = search.value.rewardType;
  if (search.value.status) params.status = search.value.status;
  params.page = page.value;
  params.size = size.value;
  const res = await getUserRewardList(params);
  const r = res as any;
  const items = r?.data?.data?.items || r?.data?.items || [];
  tableData.value = items;
  total.value = r?.data?.data?.total || r?.data?.total || 0;
}

function handlePageChange(newPage: number) {
  page.value = newPage;
  fetchData();
}

fetchData();
</script>
