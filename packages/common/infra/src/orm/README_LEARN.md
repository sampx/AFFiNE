# @toeverything/infra ORM 模块技术备忘录

## 📋 概览

ORM 模块是 @toeverything/infra 的轻量级对象关系映射系统，提供类型安全的数据库操作接口。它采用适配器模式设计，支持多种数据存储后端（内存、Yjs CRDT），特别为协同编辑场景优化。

### 模块信息

- **模块路径**: `packages/common/infra/src/orm/`
- **核心导出**: createORMClient, f, t, YjsDBAdapter, MemoryORMAdapter
- **设计模式**: 适配器模式、Builder 模式、观察者模式

### 文件结构

```
orm/
├── index.ts              # 模块导出入口
└── core/
    ├── index.ts          # 核心模块导出
    ├── types.ts          # 基础类型定义
    ├── schema.ts         # Schema 定义和构建器
    ├── client.ts         # ORM 客户端核心
    ├── table.ts          # Table 操作实现
    ├── adapters/         # 存储适配器
    │   ├── index.ts
    │   ├── types.ts      # 适配器接口定义
    │   ├── memory/       # 内存存储适配器
    │   ├── yjs/          # Yjs CRDT 适配器
    │   └── mixins/       # 通用混入功能
    ├── validators/       # 数据验证器
    │   ├── index.ts
    │   ├── schema.ts     # Schema 验证
    │   ├── data.ts       # 数据验证
    │   ├── yjs.ts        # Yjs 特定验证
    │   └── types.ts
    └── __tests__/        # 单元测试
```

## 🏗️ 核心架构

### 设计理念

ORM 模块基于 **多层适配器架构** 设计，实现了数据访问层的抽象和统一：

- **Schema Layer**: 类型安全的数据结构定义
- **Client Layer**: 统一的 ORM 客户端接口
- **Table Layer**: 表级别的 CRUD 操作封装
- **Adapter Layer**: 多种存储后端的适配实现
- **Validation Layer**: 数据完整性和类型安全保证

### 架构图

<function_calls>
<invoke name="mermaid">
<parameter name="code">graph TB
subgraph "Schema Layer"
A[Field Schema Builder] --> B[Table Schema Builder]
B --> C[DB Schema Builder]
end

    subgraph "Client Layer"
        D[ORMClient] --> E[Dynamic Table Properties]
        E --> F[Hook Management]
    end

    subgraph "Table Layer"
        G[Table Class] --> H[CRUD Operations]
        H --> I[Observable Streams]
        G --> J[Type Inference]
    end

    subgraph "Adapter Layer"
        K[DB Adapter] --> L[Table Adapter]
        L --> M[Memory Adapter]
        L --> N[Yjs Adapter]
    end

    subgraph "Validation Layer"
        O[Schema Validators] --> P[Data Validators]
        P --> Q[Yjs Validators]
    end

    C --> D
    D --> G
    G --> K
    G --> O

    classDef schemaLayer fill:#e1f5fe
    classDef clientLayer fill:#f3e5f5
    classDef tableLayer fill:#e8f5e8
    classDef adapterLayer fill:#fff3e0
    classDef validationLayer fill:#fce4ec

    class A,B,C schemaLayer
    class D,E,F clientLayer
    class G,H,I,J tableLayer
    class K,L,M,N adapterLayer
    class O,P,Q validationLayer

## 🔧 核心类详解

### 1. Schema 系统 - 类型安全的数据结构定义

#### FieldSchemaBuilder - 字段构建器

字段构建器提供链式 API 来定义数据库字段的属性和约束：

```typescript
export class FieldSchemaBuilder<Type = unknown, Optional extends boolean = false, PrimaryKey extends boolean = false> {
  schema: FieldSchema = {
    type: 'string', // 字段类型
    optional: false, // 是否可选
    isPrimaryKey: false, // 是否主键
    default: undefined, // 默认值函数
    values: undefined, // 枚举值（用于 enum 类型）
  };

  // 链式方法
  optional(): FieldSchemaBuilder<Type, true, PrimaryKey>;
  default(value: () => Type): FieldSchemaBuilder<Type, true, PrimaryKey>;
  primaryKey(): FieldSchemaBuilder<Type, Optional, true>;
}
```

#### 字段类型系统

```typescript
export type FieldType = 'string' | 'number' | 'boolean' | 'json' | 'enum';

// 字段构建器工厂
export const f = {
  string: () => new FieldSchemaBuilder<string>('string'),
  number: () => new FieldSchemaBuilder<number>('number'),
  boolean: () => new FieldSchemaBuilder<boolean>('boolean'),
  json: <T = any>() => new FieldSchemaBuilder<T>('json'),
  enum: <T extends string>(...values: T[]) => new FieldSchemaBuilder<T>('enum', values),
} as const;
```

#### 表构建器和文档表支持

