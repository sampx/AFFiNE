export * from './indexer/document';
export * from './indexer/field-type';
export * from './indexer/query';
export * from './indexer/schema';

import type { Observable } from 'rxjs';

import type { Connection } from '../connection';
import type { IndexerDocument } from './indexer/document';
import type { Query } from './indexer/query';
import type { IndexerSchema } from './indexer/schema';
import type { Storage } from './storage';

export interface IndexerStorage extends Storage {
  readonly storageType: 'indexer';
  readonly isReadonly: boolean;

  /**
   * 在指定表中搜索符合查询条件的记录
   * @typeParam T - 索引模式的键类型
   * @typeParam O - 搜索选项类型，受T约束
   * @param table - 要搜索的表名称
   * @param query - 查询条件对象
   * @param options - 可选的搜索选项
   * @returns 包含搜索结果的Promise对象
   */
  search<T extends keyof IndexerSchema, const O extends SearchOptions<T>>(
    table: T,
    query: Query<T>,
    options?: O
  ): Promise<SearchResult<T, O>>;

  /**
   * 在指定表中对符合查询条件的记录进行聚合计算
   * @typeParam T - 索引模式的键类型
   * @typeParam O - 聚合选项类型，受T约束
   * @param table - 要聚合的表名称
   * @param query - 查询条件对象
   * @param field - 要聚合的字段名称
   * @param options - 可选的聚合选项
   * @returns 包含聚合结果的Promise对象
   */
  aggregate<T extends keyof IndexerSchema, const O extends AggregateOptions<T>>(
    table: T,
    query: Query<T>,
    field: keyof IndexerSchema[T],
    options?: O
  ): Promise<AggregateResult<T, O>>;

  /**
   * 订阅指定表中符合查询条件的记录的搜索结果
   * @typeParam T - 索引模式的键类型
   * @typeParam O - 搜索选项类型，受T约束
   * @param table - 要搜索的表名称
   * @param query - 查询条件对象
   * @param options - 可选的搜索选项
   * @returns 包含搜索结果的Observable对象
   */
  search$<T extends keyof IndexerSchema, const O extends SearchOptions<T>>(
    table: T,
    query: Query<T>,
    options?: O
  ): Observable<SearchResult<T, O>>;

  aggregate$<
    T extends keyof IndexerSchema,
    const O extends AggregateOptions<T>,
  >(
    table: T,
    query: Query<T>,
    field: keyof IndexerSchema[T],
    options?: O
  ): Observable<AggregateResult<T, O>>;

  deleteByQuery<T extends keyof IndexerSchema>(
    table: T,
    query: Query<T>
  ): Promise<void>;

  insert<T extends keyof IndexerSchema>(
    table: T,
    document: IndexerDocument<T>
  ): Promise<void>;

  delete<T extends keyof IndexerSchema>(table: T, id: string): Promise<void>;

  update<T extends keyof IndexerSchema>(
    table: T,
    document: IndexerDocument<T>
  ): Promise<void>;

  refresh<T extends keyof IndexerSchema>(table: T): Promise<void>;
}

type ResultPagination = {
  count: number;
  limit: number;
  skip: number;
  hasMore: boolean;
};

type PaginationOption = { limit?: number; skip?: number };

type HighlightAbleField<T extends keyof IndexerSchema> = {
  [K in keyof IndexerSchema[T]]: IndexerSchema[T][K] extends 'FullText'
    ? K
    : never;
}[keyof IndexerSchema[T]];

export type SearchOptions<T extends keyof IndexerSchema> = {
  pagination?: PaginationOption;
  highlights?: { field: HighlightAbleField<T>; before: string; end: string }[];
  fields?: (keyof IndexerSchema[T])[];
};

/**
 * Represents the result of a search operation.
 * @template T - The type of key in IndexerSchema
 * @template O - The search options type extending SearchOptions<T>
 * @property {ResultPagination} pagination - Pagination information for the search results
 * @property {Array} nodes - Array of search result nodes
 * @property {string} nodes[].id - Unique identifier for each result node
 * @property {number} nodes[].score - Relevance score of the search result
 * @property {Object} [nodes[].fields] - Optional field values when O['fields'] is specified
 * @property {Object} [nodes[].highlights] - Optional highlight snippets when O['highlights'] is specified
 */
export type SearchResult<
  T extends keyof IndexerSchema,
  O extends SearchOptions<T>,
> = {
  pagination: ResultPagination;
  nodes: ({ id: string; score: number } & (O['fields'] extends any[]
    ? { fields: { [key in O['fields'][number]]: string | string[] } }
    : unknown) &
    (O['highlights'] extends any[]
      ? { highlights: { [key in O['highlights'][number]['field']]: string[] } }
      : unknown))[];
};

export interface AggregateOptions<T extends keyof IndexerSchema> {
  pagination?: PaginationOption;
  hits?: SearchOptions<T>;
}

export type AggregateResult<
  T extends keyof IndexerSchema,
  O extends AggregateOptions<T>,
> = {
  pagination: ResultPagination;
  buckets: ({
    key: string;
    score: number;
    count: number;
  } & (O['hits'] extends object
    ? { hits: SearchResult<T, O['hits']> }
    : unknown))[];
};

export abstract class IndexerStorageBase implements IndexerStorage {
  readonly storageType = 'indexer';
  abstract readonly connection: Connection;
  abstract readonly isReadonly: boolean;

  abstract search<
    T extends keyof IndexerSchema,
    const O extends SearchOptions<T>,
  >(table: T, query: Query<T>, options?: O): Promise<SearchResult<T, O>>;

  abstract aggregate<
    T extends keyof IndexerSchema,
    const O extends AggregateOptions<T>,
  >(
    table: T,
    query: Query<T>,
    field: keyof IndexerSchema[T],
    options?: O
  ): Promise<AggregateResult<T, O>>;

  abstract search$<
    T extends keyof IndexerSchema,
    const O extends SearchOptions<T>,
  >(table: T, query: Query<T>, options?: O): Observable<SearchResult<T, O>>;

  abstract aggregate$<
    T extends keyof IndexerSchema,
    const O extends AggregateOptions<T>,
  >(
    table: T,
    query: Query<T>,
    field: keyof IndexerSchema[T],
    options?: O
  ): Observable<AggregateResult<T, O>>;

  abstract deleteByQuery<T extends keyof IndexerSchema>(
    table: T,
    query: Query<T>
  ): Promise<void>;

  abstract insert<T extends keyof IndexerSchema>(
    table: T,
    document: IndexerDocument<T>
  ): Promise<void>;

  abstract delete<T extends keyof IndexerSchema>(
    table: T,
    id: string
  ): Promise<void>;

  abstract update<T extends keyof IndexerSchema>(
    table: T,
    document: IndexerDocument<T>
  ): Promise<void>;

  abstract refresh<T extends keyof IndexerSchema>(table: T): Promise<void>;
}
