// src/api/user-task.ts
import { http } from "../utils/http";

export function getUserTaskList(params = {}) {
  return http.get("/api/user-task/list", { params });
}
