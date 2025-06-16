/**
 * 获取指定 worker 的 URL。
 *
 * @param name worker 的名称
 * @returns worker 的完整 URL 路径
 *
 * 说明：
 * - worker 不能使用 publicPath，因为必须遵守同源策略（same-origin policy）。
 * - 路径格式为：{子路径}/js/{worker名称}-{应用版本号}.worker.js
 */
export function getWorkerUrl(name: string) {
  return (
    // NOTE: worker can not use publicPath because it must obey the same-origin policy
    // 如果 environment.subPath 存在则使用，否则默认为根路径 '/'
    (environment.subPath || '/') +
    'js/' + // 指定 worker 文件所在的 js 目录 (编译后的 dist 目录)
    `${name}-${BUILD_CONFIG.appVersion}.worker.js` // 拼接 worker 文件名和应用版本号
  );
}
