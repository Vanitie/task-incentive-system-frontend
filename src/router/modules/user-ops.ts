const Layout = () => import("@/layout/index.vue");

export default {
  path: "/user-ops",
  name: "UserOps",
  component: Layout,
  redirect: "/user-ops/action-log",
  meta: {
    icon: "ri:user-settings-line",
    title: "用户运营",
    rank: 7
  },
  children: [
    {
      path: "/user-ops/user-management",
      name: "UserManagement",
      component: () => import("@/views/user-management/index.vue"),
      meta: {
        title: "用户管理"
      }
    },
    {
      path: "/user-ops/action-log",
      name: "UserActionLog",
      component: () => import("@/views/user-action-log/index.vue"),
      meta: {
        title: "用户行为日志"
      }
    },
    {
      path: "/user-ops/action-analytics",
      name: "UserActionAnalytics",
      component: () => import("@/views/user-action-analytics/index.vue"),
      meta: {
        title: "用户行为分析"
      }
    }
  ]
} satisfies RouteConfigsTable;
