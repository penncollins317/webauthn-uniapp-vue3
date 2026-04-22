import type { ApiResponse, TokenDTO } from '@/types'
type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions {
    url: string;
    method?: RequestMethod;
    data?: any;
    header?: Record<string, any>;
    showLoading?: boolean;
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

// 统一请求函数
const request = <T = any>(options: RequestOptions): Promise<T> => {
    const {
        url,
        method = "GET",
        data = {},
        header = {},
        showLoading = true
    } = options;

    if (showLoading) {
        uni.showLoading({ title: "加载中..." });
    }

    return new Promise((resolve, reject) => {
        console.log('BASE_URL:', BASE_URL)
        console.log(url)

        uni.request({
            url: BASE_URL + url,
            method,
            data,
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

                // HTTP 层错误
                if (statusCode !== 200) {
                    uni.showToast({
                        title: "请求失败",
                        icon: "none"
                    });
                    reject(res);
                    return;
                }
                resolve(data)
            },
            fail: (err) => {
                uni.showToast({
                    title: "网络错误",
                    icon: "none"
                });
                reject(err);
            },
            complete: () => {
                if (showLoading) {
                    uni.hideLoading();
                }
            }
        });
    });
};

export default request;