```typescript
// 普通表 Schema
type TableSchemaBuilder = Record<string, FieldSchemaBuilder<any, boolean>>;

// 文档表 Schema（支持动态字段）
type DocumentTableSchemaBuilder = TableSchemaBuilder & {
  __document: FieldSchemaBuilder<boolean, true, false>;
};

// 文档表构建器
export const t = {
  document: <T extends TableSchemaBuilder>(schema: T) => {
    return {
      ...schema,
      __document: new FieldSchemaBuilder<boolean>('boolean').optional(),
    };
  },
};
```

#### Schema 定义示例

```typescript
// 用户表 Schema
const userSchema = {
  id: f.string().primaryKey(),
  name: f.string(),
  email: f.string().optional(),
  age: f.number().default(() => 0),
  status: f.enum('active', 'inactive', 'pending'),
  profile: f.json<UserProfile>().optional(),
  createdAt: f.string().default(() => new Date().toISOString()),
};

// 文档表 Schema（支持动态字段）
const documentSchema = t.document({
  id: f.string().primaryKey(),
  title: f.string(),
  content: f.json<BlockSuiteDoc>(),
  tags: f.json<string[]>().optional(),
});

// 数据库 Schema
const dbSchema = {
  users: userSchema,
  documents: documentSchema,
  workspaces: workspaceSchema,
};
```

### 2. ORMClient - 数据库客户端

#### 核心特性

- **动态表属性**: 根据 Schema 自动生成表访问器
- **Hook 系统**: 支持数据操作前后的生命周期钩子
- **类型推导**: 完整的 TypeScript 类型推导支持
- **适配器抽象**: 与具体存储实现解耦

#### 客户端创建和使用

```typescript
// 创建客户端类
const ORMClientClass = createORMClient(dbSchema);
type MyORMClient = InstanceType<typeof ORMClientClass>;

// 实例化客户端
const client = new ORMClientClass(new YjsDBAdapter(dbSchema, docProvider));

// 访问表（自动类型推导）
const usersTable = client.users; // Table<typeof userSchema>
const docsTable = client.documents; // Table<typeof documentSchema>
```

#### Hook 系统

```typescript
// 定义生命周期钩子
ORMClientClass.defineHook('users', 'before-create', async data => {
  // 自动生成 ID
  if (!data.id) {
    data.id = generateUserId();
  }

  // 时间戳处理
  data.createdAt = new Date().toISOString();

  // 数据验证
  if (!isValidEmail(data.email)) {
    throw new Error('Invalid email format');
  }
});

ORMClientClass.defineHook('users', 'after-create', async (input, result) => {
  // 审计日志
  auditLogger.log('user_created', { userId: result.id, input });

  // 发送欢迎邮件
  await sendWelcomeEmail(result.email);
});

// 批量 Hook 处理
ORMClientClass.defineHook('users', 'data-transform', data => {
  // 敏感数据加密
  if (data.password) {
    data.password = bcrypt.hash(data.password);
  }
  return data;
});
```

#### 内部实现机制

```typescript
export class ORMClient {
  static hooksMap: Map<string, Hook<any>[]> = new Map();
  readonly tables = new Map<string, Table<any>>();

  constructor(
    protected readonly db: DBSchemaBuilder,
    protected readonly adapter: DBAdapter
  ) {
    // 动态创建表属性
    Object.entries(db).forEach(([tableName, tableSchema]) => {
      Object.defineProperty(this, tableName, {
        get: () => {
          let table = this.tables.get(tableName);
          if (!table) {
            table = new Table(this.adapter, tableName, {
              schema: tableSchema,
              hooks: ORMClient.hooksMap.get(tableName),
            });
            this.tables.set(tableName, table);
          }
          return table;
        },
      });
    });
  }
}
```

### 3. Table - 表操作核心

#### 高级类型推导系统

Table 类通过复杂的 TypeScript 类型推导，确保完全的类型安全：

```typescript
// 提取必需字段
type RequiredFields<T extends TableSchemaBuilder> = {
  [K in TableDefinedFieldNames<T> as T[K] extends FieldSchemaBuilder<any, infer Optional> ? (Optional extends false ? K : never) : never]: Typeof<T[K]>;
};

// 提取可选字段
type OptionalFields<T extends TableSchemaBuilder> = {
  [K in TableDefinedFieldNames<T> as T[K] extends FieldSchemaBuilder<any, infer Optional> ? (Optional extends true ? K : never) : never]?: Typeof<T[K]> | null;
};

// 提取主键字段
type PrimaryKeyField<T extends TableSchemaBuilder> = {
  [K in TableDefinedFieldNames<T>]: T[K] extends FieldSchemaBuilder<any, any, infer PrimaryKey> ? (PrimaryKey extends true ? K : never) : never;
}[TableDefinedFieldNames<T>];

// 最终实体类型
export type Entity<T extends TableSchemaBuilder> = Pretty<MaybeDocumentEntityWrapper<T, TableDefinedEntity<T>>>;
```

#### CRUD 操作接口

