# VeryPic AI 协作指引

## 项目简介

VeryPic 是跨平台图片压缩应用，支持 macOS、Windows、Linux。主要功能：

- **Classic 模式**：手动选择文件/目录进行批量压缩
- **Watch 模式**：监听目录，自动压缩新增图片
- **TinyPNG**：支持 API 密钥，云端压缩
- **设置**：通用、压缩、TinyPNG 等配置

技术栈：Tauri 2 + React 18 + Zustand + Vite + verypic-sidecar（Node.js + Hono）。

## 开发前必读

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - 技术架构与数据流
- [docs/CODE_STYLE.md](docs/CODE_STYLE.md) - 代码规范与约定
- [docs/I18N_GUIDE.md](docs/I18N_GUIDE.md) - i18n 规范

## 功能开发流程

1. **理解需求**：先明确功能模块（Classic / Watch / 设置 / 其他）
2. **查架构**：参考 ARCHITECTURE.md 定位相关 store、组件、API
3. **改代码**：遵循 CODE_STYLE.md，优先复用已有组件
4. **补 i18n**：新增文案同步更新 zh-CN.ts 和 en-US.ts
5. **自测**：验证浅色/深色模式、无控制台报错

## 提交前检查

- [ ] 新增文案已同步 zh-CN 与 en-US
- [ ] 深色模式样式已加 `dark:` 变体（如有 UI 改动）
- [ ] 无控制台报错、无 lint 错误
- [ ] 修改 store 时兼顾 Classic 与 Watch 模式

## 常见注意

- **路径**：Watch 下路径比较统一用 `normalizePathForCompare`
- **Store**：`compression.ts` 中 `classicFiles` / `watchFiles` 分别对应两种模式，`syncViewFromMode` 会按 mode 切换
- **事件**：Watch 的 add/remove/rename 在 `watch.tsx` 的 `onmessage` 中处理

## 需求提示模板

提需求时可附带以下信息，提高 AI 产出质量：

```
【功能】简要描述
【模块】Classic / Watch / 设置 / 其他
【约束】是否需要 i18n、是否影响深色模式、是否涉及 store
【参考】可参考的现有组件或逻辑（如 file-card、watch-file-manager）
```
