# VeryPic 代码规范

## 组件

- 使用函数式组件，`export default memo(ComponentName)`
- 组件名用 PascalCase
- 页面组件：`XxxPage` 或 `CompressionXxx` 等

## 命名

| 类型 | 约定 | 示例 |
|------|------|------|
| 页面 | XxxPage 或功能名 | CompressionWatch, ClassicCompressionGuide |
| 卡片 | XxxCard | WatchFolderCard, CompressionOptionsCard |
| 工具 | xxx-utils 或 kebab-case | parsePaths, normalizePathForCompare |
| 常量 | UPPER_SNAKE 或 PascalCase | VALID_IMAGE_EXTS, SettingsKey |

## 状态管理

- 使用 Zustand，`useSelector` 按需订阅，避免全量订阅
- 示例：`useCompressionStore(useSelector(['files', 'fileMap']))`

## 样式

- 使用 Tailwind CSS + `cn()` 合并类名
- 避免内联 `style`，除非必要（如动态值）
- 深色模式需加 `dark:` 变体

## i18n

- 新增文案必须同时更新 `zh-CN.ts` 和 `en-US.ts`
- key 格式：`page.模块.子模块.描述` 或 `tips.xxx`、`common.xxx`
- 使用：`t('key')` 或 `t('key', { count: n })`

## 路径与文件

- 路径比较用 `normalizePathForCompare`（来自 `@/utils/fs`）
- 文件操作用 `@tauri-apps/plugin-fs`（exists、rename、copyFile 等）

## Store 双模式

- `compression.ts` 中 `classicFiles` / `watchFiles` 分别对应 Classic 与 Watch
- 修改 `removeFile`、`updateFilePath` 等时需兼顾两种模式
