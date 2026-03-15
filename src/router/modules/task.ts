export default [
  {
    path: "/task-config",
    name: "TaskConfig",
    component: () => import("@/views/task-config/index.vue"),
    meta: { title: "任务配置管理", icon: "table" }
  },
  {
    path: "/task-progress",
    name: "TaskProgress",
    component: () => import("@/views/task-progress/index.vue"),
    meta: { title: "学习任务进度", icon: "progress" }
  },
  {
    path: "/reward-record",
    name: "RewardRecord",
    component: () => import("@/views/reward-record/index.vue"),
    meta: { title: "奖励发放情况", icon: "reward" }
  },
  {
    path: "/system-monitor",
    name: "SystemMonitor",
    component: () => import("@/views/system-monitor/index.vue"),
    meta: { title: "系统监控与统计", icon: "monitor" }
  }
];
