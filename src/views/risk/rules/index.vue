<template>
  <div class="risk-rules-page">
    <el-card shadow="never">
      <el-form :inline="true" :model="query" class="query-form">
        <el-form-item label="规则名称">
          <el-input
            v-model="query.name"
            placeholder="请输入规则名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="query.status"
            placeholder="全部"
            clearable
            style="width: 140px"
          >
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchRules">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
          <el-button type="success" @click="openCreateDialog"
            >新增规则</el-button
          >
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="ruleList" border>
        <el-table-column prop="name" label="规则名称" min-width="160" />
        <el-table-column prop="type" label="规则类型" width="160">
          <template #default="scope">
            {{ formatRuleType(scope.row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
              {{ scope.row.status === 1 ? "启用" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="90" />
        <el-table-column
          prop="conditionExpr"
          label="表达式"
          min-width="260"
          show-overflow-tooltip
        />
        <el-table-column prop="action" label="动作" width="190">
          <template #default="scope">
            {{ formatAction(scope.row.action) }}
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本" width="90" />
        <el-table-column prop="updatedAt" label="更新时间" min-width="160" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="openDetailDialog(scope.row)"
              >查看详情</el-button
            >
            <el-button
              size="small"
              type="primary"
              @click="openEditDialog(scope.row)"
              >修改</el-button
            >
            <el-button size="small" @click="handlePublish(scope.row.id)">
              发布
            </el-button>
            <el-button
              size="small"
              type="warning"
              @click="handleRollback(scope.row.id)"
            >
              回滚
            </el-button>
            <!-- <el-button
              size="small"
              type="info"
              @click="handleValidate(scope.row.conditionExpr)"
            >
              表达式校验
            </el-button> -->
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑规则' : '新增规则'"
      width="860px"
    >
      <el-form :model="form" label-width="92px">
        <el-form-item label="规则名称">
          <el-input v-model="form.name" placeholder="例如：单用户日频控" />
        </el-form-item>
        <el-form-item label="规则类型">
          <el-select v-model="form.type" style="width: 160px">
            <el-option
              v-for="item in ruleTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 180px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-input-number v-model="form.priority" :min="1" :max="9999" />
        </el-form-item>

        <el-form-item label="表达式">
          <div class="expr-builder">
            <div
              v-for="(item, index) in expressionItems"
              :key="item.id"
              class="expr-row"
            >
              <el-select
                v-if="index > 0"
                v-model="item.logic"
                style="width: 90px"
              >
                <el-option label="AND" value="and" />
                <el-option label="OR" value="or" />
              </el-select>
              <el-select
                v-model="item.variable"
                filterable
                placeholder="变量"
                style="width: 220px"
              >
                <el-option
                  v-for="option in variableOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
              <el-select
                v-model="item.operator"
                placeholder="运算符"
                style="width: 120px"
              >
                <el-option
                  v-for="operator in operatorOptions"
                  :key="operator"
                  :label="operator"
                  :value="operator"
                />
              </el-select>
              <el-input
                v-model="item.value"
                placeholder="值，如 20 或 'USER_SIGN'"
                style="width: 250px"
              />
              <el-button
                v-if="expressionItems.length > 1"
                text
                type="danger"
                @click="removeExpressionItem(index)"
              >
                删除
              </el-button>
            </div>
            <div class="expr-actions">
              <el-button type="primary" link @click="addExpressionItem"
                >+ 新增条件</el-button
              >
            </div>
            <div class="expr-preview">
              <span class="expr-preview-label"
                >表达式预览（提交将按此字符串保存）</span
              >
              <el-input :model-value="conditionExprPreview" readonly />
            </div>
          </div>
        </el-form-item>

        <el-form-item label="动作">
          <el-select v-model="form.action" style="width: 260px">
            <el-option
              v-for="item in actionOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="info" @click="handleValidate(conditionExprPreview)">
          校验表达式
        </el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="规则详情" width="860px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="规则名称">{{
          detailForm.name
        }}</el-descriptions-item>
        <el-descriptions-item label="规则类型">{{
          formatRuleType(detailForm.type)
        }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detailForm.status === 1 ? 'success' : 'info'">
            {{ detailForm.status === 1 ? "启用" : "停用" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="优先级">{{
          detailForm.priority
        }}</el-descriptions-item>
        <el-descriptions-item label="动作">{{
          formatAction(detailForm.action)
        }}</el-descriptions-item>
        <el-descriptions-item label="版本">{{
          detailForm.version
        }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{
          detailForm.updatedAt
        }}</el-descriptions-item>
      </el-descriptions>

      <div class="detail-section-title">表达式条件项</div>
      <div class="expr-builder detail-only">
        <div
          v-for="(item, index) in detailExpressionItems"
          :key="item.id"
          class="expr-row"
        >
          <el-tag v-if="index > 0" type="info">{{
            item.logic.toUpperCase()
          }}</el-tag>
          <el-tag effect="plain">#{{ item.variable }}</el-tag>
          <el-tag type="warning" effect="plain">{{ item.operator }}</el-tag>
          <el-tag type="success" effect="plain">{{ item.value }}</el-tag>
        </div>
        <div class="expr-preview">
          <span class="expr-preview-label">表达式原文</span>
          <el-input :model-value="detailForm.conditionExpr || ''" readonly />
        </div>
      </div>
    </el-dialog>

    <el-pagination
      v-model:current-page="page.current"
      v-model:page-size="page.size"
      :total="page.total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      style="justify-content: flex-end"
      @current-change="fetchRules"
      @size-change="fetchRules"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  createRiskRule,
  getRiskRules,
  publishRiskRule,
  rollbackRiskRule,
  updateRiskRule,
  validateRiskExpression,
  type RiskRuleItem
} from "@/api/risk";

type EnumOption = { label: string; value: string };
type ExpressionItem = {
  id: number;
  logic: "and" | "or";
  variable: string;
  operator: string;
  value: string;
};

const loading = ref(false);
const dialogVisible = ref(false);
const detailDialogVisible = ref(false);
const isEdit = ref(false);
const editingId = ref<string | number>("");

const query = ref<{ name: string; status?: number }>({
  name: "",
  status: undefined
});

const page = ref({
  current: 1,
  size: 20,
  total: 0
});

const ruleList = ref<RiskRuleItem[]>([]);

const ruleTypeOptions: EnumOption[] = [
  { label: "黑名单（BLACKLIST）", value: "BLACKLIST" },
  { label: "白名单（WHITELIST）", value: "WHITELIST" },
  { label: "阈值（THRESHOLD）", value: "THRESHOLD" },
  { label: "频控（FREQ）", value: "FREQ" },
  { label: "预算（BUDGET）", value: "BUDGET" },
  { label: "关联（RELATION）", value: "RELATION" },
  { label: "评分卡（SCORECARD）", value: "SCORECARD" }
];

const actionOptions: EnumOption[] = [
  { label: "放行（PASS）", value: "PASS" },
  { label: "拒绝（REJECT）", value: "REJECT" },
  { label: "降级放行（DEGRADE_PASS）", value: "DEGRADE_PASS" },
  { label: "人工复核（REVIEW）", value: "REVIEW" },
  { label: "冻结（FREEZE）", value: "FREEZE" }
];

const variableOptions: EnumOption[] = [
  { label: "#count_1m（1分钟次数）", value: "count_1m" },
  { label: "#count_1h（1小时次数）", value: "count_1h" },
  { label: "#amount_1d（1天累计额度）", value: "amount_1d" },
  { label: "#distinct_device_1d（1天设备数）", value: "distinct_device_1d" },
  { label: "#ip_count_1m（1分钟IP计数）", value: "ip_count_1m" },
  { label: "#device_count_1m（1分钟设备计数）", value: "device_count_1m" },
  { label: "#userId（用户ID）", value: "userId" },
  { label: "#taskId（任务ID）", value: "taskId" },
  { label: "#eventType（事件类型）", value: "eventType" },
  { label: "#amount（本次额度）", value: "amount" },
  { label: "#eventTime（事件时间）", value: "eventTime" }
];

const operatorOptions = [">", ">=", "<", "<=", "==", "!="];

const form = ref<Partial<RiskRuleItem>>({
  name: "",
  type: "FREQ",
  status: 1,
  priority: 100,
  conditionExpr: "",
  action: "REJECT"
});

let expressionIdSeed = 1;

function newExpressionItem(
  partial?: Partial<Omit<ExpressionItem, "id">>
): ExpressionItem {
  return {
    id: expressionIdSeed++,
    logic: partial?.logic || "and",
    variable: partial?.variable || "count_1m",
    operator: partial?.operator || ">",
    value: partial?.value || ""
  };
}

const expressionItems = ref<ExpressionItem[]>([newExpressionItem()]);
const detailExpressionItems = ref<ExpressionItem[]>([]);

const detailForm = ref<Partial<RiskRuleItem>>({
  name: "",
  type: "",
  status: 0,
  priority: 0,
  conditionExpr: "",
  action: undefined,
  version: undefined,
  updatedAt: ""
});

const conditionExprPreview = computed(() => buildConditionExpr());

function unwrapData<T>(payload: T | { data?: T }): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return ((payload as { data?: T }).data ?? payload) as T;
  }
  return payload as T;
}

function formatRuleType(type?: string) {
  if (!type) return "-";
  return ruleTypeOptions.find(item => item.value === type)?.label || type;
}

function formatAction(action?: string) {
  if (!action) return "-";
  return actionOptions.find(item => item.value === action)?.label || action;
}

function parseConditionExpr(expr?: string) {
  if (!expr) {
    expressionItems.value = [newExpressionItem()];
    return;
  }

  const tokens = expr.trim().split(/\s+(and|or)\s+/i);
  const parsed: ExpressionItem[] = [];
  let nextLogic: "and" | "or" = "and";

  tokens.forEach((token, index) => {
    const normalized = token.trim();
    if (!normalized) return;

    if (index % 2 === 1) {
      nextLogic = normalized.toLowerCase() === "or" ? "or" : "and";
      return;
    }

    const matched = normalized.match(
      /^(#?[a-zA-Z0-9_]+)\s*(>=|<=|==|!=|>|<)\s*(.+)$/
    );
    if (!matched) {
      parsed.push(
        newExpressionItem({
          logic: parsed.length === 0 ? "and" : nextLogic,
          variable: "count_1m",
          operator: ">",
          value: normalized
        })
      );
      return;
    }

    parsed.push(
      newExpressionItem({
        logic: parsed.length === 0 ? "and" : nextLogic,
        variable: matched[1].replace(/^#/, ""),
        operator: matched[2],
        value: matched[3]
      })
    );
  });

  expressionItems.value = parsed.length ? parsed : [newExpressionItem()];
}

function parseConditionExprForDetail(expr?: string) {
  if (!expr) {
    detailExpressionItems.value = [newExpressionItem()];
    return;
  }

  const tokens = expr.trim().split(/\s+(and|or)\s+/i);
  const parsed: ExpressionItem[] = [];
  let nextLogic: "and" | "or" = "and";

  tokens.forEach((token, index) => {
    const normalized = token.trim();
    if (!normalized) return;

    if (index % 2 === 1) {
      nextLogic = normalized.toLowerCase() === "or" ? "or" : "and";
      return;
    }

    const matched = normalized.match(
      /^(#?[a-zA-Z0-9_]+)\s*(>=|<=|==|!=|>|<)\s*(.+)$/
    );
    if (!matched) {
      parsed.push(
        newExpressionItem({
          logic: parsed.length === 0 ? "and" : nextLogic,
          variable: "count_1m",
          operator: ">",
          value: normalized
        })
      );
      return;
    }

    parsed.push(
      newExpressionItem({
        logic: parsed.length === 0 ? "and" : nextLogic,
        variable: matched[1].replace(/^#/, ""),
        operator: matched[2],
        value: matched[3]
      })
    );
  });

  detailExpressionItems.value = parsed.length ? parsed : [newExpressionItem()];
}

function buildConditionExpr() {
  return expressionItems.value
    .filter(item => item.variable && item.operator && item.value)
    .map((item, index) => {
      const segment = `#${item.variable} ${item.operator} ${item.value}`;
      if (index === 0) return segment;
      return `${item.logic} ${segment}`;
    })
    .join(" ");
}

function addExpressionItem() {
  expressionItems.value.push(newExpressionItem({ logic: "and" }));
}

function removeExpressionItem(index: number) {
  expressionItems.value.splice(index, 1);
  if (expressionItems.value.length === 0) {
    expressionItems.value = [newExpressionItem()];
  }
}

async function fetchRules() {
  loading.value = true;
  try {
    const response = await getRiskRules({
      page: page.value.current,
      size: page.value.size,
      name: query.value.name || undefined,
      status: query.value.status
    });
    const data = unwrapData(response);
    ruleList.value = data?.items || [];
    page.value.total = Number(data?.total || 0);
  } catch {
    ElMessage.error("加载规则列表失败");
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  query.value = { name: "", status: undefined };
  page.value.current = 1;
  fetchRules();
}

function openCreateDialog() {
  isEdit.value = false;
  editingId.value = "";
  form.value = {
    name: "",
    type: "FREQ",
    status: 1,
    priority: 100,
    conditionExpr: "",
    action: "REJECT"
  };
  expressionItems.value = [newExpressionItem()];
  dialogVisible.value = true;
}

function openEditDialog(row: RiskRuleItem) {
  isEdit.value = true;
  editingId.value = row.id;
  form.value = { ...row };
  parseConditionExpr(row.conditionExpr);
  dialogVisible.value = true;
}

function openDetailDialog(row: RiskRuleItem) {
  detailForm.value = { ...row };
  parseConditionExprForDetail(row.conditionExpr);
  detailDialogVisible.value = true;
}

async function handlePublish(id: string | number) {
  try {
    await publishRiskRule(id);
    ElMessage.success("规则发布成功");
    fetchRules();
  } catch {
    ElMessage.error("规则发布失败");
  }
}

async function handleRollback(id: string | number) {
  try {
    await rollbackRiskRule(id);
    ElMessage.success("规则回滚成功");
    fetchRules();
  } catch {
    ElMessage.error("规则回滚失败");
  }
}

async function handleValidate(expression?: string) {
  if (!expression) {
    ElMessage.warning("请先输入表达式");
    return;
  }
  try {
    const response = await validateRiskExpression({
      conditionExpr: expression
    });
    const data = unwrapData(response);
    if (data?.valid) {
      ElMessage.success(data.message || "表达式校验通过");
      return;
    }
    ElMessage.error(data?.message || "表达式不合法");
  } catch {
    ElMessage.error("表达式校验失败");
  }
}

async function submitForm() {
  const conditionExpr = buildConditionExpr();
  if (
    !form.value.name ||
    !conditionExpr ||
    !form.value.action ||
    !form.value.type
  ) {
    ElMessage.warning("请完善规则名称、规则类型、表达式和动作");
    return;
  }
  try {
    const payload = {
      ...form.value,
      conditionExpr
    };

    if (isEdit.value && editingId.value) {
      await updateRiskRule(editingId.value, payload);
      ElMessage.success("规则更新成功");
    } else {
      await createRiskRule(payload);
      ElMessage.success("规则创建成功");
    }
    dialogVisible.value = false;
    fetchRules();
  } catch {
    ElMessage.error(isEdit.value ? "规则更新失败" : "规则创建失败");
  }
}

onMounted(fetchRules);
</script>

<style scoped>
.risk-rules-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.query-form {
  margin-bottom: 8px;
}

.expr-builder {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-only {
  margin-top: 12px;
}

.detail-section-title {
  margin-top: 14px;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.expr-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.expr-actions {
  display: flex;
  justify-content: flex-start;
}

.expr-preview {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.expr-preview-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
