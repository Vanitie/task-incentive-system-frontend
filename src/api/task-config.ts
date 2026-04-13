import { http } from "../utils/http";
// 查询任务配置列表（分页/条件）

export interface CommonResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export interface TaskConfigAnalyticsOverview {
  acceptedCount?: number;
  completedCount?: number;
  rewardedCount?: number;
  completionRate?: number;
  rewardRate?: number;
  avgCompletionMinutes?: number;
}

export interface TaskConfigAudienceHit {
  targetUsers?: number;
  reachedUsers?: number;
  reachRate?: number;
  layerBreakdown?: Array<{ layer?: string; count?: number }>;
}

export interface TaskConfigHeatmapCell {
  dayOfWeek?: number;
  hour?: number;
  hourOfDay?: number;
  count?: number;
}

export interface TaskConfigRewardElasticityItem {
  rewardBucket?: string;
  acceptedCount?: number;
  completedCount?: number;
  rewardedCount?: number;
  completionRate?: number;
  rewardRate?: number;
}

export interface TaskConfigVersionCompare {
  baselineVersion?: string;
  compareVersion?: string;
  baselineStart?: string;
  baselineEnd?: string;
  compareStart?: string;
  compareEnd?: string;
  baseline?: TaskConfigAnalyticsOverview;
  compare?: TaskConfigAnalyticsOverview;
  deltaCompletionRate?: number;
  deltaRewardRate?: number;
  note?: string;
}

export interface TaskConfigHealth {
  failedRate?: number;
  timeoutRate?: number;
  compensationCount?: number;
  totalRewardRequests?: number;
  failedCount?: number;
  timeoutCount?: number;
  replayCount?: number;
  idempotentConflictCount?: number;
  errorRate?: number;
}

export interface TaskConfigInsight {
  days?: number;
  acceptedCount?: number;
  completedCount?: number;
  rewardedCount?: number;
  completionRate?: number;
  rewardRate?: number;
  avgCompletionMinutes?: number;
  failedRate?: number;
  timeoutRate?: number;
  compensationCount?: number;
  idempotentConflictCount?: number;
  totalRewardRequests?: number;
  conversionLossCount?: number;
  rewardLossCount?: number;
  qualityScore?: number;
}

export interface TaskConfigHistory {
  id?: number;
  taskId?: number;
  version?: number;
  versionNo?: number;
  createTime?: string;
  updateTime?: string;
  [key: string]: any;
}

// 查询任务配置列表（分页/条件）
export function searchTaskConfigs(params: {
  taskName?: string;
  taskType?: string;
  status?: number;
  rewardType?: string;
  page?: number;
  size?: number;
  orderByEndTime?: string;
  asc?: boolean;
}) {
  return http.get<any, typeof params>("/api/task-config/search", { params });
}

// 新增任务配置
export function createTaskConfig(data: any) {
  return http.post<any, typeof data>("/api/task-config/create", { data });
}

// 更新任务配置
export function updateTaskConfig(data: any) {
  return http.request<any>("put", "/api/task-config/update", { data });
}

// 删除任务配置
export function deleteTaskConfig(id: string | number) {
  return http.request<any>("delete", `/api/task-config/${id}`);
}

// 查询单个任务配置
export function getTaskConfigById(id: string | number) {
  return http.get<any, any>(`/api/task-config/${id}`);
}

export function getTaskConfigAnalyticsOverview(
  id: string | number,
  params: { days: 7 | 30 }
) {
  return http.get<CommonResponse<TaskConfigAnalyticsOverview>, typeof params>(
    `/api/task-config/${id}/analytics/overview`,
    { params }
  );
}

export function getTaskConfigAudienceHit(
  id: string | number,
  params: { days: 7 | 30 }
) {
  return http.get<CommonResponse<TaskConfigAudienceHit>, typeof params>(
    `/api/task-config/${id}/analytics/audience-hit`,
    { params }
  );
}

export function getTaskConfigTimeHeatmap(
  id: string | number,
  params: { days: 7 }
) {
  return http.get<CommonResponse<TaskConfigHeatmapCell[]>, typeof params>(
    `/api/task-config/${id}/analytics/time-heatmap`,
    { params }
  );
}

export function getTaskConfigRewardElasticity(
  id: string | number,
  params: { days: 30 }
) {
  return http.get<CommonResponse<TaskConfigRewardElasticityItem[]>, typeof params>(
    `/api/task-config/${id}/analytics/reward-elasticity`,
    { params }
  );
}

export function getTaskConfigVersionCompare(
  id: string | number,
  params?: Record<string, any>
) {
  return http.get<CommonResponse<TaskConfigVersionCompare>, typeof params>(
    `/api/task-config/${id}/analytics/version-compare`,
    { params }
  );
}

export function getTaskConfigHealth(
  id: string | number,
  params: { days: 7 }
) {
  return http.get<CommonResponse<TaskConfigHealth>, typeof params>(
    `/api/task-config/${id}/analytics/health`,
    { params }
  );
}

export function getTaskConfigHistory(id: string | number) {
  return http.get<CommonResponse<TaskConfigHistory[]>, void>(
    `/api/task-config/${id}/history`
  );
}

export function getTaskConfigAnalyticsInsight(
  id: string | number,
  params: { days: 7 | 30 }
) {
  return http.get<CommonResponse<TaskConfigInsight>, typeof params>(
    `/api/task-config/${id}/analytics/insight`,
    { params }
  );
}
