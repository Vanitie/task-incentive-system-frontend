// src/api/user-task.ts
import { http } from "../utils/http";

export interface UserTaskListItem {
  id: number;
  userId: number;
  userName?: string;
  taskId: number;
  taskName?: string;
  progress: number;
  status: number;
  version?: number;
  extraData?: string;
  createTime?: string;
  updateTime?: string;
}

export interface UserTaskListQuery {
  userName?: string;
  userId?: string | number;
  taskName?: string;
  taskId?: string | number;
  status?: string | number;
  page?: number;
  size?: number;
}

export interface UserTaskListPage<T> {
  items: T[];
  total: number;
  page?: number;
  size?: number;
}

export interface CommonResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export interface UserTaskTopNAcceptedItem {
  userId: string | number;
  userName?: string;
  acceptedCount: number;
}

export interface UserTaskTopNTaskTypeItem {
  taskType: string;
  count: number;
}

export interface UserTaskTopNResult {
  topAcceptedUsers?: UserTaskTopNAcceptedItem[];
  topTaskTypes?: UserTaskTopNTaskTypeItem[];
  topUsers?: Array<{ name?: string; count?: number }>;
  topActionTypes?: Array<{
    name?: string;
    taskType?: string;
    count?: number;
  }>;
}

export type UserTaskTopNAcceptedResponse =
  | UserTaskTopNAcceptedItem[]
  | UserTaskTopNResult;

export interface UserTaskAnalyticsQuery {
  startTime?: string;
  endTime?: string;
  taskType?: string;
  orderBy?: string;
  n?: number;
  granularity?: "HOUR" | "DAY";
}

export interface UserTaskOverview {
  acceptedCount?: number;
  completedCount?: number;
  rewardedCount?: number;
  completionRate?: number;
  rewardRate?: number;
  avgCompletionMinutes?: number;
}

export interface UserTaskFunnel {
  exposed?: number;
  accepted?: number;
  completed?: number;
  rewarded?: number;
  acceptRate?: number;
  completeRate?: number;
  rewardRate?: number;
}

export interface UserTaskTrendItem {
  bucket?: string;
  acceptedCount?: number;
  completedCount?: number;
  rewardedCount?: number;
  failedCount?: number;
}

export interface UserTaskTypePerformanceItem {
  name?: string;
  taskType?: string;
  acceptedCount?: number;
  completedCount?: number;
  rewardedCount?: number;
  completionRate?: number;
  rewardRate?: number;
  avgCompletionMinutes?: number;
}

export interface UserTaskLayerItem {
  name?: string;
  layer?: string;
  acceptedCount?: number;
  completedCount?: number;
  rewardedCount?: number;
  completionRate?: number;
}

export interface UserTaskAnomaly {
  errorRate?: number;
  replayCount?: number;
  idempotentConflictCount?: number;
  failedCount?: number;
  topErrorReasons?: Array<{ reason?: string; count?: number }>;
}

export interface UserTaskCostRoi {
  completedCount?: number;
  rewardCost?: number;
  roi?: number;
  totalRewardPoints?: number;
  totalCompleted?: number;
  costPerCompletion?: number;
  costPerActiveUser?: number;
  roiScore?: number;
}

export function getUserTaskList(params: UserTaskListQuery = {}) {
  return http.get<any, UserTaskListQuery>("/api/user-task/list", { params });
}

export function getUserTaskTopN(params?: UserTaskAnalyticsQuery) {
  return http.get<CommonResponse<UserTaskTopNResult>, typeof params>(
    "/api/user-task/analytics/topn",
    { params }
  );
}

export function getUserTaskTopNAccepted(params?: UserTaskAnalyticsQuery) {
  return http.get<CommonResponse<UserTaskTopNAcceptedResponse>, typeof params>(
    "/api/user-task/analytics/topn-accepted",
    { params }
  );
}

export function getUserTaskOverview(params?: UserTaskAnalyticsQuery) {
  return http.get<CommonResponse<UserTaskOverview>, typeof params>(
    "/api/user-task/analytics/overview",
    { params }
  );
}

export function getUserTaskFunnel(params?: UserTaskAnalyticsQuery) {
  return http.get<CommonResponse<UserTaskFunnel>, typeof params>(
    "/api/user-task/analytics/funnel",
    { params }
  );
}

export function getUserTaskTrend(params?: UserTaskAnalyticsQuery) {
  return http.get<CommonResponse<UserTaskTrendItem[]>, typeof params>(
    "/api/user-task/analytics/trend",
    { params }
  );
}

export function getUserTaskTypePerformance(params?: UserTaskAnalyticsQuery) {
  return http.get<CommonResponse<UserTaskTypePerformanceItem[]>, typeof params>(
    "/api/user-task/analytics/type-performance",
    { params }
  );
}

export function getUserTaskLayer(params?: UserTaskAnalyticsQuery) {
  return http.get<CommonResponse<UserTaskLayerItem[]>, typeof params>(
    "/api/user-task/analytics/user-layer",
    { params }
  );
}

export function getUserTaskAnomaly(params?: UserTaskAnalyticsQuery) {
  return http.get<CommonResponse<UserTaskAnomaly>, typeof params>(
    "/api/user-task/analytics/anomaly",
    { params }
  );
}

export function getUserTaskCostRoi(params?: UserTaskAnalyticsQuery) {
  return http.get<CommonResponse<UserTaskCostRoi>, typeof params>(
    "/api/user-task/analytics/cost-roi",
    { params }
  );
}