```typescript
export class Table<T extends TableSchemaBuilder> {
  // 创建记录
  create(input: CreateEntityInput<T>): Entity<T>;

  // 更新记录
  update(key: PrimaryKeyFieldType<T>, input: UpdateEntityInput<T>): Entity<T> | null;

  // 获取单条记录
  get(key: PrimaryKeyFieldType<T>): Entity<T> | null;

  // 响应式获取（Observable）
  get$(key: PrimaryKeyFieldType<T>): Observable<Entity<T> | null>;

  // 查询多条记录
  find(where?: FindEntityInput<T>): Entity<T>[];

  // 响应式查询
  find$(where?: FindEntityInput<T>): Observable<Entity<T>[]>;

  // 字段选择查询
  select<Key extends keyof Entity<T>>(selectKey: Key, where?: FindEntityInput<T>): Pick<Entity<T>, Key | PrimaryKeyField<T>>[];

  // 响应式字段选择
  select$<Key extends keyof Entity<T>>(selectKey: Key, where?: FindEntityInput<T>): Observable<Pick<Entity<T>, Key | PrimaryKeyField<T>>[]>;

  // 获取所有主键
  keys(): PrimaryKeyFieldType<T>[];
  keys$(): Observable<PrimaryKeyFieldType<T>[]>;

  // 删除记录
  delete(key: PrimaryKeyFieldType<T>): void;
}
```

#### 基本使用示例

```typescript
// 创建用户
const newUser = usersTable.create({
  id: 'user-1',
  name: 'Alice',
  email: 'alice@example.com',
  age: 30,
  status: 'active',
});

// 更新用户
const updatedUser = usersTable.update('user-1', {
  name: 'Alice Smith',
  age: 31,
});

// 查询用户
const user = usersTable.get('user-1');
const activeUsers = usersTable.find({ status: 'active' });

// 响应式查询
usersTable.get$('user-1').subscribe(user => {
  console.log('用户变化:', user);
});

// 字段选择查询
const userNames = usersTable.select('name', { status: 'active' });
// 返回: [{ id: 'user-1', name: 'Alice' }, ...]
```

#### 高级查询条件

```typescript
// 查询条件类型
export type FindEntityInput<T extends TableSchemaBuilder> = {
  [key in TableDefinedFieldNames<T>]?:
    | TableDefinedEntity<T>[key] // 精确匹配
    | { not: TableDefinedEntity<T>[key] } // 不等于
    | null; // 空值查询
};

// 使用示例
const results = usersTable.find({
  status: 'active', // status = 'active'
  age: { not: null }, // age IS NOT NULL
  email: null, // email IS NULL
});
```

#### Observable 响应式特性

```typescript
// 缓存和共享 Observable
private readonly subscribedKeys: Map<Key, Observable<any>> = new Map();

get$(key: PrimaryKeyFieldType<T>): Observable<Entity<T> | null> {
  let ob$ = this.subscribedKeys.get(key);

  if (!ob$) {
    ob$ = new Observable<Entity<T>>(subscriber => {
      const unsubscribe = this.adapter.observe({
        where: { byKey: key },
        callback: ([data]) => subscriber.next(data || null),
      });

      return () => {
        unsubscribe();
        this.subscribedKeys.delete(key);
      };
    }).pipe(
      shareReplay({
        refCount: true,    // 引用计数，无订阅者时自动清理
        bufferSize: 1,     // 缓存最新值
      })
    );

    this.subscribedKeys.set(key, ob$);
  }

  return ob$;
}
```

### 4. 适配器系统 - 多后端存储支持

#### 适配器接口定义

```typescript
// 数据库适配器接口
export interface DBAdapter {
  table(tableName: string): TableAdapter;
}

// 表适配器接口
export interface TableAdapter {
  setup(opts: TableAdapterOptions): void;
  dispose(): void;

  // 数据转换
  toObject(record: any): Record<string, any>;

  // CRUD 操作
  insert(query: InsertQuery): any;
  update(query: UpdateQuery): any[];
  delete(query: DeleteQuery): void;
  find(query: FindQuery): any[];
  observe(query: ObserveQuery): () => void; // 返回取消订阅函数
}
```

#### 查询类型系统

```typescript
// 条件查询
type WhereSimpleCondition = {
  field: string;
  value: OrmPrimitiveValues | { not: OrmPrimitiveValues };
};

type WhereByKeyCondition = {
  byKey: Key;
};

export type WhereCondition = Array<WhereSimpleCondition> | WhereByKeyCondition;

// 字段选择
export type Select = '*' | 'key' | string[];

// 查询类型
export type FindQuery = {
  where?: WhereCondition;
  select?: Select;
};

export type ObserveQuery = {
  where?: WhereCondition;
  select?: Select;
  callback: (data: any[]) => void;
};
```

#### YjsDBAdapter - CRDT 协同存储

专为协同编辑优化的 Yjs 适配器：

