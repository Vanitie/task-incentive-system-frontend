export default [
  {
    path: "/task-config",
    name: "TaskConfig",
    component: () => import("@/views/task-config/index.vue"),
    meta: { title: "任务配置管理", icon: "ri:settings-3-line" }
  },
  {
    path: "/system-monitor",
    name: "SystemMonitor",
    component: () => import("@/views/system-monitor/index.vue"),
    meta: { title: "系统监控统计", icon: "ri:cpu-line" }
  },
  {
    path: "/task-progress",
    name: "TaskProgress",
    component: () => import("@/views/task-progress/index.vue"),
    meta: { title: "学习任务进度", icon: "ri:bar-chart-2-line" }
  },
  {
    path: "/reward-record",
    name: "RewardRecord",
    component: () => import("@/views/reward-record/index.vue"),
    meta: { title: "奖励发放情况", icon: "ri:medal-line" }
  },
  {
    path: "/user-action-log",
    name: "UserActionLog",
    meta: {
      title: "用户行为统计",
      icon: "ri:list-check-2"
    },
    component: () => import("@/views/user-action-log/index.vue")
  },
  {
    path: "/badge",
    name: "Badge",
    component: () => import("@/views/badge/index.vue"),
    meta: { title: "徽章管理", icon: "ri:award-line" }
  }
];
