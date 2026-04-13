<template>
  <div class="user-management-page">
    <el-card shadow="never">
      <el-form :inline="true" class="query-form">
        <el-form-item label="用户ID">
          <el-input v-model="query.userId" clearable placeholder="精确匹配" />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="query.username" clearable placeholder="模糊匹配" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="query.role" clearable style="width: 150px">
            <el-option label="管理员" value="ADMIN" />
            <el-option label="普通用户" value="USER" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.enabled" clearable style="width: 130px">
            <el-option label="启用" :value="true" />
            <el-option label="禁用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="onSearch"
            >查询</el-button
          >
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="userList" border>
        <el-table-column prop="id" label="用户ID" min-width="140" />
        <el-table-column prop="username" label="用户名" min-width="140" />
        <el-table-column label="角色" min-width="110">
          <template #default="scope">
            <el-tag
              :type="
                String(scope.row.roles || '').includes('ADMIN')
                  ? 'danger'
                  : 'info'
              "
            >
              {{
                String(scope.row.roles || "").includes("ADMIN")
                  ? "管理员"
                  : "普通用户"
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="90">
          <template #default="scope">
            <el-tag :type="scope.row.enabled ? 'success' : 'warning'">
              {{ scope.row.enabled ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="pointBalance" label="积分余额" min-width="110" />
        <el-table-column label="注册时间" min-width="170">
          <template #default="scope">{{
            formatDateTime(scope.row.registerTime)
          }}</template>
        </el-table-column>
        <el-table-column label="最后活跃" min-width="170">
          <template #default="scope">{{
            formatDateTime(scope.row.lastActiveTime)
          }}</template>
        </el-table-column>
        <el-table-column label="操作" width="360" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="openDetail(scope.row)"
              >详情</el-button
            >
            <el-button
              size="small"
              :type="scope.row.enabled ? 'warning' : 'success'"
              @click="toggleStatus(scope.row)"
            >
              {{ scope.row.enabled ? "禁用" : "启用" }}
            </el-button>
            <el-button
              v-if="!String(scope.row.roles || '').includes('ADMIN')"
              size="small"
              type="danger"
              @click="changeRole(scope.row, 'ADMIN')"
            >
              设为管理员
            </el-button>
            <el-button
              v-else
              size="small"
              type="info"
              @click="changeRole(scope.row, 'USER')"
            >
              设为普通用户
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        style="margin-top: 12px; text-align: right"
        background
        layout="sizes, prev, pager, next, jumper, ->, total"
        :current-page="page.current"
        :page-size="page.size"
        :page-sizes="[10, 20, 50, 100]"
        :total="page.total"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" header="TopN（接取最多任务用户）">
          <el-table :data="topAcceptedUsers" size="small" border>
            <el-table-column prop="userId" label="用户ID" min-width="130" />
            <el-table-column prop="userName" label="用户名" min-width="120" />
            <el-table-column
              prop="acceptedCount"
              label="接取任务数"
              min-width="110"
            />
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" header="TopN（任务类型）">
          <el-table :data="topTaskTypes" size="small" border>
            <el-table-column prop="taskType" label="任务类型" min-width="130" />
            <el-table-column prop="count" label="数量" min-width="100" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" header="管理操作审计日志">
      <el-form :inline="true" class="query-form">
        <el-form-item label="操作人ID">
          <el-input
            v-model="auditQuery.operatorUserId"
            clearable
            placeholder="可选"
          />
        </el-form-item>
        <el-form-item label="目标用户ID">
          <el-input
            v-model="auditQuery.targetUserId"
            clearable
            placeholder="可选"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :loading="auditLoading"
            @click="fetchAuditLogs"
          >
            查询审计
          </el-button>
        </el-form-item>
      </el-form>

      <el-table :data="auditList" size="small" border v-loading="auditLoading">
        <el-table-column prop="id" label="日志ID" min-width="120" />
        <el-table-column
          prop="operatorUserId"
          label="操作人ID"
          min-width="120"
        />
        <el-table-column
          prop="targetUserId"
          label="目标用户ID"
          min-width="120"
        />
        <el-table-column prop="actionType" label="动作" min-width="160" />
        <el-table-column
          prop="detail"
          label="详情"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column label="操作时间" min-width="170">
          <template #default="scope">{{
            formatDateTime(scope.row.operateTime)
          }}</template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-drawer
      v-model="detailVisible"
      title="用户详情"
      size="46%"
      destroy-on-close
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户ID">{{
          detail.basic?.id
        }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{
          detail.basic?.username
        }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{
          detail.basic?.roles || "-"
        }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{
          detail.basic?.enabled ? "启用" : "禁用"
        }}</el-descriptions-item>
        <el-descriptions-item label="积分余额">{{
          detail.basic?.pointBalance ?? 0
        }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{
          formatDateTime(detail.basic?.registerTime)
        }}</el-descriptions-item>
      </el-descriptions>

      <el-row :gutter="12" style="margin-top: 12px">
        <el-col :span="8">
          <el-card shadow="hover">
            <div class="metric-title">当前积分</div>
            <div class="metric-value">
              {{ pointSummary.currentPoints ?? 0 }}
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover">
            <div class="metric-title">累计获得</div>
            <div class="metric-value">{{ pointSummary.totalGain ?? 0 }}</div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover">
            <div class="metric-title">累计消耗</div>
            <div class="metric-value">{{ pointSummary.totalConsume ?? 0 }}</div>
          </el-card>
        </el-col>
      </el-row>

      <el-table
        :data="behaviorRows"
        size="small"
        border
        style="margin-top: 12px"
      >
        <el-table-column prop="days" label="统计周期(天)" min-width="100" />
        <el-table-column
          prop="behaviorCount"
          label="行为次数"
          min-width="110"
        />
        <el-table-column prop="signDays" label="签到天数" min-width="100" />
        <el-table-column
          prop="taskCompletionRate"
          label="任务完成率(%)"
          min-width="120"
        />
        <el-table-column prop="rewardRate" label="领奖率(%)" min-width="100" />
      </el-table>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getUserAdminPage,
  getUserAdminDetail,
  updateUserAdminStatus,
  updateUserAdminRole,
  getUserAdminPointsSummary,
  getUserAdminBehaviorSummary,
  getUserAdminAuditLogs,
  type UserAdminItem,
  type UserDetail,
  type PointSummary,
  type BehaviorSummary,
  type AuditLogItem
} from "@/api/user-admin";
import {
  getUserTaskTopN,
  getUserTaskTopNAccepted,
  type UserTaskTopNAcceptedItem,
  type UserTaskTopNTaskTypeItem
} from "@/api/user-task";