```typescript
export class YjsDBAdapter implements DBAdapter {
  tables: Map<string, TableAdapter> = new Map();

  constructor(
    db: DBSchemaBuilder,
    private readonly provider: DocProvider // 文档提供者
  ) {
    for (const [tableName, table] of Object.entries(db)) {
      validators.validateYjsTableSchema(tableName, table);
      const doc = this.provider.getDoc(tableName); // 每个表一个 YDoc
      this.tables.set(tableName, new YjsTableAdapter(tableName, doc));
    }
  }
}
```

#### YjsTableAdapter 实现细节

```typescript
/**
 * Yjs 表适配器数据结构：
 *
 * Table(YDoc)
 *   Key(string): Row(YMap)({
 *     FieldA(string): Value(Primitive)
 *     FieldB(string): Value(Primitive)
 *     $$DELETED: boolean  // 软删除标记
 *   })
 */
@HookAdapter()
export class YjsTableAdapter implements TableAdapter {
  private readonly deleteFlagKey = '$$DELETED';
  private readonly origin = 'YjsTableAdapter';

  // 插入数据
  insert(query: InsertQuery) {
    const { data } = query;
    const key = data[this.keyField];
    const record = this.doc.getMap(key.toString());

    this.doc.transact(() => {
      for (const key in data) {
        if (data[key] !== undefined) {
          record.set(key, data[key]);
        }
      }
      record.delete(this.deleteFlagKey); // 清除删除标记
    }, this.origin);

    return this.value(record, query.select);
  }

  // 观察数据变化
  observe(query: ObserveQuery) {
    const { where, select, callback } = query;
    const results = new Map<string, any>();

    // 初始数据填充
    for (const record of this.iterate(where)) {
      results.set(this.keyof(record), this.value(record, select));
    }
    callback(Array.from(results.values()));

    // 监听变化
    const ob = (tx: Transaction) => {
      let hasChanged = false;

      for (const [ty] of tx.changed) {
        const record = ty;
        const key = this.keyof(record);
        const isMatch = this.match(record, where) && !this.isDeleted(record);
        const prevMatch = results.get(key);
        const isPrevMatched = results.has(key);

        if (isMatch && isPrevMatched) {
          // 更新现有记录
          const newValue = this.value(record, select);
          if (!shallowEqual(prevMatch, newValue)) {
            results.set(key, newValue);
            hasChanged = true;
          }
        } else if (isMatch && !isPrevMatched) {
          // 新增记录
          results.set(key, this.value(record, select));
          hasChanged = true;
        } else if (!isMatch && isPrevMatched) {
          // 删除记录
          results.delete(key);
          hasChanged = true;
        }
      }

      if (hasChanged) {
        callback(Array.from(results.values()));
      }
    };

    this.doc.on('afterTransaction', ob);
    return () => this.doc.off('afterTransaction', ob);
  }

  // 软删除实现
  private deleteTy(ty: AbstractType<any>) {
    this.fields.forEach(field => {
      if (field !== this.keyField) {
        YMap.prototype.delete.call(ty, field);
      }
    });
    YMap.prototype.set.call(ty, this.deleteFlagKey, true);
  }
}
```

#### MemoryORMAdapter - 内存存储

轻量级的内存存储适配器，适用于测试和临时数据：

```typescript
export class MemoryORMAdapter implements DBAdapter {
  table(tableName: string) {
    return new MemoryTableAdapter(tableName);
  }
}

export class MemoryTableAdapter implements TableAdapter {
  private data: Map<string, any> = new Map();
  private observers: Set<Function> = new Set();

  insert(query: InsertQuery) {
    const { data } = query;
    const key = data[this.keyField];
    this.data.set(key, { ...data });
    this.notifyObservers();
    return data;
  }

  // 简单的观察者模式实现
  observe(query: ObserveQuery) {
    const { callback } = query;
    const observer = () => {
      const results = this.find({ where: query.where, select: query.select });
      callback(results);
    };

    this.observers.add(observer);
    observer(); // 立即调用一次

    return () => this.observers.delete(observer);
  }

  private notifyObservers() {
    this.observers.forEach(observer => observer());
  }
}
```

### 5. 验证系统 - 数据完整性保证

#### 验证器架构

```typescript
interface ValidationError {
  code: string;
  error: Error;
}

// 验证器接口
interface Validator {
  validate(...args: any[]): void;
}

// 验证函数工厂
function use<Validator extends { validate: (...args: any[]) => void }>(rules: Record<string, Validator>) {
  return (...payload: Parameters<Validator['validate']>) => {
    const errors: ValidationError[] = [];

    for (const [code, validator] of Object.entries(rules)) {
      try {
        validator.validate(...payload);
      } catch (e) {
        errors.push({ code, error: e as Error });
      }
    }

    if (errors.length) {
      const message = errors.map(({ code, error }) => `${code}: ${error.message}`).join('\n');
      throw new Error('Validation Failed Error\n' + message);
    }
  };
}
```

#### Schema 验证器

