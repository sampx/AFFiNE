import type { Entity } from './components/entity';
import type { Scope } from './components/scope';
import type { Service } from './components/service';
import type { Store } from './components/store';
import { DEFAULT_VARIANT, ROOT_SCOPE, SUB_COMPONENTS } from './consts';
import { DuplicateDefinitionError } from './error';
import { parseIdentifier } from './identifier';
import type { FrameworkProvider } from './provider';
import { BasicFrameworkProvider } from './provider';
import { stringifyScope } from './scope';
import type {
  ComponentFactory,
  ComponentVariant,
  FrameworkScopeStack,
  GeneralIdentifier,
  Identifier,
  IdentifierType,
  IdentifierValue,
  SubComponent,
  Type,
  TypesToDeps,
} from './types';

export class Framework {
  private readonly components: Map<
    string,
    Map<string, Map<ComponentVariant, ComponentFactory>>
  > = new Map();

  /**
   * Create an empty framework.
   *
   * same as `new Framework()`
   */
  static get EMPTY() {
    return new Framework();
  }

  /**
   * The number of components in the framework.
   */
  get componentCount() {
    let count = 0;
    for (const [, identifiers] of this.components) {
      for (const [, variants] of identifiers) {
        count += variants.size;
      }
    }
    return count;
  }

  /**
   * @see {@link FrameworkEditor.service}
   */
  get service() {
    return new FrameworkEditor(this).service;
  }

  /**
   * @see {@link FrameworkEditor.impl}
   */
  get impl() {
    return new FrameworkEditor(this).impl;
  }

  /**
   * @see {@link FrameworkEditor.entity}
   */
  get entity() {
    return new FrameworkEditor(this).entity;
  }

  /**
   * @see {@link FrameworkEditor.scope}
   */
  get scope() {
    return new FrameworkEditor(this).scope;
  }

  /**
   * @see {@link FrameworkEditor.override}
   */
  get override() {
    return new FrameworkEditor(this).override;
  }

  /**
   * @see {@link FrameworkEditor.store}
   */
  get store() {
    return new FrameworkEditor(this).store;
  }

  /**
   * @internal Use {@link impl} instead.
   */
  addValue<T>(
    identifier: GeneralIdentifier<T>,
    value: T,
    {
      scope,
      override,
    }: { scope?: FrameworkScopeStack; override?: boolean } = {}
  ) {
    this.addFactory(parseIdentifier(identifier) as Identifier<T>, () => value, {
      scope,
      override,
    });
  }

  /**
   * @internal Use {@link impl} instead.
   */
  /**
   * 添加一个组件工厂到框架中
   *
   * @param identifier - 组件标识符，可以是字符串或GeneralIdentifier对象
   * @param factory - 组件工厂函数
   * @param options - 可选配置项
   * @param options.scope - 组件的作用域栈，默认为根作用域
   * @param options.override - 是否允许覆盖已存在的组件，默认为false
   * @throws {DuplicateDefinitionError} 当组件已存在且未设置override时抛出
   *
   * 该方法会将组件工厂按作用域、标识符和变体进行分层存储，
   * 确保同一作用域下相同标识符和变体的组件唯一性
   */
  addFactory<T>(
    identifier: GeneralIdentifier<T>,
    factory: ComponentFactory<T>,
    {
      scope,
      override,
    }: { scope?: FrameworkScopeStack; override?: boolean } = {}
  ) {
    // 1. 规范化作用域为字符串格式
    const normalizedScope = stringifyScope(scope ?? ROOT_SCOPE);
    // 2. 解析组件标识符
    const normalizedIdentifier = parseIdentifier(identifier);
    // 3. 获取或使用默认变体
    const normalizedVariant = normalizedIdentifier.variant ?? DEFAULT_VARIANT;

    // 4. 获取或初始化作用域下的服务集合
    const services =
      this.components.get(normalizedScope) ??
      new Map<string, Map<ComponentVariant, ComponentFactory>>();

    // 5. 获取或初始化组件名称下的变体集合
    const variants =
      services.get(normalizedIdentifier.identifierName) ??
      new Map<ComponentVariant, ComponentFactory>();

    // 6. 检查是否已存在相同变体的组件(除非允许覆盖)
    if (variants.has(normalizedVariant) && !override) {
      throw new DuplicateDefinitionError(normalizedIdentifier);
    }

    // 7. 注册组件
    variants.set(normalizedVariant, factory);
    services.set(normalizedIdentifier.identifierName, variants);
    this.components.set(normalizedScope, services);
  }

