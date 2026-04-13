import { http } from "@/utils/http";

export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

export type TaskEngineMode = "async" | "sync" | "direct";

export interface TaskEngineProcessEventRequest {
  messageId?: string;
  requestId?: string;
  eventId?: string;
  deviceId?: string;
  ip?: string;
  channel?: string;
  ext?: Record<string, any>;
  userId: string | number;
  eventType: string;
  value?: number;
  time?: string;
}

export function processEventByMode(
  mode: TaskEngineMode,
  data: TaskEngineProcessEventRequest
) {
  const pathMap: Record<TaskEngineMode, string> = {
    async: "/api/engine/process-event-async",
    sync: "/api/engine/process-event-sync",
    direct: "/api/engine/process-event-direct"
  };

  return http.post<ApiResponse<Record<string, any>>, TaskEngineProcessEventRequest>(
    pathMap[mode],
    { data }
  );
}