const loading = ref(false);
const auditLoading = ref(false);

const query = ref<{
  userId?: string;
  username?: string;
  role?: string;
  enabled?: boolean;
}>({});

const page = ref({ current: 1, size: 20, total: 0 });
const userList = ref<UserAdminItem[]>([]);

const topAcceptedUsers = ref<UserTaskTopNAcceptedItem[]>([]);
const topTaskTypes = ref<UserTaskTopNTaskTypeItem[]>([]);

const auditQuery = ref<{ operatorUserId?: string; targetUserId?: string }>({});
const auditList = ref<AuditLogItem[]>([]);

const detailVisible = ref(false);
const detail = ref<UserDetail>({});
const pointSummary = ref<PointSummary>({});
const behavior7d = ref<BehaviorSummary>({});
const behavior30d = ref<BehaviorSummary>({});

const behaviorRows = computed(() =>
  [behavior7d.value, behavior30d.value].filter(Boolean)
);

function unwrapData<T>(payload: T | { data?: T }): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return ((payload as { data?: T }).data ?? payload) as T;
  }
  return payload as T;
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

async function fetchUsers() {
  loading.value = true;
  try {
    const response = await getUserAdminPage({
      userId: query.value.userId,
      username: query.value.username,
      role: query.value.role,
      enabled: query.value.enabled,
      page: page.value.current,
      size: page.value.size
    });
    const data = unwrapData(response);
    userList.value = data.items || [];
    page.value.total = Number(data.total || 0);
  } catch {
    ElMessage.error("加载用户列表失败");
  } finally {
    loading.value = false;
  }
}