  remove(identifier: IdentifierValue, scope: FrameworkScopeStack = ROOT_SCOPE) {
    const normalizedScope = stringifyScope(scope);
    const normalizedIdentifier = parseIdentifier(identifier);
    const normalizedVariant = normalizedIdentifier.variant ?? DEFAULT_VARIANT;

    const services = this.components.get(normalizedScope);
    if (!services) {
      return;
    }

    const variants = services.get(normalizedIdentifier.identifierName);
    if (!variants) {
      return;
    }

    variants.delete(normalizedVariant);
  }

  /**
   * Create a service provider from the collection.
   *
   * @example
   * ```ts
   * provider() // create a service provider for root scope
   * provider(ScopeA, parentProvider) // create a service provider for scope A
   * ```
   *
   * @param scope The scope of the service provider, default to the root scope.
   * @param parent The parent service provider, it is required if the scope is not the root scope.
   */
  provider(
    scope: FrameworkScopeStack = ROOT_SCOPE,
    parent: FrameworkProvider | null = null
  ): FrameworkProvider {
    return new BasicFrameworkProvider(this, scope, parent);
  }

  /**
   * @internal
   */
  getFactory(
    identifier: IdentifierValue,
    scope: FrameworkScopeStack = ROOT_SCOPE
  ): ComponentFactory | undefined {
    return this.components
      .get(stringifyScope(scope))
      ?.get(identifier.identifierName)
      ?.get(identifier.variant ?? DEFAULT_VARIANT);
  }

  /**
   * @internal
   */
  getFactoryAll(
    identifier: IdentifierValue,
    scope: FrameworkScopeStack = ROOT_SCOPE
  ): Map<ComponentVariant, ComponentFactory> {
    return new Map(
      this.components.get(stringifyScope(scope))?.get(identifier.identifierName)
    );
  }

  /**
   * Clone the entire service collection.
   *
   * This method is quite cheap as it only clones the references.
   *
   * @returns A new service collection with the same services.
   */
  clone(): Framework {
    const di = new Framework();
    for (const [scope, identifiers] of this.components) {
      const s = new Map();
      for (const [identifier, variants] of identifiers) {
        s.set(identifier, new Map(variants));
      }
      di.components.set(scope, s);
    }
    return di;
  }
}

/**
 * A helper class to edit a framework.
 */
class FrameworkEditor {
  private currentScopeStack: FrameworkScopeStack = ROOT_SCOPE;

  constructor(private readonly collection: Framework) {}

  /**
   * Add a service to the framework.
   *
   * @see {@link Framework}
   *
   * @example
   * ```ts
   * service(ServiceClass, [dependencies, ...])
   * ```
   */
  service = <
    Arg1 extends Type<Service>,
    Arg2 extends Deps | ComponentFactory<ServiceType> | ServiceType,
    ServiceType = IdentifierType<Arg1>,
    Deps = Arg1 extends Type<ServiceType>
      ? TypesToDeps<ConstructorParameters<Arg1>>
      : [],
  >(
    service: Arg1,
    ...[arg2]: Arg2 extends [] ? [] : [Arg2]
  ): this => {
    if (arg2 instanceof Function) {
      this.collection.addFactory<any>(service as any, arg2 as any, {
        scope: this.currentScopeStack,
      });
    } else if (arg2 instanceof Array || arg2 === undefined) {
      this.collection.addFactory<any>(
        service as any,
        dependenciesToFactory(service, arg2 as any),
        { scope: this.currentScopeStack }
      );
    } else {
      this.collection.addValue<any>(service as any, arg2, {
        scope: this.currentScopeStack,
      });
    }

    if (SUB_COMPONENTS in service) {
      const subComponents = (service as any)[SUB_COMPONENTS] as SubComponent[];
      for (const { identifier, factory } of subComponents) {
        this.collection.addFactory(identifier, factory, {
          scope: this.currentScopeStack,
        });
      }
    }

    return this;
  };