```typescript
const tableSchemaValidators = {
  // 主键唯一性验证
  'unique-primary-key': {
    validate(tableName: string, schema: TableSchemaBuilder) {
      const primaryKeys = Object.entries(schema).filter(([_, field]) => field.schema.isPrimaryKey);

      if (primaryKeys.length === 0) {
        throw new Error(`Table '${tableName}' must have a primary key`);
      }

      if (primaryKeys.length > 1) {
        throw new Error(`Table '${tableName}' can only have one primary key`);
      }
    },
  },

  // 字段名称验证
  'valid-field-names': {
    validate(tableName: string, schema: TableSchemaBuilder) {
      for (const fieldName of Object.keys(schema)) {
        if (fieldName.startsWith('__') && fieldName !== '__document') {
          throw new Error(`Invalid field name '${fieldName}' in table '${tableName}'`);
        }
      }
    },
  },
};
```

#### 数据验证器

```typescript
const createEntityDataValidators = {
  // 必需字段验证
  'required-fields': {
    validate<T extends TableSchemaBuilder>(table: Table<T>, data: any) {
      for (const [fieldName, fieldSchema] of Object.entries(table.schema)) {
        if (!fieldSchema.optional && data[fieldName] === undefined) {
          throw new Error(`Required field '${fieldName}' is missing`);
        }
      }
    },
  },

  // 类型验证
  'field-types': {
    validate<T extends TableSchemaBuilder>(table: Table<T>, data: any) {
      for (const [fieldName, value] of Object.entries(data)) {
        const fieldSchema = table.schema[fieldName];
        if (!fieldSchema) continue;

        if (!validateFieldType(value, fieldSchema.type)) {
          throw new Error(`Invalid type for field '${fieldName}', expected ${fieldSchema.type}`);
        }
      }
    },
  },
};
```

#### Yjs 特定验证器

```typescript
const yjsDataValidators = {
  // Yjs 兼容性验证
  'yjs-compatible-data': {
    validate(tableName: string, data: any) {
      for (const [key, value] of Object.entries(data)) {
        if (!isYjsCompatible(value)) {
          throw new Error(`Field '${key}' contains non-serializable data for Yjs`);
        }
      }
    },
  },
};

function isYjsCompatible(value: any): boolean {
  // Yjs 支持的数据类型：string, number, boolean, null, Array, Object
  return value == null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || Array.isArray(value) || (typeof value === 'object' && value.constructor === Object);
}
```

## 🎯 使用场景与实战案例

### 1. 协同文档编辑系统

```typescript
// 文档管理 Schema
const documentSchema = t.document({
  id: f.string().primaryKey(),
  title: f.string(),
  content: f.json<Y.Doc>(),
  ownerId: f.string(),
  collaborators: f.json<string[]>().default(() => []),
  metadata: f.json<DocumentMetadata>().optional(),
  createdAt: f.string().default(() => new Date().toISOString()),
  updatedAt: f.string().default(() => new Date().toISOString()),
});

const workspaceSchema = {
  id: f.string().primaryKey(),
  name: f.string(),
  description: f.string().optional(),
  members: f.json<WorkspaceMember[]>().default(() => []),
  settings: f.json<WorkspaceSettings>().default(() => defaultSettings()),
};

const dbSchema = {
  documents: documentSchema,
  workspaces: workspaceSchema,
};

// 创建协同 ORM 客户端
const ORMClientClass = createORMClient(dbSchema);

// Yjs 文档提供者
class CollaborativeDocProvider implements DocProvider {
  private docs = new Map<string, Y.Doc>();

  getDoc(guid: string): Y.Doc {
    if (!this.docs.has(guid)) {
      const doc = new Y.Doc({ guid });
      // 连接到协同服务器
      this.connectToSync(doc, guid);
      this.docs.set(guid, doc);
    }
    return this.docs.get(guid)!;
  }

  private connectToSync(doc: Y.Doc, guid: string) {
    // WebSocket 或 WebRTC 连接实现
    const wsProvider = new WebsocketProvider('ws://localhost:8080', guid, doc);
    const indexeddbProvider = new IndexeddbPersistence(guid, doc);
  }
}

// 实例化客户端
const client = new ORMClientClass(new YjsDBAdapter(dbSchema, new CollaborativeDocProvider()));

// 生命周期钩子
ORMClientClass.defineHook('documents', 'before-create', data => {
  data.id = data.id || generateDocumentId();
  data.createdAt = new Date().toISOString();
  data.updatedAt = data.createdAt;
});

ORMClientClass.defineHook('documents', 'before-update', data => {
  data.updatedAt = new Date().toISOString();
});

// 使用示例
async function createDocument(workspaceId: string, initialData: any) {
  const document = client.documents.create({
    title: 'Untitled Document',
    content: new Y.Doc(),
    ownerId: getCurrentUserId(),
    collaborators: [],
    ...initialData,
  });

  // 实时监听文档变化
  client.documents.get$(document.id).subscribe(doc => {
    if (doc) {
      updateUI(doc);
      broadcastChange(doc);
    }
  });

  return document;
}

// 协作者管理
function addCollaborator(documentId: string, userId: string) {
  const doc = client.documents.get(documentId);
  if (doc && !doc.collaborators.includes(userId)) {
    client.documents.update(documentId, {
      collaborators: [...doc.collaborators, userId],
    });
  }
}

// 实时查询所有文档
client.documents.find$({ ownerId: getCurrentUserId() }).subscribe(docs => {
  renderDocumentList(docs);
});
```

