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
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
const search = ref({ userId: "", taskId: "", rewardType: "", status: "" });
const tableData = ref([]);

function fetchData() {
  // TODO: 调用后端API获取数据
}
</script>
