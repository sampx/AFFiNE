import { getDefaultStore } from 'jotai';

// 获取到全局唯一的 store 实例，这个 store 管理着所有的状态数据。
export function getCurrentStore() {
  return getDefaultStore();
}