### 2. 用户管理和权限系统

```typescript
// 用户权限 Schema
const userSchema = {
  id: f.string().primaryKey(),
  username: f.string(),
  email: f.string(),
  avatar: f.string().optional(),
  role: f.enum('admin', 'editor', 'viewer'),
  permissions: f.json<Permission[]>().default(() => []),
  profile: f.json<UserProfile>().optional(),
  lastLoginAt: f.string().optional(),
  isActive: f.boolean().default(() => true),
  createdAt: f.string().default(() => new Date().toISOString()),
};

const sessionSchema = {
  id: f.string().primaryKey(),
  userId: f.string(),
  token: f.string(),
  expiresAt: f.string(),
  ipAddress: f.string().optional(),
  userAgent: f.string().optional(),
  createdAt: f.string().default(() => new Date().toISOString()),
};

const auditLogSchema = {
  id: f.string().primaryKey(),
  userId: f.string().optional(),
  action: f.string(),
  resource: f.string().optional(),
  metadata: f.json<Record<string, any>>().optional(),
  timestamp: f.string().default(() => new Date().toISOString()),
};

const authDbSchema = {
  users: userSchema,
  sessions: sessionSchema,
  auditLogs: auditLogSchema,
};

// 权限管理 ORM
const AuthORMClass = createORMClient(authDbSchema);

// 审计日志 Hook
AuthORMClass.defineHook('users', 'after-create', (input, result) => {
  auditClient.auditLogs.create({
    userId: result.id,
    action: 'user_created',
    metadata: { input: sanitizeInput(input) },
  });
});

AuthORMClass.defineHook('users', 'after-update', (input, result) => {
  auditClient.auditLogs.create({
    userId: result.id,
    action: 'user_updated',
    metadata: { changes: input },
  });
});

// 使用示例
const authClient = new AuthORMClass(new MemoryORMAdapter());

// 用户认证服务
class AuthService {
  async createUser(userData: CreateUserInput) {
    // 密码加密等预处理在 Hook 中完成
    return authClient.users.create({
      username: userData.username,
      email: userData.email,
      role: userData.role || 'viewer',
      permissions: getDefaultPermissions(userData.role),
    });
  }

  async authenticateUser(email: string, password: string) {
    const user = authClient.users.find({ email })[0];
    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    if (!(await verifyPassword(password, user.passwordHash))) {
      throw new Error('Invalid credentials');
    }

    // 创建会话
    const session = authClient.sessions.create({
      userId: user.id,
      token: generateJWT(user),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // 更新最后登录时间
    authClient.users.update(user.id, {
      lastLoginAt: new Date().toISOString(),
    });

    return { user, session };
  }

  // 实时活跃用户监控
  getActiveUsers$() {
    return authClient.users.find$({ isActive: true }).pipe(
      map(users =>
        users.filter(
          user => user.lastLoginAt && Date.now() - new Date(user.lastLoginAt).getTime() < 30 * 60 * 1000 // 30分钟内
        )
      )
    );
  }

  // 权限检查
  checkPermission(userId: string, resource: string, action: string): boolean {
    const user = authClient.users.get(userId);
    if (!user) return false;

    return user.permissions.some(permission => permission.resource === resource && permission.actions.includes(action));
  }
}
```

### 3. 配置管理和设置存储

