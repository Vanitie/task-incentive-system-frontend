const Layout = () => import("@/layout/index.vue");

export default {
  path: "/task",
  name: "TaskCenter",
  component: Layout,
  redirect: "/task/config",
  meta: {
    icon: "ri:settings-3-line",
    title: "任务中心",
    rank: 4
  },
  children: [
    {
      path: "/task/config",
      name: "TaskConfig",
      component: () => import("@/views/task-config/index.vue"),
      meta: { title: "任务配置管理" }
    },
    {
      path: "/task/analytics",
      name: "TaskAnalytics",
      component: () => import("@/views/task-analytics/index.vue"),
      meta: { title: "任务分析" }
    },
    {
      path: "/task/progress",
      name: "TaskProgress",
      component: () => import("@/views/task-progress/index.vue"),
      meta: { title: "用户任务进度" }
    }
  ]
} satisfies RouteConfigsTable;
