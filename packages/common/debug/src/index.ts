import debug from 'debug';
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SESSION_KEY = 'affine:debug';

if (typeof window !== 'undefined') {
  // enable debug logs if the URL search string contains `debug`
  // e.g. http://localhost:3000/?debug
  if (window.location.search.includes('debug')) {
    // enable debug logs for the current session
    // since the query string may be removed by the browser after navigations,
    // we need to store the debug flag in sessionStorage
    sessionStorage.setItem(SESSION_KEY, 'true');
  }
  if (sessionStorage.getItem(SESSION_KEY) === 'true') {
    // enable all debug logs by default
    debug.enable('*');
    console.warn('Debug logs enabled');
  }
  if (BUILD_CONFIG.debug) {
    debug.enable('*,-micromark');
    console.warn('Debug logs enabled');
  }
}

/**
 * DebugLogger 类用于创建带有命名空间的调试日志记录器。
 * @class
 * @param {string} namespace - 日志记录器的命名空间，用于区分不同模块的日志。
 */
export class DebugLogger {
  private readonly _debug: debug.Debugger;

  /**
   * 构造函数，初始化一个新的DebugLogger实例。
   * @constructor
   * @param {string} namespace - 日志记录器的命名空间。
   */
  constructor(namespace: string) {
    this._debug = debug(namespace);
  }

  /**
   * 设置日志记录器的启用状态。
   * @param {boolean} enabled - 如果为true，则启用日志记录；否则禁用。
   */
  set enabled(enabled: boolean) {
    this._debug.enabled = enabled;
  }

  /**
   * 获取当前日志记录器的启用状态。
   * @returns {boolean} - 当前日志记录器的启用状态。
   */
  get enabled() {
    return this._debug.enabled;
  }

  /**
   * 记录调试级别日志。
   * @param {string} message - 要记录的日志信息。
   * @param {...any} args - 格式化参数。
   */
  debug(message: string, ...args: any[]) {
    this.log('debug', message, ...args);
  }

  /**
   * 记录信息级别日志。
   * @param {string} message - 要记录的日志信息。
   * @param {...any} args - 格式化参数。
   */
  info(message: string, ...args: any[]) {
    this.log('info', message, ...args);
  }

  /**
   * 记录警告级别日志。
   * @param {string} message - 要记录的日志信息。
   * @param {...any} args - 格式化参数。
   */
  warn(message: string, ...args: any[]) {
    this.log('warn', message, ...args);
  }

  /**
   * 记录错误级别日志。
   * @param {string} message - 要记录的日志信息。
   * @param {...any} args - 格式化参数。
   */
  error(message: string, ...args: any[]) {
    this.log('error', message, ...args);
  }

  /**
   * 记录指定级别的日志。
   * @param {LogLevel} level - 日志级别。
   * @param {string} message - 要记录的日志信息。
   * @param {...any} args - 格式化参数。
   */
  log(level: LogLevel, message: string, ...args: any[]) {
    this._debug.log = console[level].bind(console);
    this._debug(`[${level.toUpperCase()}] ${message}`, ...args);
  }

  /**
   * 创建一个新的DebugLogger实例，其命名空间基于当前实例的命名空间加上额外的后缀。
   * @param {string} extra - 要添加到当前命名空间的额外后缀。
   * @returns {DebugLogger} - 新的DebugLogger实例。
   */
  namespace(extra: string) {
    const currentNamespace = this._debug.namespace;
    return new DebugLogger(`${currentNamespace}:${extra}`);
  }
}
