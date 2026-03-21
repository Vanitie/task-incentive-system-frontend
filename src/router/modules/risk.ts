const Layout = () => import("@/layout/index.vue");

export default {
  path: "/risk",
  name: "Risk",
  component: Layout,
  redirect: "/risk/dashboard",
  meta: {
    icon: "ri:shield-check-line",
    title: "风控规则",
    rank: 4
  },
  children: [
    {
      path: "/risk/dashboard",
      name: "RiskDashboard",
      component: () => import("@/views/risk/dashboard/index.vue"),
      meta: {
        title: "风控看板"
      }
    },
    {
      path: "/risk/rules",
      name: "RiskRules",
      component: () => import("@/views/risk/rules/index.vue"),
      meta: {
        title: "规则管理"
      }
    },
    {
      path: "/risk/lists",
      name: "RiskLists",
      component: () => import("@/views/risk/lists/index.vue"),
      meta: {
        title: "名单管理"
      }
    },
    {
      path: "/risk/decisions",
      name: "RiskDecisions",
      component: () => import("@/views/risk/decisions/index.vue"),
      meta: {
        title: "决策日志"
      }
    },
    {
      path: "/risk/evaluate",
      name: "RiskEvaluate",
      component: () => import("@/views/risk/evaluate/index.vue"),
      meta: {
        title: "实时决策"
      }
    },
    {
      path: "/risk/quotas",
      name: "RiskQuotas",
      component: () => import("@/views/risk/quotas/index.vue"),
      meta: {
        title: "配额管理"
      }
    }
  ]
} satisfies RouteConfigsTable;