```typescript
// 应用配置 Schema
const configSchema = {
  key: f.string().primaryKey(),
  value: f.json<any>(),
  type: f.enum('system', 'user', 'workspace'),
  scope: f.string().optional(), // 作用域 ID（用户ID/工作区ID）
  description: f.string().optional(),
  updatedAt: f.string().default(() => new Date().toISOString()),
  updatedBy: f.string().optional(),
};

const configDbSchema = {
  configs: configSchema,
};

// 配置管理器
class ConfigManager {
  private client: InstanceType<typeof ConfigORMClass>;

  constructor(adapter: DBAdapter) {
    const ConfigORMClass = createORMClient(configDbSchema);
    this.client = new ConfigORMClass(adapter);
  }

  // 设置系统配置
  setSystemConfig<T>(key: string, value: T, description?: string) {
    return this.client.configs.create({
      key: `system:${key}`,
      value,
      type: 'system',
      description,
      updatedBy: 'system',
    });
  }

  // 设置用户配置
  setUserConfig<T>(userId: string, key: string, value: T) {
    const configKey = `user:${userId}:${key}`;
    const existing = this.client.configs.get(configKey);

    if (existing) {
      return this.client.configs.update(configKey, {
        value,
        updatedBy: userId,
      });
    } else {
      return this.client.configs.create({
        key: configKey,
        value,
        type: 'user',
        scope: userId,
        updatedBy: userId,
      });
    }
  }

  // 获取配置（带继承）
  getConfig<T>(key: string, userId?: string, workspaceId?: string): T | null {
    // 配置优先级：用户 > 工作区 > 系统
    const candidates = [userId && `user:${userId}:${key}`, workspaceId && `workspace:${workspaceId}:${key}`, `system:${key}`].filter(Boolean);

    for (const candidateKey of candidates) {
      const config = this.client.configs.get(candidateKey!);
      if (config) {
        return config.value;
      }
    }

    return null;
  }

  // 监听配置变化
  watchConfig$<T>(key: string, userId?: string, workspaceId?: string): Observable<T | null> {
    const candidates = [userId && `user:${userId}:${key}`, workspaceId && `workspace:${workspaceId}:${key}`, `system:${key}`].filter(Boolean);

    return combineLatest(candidates.map(candidateKey => this.client.configs.get$(candidateKey!).pipe(startWith(null)))).pipe(
      map(configs => {
        for (const config of configs) {
          if (config) return config.value;
        }
        return null;
      }),
      distinctUntilChanged()
    );
  }

  // 批量配置更新
  updateConfigs(updates: Array<{ key: string; value: any; scope?: string }>) {
    updates.forEach(({ key, value, scope }) => {
      if (scope) {
        this.setUserConfig(scope, key, value);
      } else {
        this.setSystemConfig(key, value);
      }
    });
  }

  // 获取作用域下的所有配置
  getScopeConfigs(type: 'system' | 'user' | 'workspace', scope?: string) {
    return this.client.configs.find({ type, scope });
  }
}

// 使用示例
const configManager = new ConfigManager(new YjsDBAdapter(configDbSchema, docProvider));

// 系统配置
configManager.setSystemConfig('app.theme', 'dark', '应用主题');
configManager.setSystemConfig('app.language', 'zh-CN', '默认语言');

// 用户偏好
configManager.setUserConfig('user-123', 'editor.fontSize', 14);
configManager.setUserConfig('user-123', 'editor.tabSize', 2);

// 响应式配置
configManager.watchConfig$('app.theme', 'user-123').subscribe(theme => {
  applyTheme(theme || 'light');
});

// 配置面板实现
function createConfigPanel(userId: string) {
  const userConfigs$ = configManager.client.configs.find$({
    type: 'user',
    scope: userId,
  });

  userConfigs$.subscribe(configs => {
    renderConfigForm(configs);
  });
}
```

## 🚀 最佳实践

### 1. Schema 设计原则

```typescript
// ✅ 好的 Schema 设计
const goodUserSchema = {
  // 明确的主键
  id: f.string().primaryKey(),

  // 必需字段放在前面
  username: f.string(),
  email: f.string(),

  // 可选字段有明确的默认值
  role: f.enum('admin', 'editor', 'viewer').default(() => 'viewer'),
  isActive: f.boolean().default(() => true),

  // 复杂数据使用 JSON 类型
  profile: f.json<UserProfile>().optional(),
  permissions: f.json<Permission[]>().default(() => []),

  // 时间戳字段
  createdAt: f.string().default(() => new Date().toISOString()),
  updatedAt: f.string().default(() => new Date().toISOString()),
};

// ❌ 避免的 Schema 设计
const badUserSchema = {
  // 没有主键
  username: f.string(),

  // 过于宽泛的类型
  data: f.json(), // 应该指定具体类型

  // 没有默认值的可选字段
  createdAt: f.string().optional(), // 时间戳应该有默认值
};
```

### 2. Hook 使用策略

```typescript
// 数据预处理 Hook
ORMClientClass.defineHook('users', 'before-create', data => {
  // ID 生成
  if (!data.id) {
    data.id = generateId();
  }

  // 数据规范化
  if (data.email) {
    data.email = data.email.toLowerCase().trim();
  }

  // 时间戳
  const now = new Date().toISOString();
  data.createdAt = now;
  data.updatedAt = now;
});

// 数据验证 Hook
ORMClientClass.defineHook('users', 'before-create', data => {
  if (!isValidEmail(data.email)) {
    throw new Error('Invalid email format');
  }

  if (data.username && data.username.length < 3) {
    throw new Error('Username must be at least 3 characters');
  }
});

// 副作用处理 Hook
ORMClientClass.defineHook('users', 'after-create', async (input, result) => {
  // 异步操作不应阻塞主流程
  Promise.resolve()
    .then(async () => {
      await sendWelcomeEmail(result.email);
      await createUserProfile(result.id);
      await logUserRegistration(result);
    })
    .catch(console.error);
});
```

### 3. 查询优化技巧

