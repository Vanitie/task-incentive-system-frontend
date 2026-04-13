const Layout = () => import("@/layout/index.vue");

export default {
  path: "/reward",
  name: "Reward",
  component: Layout,
  redirect: "/reward/records",
  meta: {
    icon: "ri:medal-line",
    title: "奖励中心",
    rank: 6
  },
  children: [
    {
      path: "/reward/records",
      name: "RewardRecord",
      component: () => import("@/views/reward-record/index.vue"),
      meta: {
        title: "奖励记录查询"
      }
    },
    {
      path: "/reward/badge",
      name: "Badge",
      component: () => import("@/views/badge/index.vue"),
      meta: {
        title: "徽章管理"
      }
    },
    {
      path: "/reward/reconcile-summary",
      name: "RewardReconcileSummary",
      component: () => import("@/views/reward/reconcile-summary/index.vue"),
      meta: {
        title: "对账总览",
        roles: ["admin"],
        showLink: false
      }
    },
    {
      path: "/reward/points-workbench",
      name: "RewardPointsWorkbench",
      component: () => import("@/views/reward/points-workbench/index.vue"),
      meta: {
        title: "奖励对账补偿",
        roles: ["admin"]
      }
    }
  ]
} satisfies RouteConfigsTable;
