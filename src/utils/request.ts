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

let isRefreshing = false;
let requestsQueue: Array<() => void> = [];

// 获取 token obj
const getTokenObj = () => {
    return uni.getStorageSync("token") as TokenDTO;
};

// 获取 token
const getToken = () => {
    const token = getTokenObj();
    if (token) {
        return token.accessToken;
    }
    return "";
};

const logout = () => {
    uni.removeStorageSync("token");
    uni.removeStorageSync("userinfo");
    uni.reLaunch({ url: '/pages/login/login' });
};

const isTokenExpired = (tokenObj: TokenDTO) => {
    if (!tokenObj || !tokenObj.accessToken) return true;
    
    // 如果后端返回了 expireIn 且看起来像是一个绝对时间戳（大于 1000000000）
    if (tokenObj.expireIn && !isNaN(Number(tokenObj.expireIn))) {
        const exp = Number(tokenObj.expireIn);
        if (exp > 1000000000) {
            return Date.now() / 1000 >= exp - 10; // 预留 10 秒
        }
    }
    
    // 尝试解析 JWT 获取 exp
    try {
        const token = tokenObj.accessToken;
        const strings = token.split(".");
        if (strings.length === 3) {
            let payload = strings[1].replace(/-/g, "+").replace(/_/g, "/");
            const pad = payload.length % 4;
            if (pad) {
                payload += new Array(5 - pad).join("=");
            }
            if (typeof atob === 'function') {
                const decoded = JSON.parse(decodeURIComponent(atob(payload).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join('')));
                if (decoded && decoded.exp) {
                    return Date.now() / 1000 >= decoded.exp - 10;
                }
            }
        }
    } catch (e) {
        // ignore
    }
    
    return false;
};

const doRefreshToken = async (): Promise<string> => {
    const tokenObj = getTokenObj();
    if (!tokenObj || !tokenObj.refreshToken) {
        logout();
        throw new Error("No refresh token");
    }
    
    return new Promise((resolve, reject) => {
        uni.request({
            url: BASE_URL + '/api/auth/refresh',
            method: 'POST',
            data: {
                token: tokenObj.refreshToken
            },
            header: {
                "Accept": "application/json",
            },
            success: (res: any) => {
                if (res.statusCode === 200 && res.data && res.data.errcode === 0) {
                    const newTokenObj = res.data.data;
                    uni.setStorageSync("token", newTokenObj);
                    // 刷新token后发送事件重新连接websocket
                    uni.$emit('auth:token_refresh')
                    resolve(newTokenObj.accessToken);
                } else {
                    logout();
                    reject(res);
                }
            },
            fail: (err) => {
                logout();
                reject(err);
            }
        });
    });
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

    return new Promise(async (resolve, reject) => {
        let requestUrl = url;
        if (params && Object.keys(params).length > 0) {
            const query = Object.keys(params)
                .map(key => `${key}=${params[key]}`)
                .join("&");
            requestUrl += (requestUrl.includes("?") ? "&" : "?") + query;
        }

        // 1. 请求前判断 token 是否过期
        if (url !== '/api/auth/refresh') {
            const tokenObj = getTokenObj();
            if (tokenObj && tokenObj.accessToken) {
                if (isTokenExpired(tokenObj)) {
                    if (!isRefreshing) {
                        isRefreshing = true;
                        try {
                            await doRefreshToken();
                            requestsQueue.forEach(cb => cb());
                            requestsQueue = [];
                        } catch (e) {
                            requestsQueue = [];
                            reject(e);
                            return;
                        } finally {
                            isRefreshing = false;
                        }
                    } else {
                        // 正在刷新，加入队列等待
                        new Promise<void>(resCb => {
                            requestsQueue.push(() => {
                                resCb();
                            });
                        }).then(() => {
                            // 刷新完毕，重发当前请求
                            request<T>(options).then(resolve).catch(reject);
                        });
                        return; // 等待刷新后重试，退出当前执行
                    }
                }
            }
        }

        const doRequest = () => {
            uni.request({
                url: BASE_URL + requestUrl,
                method,
                data: data,
                header: {
                    "Accept": "application/json",
                    Authorization: getToken() ? `Bearer ${getToken()}` : "",
                    ...header
                },
                success: async (res) => {
                    const { statusCode, data: resData } = res as unknown as {
                        statusCode: number;
                        data: T & ApiResponse;
                    }
                    
                    // 2. 拦截 401，且 errcode 为 401，尝试刷新 token
                    if (statusCode === 401 && resData && resData.errcode === 401) {
                        if (!isRefreshing) {
                            isRefreshing = true;
                            try {
                                await doRefreshToken();
                                requestsQueue.forEach(cb => cb());
                                requestsQueue = [];
                                // 重新发起请求
                                const retryRes = await request<T>(options);
                                resolve(retryRes);
                            } catch (e) {
                                requestsQueue = [];
                                reject(e);
                            } finally {
                                isRefreshing = false;
                            }
                        } else {
                            // 放入队列中等待
                            requestsQueue.push(() => {
                                request<T>(options).then(resolve).catch(reject);
                            });
                        }
                        return;
                    }

                    if (statusCode !== 200) {
                        uni.showToast({ title: "请求失败", icon: "none" });
                        reject(res);
                        return;
                    }
                    resolve(resData)
                },
                fail: (err) => {
                    uni.showToast({ title: "网络错误", icon: "none" });
                    reject(err);
                }
            });
        };

        doRequest();
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