```typescript
// ✅ 高效的查询模式
class UserService {
  // 缓存常用查询
  private activeUsersCache$ = this.client.users.find$({ isActive: true }).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  // 字段选择优化
  getUserList() {
    return this.client.users.select('username', { isActive: true });
  }

  // 组合查询优化
  getUserWithProfile$(userId: string) {
    return combineLatest([this.client.users.get$(userId), this.client.profiles.get$(userId)]).pipe(map(([user, profile]) => (user ? { ...user, profile } : null)));
  }

  // 分页查询模拟
  getUsersPaginated(page: number, pageSize: number = 20) {
    const users = this.client.users.find({ isActive: true });
    const start = page * pageSize;
    const end = start + pageSize;

    return {
      data: users.slice(start, end),
      total: users.length,
      page,
      pageSize,
      hasNext: end < users.length,
    };
  }
}

// ❌ 避免的查询反模式
class BadUserService {
  // 重复创建 Observable
  getUser(id: string) {
    return this.client.users.get$(id); // 每次调用都创建新的 Observable
  }

  // 过度查询
  getUsernames() {
    return this.client.users.find().map(user => user.username); // 获取了完整对象
  }

  // 阻塞操作
  async getUsers() {
    const users = [];
    const keys = this.client.users.keys();
    for (const key of keys) {
      users.push(this.client.users.get(key)); // 串行查询
    }
    return users;
  }
}
```

### 4. 错误处理和恢复

```typescript
// 错误处理包装器
class RobustORMClient {
  constructor(private client: ORMClient) {}

  async safeCreate<T>(table: Table<any>, data: any, fallback?: () => T): Promise<T | null> {
    try {
      return table.create(data);
    } catch (error) {
      console.error('Create failed:', error);

      if (fallback) {
        return fallback();
      }

      return null;
    }
  }

  async safeUpdate<T>(table: Table<any>, key: any, data: any, retries: number = 3): Promise<T | null> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return table.update(key, data);
      } catch (error) {
        console.error(`Update attempt ${attempt + 1} failed:`, error);

        if (attempt === retries - 1) {
          throw error;
        }

        // 指数退避
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    return null;
  }

  // 批量操作错误处理
  async batchCreate<T>(table: Table<any>, items: any[], onError?: (error: Error, item: any, index: number) => void): Promise<T[]> {
    const results: T[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const result = table.create(items[i]);
        results.push(result);
      } catch (error) {
        if (onError) {
          onError(error as Error, items[i], i);
        } else {
          console.error(`Batch create failed at index ${i}:`, error);
        }
      }
    }

    return results;
  }
}
```

### 5. 性能监控和调试

```typescript
// 性能监控装饰器
function withMetrics<T extends Table<any>>(table: T): T {
  const metrics = {
    createCount: 0,
    updateCount: 0,
    queryCount: 0,
    totalTime: 0,
  };

  return new Proxy(table, {
    get(target, prop) {
      const originalMethod = target[prop as keyof T];

      if (typeof originalMethod === 'function') {
        return function (...args: any[]) {
          const startTime = performance.now();

          try {
            const result = originalMethod.apply(target, args);

            // 更新指标
            if (prop === 'create') metrics.createCount++;
            else if (prop === 'update') metrics.updateCount++;
            else if (prop === 'find' || prop === 'get') metrics.queryCount++;

            const duration = performance.now() - startTime;
            metrics.totalTime += duration;

            console.debug(`${target.name}.${String(prop)} took ${duration.toFixed(2)}ms`);

            return result;
          } catch (error) {
            console.error(`${target.name}.${String(prop)} failed:`, error);
            throw error;
          }
        };
      }

      return originalMethod;
    },
  });
}

// 使用示例
const monitoredUsersTable = withMetrics(client.users);

// 调试工具
class ORMDebugger {
  static logSchema(client: ORMClient) {
    console.group('ORM Schema');
    for (const [tableName, table] of client.tables) {
      console.group(`Table: ${tableName}`);
      console.log('Schema:', table.schema);
      console.log('Key Field:', table.keyField);
      console.log('Is Document Table:', table.isDocumentTable);
      console.groupEnd();
    }
    console.groupEnd();
  }

  static async analyzeTable<T>(table: Table<T>) {
    const keys = table.keys();
    const sampleData = keys.slice(0, 5).map(key => table.get(key));

    console.group(`Table Analysis: ${table.name}`);
    console.log('Total Records:', keys.length);
    console.log('Sample Data:', sampleData);
    console.log('Schema:', table.schema);
    console.groupEnd();
  }
}
```

## 📝 注意事项和限制

### 1. Yjs 适配器限制

- 只支持可序列化的数据类型
- 不支持 Symbol、Function、Class 实例等
- 大型对象可能影响同步性能
- 删除操作是软删除，需要定期清理

### 2. 类型系统限制

- 复杂的嵌套泛型可能导致编译性能问题
- 某些边界情况下类型推导可能不准确
- Document 表的动态字段缺少类型检查

### 3. 性能考虑

- Observable 缓存需要手动管理生命周期
- 大量并发操作可能导致内存泄漏
- Yjs 文档过大时同步性能下降

### 4. 并发安全

- 内存适配器不是线程安全的
- Yjs 适配器的事务隔离有限
- 需要应用级别的并发控制

---

_最后更新: 2024年12月_
