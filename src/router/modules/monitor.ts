export default {
  path: "/system-monitor",
  name: "SystemMonitor",
  component: () => import("@/views/system-monitor/index.vue"),
  meta: { title: "系统监控统计", icon: "ri:cpu-line", rank: 98 }
} satisfies RouteConfigsTable;
