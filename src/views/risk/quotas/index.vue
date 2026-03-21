<template>
  <div class="risk-quotas-page">
    <el-card shadow="never">
      <el-form :inline="true" :model="query" class="query-form">
        <el-form-item label="作用域类型">
          <el-select v-model="query.scopeType" clearable style="width: 160px">
            <el-option label="用户(user)" value="user" />
            <el-option label="任务(task)" value="task" />
            <el-option label="活动(activity)" value="activity" />
            <el-option label="全局(global)" value="global" />
          </el-select>
        </el-form-item>
        <el-form-item label="作用域ID">
          <el-input
            v-model="query.scopeId"
            clearable
            placeholder="例如 10001"
          />
        </el-form-item>
        <el-form-item label="周期类型">
          <el-select v-model="query.periodType" clearable style="width: 160px">
            <el-option label="分钟(minute)" value="minute" />
            <el-option label="小时(hour)" value="hour" />
            <el-option label="天(day)" value="day" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
          <el-button type="success" @click="openCreateDialog"
            >新增配额</el-button
          >
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="tableData" border>
        <el-table-column prop="id" label="ID" width="100" />
        <el-table-column prop="scopeType" label="作用域类型" width="130" />
        <el-table-column prop="scopeId" label="作用域ID" min-width="140" />
        <el-table-column prop="periodType" label="周期类型" width="120" />
        <el-table-column prop="limitValue" label="限制值" min-width="120" />
        <el-table-column prop="usedValue" label="已使用" min-width="120" />
        <el-table-column prop="resetAt" label="重置时间" min-width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="openEdit(scope.row)">
              修改
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page.current"
        v-model:page-size="page.size"
        :total="page.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 16px; justify-content: flex-end"
        @current-change="fetchData"
        @size-change="fetchData"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" title="修改配额使用值" width="460px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="配额ID">
          <el-input :model-value="String(editForm.id || '')" readonly />
        </el-form-item>
        <el-form-item label="已使用值">
          <el-input-number v-model="editForm.usedValue" :min="0" :step="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="updating" @click="submitEdit"
          >保存</el-button
        >
      </template>
    </el-dialog>

    <el-dialog v-model="createDialogVisible" title="新增配额" width="560px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="作用域类型">
          <el-select v-model="createForm.scopeType" style="width: 220px">
            <el-option label="用户(user)" value="user" />
            <el-option label="任务(task)" value="task" />
            <el-option label="活动(activity)" value="activity" />
            <el-option label="全局(global)" value="global" />
          </el-select>
        </el-form-item>
        <el-form-item label="作用域ID">
          <el-input v-model="createForm.scopeId" placeholder="例如 10001" />
        </el-form-item>
        <el-form-item label="周期类型">
          <el-select v-model="createForm.periodType" style="width: 220px">
            <el-option label="分钟(minute)" value="minute" />
            <el-option label="小时(hour)" value="hour" />
            <el-option label="天(day)" value="day" />
          </el-select>
        </el-form-item>
        <el-form-item label="限制值">
          <el-input-number v-model="createForm.limitValue" :min="0" :step="1" />
        </el-form-item>
        <el-form-item label="已使用值">
          <el-input-number v-model="createForm.usedValue" :min="0" :step="1" />
        </el-form-item>
        <el-form-item label="重置时间">
          <el-date-picker
            v-model="createForm.resetAt"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="可选"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="submitCreate"
          >保存</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  createRiskQuota,
  deleteRiskQuota,
  getRiskQuotas,
  updateRiskQuota,
  type RiskQuotaItem,
  type RiskQuotaRequest
} from "@/api/risk";

const loading = ref(false);
const updating = ref(false);
const creating = ref(false);
const dialogVisible = ref(false);
const createDialogVisible = ref(false);

const query = ref<{
  scopeType?: string;
  scopeId?: string;
  periodType?: string;
}>({});

const page = ref({
  current: 1,
  size: 20,
  total: 0
});

const tableData = ref<RiskQuotaItem[]>([]);

const editForm = ref<{ id?: string | number; usedValue: number }>({
  id: undefined,
  usedValue: 0
});

const createForm = ref<RiskQuotaRequest>({
  scopeType: "user",
  scopeId: "",
  periodType: "day",
  limitValue: 0,
  usedValue: 0,
  resetAt: ""
});

function unwrapData<T>(payload: T | { data?: T }): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return ((payload as { data?: T }).data ?? payload) as T;
  }
  return payload as T;
}

async function fetchData() {
  loading.value = true;
  try {
    const response = await getRiskQuotas({
      page: page.value.current,
      size: page.value.size,
      scopeType: query.value.scopeType,
      scopeId: query.value.scopeId,
      periodType: query.value.periodType
    });
    const data = unwrapData(response);
    tableData.value = data?.items || [];
    page.value.total = Number(data?.total || 0);
  } catch {
    ElMessage.error("加载配额列表失败");
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  query.value = {};
  page.value.current = 1;
  fetchData();
}

function openEdit(row: RiskQuotaItem) {
  editForm.value = {
    id: row.id,
    usedValue: Number(row.usedValue || 0)
  };
  dialogVisible.value = true;
}

function openCreateDialog() {
  createForm.value = {
    scopeType: "user",
    scopeId: "",
    periodType: "day",
    limitValue: 0,
    usedValue: 0,
    resetAt: ""
  };
  createDialogVisible.value = true;
}

async function submitCreate() {
  if (
    !createForm.value.scopeType ||
    !createForm.value.scopeId ||
    !createForm.value.periodType
  ) {
    ElMessage.warning("请先填写作用域类型、作用域ID和周期类型");
    return;
  }

  creating.value = true;
  try {
    await createRiskQuota(createForm.value);
    ElMessage.success("配额新增成功");
    createDialogVisible.value = false;
    fetchData();
  } catch {
    ElMessage.error("配额新增失败");
  } finally {
    creating.value = false;
  }
}

async function handleDelete(row: RiskQuotaItem) {
  try {
    await ElMessageBox.confirm(
      `确认删除配额 ID: ${row.id} 吗？该操作不可恢复。`,
      "删除确认",
      {
        type: "warning",
        confirmButtonText: "确认删除",
        cancelButtonText: "取消"
      }
    );

    await deleteRiskQuota(row.id);
    ElMessage.success("配额删除成功");
    fetchData();
  } catch {
    // 用户取消或删除失败
  }
}

async function submitEdit() {
  if (editForm.value.id === undefined) {
    ElMessage.warning("缺少配额ID");
    return;
  }

  updating.value = true;
  try {
    await updateRiskQuota({
      id: editForm.value.id,
      usedValue: Number(editForm.value.usedValue || 0)
    });
    ElMessage.success("配额更新成功");
    dialogVisible.value = false;
    fetchData();
  } catch {
    ElMessage.error("配额更新失败");
  } finally {
    updating.value = false;
  }
}

onMounted(fetchData);
</script>

<style scoped>
.risk-quotas-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.query-form {
  margin-bottom: 8px;
}
</style>
