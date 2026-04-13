import { http } from "@/utils/http";

export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export interface UserRewardListQuery {
  userId?: string | number;
  taskId?: string | number;
  rewardType?: string;
  status?: string | number;
  page?: number;
  size?: number;
}

export interface UserRewardItem {
  id: number;
  userId: number;
  userName?: string;
  taskId: number;
  taskName?: string;
  rewardType: string;
  rewardValue: number;
  status: number;
  messageId?: string;
  grantStatus?: number;
  errorMsg?: string;
  updateTime?: string;
  createTime: string;
}

export interface UserRewardListPage {
  items: UserRewardItem[];
  total: number;
  page?: number;
  size?: number;
}

export interface GrantStatusCountItem {
  grantStatus: number;
  cnt: number;
}

export interface DuplicateMessageIdItem {
  messageId: string;
  cnt: number;
}

export interface RewardReconcileSummary {
  statusCount: GrantStatusCountItem[];
  withoutMessageId: number;
  duplicateMessageIds: DuplicateMessageIdItem[];
  abnormalSamples: UserRewardItem[];
  grantStatusRef: Record<string, string>;
  pointTotalDiff?: number;
  pointDiffUsers?: number;
  badgeTotalDiff?: number;
  itemPendingCount?: number;
  failedGrantTotal?: number;
  rewardTypeStatusStats?: RewardTypeStatusStat[];
}

export interface PointReplaySample {
  userId: number;
  currentPoints: number | null;
  expectedPoints: number;
  delta: number;
}

export interface PointReplayPreview {
  totalDiffUsers: number;
  sampleLimit: number;
  samples: PointReplaySample[];
  replayRule: string;
}

export interface BadgeReplaySample {
  userId: number;
  userName?: string;
  taskId?: number;
  taskName?: string;
  badgeCode: number;
  badgeId?: number | null;
  recordId?: number;
  createTime?: string;
}

export interface FailedGrantSample {
  recordId: number;
  userId: number;
  userName?: string;
  taskId?: number;
  taskName?: string;
  rewardType: string;
  rewardValue?: number;
  grantStatus?: number;
  error?: string;
  createTime?: string;
}

export interface RewardTypeStatusStat {
  rewardType: string;
  initCount: number;
  processingCount: number;
  successCount: number;
  failedCount: number;
  abnormalCount: number;
}

export interface RewardReplayPreview {
  totalDiffUsers: number;
  sampleLimit: number;
  pointTotalDiff: number;
  pointDiffUsers: number;
  badgeTotalDiff: number;
  itemPendingCount: number;
  failedGrantTotal: number;
  rewardTypeStatusStats: RewardTypeStatusStat[];
  // 兼容旧页面字段：积分差异样本
  samples?: PointReplaySample[];
  pointSamples: PointReplaySample[];
  badgeSamples: BadgeReplaySample[];
  failedSamples: FailedGrantSample[];
  replayRule: string;
}

export interface RewardReplayExecuteResult {
  pointAdjustedUsers: number;
  badgeCompensatedUsers: number;
  retriedFailedRecords: number;
  failedRecords: number;
  failedSamples: FailedGrantSample[];
  updatedUsers: number;
  failedUsers: number;
  rule: string;
  postCheck?: RewardReplayPreview;
}

export interface PointReplayFailedSample {
  userId: number;
  error: string;
}

export interface PointReplayExecuteResult {
  updatedUsers: number;
  failedUsers: number;
  failedSamples: PointReplayFailedSample[];
  rule: string;
}

// 查询用户奖励记录列表
export function getUserRewardList(params: UserRewardListQuery) {
  return http.get<ApiResponse<UserRewardListPage>, UserRewardListQuery>(
    "/api/user-reward/list",
    {
      params
    }
  );
}

// 按用户查询奖励记录
export function getUserRewardListByUser(
  userId: string | number,
  params?: Omit<UserRewardListQuery, "userId">
) {
  return http.get<ApiResponse<UserRewardListPage>, Omit<UserRewardListQuery, "userId">>(
    `/api/user-reward/list/${userId}`,
    {
      params
    }
  );
}

// 奖励链路对账摘要（管理员）
export function getRewardReconcileSummary(params?: { sampleLimit?: number }) {
  return http.get<ApiResponse<RewardReconcileSummary>, typeof params>(
    "/api/user-reward/reconcile/summary",
    {
      params
    }
  );
}

// 统一奖励重放差异预览（管理员）
export function getRewardReplayPreview(params?: { sampleLimit?: number }) {
  return http.get<ApiResponse<RewardReplayPreview>, typeof params>(
    "/api/user-reward/replay/preview",
    {
      params
    }
  );
}

// 执行奖励补偿（管理员，可按奖励类型执行）
export function executeRewardReplay(params?: { rewardType?: string }) {
  return http.post<ApiResponse<RewardReplayExecuteResult>, void>(
    "/api/user-reward/replay/execute",
    {
      params
    }
  );
}

// 积分重放差异预览（管理员）
export function getPointReplayPreview(params?: { sampleLimit?: number }) {
  return http.get<ApiResponse<PointReplayPreview>, typeof params>(
    "/api/user-reward/replay/points/preview",
    {
      params
    }
  );
}

// 执行积分补偿（管理员）
export function executePointReplay() {
  return http.post<ApiResponse<PointReplayExecuteResult>, void>(
    "/api/user-reward/replay/points/execute"
  );
}

export function unwrapApiResponse<T>(response: ApiResponse<T> | T): T {
  const payload = response as ApiResponse<T>;
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }
  return response as T;
}
