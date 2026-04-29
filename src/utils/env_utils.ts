
export function getDeviceName(): string {
    const info = uni.getSystemInfoSync()
    return `${info.model} ${info.hostName} / ${info.system}`
}