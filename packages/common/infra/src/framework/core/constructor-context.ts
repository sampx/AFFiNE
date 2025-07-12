import type { FrameworkProvider } from './provider';

interface Context {
  provider?: FrameworkProvider;
  props?: any;
}

export const CONSTRUCTOR_CONTEXT: {
  current: Context;
} = { current: {} };

/**
 * 在指定的上下文中执行回调函数，并确保上下文在回调完成后恢复原状
 * @param cb 要在指定上下文中执行的回调函数
 * @param context 要设置的上下文对象
 * @returns 回调函数的执行结果
 */
export function withContext<T>(cb: () => T, context: Context): T {
  const pre = CONSTRUCTOR_CONTEXT.current;
  try {
    CONSTRUCTOR_CONTEXT.current = context;
    return cb();
  } finally {
    CONSTRUCTOR_CONTEXT.current = pre;
  }
}
