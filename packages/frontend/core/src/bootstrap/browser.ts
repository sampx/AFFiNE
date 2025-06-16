// ORDER MATTERS - 以下导入顺序非常重要，不能随意更改
// 导入环境配置模块，用于设置运行时环境变量和全局配置
import './env';
// 导入公共路径配置模块，用于定义全局资源的基础路径
import './public-path';
// 导入浏览器兼容性垫片模块，用于在旧版浏览器中提供现代功能支持
import './polyfill/browser';
// 导入遥测(分析)模块，用于收集应用使用情况数据和性能指标
import './telemetry';
