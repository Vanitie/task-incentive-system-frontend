import { http } from "@/utils/http";

type BackendApiResponse<T> = {
  code: number;
  msg: string;
  data: T;
};

export type UserResult = {
  success: boolean;
  data: {
    /** 头像 */
    avatar: string;
    /** 用户名 */
    username: string;
    /** 昵称 */
    nickname: string;
    /** 当前登录用户的角色 */
    roles: Array<string>;
    /** 按钮级别权限 */
    permissions: Array<string>;
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
  };
};

export type RefreshTokenResult = {
  success: boolean;
  data: {
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
  };
};

/** 登录 */
export const getLogin = (data?: object) => {
  return http
    .request<BackendApiResponse<{ token: string }>>("post", "/api/auth/login", {
      data
    })
    .then(res => {
      const username = (data as any)?.username ?? "";
      const token = res?.data?.token ?? "";
      return {
        success: res?.code === 0,
        data: {
          avatar: "",
          username,
          nickname: username,
          roles: ["admin"],
          permissions: ["*:*:*"],
          accessToken: token,
          refreshToken: token,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      } as UserResult;
    });
};

/** 刷新`token` */
export const refreshTokenApi = (data?: object) => {
  return http.request<RefreshTokenResult>("post", "/refresh-token", { data });
};
