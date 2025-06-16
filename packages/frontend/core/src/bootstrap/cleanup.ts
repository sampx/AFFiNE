/**
 * 清理未使用的IndexedDB数据库
 *
 * 该函数会删除特定模式的IndexedDB数据库，包括：
 * - 以":server-clock"结尾的服务器时钟数据库
 * - 以":sync-metadata"结尾的同步元数据数据库
 * - 以"idx:"开头且以":block"或":doc"结尾的索引块/文档数据库
 * - 以"jp:"开头的数据库
 *
 * 如果浏览器不支持IndexedDB，则直接返回不执行任何操作
 */
function cleanupUnusedIndexedDB() {
  // 获取 indexedDB API 的引用
  const indexedDB = window.indexedDB;
  // 如果浏览器不支持 indexedDB，则提前返回
  if (!indexedDB) {
    return;
  }

  // 获取所有可用数据库的列表
  indexedDB.databases().then(databases => {
    databases.forEach(database => {
      // 移除服务器时钟数据库
      if (database.name?.endsWith(':server-clock')) {
        indexedDB.deleteDatabase(database.name);
      }
      // 移除同步元数据数据库
      if (database.name?.endsWith(':sync-metadata')) {
        indexedDB.deleteDatabase(database.name);
      }
      // 移除索引块或文档数据库
      if (
        database.name?.startsWith('idx:') &&
        (database.name.endsWith(':block') || database.name.endsWith(':doc'))
      ) {
        indexedDB.deleteDatabase(database.name);
      }
      // 移除 jp 前缀的数据库
      if (database.name?.startsWith('jp:')) {
        indexedDB.deleteDatabase(database.name);
      }
    });
  });
}

cleanupUnusedIndexedDB();
