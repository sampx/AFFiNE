// 导入浏览器环境的初始化模块，设置运行时环境变量和全局配置
import '@affine/core/bootstrap/browser';
// 导入清理模块，用于在应用启动时清理未使用的IndexedDB数据库
// 清理规则包括：
// - 名称为server-clock的数据库
// - 名称为sync-metadata的数据库
// - 名称以idx:开头且以block或doc结尾的数据库
// - 名称以jp:开头的数据库
import '@affine/core/bootstrap/cleanup';
// 导入主题样式模块，包含以下主要功能：
// 1. 加载基础CSS样式（@toeverything/theme的style.css）
// 2. 加载自定义字体样式（fonts.css）
// 3. 加载全局样式（global.css）
// 4. 加载主题特定样式（theme.css）
//
// 主题样式中定义了：
// - 字体家族配置（包括无衬线、有衬线、等宽字体等）
// - 颜色变量（包括主色调、成功/警告/错误颜色等）
// - UI组件样式（按钮、输入框、对话框等）
// - 不同主题模式（light/dark）的样式配置
// - 打印样式优化
import '@affine/component/theme';
