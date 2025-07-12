import { CONSTRUCTOR_CONTEXT } from '../constructor-context';
import type { FrameworkProvider } from '../provider';

export class Component<Props = {}> {
  readonly framework: FrameworkProvider;

  readonly props: Props;

  protected readonly disposables: (() => void)[] = [];

  get eventBus() {
    return this.framework.eventBus;
  }

  /**
   * 组件构造函数，必须在提供者上下文中创建
   * @throws 如果没有在提供者上下文中创建，则抛出错误
   * @remarks 会从当前CONSTRUCTOR_CONTEXT中获取框架提供者和属性，并清空上下文
   */
  constructor() {
    if (!CONSTRUCTOR_CONTEXT.current.provider) {
      throw new Error('Component must be created in the context of a provider');
    }
    this.framework = CONSTRUCTOR_CONTEXT.current.provider;
    this.props = CONSTRUCTOR_CONTEXT.current.props;
    //
    CONSTRUCTOR_CONTEXT.current = {};
  }

  dispose() {
    this.disposables.forEach(dispose => dispose());
  }

  [Symbol.dispose]() {
    this.dispose();
  }
}
