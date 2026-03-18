import { http } from "../utils/http";
// 类型声明
export interface StatCardRes {
  icon: any;
  bgColor: string;
  color: string;
  duration: number;
  name: string;
  value: number;
  percent: string;
  data: number[];
}
export interface DailyTaskBarRes {
  date: string;
  taken: number;
  completed: number;
}
[];
export interface WeeklyCompletionRes {
  date: string;
  completionRate: number;
}
[];
export interface DailyStatsRes {
  date: string;
  userCount: number;
  taskCount: number;
  rewardCount: number;
}
export interface BackendApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

// 用户总数
export function getUserTotal() {
  return http.get<BackendApiResponse<StatCardRes>, void>(
    "/api/user/count/total"
  );
}

// 活跃用户数（最近7天）
export function getActive7Days() {
  return http.get<BackendApiResponse<StatCardRes>, void>(
    "/api/user/count/active7days"
  );
}

// 今日参与任务用户数
export function getTodayUserCount() {
  return http.get<BackendApiResponse<StatCardRes>, void>(
    "/api/user/count/today"
  );
}

// 今日奖励领取用户数
export function getTodayRewardReceivers() {
  return http.get<BackendApiResponse<StatCardRes>, void>(
    "/api/user-reward/count/today-receivers"
  );
}

// 单日任务完成数（两周任务接取/完成数）
export function getDailyTaskBar() {
  return http.get<BackendApiResponse<DailyTaskBarRes[]>, void>(
    "/api/stats/daily-task-bar"
  );
}

// 任务完成率（本周每日任务完成率）
export function getWeeklyCompletion() {
  return http.get<BackendApiResponse<WeeklyCompletionRes[]>, void>(
    "/api/stats/weekly-completion"
  );
}

// 数据统计（最近30天，分页）
export function getDailyStats(params: { page?: number; size?: number }) {
  return http.get<BackendApiResponse<DailyStatsRes[]>, typeof params>(
    "/api/stats/daily-stats",
    { params }
  );
}
