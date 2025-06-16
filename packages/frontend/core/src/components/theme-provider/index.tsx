// 从affine核心模块导入主题服务
import { AppThemeService } from '@affine/core/modules/theme';
// 从infra模块导入服务钩子
import { useService } from '@toeverything/infra';
// 从next-themes导入主题提供者和主题钩子
import { ThemeProvider as NextThemeProvider, useTheme } from 'next-themes';
// 从react导入类型和钩子
import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';

// 定义支持的主题类型数组
const themes = ['dark', 'light'];

// 主题观察者组件，用于同步主题状态到应用主题服务
function ThemeObserver() {
  // 从next-themes获取当前解析后的主题
  const { resolvedTheme } = useTheme();
  // 获取应用主题服务实例
  const service = useService(AppThemeService);

  // 当解析后的主题变化时，更新主题服务中的主题状态
  useEffect(() => {
    service.appTheme.theme$.next(resolvedTheme);
  }, [resolvedTheme, service.appTheme.theme$]);

  // 这是一个无渲染组件，只负责主题状态同步
  return null;
}

// 主题提供者组件，包装next-themes的ThemeProvider并添加主题观察者
export const ThemeProvider = ({ children }: PropsWithChildren) => {
  return (
    // 使用next-themes的ThemeProvider，传入支持的主题列表并启用系统主题检测
    <NextThemeProvider themes={themes} enableSystem={true}>
      {children}
      {/* 添加主题观察者组件用于同步主题状态 */}
      <ThemeObserver />
    </NextThemeProvider>
  );
};
