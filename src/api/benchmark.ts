import { http } from "../utils/http";

export interface CommonResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export interface LoadTestStartRequest {
  targetMode: "sync" | "async" | "direct";
  testMode: "baseline" | "max";
  rate?: number;
  startRate?: number;
  duration?: string;
  preVus?: number;
  maxVus?: number;
  dataScale?: "original" | "qps_6000";
  token?: string;
  forcePeak?: boolean;
}

export interface LoadTestStartResponse {
  accepted?: boolean;
  warning?: boolean;
  warningMessage?: string;
  runId?: string;
  runningRunId?: string;
  status?: string;
  message?: string;
  requestedQps?: number;
  maxAllowedQps?: number;
}

export interface LoadTestReport {
  totalRequests?: number;
  bizSuccessCount?: number;
  bizFailCount?: number;
  degradedCount?: number;
  status503Count?: number;
  iterationsRate?: number;
  httpReqsRate?: number;
  bizSuccessQps?: number;
  bizAcceptedQps?: number;
  estimatedLimitQps?: number;
  p95Ms?: number;
}

export interface LoadTestStatusResponse {
  runId?: string;
  status?: string;
  targetMode?: string;
  testMode?: string;
  requestedQps?: number;
  maxAllowedQps?: number;
  startedAt?: string;
  finishedAt?: string;
  exitCode?: number;
  summary?: string;
  command?: string;
  output?: string;
  report?: LoadTestReport;
}

export function startLoadTest(data: LoadTestStartRequest) {
  return http.post<CommonResponse<LoadTestStartResponse>, LoadTestStartRequest>(
    "/api/benchmark/load-test/start",
    { data }
  );
}

export function getLoadTestStatus(runId: string) {
  return http.get<CommonResponse<LoadTestStatusResponse>, void>(
    `/api/benchmark/load-test/${runId}`
  );
}
