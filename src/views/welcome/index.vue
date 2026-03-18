<script setup lang="ts">
import GroupLine from "~icons/ri/group-line";
import Question from "~icons/ri/question-answer-line";
import CheckLine from "~icons/ri/chat-check-line";
import Smile from "~icons/ri/star-smile-line";

const iconMap = {
  user: GroupLine,
  active: Question,
  task: CheckLine,
  reward: Smile
};
import { ref, markRaw, onMounted } from "vue";
import ReCol from "@/components/ReCol";
import { useDark, randomGradient } from "./utils";
import { ReNormalCountTo } from "@/components/ReCountTo";
import { useRenderFlicker } from "@/components/ReFlicker";
import { ChartBar, ChartLine, ChartRound } from "./components/charts";
import WelcomeTable from "./components/table/index.vue";
import Segmented, { type OptionsType } from "@/components/ReSegmented";
import {
  getUserTotal,
  getActive7Days,
  getTodayUserCount,
  getTodayRewardReceivers,
  getDailyTaskBar,
  getWeeklyCompletion,
  getDailyStats
} from "@/api/welcome";

defineOptions({
  name: "Welcome"
});

const { isDark } = useDark();
let curWeek = ref(1); // 0上周、1本周
const optionsBasis: Array<OptionsType> = [{ label: "上周" }, { label: "本周" }];

// 顶部统计卡片数据
const statCards = ref([
  {
    name: "用户总数",
    value: 0,
    percent: "",
    icon: undefined,
    bgColor: "#effaff",
    color: "#41b6ff",
    duration: 2200,
    data: []
  },
  {
    name: "活跃用户数",
    value: 0,
    percent: "",
    icon: undefined,
    bgColor: "#fff5f4",
    color: "#e85f33",
    duration: 1600,
    data: []
  },
  {
    name: "今日参与任务用户数",
    value: 0,
    percent: "",
    icon: undefined,
    bgColor: "#eff8f4",
    color: "#26ce83",
    duration: 1500,
    data: []
  },
  {
    name: "今日奖励领取用户数",
    value: 0,
    percent: "",
    icon: undefined,
    bgColor: "#fffbe6",
    color: "#ffb300",
    duration: 1800,
    data: []
  }
]);

// 单日任务完成数
const barChartData = ref([
  { takeData: [], completeData: [] },
  { takeData: [], completeData: [] }
]);
// 任务完成率
const progressData = ref([]);
// 数据统计表格
const tableData = ref([]);
// 最新动态
const latestNewsData = ref([]);

onMounted(async () => {
  // 顶部统计卡片
  const [userTotal, active7, todayUser, todayReward] = await Promise.all([
    getUserTotal(),
    getActive7Days(),
    getTodayUserCount(),
    getTodayRewardReceivers()
  ]);
  // 自动补充icon语义
  statCards.value[0] = { ...userTotal.data, icon: iconMap.user };
  statCards.value[1] = { ...active7.data, icon: iconMap.active };
  statCards.value[2] = { ...todayUser.data, icon: iconMap.task };
  statCards.value[3] = { ...todayReward.data, icon: iconMap.reward };

  // 单日任务完成数
  const dailyBar = await getDailyTaskBar();
  // 假设后端返回两周数据，前一周后一周分组
  const barArr =
    dailyBar.data &&
    typeof dailyBar.data === "object" &&
    "records" in dailyBar.data &&
    Array.isArray((dailyBar.data as any).records)
      ? (dailyBar.data as any).records
      : dailyBar.data;
  if (Array.isArray(barArr)) {
    // 顺序调整：本周在前，上周在后
    barChartData.value = [
      {
        takeData: barArr[1]?.taskReceived || [],
        completeData: barArr[1]?.taskCompleted || []
      },
      {
        takeData: barArr[0]?.taskReceived || [],
        completeData: barArr[0]?.taskCompleted || []
      }
    ];
  }

  // 任务完成率
  const weekly = await getWeeklyCompletion();
  const weekArr =
    weekly.data &&
    typeof weekly.data === "object" &&
    "records" in weekly.data &&
    Array.isArray((weekly.data as any).records)
      ? (weekly.data as any).records
      : weekly.data;
  if (Array.isArray(weekArr)) {
    progressData.value = weekArr.map(item => ({
      week: item.week || item.date,
      percentage:
        item.percentage ?? Math.round((item.completionRate ?? 0) * 100),
      duration: item.duration ?? 100,
      color: item.color || "#41b6ff"
    }));
  }

  // 数据统计表格
  const stats = await getDailyStats({ page: 1, size: 30 });
  const tableArr =
    stats.data &&
    typeof stats.data === "object" &&
    "records" in stats.data &&
    Array.isArray((stats.data as any).records)
      ? (stats.data as any).records
      : stats.data;
  if (Array.isArray(tableArr)) {
    tableData.value = tableArr;
    // 最新动态可用表格数据部分字段
    latestNewsData.value = tableArr.slice(0, 14).map((item, idx) => ({
      ...item,
      date: item.statDate || item.date
    }));
  }
});
</script>

