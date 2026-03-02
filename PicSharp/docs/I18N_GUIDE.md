# PicSharp i18n 规范

## 语言文件

- `apps/picsharp-app/src/i18n/locales/zh-CN.ts`
- `apps/picsharp-app/src/i18n/locales/en-US.ts`
- 支持语言：zh-CN、en-US，fallback 为 en-US -> zh-CN

## key 命名

| 前缀 | 用途 | 示例 |
|------|------|------|
| common. | 通用文案 | common.compress_completed |
| nav. | 导航 | nav.watch |
| page.模块.子模块. | 页面内文案 | page.compression.watch.list.title |
| tips. | 提示、错误 | tips.file_watch_abort |
| settings. | 设置相关 | settings.general.theme.title |
| update. | 更新相关 | update.button.update |

## 插值

使用 `{{变量名}}`，如 `{{count}}`、`{{version}}`：

```ts
t('page.compression.watch.list.processed', { count: 5 })
// zh-CN: 已压缩: 5
// en-US: Processed: 5
```

## 新增流程

1. 在 `zh-CN.ts` 和 `en-US.ts` 同一位置添加 key
2. 保持 key 顺序一致，便于维护
3. 在组件中使用 `const t = useI18n(); t('key')` 或 `t('key', { count: n })`

## 使用

```tsx
import { useI18n } from '@/i18n';

function MyComponent() {
  const t = useI18n();
  return <span>{t('page.compression.watch.list.title')}</span>;
}
```
