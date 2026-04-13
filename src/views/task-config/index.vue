<template>
  <div>
    <el-card>
      <el-row>
        <el-input
          v-model="search.taskName"
          placeholder="任务名称"
          style="width: 200px; margin-right: 8px"
        />
        <el-select
          v-model="search.taskType"
          placeholder="任务类型"
          style="width: 150px; margin-right: 8px"
        >
          <el-option label="全部" value="" />
          <el-option label="累积任务" value="ACCUMULATE" />
          <el-option label="连续任务" value="CONTINUOUS" />
          <el-option label="阶梯任务" value="STAIR" />
          <el-option label="时间窗口累积任务" value="WINDOW_ACCUMULATE" />
        </el-select>
        <el-select
          v-model="search.status"
          placeholder="任务状态"
          style="width: 150px; margin-right: 8px"
        >
          <el-option label="全部" value="" />
          <el-option label="启用" :value="1" />
          <el-option label="停用" :value="0" />
        </el-select>
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
          v-model="search.sortOrder"
          placeholder="结束时间排序"
          style="width: 150px; margin-right: 8px"
        >
          <el-option label="默认" value="" />
          <el-option label="结束时间升序" value="asc" />
          <el-option label="结束时间降序" value="desc" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="openDialog">新增任务</el-button>
      </el-row>
      <el-table v-loading="loading" :data="tableData" style="margin-top: 16px">
        <el-table-column prop="taskName" label="任务名称" />
        <el-table-column prop="taskType" label="任务类型">
          <template #default="scope">
            {{ getTaskTypeLabel(scope.row.taskType) }}
          </template>
        </el-table-column>
        <el-table-column prop="stockType" label="库存类型">
          <template #default="scope">
            {{ getStockTypeLabel(scope.row.stockType) }}
          </template>
        </el-table-column>
        <el-table-column prop="triggerEvent" label="触发事件">
          <template #default="scope">
            {{ getTriggerEventLabel(scope.row.triggerEvent) }}
          </template>
        </el-table-column>
        <el-table-column prop="rewardType" label="奖励类型">
          <template #default="scope">
            {{ getRewardTypeLabel(scope.row.rewardType) }}
          </template>
        </el-table-column>
        <el-table-column prop="rewardValue" label="奖励数值" />
        <el-table-column prop="totalStock" label="库存" />
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
              {{ scope.row.status === 1 ? "启用" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="150">
          <template #default="scope">
            <div>{{ formatDateTime(scope.row.startTime).date }}</div>
            <div>{{ formatDateTime(scope.row.startTime).time }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="endTime" label="结束时间" width="150">
          <template #default="scope">
            <div>{{ formatDateTime(scope.row.endTime).date }}</div>
            <div>{{ formatDateTime(scope.row.endTime).time }}</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="230">
          <template #default="scope">
            <el-button size="small" @click="showTaskDetail(scope.row)"
              >详情</el-button
            >
            <el-button size="small" @click="editTask(scope.row)"
              >编辑</el-button
            >
            <el-button
              size="small"
              type="danger"
              @click="deleteTask(scope.row.id)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="page.current"
        v-model:page-size="page.size"
        :page-sizes="[10, 20, 50, 100]"
        :total="page.total"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 16px; justify-content: flex-end"
        @current-change="fetchData"
        @size-change="handleSizeChange"
      />
    </el-card>
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="920px">
      <el-form
        v-if="!isDetailMode"
        :model="form"
        label-width="96px"
        class="task-config-form"
      >
        <el-form-item label="任务名称">
          <el-input
            v-model="form.taskName"
            class="form-control"
            :disabled="isDetailMode"
          />
        </el-form-item>
        <el-form-item label="任务类型">
          <el-select
            v-model="form.taskType"
            class="form-control"
            :disabled="isDetailMode"
            @change="handleTaskTypeChange"
          >
            <el-option label="累积任务" value="ACCUMULATE" />
            <el-option label="连续任务" value="CONTINUOUS" />
            <el-option label="阶梯任务" value="STAIR" />
            <el-option label="时间窗口累积任务" value="WINDOW_ACCUMULATE" />
          </el-select>
        </el-form-item>
        <el-form-item label="库存类型">
          <el-select
            v-model="form.stockType"
            class="form-control"
            :disabled="isDetailMode"
          >
            <el-option label="无限" value="STOCK_TYPE_UNLIMITED" />
            <el-option label="限量" value="STOCK_TYPE_LIMITED" />
          </el-select>
        </el-form-item>
        <el-form-item label="触发事件">
          <el-select
            v-model="form.triggerEvent"
            class="form-control"
            :disabled="isDetailMode"
            placeholder="请选择触发事件"
          >
            <el-option
              v-for="item in getTriggerEventOptions(form.taskType)"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="奖励类型">
          <el-select
            v-model="form.rewardType"
            class="form-control"
            :disabled="isDetailMode"
          >
            <el-option label="积分" value="REWARD_POINT" />
            <el-option label="徽章" value="REWARD_BADGE" />
            <el-option label="实物" value="REWARD_PHYSICAL" />
          </el-select>
        </el-form-item>
        <el-form-item label="奖励数值">
          <el-input
            v-model="form.rewardValue"
            class="form-control"
            :disabled="isDetailMode"
            type="number"
          />
        </el-form-item>
        <el-form-item label="库存">
          <el-input
            v-model="form.totalStock"
            class="form-control"
            :disabled="isDetailMode"
            type="number"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="form.status"
            class="form-control"
            :disabled="isDetailMode"
          >
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="form.startTime"
            class="form-control"
            :disabled="isDetailMode"
            type="datetime"
          />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker
            v-model="form.endTime"
            class="form-control"
            :disabled="isDetailMode"
            type="datetime"
          />
        </el-form-item>
        <el-form-item label="任务策略配置">
          <div class="strategy-config-wrap">
            <template v-if="form.taskType === 'ACCUMULATE'">
              <el-form-item label="目标值" label-width="96px">
                <el-input-number
                  v-model="form.strategyConfig.accumulate.targetValue"
                  class="form-control"
                  :disabled="isDetailMode"
                  :min="1"
                />
              </el-form-item>
            </template>

            <template v-else-if="form.taskType === 'CONTINUOUS'">
              <el-form-item label="目标天数" label-width="96px">
                <el-input-number
                  v-model="form.strategyConfig.continuous.targetDays"
                  class="form-control"
                  :disabled="isDetailMode"
                  :min="1"
                />
              </el-form-item>
            </template>

            <template v-else-if="form.taskType === 'STAIR'">
              <div class="stair-grid stair-header">
                <span>阶梯</span>
                <span>目标值</span>
                <span>奖励值</span>
                <span>操作</span>
              </div>
              <el-space direction="vertical" fill class="stair-space">
                <div
                  v-for="(stage, index) in form.strategyConfig.stair.stages"
                  :key="index"
                  class="stair-grid stair-row"
                >
                  <span>第{{ index + 1 }}阶梯</span>
                  <el-input-number
                    v-model="form.strategyConfig.stair.stages[index]"
                    class="stair-input"
                    :disabled="isDetailMode"
                    :min="1"
                    placeholder="目标值"
                  />
                  <el-input-number
                    v-model="form.strategyConfig.stair.rewards[index]"
                    class="stair-input"
                    :disabled="isDetailMode"
                    :min="1"
                    placeholder="奖励值"
                  />
                  <el-button
                    v-if="
                      !isDetailMode &&
                      form.strategyConfig.stair.stages.length > 1
                    "
                    type="danger"
                    text
                    @click="removeStair(index)"
                  >
                    删除
                  </el-button>
                </div>
                <el-button
                  v-if="!isDetailMode"
                  type="primary"
                  class="stair-add"
                  link
                  @click="addStair"
                  >+ 新增阶梯</el-button
                >
              </el-space>
            </template>

            <template v-else-if="form.taskType === 'WINDOW_ACCUMULATE'">
              <el-form-item label="窗口目标值" label-width="96px">
                <el-input-number
                  v-model="form.strategyConfig.windowAccumulate.targetValue"
                  class="form-control"
                  :disabled="isDetailMode"
                  :min="1"
                />
              </el-form-item>
              <el-form-item label="窗口分钟数" label-width="96px">
                <el-input-number
                  v-model="form.strategyConfig.windowAccumulate.windowMinutes"
                  class="form-control window-minutes-input"
                  :disabled="isDetailMode"
                  :min="1"
                />
              </el-form-item>
            </template>

            <template v-else>
              <el-empty description="请先选择任务类型" :image-size="72" />
            </template>
          </div>
        </el-form-item>
      </el-form>

      <el-tabs v-else v-model="detailTab" class="detail-tabs">
        <el-tab-pane label="任务详情" name="detail">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="任务ID">
              {{ detailSourceRow.id ?? detailTaskId ?? "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="任务名称">
              {{ detailSourceRow.taskName || "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="任务类型">
              {{ getTaskTypeLabel(detailSourceRow.taskType || "") }}
            </el-descriptions-item>
            <el-descriptions-item label="库存类型">
              {{ getStockTypeLabel(detailSourceRow.stockType || "") }}
            </el-descriptions-item>
            <el-descriptions-item label="触发事件">
              {{ getTriggerEventLabel(detailSourceRow.triggerEvent || "") }}
            </el-descriptions-item>
            <el-descriptions-item label="奖励类型">
              {{ getRewardTypeLabel(detailSourceRow.rewardType || "") }}
            </el-descriptions-item>
            <el-descriptions-item label="奖励数值">
              {{ detailSourceRow.rewardValue ?? "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="库存">
              {{ detailSourceRow.totalStock ?? "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="detailSourceRow.status === 1 ? 'success' : 'info'">
                {{ detailSourceRow.status === 1 ? "启用" : "停用" }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="开始时间">
              {{ normalizeSingleDateTime(detailSourceRow.startTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="结束时间">
              {{ normalizeSingleDateTime(detailSourceRow.endTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="规则配置" :span="2">
              {{ detailSourceRow.ruleConfig || "-" }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="本任务分析" name="analytics">
          <div class="strategy-config-wrap">
            <el-row :gutter="10">
              <el-col :span="8">
                <el-card shadow="hover" class="metric-card">
                  <div class="metric-title">7天完成率</div>
                  <div class="metric-value">
                    {{ formatPercent(overview7.completionRate) }}
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card shadow="hover" class="metric-card">
                  <div class="metric-title">30天完成率</div>
                  <div class="metric-value">
                    {{ formatPercent(overview30.completionRate) }}
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card shadow="hover" class="metric-card">
                  <div class="metric-title">7天失败率</div>
                  <div class="metric-value">
                    {{ formatPercent(health.failedRate) }}
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="10" style="margin-top: 10px">
              <el-col :span="6">
                <el-card shadow="hover" class="metric-card">
                  <div class="metric-title">转化流失（接取-完成）</div>
                  <div class="metric-value">
                    {{ Number(insight.conversionLossCount || 0) }}
                  </div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="metric-card">
                  <div class="metric-title">发奖流失（完成-领奖）</div>
                  <div class="metric-value">
                    {{ Number(insight.rewardLossCount || 0) }}
                  </div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="metric-card">
                  <div class="metric-title">质量评分</div>
                  <div class="metric-value">
                    {{ Number(insight.qualityScore || 0).toFixed(2) }}
                  </div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="metric-card">
                  <div class="metric-title">平均完成耗时(分钟)</div>
                  <div class="metric-value">
                    {{ Number(insight.avgCompletionMinutes || 0).toFixed(2) }}
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="10" style="margin-top: 10px">
              <el-col :span="12">
                <el-descriptions
                  :column="1"
                  border
                  size="small"
                  title="人群命中(7天)"
                >
                  <el-descriptions-item label="目标用户数">{{
                    Number(audience.targetUsers || 0)
                  }}</el-descriptions-item>
                  <el-descriptions-item label="实际触达用户数">{{
                    Number(audience.reachedUsers || 0)
                  }}</el-descriptions-item>
                  <el-descriptions-item label="触达率">{{
                    formatPercent(audience.reachRate)
                  }}</el-descriptions-item>
                </el-descriptions>
              </el-col>
              <el-col :span="12">
                <el-descriptions
                  :column="1"
                  border
                  size="small"
                  title="健康度(7天)"
                >
                  <el-descriptions-item label="失败率">{{
                    formatPercent(health.failedRate)
                  }}</el-descriptions-item>
                  <el-descriptions-item label="超时率">{{
                    formatPercent(health.timeoutRate)
                  }}</el-descriptions-item>
                  <el-descriptions-item label="补偿重放次数">{{
                    Number(health.compensationCount || 0)
                  }}</el-descriptions-item>
                  <el-descriptions-item label="奖励请求总数">{{
                    Number(health.totalRewardRequests || 0)
                  }}</el-descriptions-item>
                  <el-descriptions-item label="幂等冲突数">{{
                    Number(health.idempotentConflictCount || 0)
                  }}</el-descriptions-item>
                </el-descriptions>
              </el-col>
            </el-row>

            <el-row :gutter="10" style="margin-top: 10px">
              <el-col :span="12">
                <el-card shadow="never">
                  <template #header>
                    <div class="analysis-card-header">
                      <span>单任务分析图</span>
                      <el-select
                        v-model="detailAnalyticsMetricMode"
                        style="width: 200px"
                        @change="handleDetailMetricModeChange"
                      >
                        <el-option
                          v-for="item in detailAnalyticsMetricOptions"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"
                        />
                      </el-select>
                    </div>
                  </template>
                  <div ref="diagnosisChartRef" class="analytics-chart" />
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card shadow="never" header="时段热力(7天，TOP10)">
                  <div ref="heatmapChartRef" class="analytics-chart" />
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <el-tab-pane label="历史版本对比" name="history">
          <el-form :inline="true" class="history-toolbar">
            <el-form-item label="基线版本">
              <el-input :model-value="baselineVersionDisplay" disabled />
            </el-form-item>
            <el-form-item label="对比版本">
              <el-select
                v-model="compareVersion"
                placeholder="对比版本"
                style="width: 260px"
                :loading="historyLoading"
              >
                <el-option
                  v-for="item in compareVersionOptions"
                  :key="`compare-${historyOptionKey(item)}`"
                  :label="historyOptionLabel(item)"
                  :value="String(item.versionNo ?? item.version ?? '')"
                />
              </el-select>
            </el-form-item>
            <el-button
              type="primary"
              :disabled="!selectedCompareRecord"
              @click="applyHistoryToEdit"
            >
              使用对比版本快速修改
            </el-button>
          </el-form>

          <el-card
            shadow="never"
            header="版本对比结果"
            style="margin-bottom: 10px"
          >
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="基线版本">{{
                versionCompare.baselineVersion || "-"
              }}</el-descriptions-item>
              <el-descriptions-item label="对比版本">{{
                versionCompare.compareVersion || "-"
              }}</el-descriptions-item>
              <el-descriptions-item label="基线统计窗口">{{
                versionCompare.baselineStart
                  ? `${normalizeSingleDateTime(versionCompare.baselineStart)} ~ ${normalizeSingleDateTime(versionCompare.baselineEnd)}`
                  : "-"
              }}</el-descriptions-item>
              <el-descriptions-item label="对比统计窗口">{{
                versionCompare.compareStart
                  ? `${normalizeSingleDateTime(versionCompare.compareStart)} ~ ${normalizeSingleDateTime(versionCompare.compareEnd)}`
                  : "-"
              }}</el-descriptions-item>
              <el-descriptions-item label="说明" :span="2">{{
                versionCompare.note || "-"
              }}</el-descriptions-item>
            </el-descriptions>
            <el-row :gutter="10" style="margin-top: 10px">
              <el-col :span="8">
                <el-card shadow="hover">
                  <div class="metric-title">基线完成率(%)</div>
                  <div class="metric-value">
                    {{
                      Number(
                        versionCompare.baseline?.completionRate || 0
                      ).toFixed(2)
                    }}
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card shadow="hover">
                  <div class="metric-title">对比完成率(%)</div>
                  <div class="metric-value">
                    {{
                      Number(
                        versionCompare.compare?.completionRate || 0
                      ).toFixed(2)
                    }}
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card shadow="hover">
                  <div class="metric-title">完成率差值(百分点)</div>
                  <div class="metric-value">
                    {{
                      Number(versionCompare.deltaCompletionRate || 0).toFixed(2)
                    }}
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </el-card>

          <el-table
            :data="historyCompareRows"
            size="small"
            border
            :row-class-name="historyDiffRowClass"
          >
            <el-table-column prop="field" label="字段" min-width="160" />
            <el-table-column
              prop="currentValue"
              label="现版本值"
              min-width="260"
              show-overflow-tooltip
            />
            <el-table-column
              prop="historyValue"
              label="历史版本值"
              min-width="260"
              show-overflow-tooltip
            />
          </el-table>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="dialogVisible = false">
          {{ isDetailMode ? "关闭" : "取消" }}
        </el-button>
        <el-button v-if="!isDetailMode" type="primary" @click="submitForm"
          >保存</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import * as echarts from "echarts";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from "vue";
import {
  searchTaskConfigs,
  createTaskConfig,
  updateTaskConfig,
  deleteTaskConfig,
  getTaskConfigAnalyticsOverview,
  getTaskConfigAudienceHit,
  getTaskConfigTimeHeatmap,
  getTaskConfigVersionCompare,
  getTaskConfigHealth,
  getTaskConfigAnalyticsInsight,
  getTaskConfigHistory,
  type TaskConfigAnalyticsOverview,
  type TaskConfigAudienceHit,
  type TaskConfigHealth,
  type TaskConfigHeatmapCell,
  type TaskConfigInsight,
  type TaskConfigVersionCompare,
  type TaskConfigHistory
} from "../../api/task-config";

interface TaskConfigForm {
  taskName: string;
  taskType: string;
  stockType: string;
  triggerEvent: string;
  rewardType: string;
  rewardValue: number;
  totalStock: number;
  status: number;
  startTime: string | Date;
  endTime: string | Date;
  strategyConfig: {
    accumulate: { targetValue: number };
    continuous: { targetDays: number };
    stair: { stages: number[]; rewards: number[] };
    windowAccumulate: { targetValue: number; windowMinutes: number };
  };
}

interface TaskConfigItem {
  id: string | number;
  taskName: string;
  taskType: string;
  stockType: string;
  triggerEvent: string;
  rewardType: string;
  rewardValue: number;
  totalStock: number | null;
  status: number;
  startTime: string;
  endTime: string;
  ruleConfig: string;
}

const search = ref({
  taskName: "",
  taskType: "",
  status: "" as "" | number,
  rewardType: "",
  sortOrder: ""
});
const tableData = ref<TaskConfigItem[]>([]);
const loading = ref(false);
const page = ref({
  current: 1,
  size: 20,
  total: 0
});
const dialogVisible = ref(false);
const dialogMode = ref<"create" | "edit" | "detail">("create");
const isDetailMode = computed(() => dialogMode.value === "detail");
const detailTab = ref<"detail" | "analytics" | "history">("detail");
const detailTaskId = ref<string | null>(null);
const detailSourceRow = ref<Record<string, any>>({});
const dialogTitle = computed(() => {
  if (dialogMode.value === "detail") {
    return "任务详情";
  }
  return "任务配置";
});

function createDefaultStrategyConfig() {
  return {
    accumulate: { targetValue: 1 },
    continuous: { targetDays: 1 },
    stair: { stages: [1], rewards: [1] },
    windowAccumulate: { targetValue: 1, windowMinutes: 60 }
  };
}

const form = ref<TaskConfigForm>({
  taskName: "",
  taskType: "",
  stockType: "STOCK_TYPE_UNLIMITED",
  triggerEvent: "",
  rewardType: "",
  rewardValue: 0,
  totalStock: 0,
  status: 1,
  startTime: "",
  endTime: "",
  strategyConfig: createDefaultStrategyConfig()
});
const editId = ref<string | number | null>(null);

const overview7 = ref<TaskConfigAnalyticsOverview>({});
const overview30 = ref<TaskConfigAnalyticsOverview>({});
const audience = ref<TaskConfigAudienceHit>({});
const health = ref<TaskConfigHealth>({});
const insight = ref<TaskConfigInsight>({});
const heatmapRows = ref<TaskConfigHeatmapCell[]>([]);
const versionCompare = ref<TaskConfigVersionCompare>({});
const versionCompareLoading = ref(false);
const historyLoading = ref(false);
const historyList = ref<TaskConfigHistory[]>([]);
const baselineVersion = ref("");
const compareVersion = ref("");
const detailAnalyticsMetricMode = ref<
  "conversion" | "window" | "audience" | "health"
>("conversion");

const diagnosisChartRef = ref<HTMLElement | null>(null);
const heatmapChartRef = ref<HTMLElement | null>(null);
let diagnosisChart: echarts.ECharts | null = null;
let heatmapChart: echarts.ECharts | null = null;

const detailAnalyticsMetricOptions = [
  { label: "转化漏斗对比", value: "conversion" },
  { label: "窗口效率对比", value: "window" },
  { label: "人群触达概览", value: "audience" },
  { label: "风险健康概览", value: "health" }
] as const;

const latestHistoryRecord = computed(() => {
  if (!historyList.value.length) return null;
  return historyList.value[0] || null;
});

const baselineVersionDisplay = computed(() => {
  if (!latestHistoryRecord.value) return "当前版本";
  const version =
    latestHistoryRecord.value.versionNo ??
    latestHistoryRecord.value.version ??
    "-";
  const time = normalizeSingleDateTime(
    latestHistoryRecord.value.createTime || latestHistoryRecord.value.updateTime
  );
  return `当前版本(${version}) / ${time}`;
});

const compareVersionOptions = computed(() => {
  if (!historyList.value.length) return [];
  return historyList.value.filter(item => {
    const version = String(item.versionNo ?? item.version ?? "");
    return version && version !== baselineVersion.value;
  });
});

const selectedCompareRecord = computed(() => {
  if (!compareVersion.value) return null;
  return (
    historyList.value.find(
      item =>
        String(item.versionNo ?? item.version ?? "") === compareVersion.value
    ) || null
  );
});

const currentCompareSource = computed(() => {
  return {
    ...(latestHistoryRecord.value || {}),
    ...(detailSourceRow.value || {})
  };
});

const HISTORY_COMPARE_FIELDS: Array<{ key: string; label: string }> = [
  { key: "taskName", label: "任务名称" },
  { key: "taskType", label: "任务类型" },
  { key: "stockType", label: "库存类型" },
  { key: "triggerEvent", label: "触发事件" },
  { key: "rewardType", label: "奖励类型" },
  { key: "rewardValue", label: "奖励数值" },
  { key: "totalStock", label: "库存" },
  { key: "status", label: "状态" },
  { key: "startTime", label: "开始时间" },
  { key: "endTime", label: "结束时间" },
  { key: "ruleConfig", label: "规则配置" },
  { key: "sourceUpdateTime", label: "源更新时间" },
  { key: "changeType", label: "变更类型" },
  { key: "changedBy", label: "变更人" },
  { key: "createTime", label: "快照时间" }
];

const historyCompareRows = computed(() => {
  if (!selectedCompareRecord.value) return [];
  const current = currentCompareSource.value || {};
  const history = selectedCompareRecord.value || {};
  return HISTORY_COMPARE_FIELDS.map(item => {
    const currentValue = stringifyCompareValueByField(
      item.key,
      current[item.key]
    );
    const historyValue = stringifyCompareValueByField(
      item.key,
      (history as any)[item.key]
    );
    return {
      field: item.label,
      currentValue,
      historyValue,
      changed: currentValue !== historyValue
    };
  });
});

const TASK_TYPE_LABELS: Record<string, string> = {
  ACCUMULATE: "累积任务",
  CONTINUOUS: "连续任务",
  STAIR: "阶梯任务",
  WINDOW_ACCUMULATE: "时间窗口累积任务"
};

const STOCK_TYPE_LABELS: Record<string, string> = {
  STOCK_TYPE_UNLIMITED: "无限",
  STOCK_TYPE_LIMITED: "限量",
  UNLIMITED: "无限",
  LIMITED: "限量"
};

function getStockTypeLabel(value: string) {
  return STOCK_TYPE_LABELS[value] ?? value;
}

const REWARD_TYPE_LABELS: Record<string, string> = {
  REWARD_POINT: "积分",
  REWARD_BADGE: "徽章",
  REWARD_PHYSICAL: "实物",
  POINT: "积分",
  BADGE: "徽章",
  ITEM: "实物"
};

const TRIGGER_EVENT_OPTIONS: Record<
  string,
  Array<{ label: string; value: string }>
> = {
  ACCUMULATE: [
    { label: "学习", value: "USER_LEARN" },
    { label: "登录", value: "USER_SIGN" },
    { label: "领奖", value: "USER_REWARD_CLAIM" },
    { label: "其他", value: "OTHER" }
  ],
  CONTINUOUS: [
    { label: "学习", value: "USER_LEARN" },
    { label: "登录", value: "USER_SIGN" },
    { label: "领奖", value: "USER_REWARD_CLAIM" },
    { label: "其他", value: "OTHER" }
  ],
  STAIR: [
    { label: "学习", value: "USER_LEARN" },
    { label: "登录", value: "USER_SIGN" },
    { label: "领奖", value: "USER_REWARD_CLAIM" },
    { label: "其他", value: "OTHER" }
  ],
  WINDOW_ACCUMULATE: [
    { label: "学习", value: "USER_LEARN" },
    { label: "登录", value: "USER_SIGN" },
    { label: "领奖", value: "USER_REWARD_CLAIM" },
    { label: "其他", value: "OTHER" }
  ]
};

function buildRuleConfigByTaskType(taskType: string) {
  if (taskType === "ACCUMULATE") {
    return {
      targetValue: form.value.strategyConfig.accumulate.targetValue
    };
  }
  if (taskType === "CONTINUOUS") {
    return {
      targetDays: form.value.strategyConfig.continuous.targetDays
    };
  }
  if (taskType === "STAIR") {
    return {
      stages: form.value.strategyConfig.stair.stages,
      rewards: form.value.strategyConfig.stair.rewards
    };
  }
  if (taskType === "WINDOW_ACCUMULATE") {
    return {
      targetValue: form.value.strategyConfig.windowAccumulate.targetValue,
      windowMinutes: form.value.strategyConfig.windowAccumulate.windowMinutes
    };
  }
  return {};
}

function parseRuleConfigByTaskType(
  taskType: string,
  ruleConfig: string,
  strategyConfig: TaskConfigForm["strategyConfig"]
) {
  let parsed: any = {};
  try {
    parsed = ruleConfig ? JSON.parse(ruleConfig) : {};
  } catch {
    parsed = {};
  }

  if (taskType === "ACCUMULATE") {
    strategyConfig.accumulate.targetValue = Number(parsed.targetValue || 1);
  }
  if (taskType === "CONTINUOUS") {
    strategyConfig.continuous.targetDays = Number(parsed.targetDays || 1);
  }
  if (taskType === "STAIR") {
    const stages = Array.isArray(parsed.stages)
      ? parsed.stages
          .map((v: any) => Number(v || 0))
          .filter((v: number) => v > 0)
      : [1];
    const rewards = Array.isArray(parsed.rewards)
      ? parsed.rewards
          .map((v: any) => Number(v || 0))
          .filter((v: number) => v > 0)
      : [];
    strategyConfig.stair.stages = stages.length ? stages : [1];
    strategyConfig.stair.rewards =
      rewards.length === strategyConfig.stair.stages.length
        ? rewards
        : strategyConfig.stair.stages.map(() => 1);
  }
  if (taskType === "WINDOW_ACCUMULATE") {
    strategyConfig.windowAccumulate.targetValue = Number(
      parsed.targetValue || 1
    );
    strategyConfig.windowAccumulate.windowMinutes = Number(
      parsed.windowMinutes || 60
    );
  }
}

function addStair() {
  form.value.strategyConfig.stair.stages.push(1);
  form.value.strategyConfig.stair.rewards.push(1);
}

function removeStair(index: number) {
  form.value.strategyConfig.stair.stages.splice(index, 1);
  form.value.strategyConfig.stair.rewards.splice(index, 1);
}

function getTaskTypeLabel(value: string) {
  return TASK_TYPE_LABELS[value] ?? value;
}

function getRewardTypeLabel(value: string) {
  return REWARD_TYPE_LABELS[value] ?? value;
}

function getTriggerEventOptions(taskType: string) {
  return TRIGGER_EVENT_OPTIONS[taskType] ?? [{ label: "其他", value: "OTHER" }];
}

function getTriggerEventLabel(value: string) {
  const all = Object.values(TRIGGER_EVENT_OPTIONS).flat();
  const direct = all.find(item => item.value === value)?.label;
  if (direct) return direct;
  const fallbackMap: Record<string, string> = {
    USER_TASK_ACCEPT: "接取任务",
    USER_TASK_COMPLETE: "完成任务",
    USER_TASK_REWARD: "任务领奖",
    USER_REWARD_CLAIM: "领奖",
    USER_ACTION_LOGIN: "用户登录",
    USER_ACTION_STUDY: "学习行为",
    USER_LEARN: "学习",
    USER_SIGN: "登录",
    OTHER: "其他"
  };
  return fallbackMap[value] ?? value;
}

function formatDateTime(input: string) {
  if (!input) {
    return { date: "", time: "" };
  }
  const text = input.replace("T", " ").replace(/\.\d+\+00:00$/, "");
  const [date, time] = text.split(" ");
  return {
    date: date ?? "",
    time: time ?? ""
  };
}

function normalizeSingleDateTime(input?: string) {
  if (!input) return "-";
  return String(input)
    .replace("T", " ")
    .replace(/\.\d+\+00:00$/, "");
}

function ensureAnalyticsCharts() {
  if (diagnosisChartRef.value && !diagnosisChart) {
    diagnosisChart = echarts.init(diagnosisChartRef.value);
  }
  if (heatmapChartRef.value && !heatmapChart) {
    heatmapChart = echarts.init(heatmapChartRef.value);
  }
}

function renderDiagnosisChart() {
  if (!diagnosisChart) return;
  if (detailAnalyticsMetricMode.value === "conversion") {
    diagnosisChart.setOption({
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      legend: { top: 0 },
      grid: { left: 46, right: 18, top: 36, bottom: 42 },
      xAxis: { type: "category", data: ["接取", "完成", "领奖"] },
      yAxis: { type: "value", name: "数量" },
      series: [
        {
          name: "近7天",
          type: "bar",
          data: [
            Number(overview7.value.acceptedCount || 0),
            Number(overview7.value.completedCount || 0),
            Number(overview7.value.rewardedCount || 0)
          ]
        },
        {
          name: "近30天",
          type: "bar",
          data: [
            Number(overview30.value.acceptedCount || 0),
            Number(overview30.value.completedCount || 0),
            Number(overview30.value.rewardedCount || 0)
          ]
        }
      ]
    });
    return;
  }

  if (detailAnalyticsMetricMode.value === "window") {
    diagnosisChart.setOption({
      tooltip: { trigger: "axis" },
      legend: { top: 0 },
      grid: { left: 46, right: 18, top: 36, bottom: 42 },
      xAxis: { type: "category", data: ["7天", "30天"] },
      yAxis: [
        { type: "value", name: "比率(%)" },
        { type: "value", name: "时长(分钟)" }
      ],
      series: [
        {
          name: "完成率",
          type: "bar",
          data: [
            Number(overview7.value.completionRate || 0),
            Number(overview30.value.completionRate || 0)
          ]
        },
        {
          name: "领奖率",
          type: "bar",
          data: [
            Number(overview7.value.rewardRate || 0),
            Number(overview30.value.rewardRate || 0)
          ]
        },
        {
          name: "平均完成耗时",
          type: "line",
          smooth: true,
          yAxisIndex: 1,
          data: [
            Number(overview7.value.avgCompletionMinutes || 0),
            Number(overview30.value.avgCompletionMinutes || 0)
          ]
        }
      ]
    });
    return;
  }

  if (detailAnalyticsMetricMode.value === "audience") {
    diagnosisChart.setOption({
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: { left: 46, right: 18, top: 24, bottom: 42 },
      xAxis: {
        type: "category",
        data: ["目标用户", "实际触达", "触达率"]
      },
      yAxis: { type: "value", name: "数值" },
      series: [
        {
          name: "人群触达",
          type: "bar",
          barWidth: 32,
          data: [
            {
              value: Number(audience.value.targetUsers || 0),
              itemStyle: { color: "#2563eb" }
            },
            {
              value: Number(audience.value.reachedUsers || 0),
              itemStyle: { color: "#10b981" }
            },
            {
              value: Number(audience.value.reachRate || 0),
              itemStyle: { color: "#f59e0b" }
            }
          ],
          label: { show: true, position: "top" }
        }
      ]
    });
    return;
  }

  diagnosisChart.setOption({
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: 46, right: 18, top: 24, bottom: 56 },
    xAxis: {
      type: "category",
      data: ["失败率", "超时率", "补偿重放", "幂等冲突"],
      axisLabel: { interval: 0, rotate: 12 }
    },
    yAxis: { type: "value", name: "数值" },
    series: [
      {
        name: "健康指标",
        type: "bar",
        barWidth: 28,
        data: [
          {
            value: Number(health.value.failedRate || 0),
            itemStyle: { color: "#ef4444" }
          },
          {
            value: Number(health.value.timeoutRate || 0),
            itemStyle: { color: "#8b5cf6" }
          },
          {
            value: Number(
              health.value.compensationCount || health.value.replayCount || 0
            ),
            itemStyle: { color: "#10b981" }
          },
          {
            value: Number(health.value.idempotentConflictCount || 0),
            itemStyle: { color: "#f97316" }
          }
        ],
        label: { show: true, position: "top" }
      }
    ]
  });
}

function handleDetailMetricModeChange() {
  nextTick(() => {
    ensureAnalyticsCharts();
    renderAnalyticsCharts();
  });
}

function renderHeatmapChart() {
  if (!heatmapChart) return;
  const hours = Array.from({ length: 24 }, (_, i) => `${i}`);
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const matrix = (heatmapRows.value || [])
    .map(item => {
      const day = Math.max(1, Math.min(7, Number(item.dayOfWeek || 1))) - 1;
      const hour = Math.max(
        0,
        Math.min(23, Number(item.hourOfDay ?? item.hour ?? 0))
      );
      const count = Number(item.count || 0);
      return [hour, day, count];
    })
    .filter(item => Number.isFinite(item[0]) && Number.isFinite(item[1]));

  const maxValue = matrix.length
    ? Math.max(...matrix.map(item => Number(item[2] || 0)))
    : 0;

  heatmapChart.setOption({
    tooltip: {
      position: "top",
      formatter: (params: any) => {
        const value = params?.value || [];
        const hour = value[0] ?? "-";
        const day = weekdays[value[1]] || "-";
        const count = value[2] ?? 0;
        return `${day} ${hour}:00<br/>次数: ${count}`;
      }
    },
    grid: { top: 30, left: 45, right: 18, bottom: 28 },
    xAxis: { type: "category", data: hours, splitArea: { show: true } },
    yAxis: { type: "category", data: weekdays, splitArea: { show: true } },
    visualMap: {
      min: 0,
      max: maxValue || 1,
      calculable: true,
      orient: "horizontal",
      left: "center",
      bottom: 0
    },
    series: [
      {
        name: "触发次数",
        type: "heatmap",
        data: matrix,
        label: { show: false },
        emphasis: { itemStyle: { shadowBlur: 10 } }
      }
    ]
  });
}

function renderAnalyticsCharts() {
  renderDiagnosisChart();
  renderHeatmapChart();
}

function resizeAnalyticsCharts() {
  diagnosisChart?.resize();
  heatmapChart?.resize();
}

function mapEnumToLabel(field: string, value: string) {
  if (field === "taskType") return getTaskTypeLabel(value);
  if (field === "stockType") return getStockTypeLabel(value);
  if (field === "triggerEvent") return getTriggerEventLabel(value);
  if (field === "rewardType") return getRewardTypeLabel(value);
  if (field === "changeType") {
    const changeTypeMap: Record<string, string> = {
      CREATE: "创建",
      UPDATE: "更新",
      DELETE: "删除"
    };
    return changeTypeMap[value] || value;
  }
  if (field === "status") {
    return String(value) === "1" ? "启用" : "停用";
  }
  return value;
}

function stringifyCompareValueByField(field: string, value: any) {
  if (value === null || value === undefined || value === "") return "-";
  if (
    ["startTime", "endTime", "sourceUpdateTime", "createTime"].includes(field)
  ) {
    return normalizeSingleDateTime(String(value));
  }
  if (
    [
      "taskType",
      "stockType",
      "triggerEvent",
      "rewardType",
      "changeType",
      "status"
    ].includes(field)
  ) {
    return mapEnumToLabel(field, String(value));
  }
  return stringifyCompareValue(value);
}

function stringifyCompareValue(value: any) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function historyOptionKey(item: TaskConfigHistory) {
  const version = item.versionNo ?? item.version ?? "";
  const id = item.id ?? "";
  const time = item.createTime ?? item.updateTime ?? "";
  return `${version}|${id}|${time}`;
}

function historyOptionLabel(item: TaskConfigHistory) {
  const version = item.versionNo ?? item.version ?? "-";
  const time = normalizeSingleDateTime(item.createTime || item.updateTime);
  return `版本 ${version} / ${time}`;
}

function historyDiffRowClass({ row }: { row: { changed?: boolean } }) {
  return row?.changed ? "history-diff-row" : "";
}

function formatPercent(value?: number) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function unwrapData<T>(payload: T | { data?: T }): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return ((payload as { data?: T }).data ?? payload) as T;
  }
  return payload as T;
}

function resetDetailAnalytics() {
  overview7.value = {};
  overview30.value = {};
  audience.value = {};
  health.value = {};
  insight.value = {};
  heatmapRows.value = [];
  versionCompare.value = {};
}

async function fetchHistoryVersionCompare() {
  if (!detailTaskId.value || !baselineVersion.value || !compareVersion.value) {
    return;
  }
  versionCompareLoading.value = true;
  try {
    const res = await getTaskConfigVersionCompare(detailTaskId.value, {
      baselineVersion: baselineVersion.value,
      compareVersion: compareVersion.value
    });
    versionCompare.value = unwrapData(res) || {};
  } finally {
    versionCompareLoading.value = false;
  }
}

async function refreshHistory() {
  if (!detailTaskId.value) return;
  historyLoading.value = true;
  try {
    const res = await getTaskConfigHistory(detailTaskId.value);
    const list = unwrapData(res) || [];
    historyList.value = [...list].sort(
      (a, b) =>
        Number(b.versionNo ?? b.version ?? 0) -
        Number(a.versionNo ?? a.version ?? 0)
    );
    if (historyList.value.length) {
      baselineVersion.value = String(
        historyList.value[0].versionNo ?? historyList.value[0].version ?? ""
      );
      compareVersion.value = String(
        historyList.value[1]?.versionNo ?? historyList.value[1]?.version ?? ""
      );
      await fetchHistoryVersionCompare();
    } else {
      baselineVersion.value = "";
      compareVersion.value = "";
      versionCompare.value = {};
    }
  } finally {
    historyLoading.value = false;
  }
}

function fillFormByRow(row: any) {
  const strategyConfig = createDefaultStrategyConfig();
  parseRuleConfigByTaskType(
    row.taskType ?? "",
    row.ruleConfig ?? "",
    strategyConfig
  );
  form.value = {
    taskName: row.taskName ?? "",
    taskType: row.taskType ?? "",
    stockType: row.stockType ?? "STOCK_TYPE_UNLIMITED",
    triggerEvent: row.triggerEvent ?? "",
    rewardType: row.rewardType ?? "",
    rewardValue: row.rewardValue ?? 0,
    totalStock: row.totalStock ?? 0,
    status: row.status ?? 1,
    startTime: row.startTime ?? "",
    endTime: row.endTime ?? "",
    strategyConfig
  };
}

function applyHistoryToEdit() {
  if (!selectedCompareRecord.value) return;
  const merged = {
    ...detailSourceRow.value,
    ...selectedCompareRecord.value,
    id: detailTaskId.value
  };
  dialogMode.value = "edit";
  fillFormByRow(merged);
  editId.value = detailTaskId.value || null;
  detailTaskId.value = null;
  baselineVersion.value = "";
  compareVersion.value = "";
}

async function fetchDetailAnalytics(id: string | number) {
  resetDetailAnalytics();
  const [o7, o30, aud, hm, hl, ins] = await Promise.all([
    getTaskConfigAnalyticsOverview(id, { days: 7 }),
    getTaskConfigAnalyticsOverview(id, { days: 30 }),
    getTaskConfigAudienceHit(id, { days: 7 }),
    getTaskConfigTimeHeatmap(id, { days: 7 }),
    getTaskConfigHealth(id, { days: 7 }),
    getTaskConfigAnalyticsInsight(id, { days: 7 })
  ]);
  overview7.value = unwrapData(o7) || {};
  overview30.value = unwrapData(o30) || {};
  audience.value = unwrapData(aud) || {};
  heatmapRows.value = unwrapData(hm) || [];
  health.value = unwrapData(hl) || {};
  insight.value = unwrapData(ins) || {};

  if (detailTab.value === "analytics") {
    await nextTick();
    ensureAnalyticsCharts();
    renderAnalyticsCharts();
  }
}

async function fetchData() {
  loading.value = true;
  // 处理排序参数
  let orderByEndTime = "endTime";
  let asc = undefined;
  if (search.value.sortOrder === "asc") asc = true;
  if (search.value.sortOrder === "desc") asc = false;
  const params = {
    taskName: search.value.taskName || undefined,
    taskType: search.value.taskType || undefined,
    status: search.value.status === "" ? undefined : search.value.status,
    rewardType: search.value.rewardType || undefined,
    page: page.value.current,
    size: page.value.size,
    orderByEndTime,
    asc
  };
  try {
    const res = await searchTaskConfigs(params);
    tableData.value = res?.data?.items || res?.data?.records || [];
    page.value.total = res?.data?.total || 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  page.value.current = 1;
  fetchData();
}

function handleSizeChange() {
  page.value.current = 1;
  fetchData();
}

function openDialog() {
  dialogMode.value = "create";
  form.value = {
    taskName: "",
    taskType: "",
    stockType: "STOCK_TYPE_UNLIMITED",
    triggerEvent: "",
    rewardType: "",
    rewardValue: 0,
    totalStock: 0,
    status: 1,
    startTime: "",
    endTime: "",
    strategyConfig: createDefaultStrategyConfig()
  };
  editId.value = null;
  detailTaskId.value = null;
  detailSourceRow.value = {};
  detailTab.value = "detail";
  historyList.value = [];
  baselineVersion.value = "";
  compareVersion.value = "";
  versionCompareLoading.value = false;
  resetDetailAnalytics();
  dialogVisible.value = true;
}

function editTask(row: any) {
  dialogMode.value = "edit";
  fillFormByRow(row);
  editId.value = row.id;
  detailTaskId.value = null;
  detailSourceRow.value = {};
  detailTab.value = "detail";
  historyList.value = [];
  baselineVersion.value = "";
  compareVersion.value = "";
  versionCompareLoading.value = false;
  resetDetailAnalytics();
  dialogVisible.value = true;
}

async function showTaskDetail(row: any) {
  dialogMode.value = "detail";
  detailSourceRow.value = { ...row };
  editId.value = null;
  detailTab.value = "detail";
  detailTaskId.value = row?.id != null ? String(row.id) : null;
  dialogVisible.value = true;
  if (detailTaskId.value) {
    await Promise.all([
      fetchDetailAnalytics(detailTaskId.value),
      refreshHistory()
    ]);
  }
}

function handleTaskTypeChange(value: string) {
  const options = getTriggerEventOptions(value);
  const valid = options.some(item => item.value === form.value.triggerEvent);
  if (!valid) {
    form.value.triggerEvent = options[0]?.value ?? "";
  }

  if (value === "STAIR") {
    if (!form.value.strategyConfig.stair.stages.length) {
      form.value.strategyConfig.stair.stages = [1];
      form.value.strategyConfig.stair.rewards = [1];
    }
  }
}

async function deleteTask(id: string | number) {
  await deleteTaskConfig(id);
  if (tableData.value.length === 1 && page.value.current > 1) {
    page.value.current -= 1;
  }
  fetchData();
}

async function submitForm() {
  const ruleConfigObject = buildRuleConfigByTaskType(form.value.taskType);
  const payload = {
    ...form.value,
    ruleConfig: JSON.stringify(ruleConfigObject),
    startTime:
      typeof form.value.startTime === "string"
        ? form.value.startTime
        : (form.value.startTime as Date).toISOString(),
    endTime:
      typeof form.value.endTime === "string"
        ? form.value.endTime
        : (form.value.endTime as Date).toISOString()
  };
  delete (payload as any).strategyConfig;
  if (editId.value) {
    await updateTaskConfig({ ...payload, id: editId.value });
  } else {
    await createTaskConfig(payload);
  }
  dialogVisible.value = false;
  fetchData();
}

fetchData();

watch(
  () => [dialogVisible.value, detailTab.value],
  async ([visible, tab]) => {
    if (visible && tab === "analytics") {
      await nextTick();
      ensureAnalyticsCharts();
      renderAnalyticsCharts();
      resizeAnalyticsCharts();
    }
  }
);

watch(
  () => [baselineVersion.value, compareVersion.value, detailTab.value],
  ([base, compare, tab], [prevBase, prevCompare]) => {
    if (
      tab === "history" &&
      base &&
      compare &&
      (base !== prevBase || compare !== prevCompare)
    ) {
      fetchHistoryVersionCompare();
    }
  }
);

watch(
  () => [
    detailAnalyticsMetricMode.value,
    overview7.value,
    overview30.value,
    audience.value,
    health.value,
    heatmapRows.value
  ],
  () => {
    if (dialogVisible.value && detailTab.value === "analytics") {
      nextTick(() => {
        ensureAnalyticsCharts();
        renderAnalyticsCharts();
      });
    }
  },
  { deep: true }
);

onMounted(() => {
  window.addEventListener("resize", resizeAnalyticsCharts);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeAnalyticsCharts);
  diagnosisChart?.dispose();
  heatmapChart?.dispose();
});
</script>

<style scoped>
.analysis-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.task-config-form :deep(.el-form-item__content) {
  margin-left: 16px;
  flex: 1;
}

.form-control {
  width: 100%;
  max-width: 460px;
}

.strategy-config-wrap {
  width: 100%;
}

.stair-space {
  width: 100%;
}

.stair-grid {
  display: grid;
  grid-template-columns: 84px 140px 140px 72px;
  align-items: center;
  gap: 8px;
}

.stair-header {
  margin-bottom: 8px;
  padding: 0 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.stair-row {
  padding-right: 12px;
}

.stair-input {
  width: 132px;
}

.stair-add {
  margin-left: 4px;
}

.window-minutes-input {
  margin-left: 0;
}

.metric-card {
  min-height: 92px;
}

.analytics-chart {
  width: 100%;
  height: 300px;
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

:deep(.el-table .history-diff-row > td.el-table__cell) {
  background: #fff7e6;
}
</style>