  /**
   * Add a store to the framework.
   *
   * @see {@link Framework}
   *
   * @example
   * ```ts
   * store(StoreClass, [dependencies, ...])
   * ```
   */
  store = <
    Arg1 extends Type<Store>,
    Arg2 extends Deps | ComponentFactory<StoreType> | StoreType,
    StoreType = IdentifierType<Arg1>,
    Deps = Arg1 extends Type<StoreType>
      ? TypesToDeps<ConstructorParameters<Arg1>>
      : [],
  >(
    store: Arg1,
    ...[arg2]: Arg2 extends [] ? [] : [Arg2]
  ): this => {
    if (arg2 instanceof Function) {
      this.collection.addFactory<any>(store as any, arg2 as any, {
        scope: this.currentScopeStack,
      });
    } else if (arg2 instanceof Array || arg2 === undefined) {
      this.collection.addFactory<any>(
        store as any,
        dependenciesToFactory(store, arg2 as any),
        { scope: this.currentScopeStack }
      );
    } else {
      this.collection.addValue<any>(store as any, arg2, {
        scope: this.currentScopeStack,
      });
    }

    if (SUB_COMPONENTS in store) {
      const subComponents = (store as any)[SUB_COMPONENTS] as SubComponent[];
      for (const { identifier, factory } of subComponents) {
        this.collection.addFactory(identifier, factory, {
          scope: this.currentScopeStack,
        });
      }
    }

    return this;
  };

  /**
   * Add an entity to the framework.
   */
  entity = <
    Arg1 extends Type<Entity<any>>,
    Arg2 extends Deps | ComponentFactory<EntityType>,
    EntityType = IdentifierType<Arg1>,
    Deps = Arg1 extends Type<EntityType>
      ? TypesToDeps<ConstructorParameters<Arg1>>
      : [],
  >(
    entity: Arg1,
    ...[arg2]: Arg2 extends [] ? [] : [Arg2]
  ): this => {
    if (arg2 instanceof Function) {
      this.collection.addFactory<any>(entity as any, arg2 as any, {
        scope: this.currentScopeStack,
      });
    } else {
      this.collection.addFactory<any>(
        entity as any,
        dependenciesToFactory(entity, arg2 as any),
        { scope: this.currentScopeStack }
      );
    }

    return this;
  };

  /**
   * Add an implementation for identifier to the collection.
   *
   * @see {@link Framework}
   *
   * @example
   * ```ts
   * addImpl(Identifier, Class, [dependencies, ...])
   * or
   * addImpl(Identifier, Instance)
   * or
   * addImpl(Identifier, Factory)
   * ```
   */
  impl = <
    Arg1 extends Identifier<any>,
    Arg2 extends Type<Trait> | ComponentFactory<Trait> | Trait,
    Arg3 extends Deps,
    Trait = IdentifierType<Arg1>,
    Deps = Arg2 extends Type<Trait>
      ? TypesToDeps<ConstructorParameters<Arg2>>
      : [],
  >(
    identifier: Arg1,
    arg2: Arg2,
    ...[arg3]: Arg3 extends [] ? [] : [Arg3]
  ): this => {
    if (arg2 instanceof Function) {
      this.collection.addFactory<any>(
        identifier,
        dependenciesToFactory(arg2, arg3 as any[]),
        { scope: this.currentScopeStack }
      );
    } else {
      this.collection.addValue(identifier, arg2 as any, {
        scope: this.currentScopeStack,
      });
    }

    return this;
  };

