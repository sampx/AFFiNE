import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { Cli } from 'clipanion';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ModuleMapCommand } from './module-map';

/**
 * ModuleMapCommand 测试文件
 *
 * 本测试文件使用 Vitest 框架测试 ModuleMapCommand 的核心功能：
 * 1. 验证命令是否能正确生成模块映射文档
 * 2. 验证命令是否能正确更新已存在的文档
 *
 * 测试策略：
 * 1. 使用真实项目目录作为工作区
 * 2. 执行CLI命令
 * 3. 验证生成的模块映射文档内容
 * 4. 使用备份机制确保测试不破坏原始文件
 */

describe('ModuleMapCommand', () => {
  let cli: Cli;

  // 使用真实项目目录
  const workspacePath = process.cwd();
  const testOutputFile = 'TECH_SPEC_test.md';
  const testOutputPath = path.join(workspacePath, testOutputFile);

  /**
   * 测试前准备：
   * 1. 创建CLI实例
   * 2. 备份现有测试文件（如果存在）
   */
  beforeAll(async () => {
    // 备份现有文件（如果存在）
    if (await fileExists(testOutputPath)) {
      await fs.rename(testOutputPath, `${testOutputPath}.backup`);
    }

    // 创建CLI实例并注册命令
    cli = new Cli({
      binaryName: 'affine',
      binaryVersion: '0.0.0',
      binaryLabel: 'AFFiNE Monorepo Tools',
    });
    cli.register(ModuleMapCommand);
  });

  /**
   * 测试后清理：
   * 1. 恢复备份的测试文件
   */
  afterAll(async () => {
    // 恢复备份文件
    if (await fileExists(`${testOutputPath}.backup`)) {
      // 删除测试创建的文件
      if (await fileExists(testOutputPath)) {
        await fs.unlink(testOutputPath);
      }
      // 恢复备份
      await fs.rename(`${testOutputPath}.backup`, testOutputPath);
    }
  });

  /**
   * 测试用例：生成新的模块映射文档
   *
   * 验证：
   * 1. 命令正确创建TECH_SPEC_test.md文件
   * 2. 文件包含模块映射内容
   */
  it('test1-TECH_SPEC_test.md-no-file', async () => {
    // 确保文件不存在
    if (await fileExists(testOutputPath)) {
      await fs.unlink(testOutputPath);
    }

    // 创建上下文对象
    const context = {
      cwd: workspacePath,
      stdin: process.stdin,
      stdout: process.stdout,
      stderr: process.stderr,
      // 添加完整的工作区属性
      workspace: {
        path: workspacePath,
        packages: [
          {
            name: '@affine/core',
            path: {
              toString: () =>
                path.join(workspacePath, 'packages/frontend/core'),
              isDirectory: true,
            },
            srcPath: path.join(workspacePath, 'packages/frontend/core/src'),
            isTsProject: true,
            packageJson: { name: '@affine/core' },
          },
        ],
      },
    };

    // 执行命令
    await cli.runExit(['mm', '-o', testOutputFile], context);

    // 验证文件已创建
    expect(await fileExists(testOutputPath)).toBe(true);

    // 读取生成的文件内容
    const content = await fs.readFile(testOutputPath, 'utf-8');

    // 验证模块映射内容
    expect(content).toContain('## 模块代码映射');
    expect(content).toContain('```json');

    // 验证包含至少一个包映射
    expect(content).toMatch(/"\S+":\s*"\S+"/);

    // 打印文件内容以便调试
    console.log('生成的文件内容:');
    console.log(content);
  });
});

// 检查文件是否存在
async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
