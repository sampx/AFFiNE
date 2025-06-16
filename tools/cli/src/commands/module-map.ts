import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { Path } from '@affine-tools/utils/path';
import type { Package } from '@affine-tools/utils/workspace';
import { parse } from 'jsonc-parser';

import { Command, Option } from '../command';

export class ModuleMapCommand extends Command {
  static override paths = [['module-map'], ['mm']];
  static override usage = Command.Usage({
    description: '生成 monorepo 中所有子 package 的模块名与源代码目录的映射',
    examples: [['生成模块代码映射', 'affine module-map']],
  });

  private readonly outputFile = Option.String('--output,-o', 'TECH_SPEC.md', {
    description: '指定输出文件的路径和名称',
  });

  async execute() {
    this.logger.info('开始生成模块代码映射...');

    const moduleMap: Record<string, string> = {};

    // 遍历所有 package
    for (const pkg of this.workspace.packages) {
      // if (pkg.packageJson.private) {
      //   this.logger.info('私有模块：' + pkg.name);
      //   continue; // 跳过私有 package
      // }

      const sourcePath = await this.determineSourcePath(pkg);

      // this.logger.info('模块：' + pkg.name + ' 源代码目录：' + sourcePath);

      moduleMap[pkg.name] = path.relative(
        this.workspace.path.toString(),
        sourcePath?.toString() ?? '(unresolved)'
      );
    }

    await this.updateTechSpecMd(moduleMap, this.outputFile);

    this.logger.info('模块代码映射生成完成。');
  }

  /**
   * 确定给定 Package 对象的源代码路径。
   * 优先级：tsconfig.json 中的 rootDir -> Package 对象的 srcPath -> package.json 中的 main/module/types 字段。
   * @param pkg Package 对象
   * @returns 源代码目录的绝对路径，如果无法确定则返回 null
   */
  private async determineSourcePath(pkg: Package): Promise<string | null> {
    if (!pkg.path.isDirectory) {
      this.logger.error(`Package "${pkg.name}" 的路径不是目录：${pkg.path}`);
      return null; // 如果路径不是目录，直接返回 null
    }

    // 1. 检查 Package 对象的 srcPath
    const srcPath = pkg.srcPath.toString();
    if (new Path(srcPath).isDirectory()) {
      return srcPath;
    }

    // 2. 检查 tsconfig.json 中的 rootDir
    if (pkg.isTsProject) {
      const tsconfigPath = pkg.path.join('tsconfig.json').toString();
      try {
        const tsconfigContent = await fs.readFile(tsconfigPath, 'utf-8');
        const tsconfig = parse(tsconfigContent);
        const rootDir = tsconfig?.compilerOptions?.rootDir;
        if (typeof rootDir === 'string' && rootDir) {
          const sourcePath = pkg.path.join(rootDir).toString();
          if (new Path(sourcePath).isDirectory()) {
            return sourcePath;
          }
        }
      } catch (e: any) {
        this.logger.error(`忽略 tsconfig.json 错误: ${e.toString()}`);
      }
    }

    // 3. 检查 package.json 中的 main/module/types 字段
    const entryPoints: string[] = [];
    if (pkg.packageJson.main) {
      entryPoints.push(pkg.packageJson.main);
    }
    if (typeof pkg.packageJson.exports === 'string') {
      entryPoints.push(pkg.packageJson.exports);
    } else if (
      typeof pkg.packageJson.exports === 'object' &&
      pkg.packageJson.exports !== null
    ) {
      // 尝试获取默认导出，例如 '.' 键
      const defaultExport = pkg.packageJson.exports['.'];
      if (typeof defaultExport === 'string') {
        entryPoints.push(defaultExport);
      } else if (typeof defaultExport === 'object' && defaultExport !== null) {
        // 如果 '.' 也是一个对象，尝试获取 'import' 或 'require' 字段
        if (typeof defaultExport.import === 'string') {
          entryPoints.push(defaultExport.import);
        } else if (typeof defaultExport.require === 'string') {
          entryPoints.push(defaultExport.require);
        }
      }
    }
    for (const entryPoint of entryPoints) {
      const entryPath = pkg.path.join(entryPoint).toString();
      const potentialSourceDir = path.dirname(entryPath);

      // 如果入口点在 dist 或 lib 目录下，则其父目录可能是源代码的逻辑根目录
      if (
        potentialSourceDir.includes('dist') ||
        potentialSourceDir.includes('lib')
      ) {
        const parentDir = path.dirname(potentialSourceDir);
        if (new Path(potentialSourceDir).isDirectory()) {
          return parentDir;
        }
      }
    }

    return pkg.path.toString(); // 如果没有找到合适的源代码目录，返回 package 的根目录
  }

  /**
   * 新建或更新项目根目录下的 TECH_SPEC.md 文件。
   * @param moduleMap 模块映射对象
   */
  private async updateTechSpecMd(
    moduleMap: Record<string, string>,
    filename: string
  ) {
    const techSpecPath = path.join(this.workspace.path.toString(), filename);
    let content = '';
    try {
      content = await fs.readFile(techSpecPath, 'utf-8');
    } catch (e: any) {
      // 文件不存在，将创建新文件
      this.logger.info(`${e.message}文件不存在，将创建新文件: ${techSpecPath}`);
    }

    const moduleMapSectionTitle = '## 模块代码映射';
    const newModuleMapContent = `\`\`\`json\n${JSON.stringify(moduleMap, null, 2)}\n\`\`\``;
    const newSectionContent = `${moduleMapSectionTitle}\n${newModuleMapContent}`;

    const sectionStartIndex = content.indexOf(moduleMapSectionTitle);

    if (sectionStartIndex !== -1) {
      this.logger.info('模块代码映射章节已存在，将更新它。');
      // Find the end of the section (either next section or end of file)
      let sectionEndIndex = content.indexOf('\n## ', sectionStartIndex + 1);
      if (sectionEndIndex === -1) {
        sectionEndIndex = content.length;
      }

      const before = content.substring(0, sectionStartIndex);
      const after = content.substring(sectionEndIndex);

      content = before + newSectionContent + after;
    } else {
      // 如果不存在该章节，则添加到文件末尾
      this.logger.info('模块代码映射不存在，将添加新章节。');
      content += (content.endsWith('\n') ? '\n' : '\n\n') + newSectionContent;
    }

    await fs.writeFile(techSpecPath, content, 'utf-8');
    this.logger.info(`已更新文件: ${techSpecPath}`);
  }
}
