import { http } from "../utils/http";
// 查询任务配置列表（分页/条件）

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
export function deleteTaskConfig(id: number) {
  return http.request<any>("delete", `/api/task-config/${id}`);
}

// 查询单个任务配置
export function getTaskConfigById(id: number) {
  return http.get<any, any>(`/api/task-config/${id}`);
}
