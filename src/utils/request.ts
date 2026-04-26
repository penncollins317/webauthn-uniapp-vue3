import type { ApiResponse, TokenDTO } from '@/types'
type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions {
    url: string;
    method?: RequestMethod;
    data?: any;
    params?: any;
    header?: Record<string, any>;
}

const BASE_URL = import.meta.env.VITE_SERVER_URL

// 获取 token
const getToken = () => {
    const token = uni.getStorageSync("token") as TokenDTO;
    if (token) {
        return token.accessToken;
    }
    return "";
};

/**
 * 统一请求函数 (基础版本，无 Loading)
 */
const request = <T = any>(options: RequestOptions): Promise<T> => {
    const {
        url,
        method = "GET",
        data = {},
        params = {},
        header = {}
    } = options;

    return new Promise((resolve, reject) => {
        let requestUrl = url;
        if (params && Object.keys(params).length > 0) {
            const query = Object.keys(params)
                .map(key => `${key}=${params[key]}`)
                .join("&");
            requestUrl += (requestUrl.includes("?") ? "&" : "?") + query;
        }

        uni.request({
            url: BASE_URL + requestUrl,
            method,
            data: data,
            header: {
                "Accept": "application/json",
                Authorization: getToken() ? `Bearer ${getToken()}` : "",
                ...header
            },
            success: (res) => {
                const { statusCode, data } = res as unknown as {
                    statusCode: number;
                    data: T;
                }
                if (statusCode !== 200) {
                    uni.showToast({ title: "请求失败", icon: "none" });
                    reject(res);
                    return;
                }
                resolve(data)
            },
            fail: (err) => {
                uni.showToast({ title: "网络错误", icon: "none" });
                reject(err);
            }
        });
    });
};

/**
 * Loading 包装器
 */
export const withLoading = <T>(promise: Promise<T>, title = "加载中..."): Promise<T> => {
    uni.showLoading({ title, mask: true });
    return promise.finally(() => {
        uni.hideLoading();
    });
};

export default request;