  /**
   * same as {@link impl} but this method will override the component if it exists.
   *
   * @see {@link Framework}
   *
   * @example
   * ```ts
   * override(Identifier, Class, [dependencies, ...])
   * or
   * override(Identifier, Instance)
   * or
   * override(Identifier, Factory)
   * ```
   */
  override = <
    Arg1 extends Identifier<any>,
    Arg2 extends Type<Trait> | ComponentFactory<Trait> | Trait,
    Arg3 extends Deps,
    Trait = IdentifierType<Arg1>,
    Deps = Arg2 extends Type<Trait>
      ? TypesToDeps<ConstructorParameters<Arg2>>
      : [],
  >(
    identifier: Arg1,
    arg2: Arg2,
    ...[arg3]: Arg3 extends [] ? [] : [Arg3]
  ): this => {
    if (arg2 === null) {
      this.collection.remove(
        parseIdentifier(identifier),
        this.currentScopeStack
      );
      return this;
    } else if (arg2 instanceof Function) {
      this.collection.addFactory<any>(
        identifier,
        dependenciesToFactory(arg2, arg3 as any[]),
        { scope: this.currentScopeStack, override: true }
      );
    } else {
      this.collection.addValue(identifier, arg2 as any, {
        scope: this.currentScopeStack,
        override: true,
      });
    }

    return this;
  };

  /**
   * Set the scope for the service registered subsequently
   *
   * @example
   *
   * ```ts
   * const ScopeA = createScope('a');
   *
   * services.scope(ScopeA).add(XXXService, ...);
   * ```
   */
  scope = (scope: Type<Scope<any>>): this => {
    this.currentScopeStack = [
      ...this.currentScopeStack,
      parseIdentifier(scope).identifierName,
    ];

    this.collection.addFactory<any>(
      scope as any,
      dependenciesToFactory(scope, [] as any),
      { scope: this.currentScopeStack, override: true }
    );

    return this;
  };
}

/**
 * 将依赖项转换为组件工厂函数
 *
 * @param cls - 目标类或工厂函数
 * @param deps - 依赖项数组，默认为空数组
 * @returns 返回一个组件工厂函数，该函数接收FrameworkProvider并返回类实例或工厂函数结果
 *
 * @remarks
 * - 当依赖项是数组形式时，表示需要获取该标识符对应的所有实例
 * - 会自动检测cls是否为构造函数来决定使用new调用还是直接调用
 * - 会将provider作为最后一个参数传递给构造函数或工厂函数
 */
function dependenciesToFactory(
  cls: any,
  deps: any[] = []
): ComponentFactory<any> {
  return (provider: FrameworkProvider) => {
    // 处理依赖项
    const args: any[] = []; // 存储解析后的依赖参数
    for (const dep of deps) {
      let isAll: boolean; // 标记是否需要获取所有匹配实例
      let identifier: any; // 依赖标识符
      // 处理依赖项格式
      if (Array.isArray(dep)) {
        if (dep.length !== 1) {
          throw new Error('Invalid dependency');
        }
        isAll = true;
        identifier = dep[0];
      } else {
        isAll = false;
        identifier = dep;
      }
      // 获取依赖项实例
      if (isAll) {
        args.push(Array.from(provider.getAll(identifier).values()));
      } else {
        args.push(provider.get(identifier));
      }
    }
    // 创建组件实例
    if (isConstructor(cls)) {
      return new cls(...args, provider);
    } else {
      return cls(...args, provider);
    }
  };
}

// a hack to check if a function is a constructor
// https://github.com/zloirock/core-js/blob/232c8462c26c75864b4397b7f643a4f57c6981d5/packages/core-js/internals/is-constructor.js#L15
function isConstructor(cls: any) {
  try {
    Reflect.construct(function () {}, [], cls);
    return true;
  } catch {
    return false;
  }
}
