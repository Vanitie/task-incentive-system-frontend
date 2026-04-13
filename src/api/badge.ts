import { http } from "@/utils/http";

export interface BadgeItem {
  id?: number;
  name: string;
  code: number;
  imageUrl: string;
  description: string;
  createTime?: string;
  updateTime?: string;
}

export interface PageResult<T> {
  total: number;
  page: number;
  size: number;
  items: T[];
}

export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export function getBadgeList(params: { page?: number; size?: number }) {
  return http.get<ApiResponse<PageResult<BadgeItem>>, typeof params>(
    "/api/badge/list",
    { params }
  );
}

export function searchBadgeByName(params: {
  name: string;
  page?: number;
  size?: number;
}) {
  return http.get<ApiResponse<PageResult<BadgeItem>>, typeof params>(
    "/api/badge/search",
    { params }
  );
}

export function createBadge(data: BadgeItem) {
  return http.post<ApiResponse<boolean>, BadgeItem>("/api/badge/create", {
    data
  });
}

export function updateBadge(data: BadgeItem) {
  return http.request<ApiResponse<boolean>>("put", "/api/badge/update", {
    data
  });
}

export function deleteBadge(id: number) {
  return http.request<ApiResponse<boolean>>("delete", `/api/badge/${id}`);
}

export function uploadBadgeImage(file: File, badgeId?: number) {
  const formData = new FormData();
  formData.append("file", file);
  if (typeof badgeId === "number") {
    formData.append("badgeId", String(badgeId));
  }
  return http.request<ApiResponse<string>>("post", "/api/badge/upload-image", {
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
}
