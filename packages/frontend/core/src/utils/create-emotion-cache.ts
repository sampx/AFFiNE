// 引入emotion缓存创建函数
import createCache from '@emotion/cache';

/**
 * 创建Emotion样式缓存
 * @returns 返回创建的样式缓存对象
 */
export default function createEmotionCache() {
  // 获取Emotion插入点元素
  const emotionInsertionPoint = document.querySelector<HTMLMetaElement>(
    'meta[name="emotion-insertion-point"]'
  );
  const insertionPoint = emotionInsertionPoint ?? undefined;

  // 创建并返回样式缓存
  return createCache({ key: 'affine', insertionPoint });
}