async function fetchTopN() {
  try {
    const [topnRes, acceptedRes] = await Promise.all([
      getUserTaskTopN({ n: 10 }),
      getUserTaskTopNAccepted({ n: 10 })
    ]);
    const topnData = unwrapData(topnRes) || {};
    const topTypeRaw = topnData.topTaskTypes || topnData.topActionTypes || [];
    topTaskTypes.value = (topTypeRaw || []).map((item: any) => ({
      taskType: String(item.taskType || item.name || ""),
      count: Number(item.count || 0)
    }));

    const acceptedData = unwrapData(acceptedRes);
    topAcceptedUsers.value = Array.isArray(acceptedData)
      ? acceptedData
      : acceptedData?.topAcceptedUsers || [];
  } catch {
    ElMessage.warning("TopN 数据加载失败");
  }
}

async function fetchAuditLogs() {
  auditLoading.value = true;
  try {
    const response = await getUserAdminAuditLogs({
      operatorUserId: auditQuery.value.operatorUserId,
      targetUserId: auditQuery.value.targetUserId,
      page: 1,
      size: 20
    });
    const data = unwrapData(response);
    auditList.value = data.items || [];
  } catch {
    ElMessage.error("加载审计日志失败");
  } finally {
    auditLoading.value = false;
  }
}

async function openDetail(row: UserAdminItem) {
  detailVisible.value = true;
  try {
    const [detailRes, pointsRes, b7Res, b30Res] = await Promise.all([
      getUserAdminDetail(row.id),
      getUserAdminPointsSummary(row.id),
      getUserAdminBehaviorSummary(row.id, 7),
      getUserAdminBehaviorSummary(row.id, 30)
    ]);

    detail.value = unwrapData(detailRes) || {};
    pointSummary.value = unwrapData(pointsRes) || {};
    behavior7d.value = unwrapData(b7Res) || {};
    behavior30d.value = unwrapData(b30Res) || {};
  } catch {
    ElMessage.error("加载用户详情失败");
  }
}

async function toggleStatus(row: UserAdminItem) {
  const nextEnabled = !row.enabled;
  await ElMessageBox.confirm(
    `确认将用户 ${row.username} ${nextEnabled ? "启用" : "禁用"} 吗？`,
    "状态变更确认",
    { type: "warning" }
  );
  try {
    await updateUserAdminStatus({ userId: row.id, enabled: nextEnabled });
    ElMessage.success("状态更新成功");
    fetchUsers();
    fetchAuditLogs();
  } catch {
    ElMessage.error("状态更新失败");
  }
}

async function changeRole(row: UserAdminItem, role: "USER" | "ADMIN") {
  await ElMessageBox.confirm(
    `确认将用户 ${row.username} 角色设置为 ${role} 吗？`,
    "角色调整确认",
    { type: "warning" }
  );
  try {
    await updateUserAdminRole({ userId: row.id, role });
    ElMessage.success("角色更新成功");
    fetchUsers();
    fetchAuditLogs();
  } catch {
    ElMessage.error("角色更新失败");
  }
}

function handlePageChange(current: number) {
  page.value.current = current;
  fetchUsers();
}

function handleSizeChange(size: number) {
  page.value.size = size;
  page.value.current = 1;
  fetchUsers();
}

function onSearch() {
  page.value.current = 1;
  fetchUsers();
}

function onReset() {
  query.value = {};
  page.value.current = 1;
  fetchUsers();
}

fetchUsers();
fetchTopN();
fetchAuditLogs();
</script>

<style scoped>
.user-management-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.query-form {
  margin-bottom: -18px;
}

.metric-title {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.metric-value {
  margin-top: 6px;
  font-size: 22px;
  font-weight: 600;
}
</style>
