import { http } from "@/utils/http";

export interface CommonResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export interface PageResult<T> {
  total: number;
  page?: number;
  size?: number;
  items: T[];
}

export interface UserAdminItem {
  id: number;
  username: string;
  roles?: string;
  pointBalance?: number;
  enabled?: boolean;
  registerTime?: string;
  lastActiveTime?: string;
}

export interface PointSummary {
  currentPoints?: number;
  totalGain?: number;
  totalConsume?: number;
  recentChange?: number;
}

export interface BehaviorSummary {
  days?: number;
  behaviorCount?: number;
  signDays?: number;
  taskCompletionRate?: number;
  rewardRate?: number;
}

export interface UserDetail {
  basic?: UserAdminItem;
  pointSummary?: PointSummary;
  behavior7d?: BehaviorSummary;
  behavior30d?: BehaviorSummary;
}

export interface AuditLogItem {
  id: number;
  operatorUserId?: number;
  targetUserId?: number;
  actionType?: string;
  detail?: string;
  operateTime?: string;
}

export interface AuditPage {
  total: number;
  items: AuditLogItem[];
}

export function getUserAdminPage(params?: {
  userId?: string | number;
  username?: string;
  role?: string;
  enabled?: boolean;
  registerStart?: string;
  registerEnd?: string;
  activeStart?: string;
  activeEnd?: string;
  page?: number;
  size?: number;
}) {
  return http.get<CommonResponse<PageResult<UserAdminItem>>, typeof params>(
    "/api/user/admin/page",
    { params }
  );
}

export function getUserAdminDetail(id: string | number) {
  return http.get<CommonResponse<UserDetail>, void>(`/api/user/admin/${id}/detail`);
}

export function updateUserAdminStatus(data: {
  userId: string | number;
  enabled: boolean;
}) {
  return http.request<CommonResponse<boolean>>("put", "/api/user/admin/status", {
    params: data
  });
}

export function updateUserAdminRole(data: {
  userId: string | number;
  role: "USER" | "ADMIN" | "ROLE_USER" | "ROLE_ADMIN";
}) {
  return http.request<CommonResponse<boolean>>("put", "/api/user/admin/role", {
    params: data
  });
}

export function getUserAdminPointsSummary(id: string | number) {
  return http.get<CommonResponse<PointSummary>, void>(`/api/user/admin/${id}/points-summary`);
}

export function getUserAdminBehaviorSummary(
  id: string | number,
  days: 7 | 30
) {
  return http.get<CommonResponse<BehaviorSummary>, { days: 7 | 30 }>(
    `/api/user/admin/${id}/behavior-summary`,
    {
      params: { days }
    }
  );
}

export function getUserAdminAuditLogs(params?: {
  operatorUserId?: string | number;
  targetUserId?: string | number;
  page?: number;
  size?: number;
}) {
  return http.get<CommonResponse<AuditPage>, typeof params>(
    "/api/user/admin/audit-logs",
    { params }
  );
}