<template>
  <div>
    <el-row :gutter="24" justify="space-around">
      <re-col
        v-for="(item, index) in statCards"
        :key="index"
        v-motion
        class="mb-4.5"
        :value="6"
        :md="12"
        :sm="12"
        :xs="24"
        :initial="{
          opacity: 0,
          y: 100
        }"
        :enter="{
          opacity: 1,
          y: 0,
          transition: {
            delay: 80 * (index + 1)
          }
        }"
      >
        <el-card class="line-card" shadow="never">
          <div class="flex justify-between">
            <span class="text-md font-medium">
              {{ item.name }}
            </span>
            <div
              class="size-8 flex-c rounded-md"
              :style="{
                backgroundColor: isDark ? 'transparent' : item.bgColor
              }"
            >
              <IconifyIconOffline
                :icon="item.icon"
                :color="item.color"
                width="18"
                height="18"
              />
            </div>
          </div>
          <div class="flex justify-between items-start mt-3">
            <div class="w-1/2">
              <ReNormalCountTo
                :duration="item.duration"
                :fontSize="'1.6em'"
                :startVal="100"
                :endVal="item.value"
              />
              <p class="font-medium text-green-500">{{ item.percent }}</p>
            </div>
            <ChartLine
              v-if="item.data.length > 1"
              class="w-1/2!"
              :color="item.color"
              :data="item.data"
            />
            <ChartRound v-else class="w-1/2!" />
          </div>
        </el-card>
      </re-col>

      <re-col
        v-motion
        class="mb-4.5"
        :value="18"
        :xs="24"
        :initial="{
          opacity: 0,
          y: 100
        }"
        :enter="{
          opacity: 1,
          y: 0,
          transition: {
            delay: 400
          }
        }"
      >
        <el-card class="bar-card" shadow="never">
          <div class="flex justify-between">
            <span class="text-md font-medium">单日任务完成数</span>
            <Segmented v-model="curWeek" :options="optionsBasis" />
          </div>
          <div class="flex justify-between items-start mt-3">
            <ChartBar
              :takeData="barChartData[curWeek]?.takeData || []"
              :completeData="barChartData[curWeek]?.completeData || []"
            />
          </div>
        </el-card>
      </re-col>

      <re-col
        v-motion
        class="mb-4.5"
        :value="6"
        :xs="24"
        :initial="{
          opacity: 0,
          y: 100
        }"
        :enter="{
          opacity: 1,
          y: 0,
          transition: {
            delay: 480
          }
        }"
      >
        <el-card shadow="never">
          <div class="flex justify-between">
            <span class="text-md font-medium">任务完成率</span>
          </div>
          <div
            v-for="(item, index) in progressData"
            :key="index"
            :class="[
              'flex',
              'justify-between',
              'items-start',
              index === 0 ? 'mt-8' : 'mt-[2.15rem]'
            ]"
          >
            <el-progress
              :text-inside="true"
              :percentage="item.percentage"
              :stroke-width="21"
              :color="item.color"
              striped
              striped-flow
              :duration="item.duration"
            />
            <span class="text-nowrap ml-2 text-text_color_regular text-sm">
              {{ item.week }}
            </span>
          </div>
        </el-card>
      </re-col>

      <re-col
        v-motion
        class="mb-4.5"
        :value="18"
        :xs="24"
        :initial="{
          opacity: 0,
          y: 100
        }"
        :enter="{
          opacity: 1,
          y: 0,
          transition: {
            delay: 560
          }
        }"
      >
        <el-card shadow="never">
          <div class="flex justify-between">
            <span class="text-md font-medium">数据统计</span>
          </div>
          <el-scrollbar max-height="504" class="mt-3">
            <WelcomeTable :data="tableData" />
          </el-scrollbar>
        </el-card>
      </re-col>

      <re-col
        v-motion
        class="mb-4.5"
        :value="6"
        :xs="24"
        :initial="{
          opacity: 0,
          y: 100
        }"
        :enter="{
          opacity: 1,
          y: 0,
          transition: {
            delay: 640
          }
        }"
      >
        <el-card shadow="never">
          <div class="flex justify-between">
            <span class="text-md font-medium">最新动态</span>
          </div>
          <el-scrollbar max-height="504" class="mt-3">
            <el-timeline>
              <el-timeline-item
                v-for="(item, index) in latestNewsData"
                :key="index"
                center
                placement="top"
                :icon="
                  markRaw(
                    useRenderFlicker({
                      background: randomGradient({
                        randomizeHue: true
                      })
                    })
                  )
                "
                :timestamp="item.date"
              >
                <p class="text-text_color_regular text-sm">
                  {{
                    `新增 ${item.requiredNumber} 条问题，${item.resolveNumber} 条已解决`
                  }}
                </p>
              </el-timeline-item>
            </el-timeline>
          </el-scrollbar>
        </el-card>
      </re-col>
    </el-row>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-card) {
  --el-card-border-color: none;

  /* 解决概率进度条宽度 */
  .el-progress--line {
    width: 85%;
  }

  /* 解决概率进度条字体大小 */
  .el-progress-bar__innerText {
    font-size: 15px;
  }

  /* 隐藏 el-scrollbar 滚动条 */
  .el-scrollbar__bar {
    display: none;
  }

  /* el-timeline 每一项上下、左右边距 */
  .el-timeline-item {
    margin: 0 6px;
  }
}

:deep(.el-timeline.is-start) {
  padding-left: 0;
}

.main-content {
  margin: 20px 20px 0 !important;
}
</style>
