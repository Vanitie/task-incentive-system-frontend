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

export function queryUserActionLog(params: UserActionLogQuery) {
  return http.get<UserActionLogQueryResponse, UserActionLogQuery>(
    "/api/user-action-log/query",
    { params }
  );
}
