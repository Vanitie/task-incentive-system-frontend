<template>
  <div class="reward-record-page">
    <el-card>
      <el-alert type="info" show-icon :closable="false" class="workbench-entry">
        <template #title>
          奖励记录用于追踪发奖事实；对账、差异预览和积分补偿已统一收口到“奖励对账补偿”工作台。
        </template>
        <template #default>
          <el-button type="primary" link @click="goToWorkbench">
            进入奖励对账补偿工作台
          </el-button>
        </template>
      </el-alert>

      <el-row class="query-row">
        <el-select
          v-model="searchMode"
          placeholder="查询方式"
          style="width: 160px; margin-right: 8px"
        >
          <el-option label="综合查询" value="all" />
          <el-option label="按用户查询" value="byUser" />
        </el-select>

        <el-input
          v-model="search.userId"
          :placeholder="searchMode === 'byUser' ? '必填：用户ID' : '用户ID'"
          style="width: 190px; margin-right: 8px"
          clearable
        />
        <el-input
          v-model="search.taskId"
          placeholder="任务ID"
          style="width: 180px; margin-right: 8px"
          clearable
        />

        <el-select
          v-model="search.rewardType"
          placeholder="奖励类型"
          style="width: 160px; margin-right: 8px"
          clearable
        >
          <el-option label="积分" value="POINT" />
          <el-option label="REWARD_POINT" value="REWARD_POINT" />
          <el-option label="OP_POINT" value="OP_POINT" />
          <el-option label="POINT_CONSUME" value="POINT_CONSUME" />
          <el-option label="徽章" value="BADGE" />
          <el-option label="REWARD_BADGE" value="REWARD_BADGE" />
          <el-option label="实物" value="ITEM" />
          <el-option label="REWARD_PHYSICAL" value="REWARD_PHYSICAL" />
        </el-select>

        <el-select
          v-model="search.status"
          placeholder="领取状态"
          style="width: 140px; margin-right: 8px"
          clearable
        >
          <el-option label="未领取" value="0" />
          <el-option label="已领取" value="1" />
        </el-select>

        <el-button type="primary" :loading="loading" @click="onSearch">
          搜索
        </el-button>
      </el-row>

      <el-table
        v-loading="loading"
        :data="tableData"
        style="margin-top: 16px"
        border
      >
        <el-table-column prop="userName" label="用户名" min-width="130" />
        <el-table-column prop="taskName" label="任务名" min-width="160" />
        <el-table-column prop="rewardType" label="奖励类型" min-width="130">
          <template #default="scope">
            <el-tag :type="rewardTypeTagType(scope.row.rewardType)">
              {{ getRewardTypeLabel(scope.row.rewardType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rewardValue" label="奖励内容" min-width="150">
          <template #default="scope">
            {{ formatRewardValue(scope.row.rewardType, scope.row.rewardValue) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="领取状态" min-width="110">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
              {{ scope.row.status === 1 ? "已领取" : "未领取" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="grantStatus" label="发奖状态" min-width="110">
          <template #default="scope">
            <el-tag :type="grantStatusTagType(scope.row.grantStatus)">
              {{ grantStatusLabel(scope.row.grantStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="发放时间" min-width="170">
          <template #default="scope">
            {{ normalizeDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="showDetail(scope.row)"
              >详情</el-button
            >
          </template>
        </el-table-column>
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

    <el-dialog v-model="dialogVisible" title="奖励记录详情" width="620px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="记录ID">{{
          detail.id
        }}</el-descriptions-item>
        <el-descriptions-item label="用户ID">{{
          detail.userId
        }}</el-descriptions-item>
        <el-descriptions-item label="任务ID">{{
          detail.taskId
        }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{
          detail.userName || "-"
        }}</el-descriptions-item>
        <el-descriptions-item label="任务名">{{
          detail.taskName || "-"
        }}</el-descriptions-item>
        <el-descriptions-item label="奖励类型">{{
          getRewardTypeLabel(detail.rewardType)
        }}</el-descriptions-item>
        <el-descriptions-item label="奖励数值">{{
          detail.rewardValue
        }}</el-descriptions-item>
        <el-descriptions-item label="领取状态">{{
          detail.status === 1 ? "已领取" : "未领取"
        }}</el-descriptions-item>
        <el-descriptions-item label="发奖状态">{{
          grantStatusLabel(detail.grantStatus)
        }}</el-descriptions-item>
        <el-descriptions-item label="message_id">{{
          detail.messageId || "-"
        }}</el-descriptions-item>
        <el-descriptions-item label="error_msg">{{
          detail.errorMsg || "-"
        }}</el-descriptions-item>
        <el-descriptions-item label="发放时间">{{
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
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  getUserRewardList,
  getUserRewardListByUser,
  unwrapApiResponse,
  type UserRewardItem,
  type UserRewardListPage
} from "@/api/user-reward";

const pageSizes = [10, 20, 50, 100];
const router = useRouter();

const searchMode = ref<"all" | "byUser">("all");
const search = ref({ userId: "", taskId: "", rewardType: "", status: "" });
const tableData = ref<UserRewardItem[]>([]);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const total = ref(0);
const dialogVisible = ref(false);
const detail = ref<UserRewardItem>({
  id: 0,
  userId: 0,
  userName: "",
  taskId: 0,
  taskName: "",
  rewardType: "",
  rewardValue: 0,
  status: 0,
  createTime: ""
});

const rewardTypeLabelMap: Record<string, string> = {
  POINT: "积分",
  REWARD_POINT: "积分奖励",
  OP_POINT: "运营改分",
  POINT_CONSUME: "积分消费",
  BADGE: "徽章",
  REWARD_BADGE: "徽章奖励",
  ITEM: "实物",
  REWARD_PHYSICAL: "实物奖励"
};

const grantStatusMap: Record<number, string> = {
  0: "INIT",
  1: "PROCESSING",
  2: "SUCCESS",
  3: "FAILED"
};

function grantStatusLabel(value?: number) {
  if (value === undefined || value === null) return "-";
  return grantStatusMap[Number(value)] || String(value);
}

function grantStatusTagType(value?: number) {
  if (value === 2) return "success";
  if (value === 3) return "danger";
  if (value === 1) return "warning";
  return "info";
}

function getRewardTypeLabel(value: string) {
  return rewardTypeLabelMap[value] ?? value;
}

function rewardTypeTagType(value: string) {
  if (["POINT", "REWARD_POINT", "OP_POINT", "POINT_CONSUME"].includes(value)) {
    return "success";
  }
  if (["BADGE", "REWARD_BADGE"].includes(value)) {
    return "warning";
  }
  if (["ITEM", "REWARD_PHYSICAL"].includes(value)) {
    return "danger";
  }
  return "info";
}

function formatRewardValue(rewardType: string, rewardValue: number) {
  if (["POINT", "REWARD_POINT", "OP_POINT"].includes(rewardType)) {
    return `+${rewardValue} 积分`;
  }
  if (rewardType === "POINT_CONSUME") {
    return `-${Math.abs(rewardValue)} 积分`;
  }
  if (["BADGE", "REWARD_BADGE"].includes(rewardType)) {
    return `徽章编码 ${rewardValue}`;
  }
  if (["ITEM", "REWARD_PHYSICAL"].includes(rewardType)) {
    return `实物编号 ${rewardValue}`;
  }
  return String(rewardValue);
}

function normalizeDateTime(input?: string | Date) {
  if (!input) return "";
  return String(input)
    .replace("T", " ")
    .replace(/\.\d+\+00:00$/, "");
}

function normalizePageData(pageData: UserRewardListPage): UserRewardListPage {
  return {
    ...pageData,
    total: Number(pageData.total || 0),
    items: (pageData.items || []).map(item => ({
      ...item,
      id: Number(item.id),
      userId: Number(item.userId),
      taskId: Number(item.taskId),
      rewardValue: Number(item.rewardValue || 0),
      status: Number(item.status || 0),
      grantStatus:
        item.grantStatus === undefined || item.grantStatus === null
          ? undefined
          : Number(item.grantStatus)
    }))
  };
}

async function fetchData() {
  loading.value = true;
  try {
    const params: Record<string, any> = {
      page: page.value,
      size: size.value
    };

    if (search.value.taskId) params.taskId = search.value.taskId;
    if (search.value.rewardType) params.rewardType = search.value.rewardType;
    if (search.value.status !== "") params.status = search.value.status;

    let pageData: UserRewardListPage;
    if (searchMode.value === "byUser") {
      if (!search.value.userId) {
        ElMessage.warning("按用户查询时，请输入用户ID");
        tableData.value = [];
        total.value = 0;
        return;
      }
      pageData = unwrapApiResponse(
        await getUserRewardListByUser(search.value.userId, params)
      );
    } else {
      if (search.value.userId) params.userId = search.value.userId;
      pageData = unwrapApiResponse(await getUserRewardList(params));
    }

    const normalized = normalizePageData(pageData);
    tableData.value = normalized.items;
    total.value = normalized.total;
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  page.value = 1;
  fetchData();
}

function handleSizeChange(newSize: number) {
  size.value = newSize;
  page.value = 1;
  fetchData();
}

function handlePageChange(newPage: number) {
  page.value = newPage;
  fetchData();
}

function showDetail(row: UserRewardItem) {
  detail.value = { ...row };
  dialogVisible.value = true;
}

function goToWorkbench() {
  router.push("/reward/points-workbench");
}

fetchData();
</script>

<style scoped>
.workbench-entry {
  margin-bottom: 12px;
}

.reward-record-page .query-row {
  display: flex;
  flex-wrap: wrap;
  row-gap: 8px;
}
</style>
