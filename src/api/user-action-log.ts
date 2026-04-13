import { http } from "@/utils/http";

export interface UserActionLogQuery {
  userId?: string;
  actionType?: string;
  startTime?: string;
  endTime?: string;
  page?: number;
  pageSize?: number;
}

export interface UserActionLogItem {
  id: string;
  userId: string;
  userName?: string;
  actionType: string;
  actionValue: number;
  createTime: string;
}

export interface UserActionLogQueryResult {
  total: number;
  page: number;
  size: number;
  items: UserActionLogItem[];
}

export interface UserActionLogQueryResponse {
  code: number;
  msg: string;
  data: UserActionLogQueryResult;
}

export interface TrendPoint {
  time?: string;
  bucket?: string;
  value?: number;
  count?: number;
}

export interface TypeRatioItem {
  actionType?: string;
  type?: string;
  count?: number;
  ratio?: number;
}

export interface UserLayerItem {
  layer?: string;
  layerType?: string;
  learnCount?: number;
  signCount?: number;
  taskAcceptCount?: number;
  rewardClaimCount?: number;
  total?: number;
}

export interface HeatmapCell {
  dayOfWeek?: number;
  day?: number;
  hourOfDay?: number;
  hour?: number;
  count?: number;
  value?: number;
}

export interface ConversionDashboard {
  completionRate?: number;
  rewardRate?: number;
  rewardClaimRate?: number;
  avgActionsPerUser?: number;
}

export interface TopNResult {
  topUsers?: Array<{ userId: string | number; userName?: string; count: number }>;
  topActionTypes?: Array<{ actionType: string; count: number }>;
}

export interface CommonResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export function queryUserActionLog(params: UserActionLogQuery) {
  return http.get<UserActionLogQueryResponse, UserActionLogQuery>(
    "/api/user-action-log/query",
    { params }
  );
}

export function getActionTrend(params?: {
  startTime?: string;
  endTime?: string;
  granularity?: "DAY" | "HOUR";
}) {
  return http.get<CommonResponse<TrendPoint[]>, typeof params>(
    "/api/user-action-log/analytics/trend",
    { params }
  );
}

export function getActionTypeRatio(params?: {
  startTime?: string;
  endTime?: string;
}) {
  return http.get<CommonResponse<TypeRatioItem[]>, typeof params>(
    "/api/user-action-log/analytics/type-ratio",
    { params }
  );
}

export function getActionUserLayer(params?: {
  startTime?: string;
  endTime?: string;
}) {
  return http.get<CommonResponse<UserLayerItem[]>, typeof params>(
    "/api/user-action-log/analytics/user-layer",
    { params }
  );
}

export function getActionHeatmap(params?: {
  startTime?: string;
  endTime?: string;
}) {
  return http.get<CommonResponse<HeatmapCell[]>, typeof params>(
    "/api/user-action-log/analytics/heatmap",
    { params }
  );
}

export function getActionConversion(params?: {
  startTime?: string;
  endTime?: string;
}) {
  return http.get<CommonResponse<ConversionDashboard>, typeof params>(
    "/api/user-action-log/analytics/conversion",
    { params }
  );
}

export function getActionTopN(params?: {
  startTime?: string;
  endTime?: string;
  n?: number;
}) {
  return http.get<CommonResponse<TopNResult>, typeof params>(
    "/api/user-action-log/analytics/topn",
    { params }
  );
}
