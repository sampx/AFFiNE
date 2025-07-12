import React, { useContext, useMemo } from 'react';

import type { FrameworkProvider, Scope, Service } from '../core';
import { Framework, FrameworkStackProvider } from '../core';
import type { GeneralIdentifier, IdentifierType, Type } from '../core/types';

export const FrameworkProviderContext = React.createContext<FrameworkProvider>(
  Framework.EMPTY.provider()
);

/**
 * 获取当前框架的上下文提供者
 *
 * @returns FrameworkProvider - 框架上下文提供者实例，保证不为null（因为有默认值）
 */
export function useFramework(): FrameworkProvider {
  return useContext(FrameworkProviderContext); // never null, because the default value
}

/**
 * 从框架上下文中获取指定标识符对应的服务实例
 * @param identifier - 服务标识符
 * @returns 对应的服务实例
 * @template T - 服务类型
 */
export function useService<T>(identifier: GeneralIdentifier<T>): T {
  return useContext(FrameworkProviderContext).get(identifier);
}

/**
 * 自定义钩子，用于从框架提供者中获取多个服务实例
 *
 * @template T - 服务标识符的键值对类型，键为字符串，值为通用服务标识符
 * @param identifiers - 包含服务标识符键值对的对象
 * @returns 返回一个对象，其中键为原始标识符键的小写首字母形式，值为对应的服务实例
 *
 * @example
 * const { userService, authService } = useServices({
 *   UserService: UserServiceIdentifier,
 *   AuthService: AuthServiceIdentifier
 * });
 */
export function useServices<
  const T extends { [key in string]: GeneralIdentifier<Service> },
>(
  identifiers: T
): keyof T extends string
  ? { [key in Uncapitalize<keyof T>]: IdentifierType<T[Capitalize<key>]> }
  : never {
  const provider = useContext(FrameworkProviderContext);

  const services: any = {};

  for (const [key, value] of Object.entries(identifiers)) {
    services[key.charAt(0).toLowerCase() + key.slice(1)] = provider.get(value);
  }

  return services;
}

export function useServiceOptional<T extends Service>(
  identifier: Type<T>
): T | undefined {
  return useContext(FrameworkProviderContext).getOptional(identifier);
}

/**
 * 框架根组件，用于提供框架上下文
 * @param framework - 框架提供器实例
 * @param children - 子组件
 */
export const FrameworkRoot = ({
  framework,
  children,
}: React.PropsWithChildren<{ framework: FrameworkProvider }>) => {
  return (
    <FrameworkProviderContext.Provider value={framework}>
      {children}
    </FrameworkProviderContext.Provider>
  );
};

/**
 * 框架作用域组件，用于提供嵌套的框架上下文
 *
 * @param scope - 可选的作用域对象，包含框架实例
 * @param children - 子组件
 * @returns 返回一个提供新框架上下文的React Provider组件
 *
 * @remarks
 * 当传入scope时，会创建一个新的框架堆栈提供者，将当前provider与scope中的框架实例合并
 * 否则直接使用上层提供的context
 */
export const FrameworkScope = ({
  scope,
  children,
}: React.PropsWithChildren<{ scope?: Scope }>) => {
  const provider = useContext(FrameworkProviderContext);

  const nextStack = useMemo(() => {
    if (!scope) return provider;
    // make sure the stack order is inside to outside
    return new FrameworkStackProvider([scope.framework, provider]);
  }, [scope, provider]);

  return (
    <FrameworkProviderContext.Provider value={nextStack}>
      {children}
    </FrameworkProviderContext.Provider>
  );
};
