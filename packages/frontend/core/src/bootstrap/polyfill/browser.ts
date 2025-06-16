// 导入Array现代数组方法的polyfill（如Array.from、Array.of等）
import './array';
// 导入Set数据结构的polyfill实现
import './set';
// 导入资源清理(dispose)机制的兼容性处理
import './dispose';
// 导入迭代器辅助功能的兼容实现
import './iterator-helpers';
// 导入Promise.withResolvers等现代Promise特性的兼容实现
import './promise-with-resolvers';
// 导入requestIdleCallback API的polyfill，用于在浏览器空闲时期执行任务
import './request-idle-callback';
// 导入ResizeObserver API的polyfill，用于监听元素尺寸变化
import './resize-observer';
