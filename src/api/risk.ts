import { http } from "@/utils/http";

export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export interface PageData<T> {
  total: number;
  page: number;
  size: number;
  items: T[];
}

export interface RiskDashboardOverview {
  start?: string;
  end?: string;
  total: number;
  pass: number;
  reject: number;
  degradePass: number;
  review: number;
  freeze: number;
  interceptRate: number;
  passRate: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
}

export interface RiskDailyTrendItem {
  date: string;
  total: number;
  pass: number;
  reject: number;
  degradePass: number;
  review: number;
  freeze: number;
}

export interface RiskRuleItem {
  id: string | number;
  name: string;
  type: string;
  priority: number;
  status: number;
  conditionExpr: string;
  action: "PASS" | "REJECT" | "DEGRADE_PASS" | "REVIEW" | "FREEZE";
  actionParams?: string;
  version?: number;
  startTime?: string;
  endTime?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RiskListItem {
  id: string | number;
  targetType: "user" | "device" | "ip";
  targetValue: string;
  source: string;
  expireAt?: string;
  status: number;
  createdAt?: string;
}

export interface RiskHitRule {
  ruleId: number;
  ruleName: string;
  action: string;
}

export interface RiskDecisionItem {
  id: string | number;
  requestId?: string;
  eventId?: string;
  taskId?: string | number;
  userId?: string | number;
  decision: "PASS" | "REJECT" | "DEGRADE_PASS" | "REVIEW" | "FREEZE";
  reasonCode: string;
  hitRules: RiskHitRule[];
  riskScore?: number;
  latencyMs: number;
  createdAt: string;
}

export interface RiskDecisionEvaluateRequest {
  requestId: string;
  eventId: string;
  userId: string | number;
  taskId: string | number;
  eventType: string;
  eventTime: string;
  amount: number;
  deviceId?: string;
  ip?: string;
  channel?: string;
  ext?: Record<string, any>;
}

export interface RiskDecisionEvaluateHitRule {
  ruleId: number;
  ruleName: string;
  ruleType?: string;
  action?: string;
  actionParams?: string;
  reasonCode?: string;
}

export interface RiskDecisionEvaluateResponse {
  decision: "PASS" | "REJECT" | "DEGRADE_PASS" | "REVIEW" | "FREEZE";
  reasonCode: string;
  hitRules: RiskDecisionEvaluateHitRule[];
  riskScore?: number;
  traceId?: string;
  degradeRatio?: number;
}

export interface RiskQuotaItem {
  id: string | number;
  scopeType: string;
  scopeId: string;
  resourceType?: string;
  resourceId?: string;
  periodType: string;
  limitValue: number;
  usedValue?: number;
  resetAt?: string;
  createdAt?: string;
}

export interface RiskQuotaRequest {
  id?: string | number;
  scopeType: string;
  scopeId: string;
  resourceType: string;
  resourceId: string;
  periodType: string;
  limitValue: number;
}

export function getRiskDashboardOverview(params?: {
  start?: string;
  end?: string;
}) {
  return http.get<ApiResponse<RiskDashboardOverview>, typeof params>(
    "/api/risk/dashboard/overview",
    { params }
  );
}

export function getRiskDashboardDailyTrend(params?: {
  start?: string;
  end?: string;
}) {
  return http.get<ApiResponse<RiskDailyTrendItem[]>, typeof params>(
    "/api/risk/dashboard/daily-trend",
    { params }
  );
}

export function getRiskRules(params?: {
  page?: number;
  size?: number;
  name?: string;
  status?: number;
}) {
  return http.get<ApiResponse<PageData<RiskRuleItem>>, typeof params>(
    "/api/risk/rules",
    { params }
  );
}

export function createRiskRule(data: Partial<RiskRuleItem>) {
  return http.post<ApiResponse<RiskRuleItem>, Partial<RiskRuleItem>>(
    "/api/risk/rules",
    { data }
  );
}

export function updateRiskRule(
  id: string | number,
  data: Partial<RiskRuleItem>
) {
  return http.request<ApiResponse<RiskRuleItem>>(
    "put",
    `/api/risk/rules/${id}`,
    {
      data
    }
  );
}

export function publishRiskRule(id: string | number) {
  return http.post<ApiResponse<boolean>, void>(`/api/risk/rules/${id}/publish`);
}

export function rollbackRiskRule(id: string | number) {
  return http.post<ApiResponse<boolean>, void>(
    `/api/risk/rules/${id}/rollback`
  );
}

export function validateRiskExpression(data: { conditionExpr: string }) {
  return http.post<
    ApiResponse<{
      valid: boolean;
      message?: string;
      missingSharpVariables?: string[];
    }>,
    typeof data
  >("/api/risk/rules/validate", { data });
}

export function getRiskList(
  listType: "blacklist" | "whitelist",
  params?: {
    page?: number;
    size?: number;
    targetValue?: string;
    source?: string;
    status?: number;
  }
) {
  const url =
    listType === "blacklist" ? "/api/risk/blacklist" : "/api/risk/whitelist";
  return http.get<ApiResponse<PageData<RiskListItem>>, typeof params>(url, {
    params
  });
}

export function createRiskListItem(
  listType: "blacklist" | "whitelist",
  data: Partial<RiskListItem>
) {
  const url =
    listType === "blacklist" ? "/api/risk/blacklist" : "/api/risk/whitelist";
  return http.post<ApiResponse<RiskListItem>, Partial<RiskListItem>>(url, {
    data
  });
}

export function getRiskDecisions(params?: {
  page?: number;
  size?: number;
  taskId?: string;
  decision?: string;
  start?: string;
  end?: string;
}) {
  return http.get<ApiResponse<PageData<RiskDecisionItem>>, typeof params>(
    "/api/risk/decisions",
    {
      params
    }
  );
}

export function evaluateRiskDecision(data: RiskDecisionEvaluateRequest) {
  return http.post<ApiResponse<RiskDecisionEvaluateResponse>, typeof data>(
    "/api/risk/decision/evaluate",
    {
      data
    }
  );
}

export function getRiskQuotas(params?: {
  page?: number;
  size?: number;
  scopeType?: string;
  scopeId?: string;
  resourceType?: string;
  resourceId?: string;
  periodType?: string;
}) {
  return http.get<ApiResponse<PageData<RiskQuotaItem>>, typeof params>(
    "/api/risk/quotas",
    {
      params
    }
  );
}

export function createRiskQuota(data: RiskQuotaRequest) {
  return http.post<ApiResponse<RiskQuotaItem>, RiskQuotaRequest>(
    "/api/risk/quotas",
    {
      data
    }
  );
}

export function updateRiskQuota(data: {
  id?: string | number;
  scopeType: string;
  scopeId: string;
  resourceType: string;
  resourceId: string;
  periodType: string;
  limitValue: number;
}) {
  return http.request<ApiResponse<RiskQuotaItem>>("put", "/api/risk/quotas", {
    data
  });
}

export function deleteRiskQuota(id: string | number) {
  return http.request<ApiResponse<boolean>>("delete", `/api/risk/quotas/${id}`);
}
