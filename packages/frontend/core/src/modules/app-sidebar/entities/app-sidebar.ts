import { Entity, LiveData } from '@toeverything/infra';
import { map } from 'rxjs';

import type { AppSidebarState } from '../providers/storage';

enum APP_SIDEBAR_STATE {
  OPEN = 'open',
  WIDTH = 'width',
}

export class AppSidebar extends Entity {
  /**
   * 创建一个AppSidebar实例
   * @param appSidebarState 应用侧边栏状态存储对象
   */
  constructor(private readonly appSidebarState: AppSidebarState) {
    super();
  }

  /**
   * 指示侧边栏是否打开的LiveData
   * 即使侧边栏未打开，悬停也可以显示浮动侧边栏
   * 默认值为true
   */
  open$ = LiveData.from(
    this.appSidebarState
      .watch<boolean>(APP_SIDEBAR_STATE.OPEN)
      .pipe(map(value => value ?? true)),
    true
  );

  width$ = LiveData.from(
    this.appSidebarState
      .watch<number>(APP_SIDEBAR_STATE.WIDTH)
      .pipe(map(value => value ?? 248)),
    248
  );

  /**
   * 悬停可以显示浮动侧边栏，但不会打开侧边栏
   */
  hovering$ = new LiveData<boolean>(false);

  /**
   * 防止在侧边栏关闭时设置悬停状态
   */
  preventHovering$ = new LiveData<boolean>(false);

  /**
   * 小屏模式，会禁用悬停效果
   */
  smallScreenMode$ = new LiveData<boolean>(false);
  resizing$ = new LiveData<boolean>(false);

  /**
   * 获取缓存的应用侧边栏打开状态
   * @returns 返回存储中的侧边栏打开状态布尔值
   */
  getCachedAppSidebarOpenState = () => {
    return this.appSidebarState.get<boolean>(APP_SIDEBAR_STATE.OPEN);
  };

  /**
   * 切换侧边栏打开状态
   * 如果当前是打开状态则关闭，如果是关闭状态则打开
   */
  toggleSidebar = () => {
    this.setOpen(!this.open$.value);
  };

  setOpen = (open: boolean) => {
    this.appSidebarState.set(APP_SIDEBAR_STATE.OPEN, open);
    return;
  };

  /**
   * 设置侧边栏的小屏模式
   * 在小屏模式下会禁用悬停效果
   * @param smallScreenMode 要设置的小屏模式布尔值
   */
  setSmallScreenMode = (smallScreenMode: boolean) => {
    this.smallScreenMode$.next(smallScreenMode);
  };

  setHovering = (hoverFloating: boolean) => {
    this.hovering$.next(hoverFloating);
  };

  setPreventHovering = (preventHovering: boolean) => {
    this.preventHovering$.next(preventHovering);
  };

  setResizing = (resizing: boolean) => {
    this.resizing$.next(resizing);
  };

  /**
   * 设置侧边栏的宽度
   * @param width 要设置的侧边栏宽度（以像素为单位）
   */
  setWidth = (width: number) => {
    this.appSidebarState.set(APP_SIDEBAR_STATE.WIDTH, width);
  };
}
