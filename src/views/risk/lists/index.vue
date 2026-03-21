<template>
  <div class="risk-lists-page">
    <el-card shadow="never">
      <template #header>
        <div class="header-row">
          <el-tabs v-model="currentTab" @tab-change="fetchData">
            <el-tab-pane label="黑名单" name="blacklist" />
            <el-tab-pane label="白名单" name="whitelist" />
          </el-tabs>
          <div>
            <el-button type="primary" @click="openCreateDialog">新增</el-button>
            <el-button disabled>批量导入（后续扩展）</el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="query" class="query-form">
        <el-form-item label="目标值">
          <el-input
            v-model="query.targetValue"
            placeholder="用户ID/设备ID/IP"
            clearable
          />
        </el-form-item>
        <el-form-item label="来源">
          <el-input v-model="query.source" placeholder="来源系统" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="query.status"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="tableData" border>
        <el-table-column prop="targetType" label="目标类型" width="120" />
        <el-table-column
          prop="targetValue"
          label="目标值"
          min-width="220"
          show-overflow-tooltip
        />
        <el-table-column prop="source" label="来源" min-width="160" />
        <el-table-column prop="expireAt" label="有效期至" min-width="160" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
              {{ scope.row.status === 1 ? "启用" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="160" />
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

    <el-dialog
      v-model="dialogVisible"
      :title="currentTab === 'blacklist' ? '新增黑名单' : '新增白名单'"
      width="560px"
    >
      <el-form :model="form" label-width="88px">
        <el-form-item label="目标类型">
          <el-select v-model="form.targetType" style="width: 160px">
            <el-option label="用户" value="user" />
            <el-option label="设备" value="device" />
            <el-option label="IP" value="ip" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标值">
          <el-input v-model="form.targetValue" placeholder="请输入目标值" />
        </el-form-item>
        <el-form-item label="来源">
          <el-input v-model="form.source" placeholder="例如：手动封禁" />
        </el-form-item>
        <el-form-item label="有效期至">
          <el-date-picker
            v-model="form.expireAt"
            type="datetime"
            placeholder="可为空，表示长期有效"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="statusSwitch"
            active-text="启用"
            inactive-text="停用"
          />
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
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { createRiskListItem, getRiskList, type RiskListItem } from "@/api/risk";

type ListType = "blacklist" | "whitelist";

const currentTab = ref<ListType>("blacklist");
const loading = ref(false);
const dialogVisible = ref(false);

const query = ref<{ targetValue: string; source: string; status?: number }>({
  targetValue: "",
  source: "",
  status: undefined
});

const page = ref({
  current: 1,
  size: 20,
  total: 0
});

const tableData = ref<RiskListItem[]>([]);

const form = ref<Partial<RiskListItem>>({
  targetType: "user",
  targetValue: "",
  source: "",
  expireAt: "",
  status: 1
});

const statusSwitch = computed({
  get: () => form.value.status === 1,
  set: (value: boolean) => {
    form.value.status = value ? 1 : 0;
  }
});

function unwrapData<T>(payload: T | { data?: T }): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return ((payload as { data?: T }).data ?? payload) as T;
  }
  return payload as T;
}

function normalizeDate(input: unknown) {
  if (!input) return "";
  if (typeof input === "string") return input;
  if (input instanceof Date) return input.toISOString();
  return String(input);
}

async function fetchData() {
  loading.value = true;
  try {
    const response = await getRiskList(currentTab.value, {
      page: page.value.current,
      size: page.value.size,
      targetValue: query.value.targetValue || undefined,
      source: query.value.source || undefined,
      status: query.value.status
    });
    const data = unwrapData(response);
    tableData.value = data?.items || [];
    page.value.total = Number(data?.total || 0);
  } catch {
    ElMessage.error("加载名单数据失败");
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  query.value = { targetValue: "", source: "", status: undefined };
  page.value.current = 1;
  fetchData();
}

function openCreateDialog() {
  form.value = {
    targetType: "user",
    targetValue: "",
    source: "",
    expireAt: "",
    status: 1
  };
  dialogVisible.value = true;
}

async function submitForm() {
  if (!form.value.targetValue || !form.value.targetType) {
    ElMessage.warning("请填写目标类型和目标值");
    return;
  }
  try {
    await createRiskListItem(currentTab.value, {
      ...form.value,
      expireAt: normalizeDate(form.value.expireAt)
    });
    ElMessage.success("名单新增成功");
    dialogVisible.value = false;
    fetchData();
  } catch {
    ElMessage.error("名单新增失败");
  }
}

onMounted(fetchData);
</script>

<style scoped>
.risk-lists-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.query-form {
  margin-bottom: 8px;
}
</style>
