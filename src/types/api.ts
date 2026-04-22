export interface ApiResponse<T = any> {
    errcode: number
    errmsg: string
    data?: T
}