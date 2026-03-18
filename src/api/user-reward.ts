import { http } from "@/utils/http";

// 查询用户奖励记录列表
export function getUserRewardList(params: any) {
  return http.get("/api/user-reward/list", { params });
}
