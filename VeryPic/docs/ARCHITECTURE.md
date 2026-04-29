# VeryPic 技术架构

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面壳 | Tauri 2.x |
| 前端 | React 18、Vite 6、TypeScript 5 |
| UI | Radix UI、Ant Design、Tailwind CSS、shadcn/ui 风格组件 |
| 状态 | Zustand |
| 路由 | React Router 7 |
| 表单 | React Hook Form + Zod |
| 后端服务 | `@verypic/verypic-sidecar`（进程名 `verypic-sidecar`）：Node.js + Hono + Sharp + @napi-rs/image |
| 包管理 | pnpm 9+，Node 20+ |

## 项目结构

```
monorepo/
├── apps/verypic-app/           # Tauri 桌面应用
│   └── src/
│       ├── components/         # 通用组件
│       ├── hooks/              # 自定义 Hooks
│       ├── i18n/               # 国际化
│       ├── pages/              # 页面
│       ├── store/              # Zustand 状态
│       ├── utils/              # 工具函数
│       └── constants.ts
├── packages/verypic-sidecar/   # Node.js 侧边服务
│   └── src/
│       ├── controllers/        # API 控制器
│       └── ...
└── doc/                        # 文档图片
```

## 数据流

### Classic 模式

用户选择文件/目录 -> parsePaths -> classicFiles / classicFileMap -> Compressor.compress() -> 更新 fileMap 状态 -> FileCard 展示

### Watch 模式

- dirspy 监听目录，通过 SSE 推送 add、remove、rename 等事件
- watch.tsx 的 onmessage 接收事件，调用 appendWatchFiles、updateFilePath、removeFile
- 数据存入 watchFiles / fileMap，watch-file-manager 展示

### 关键路径

| 功能 | 路径 | 说明 |
|------|------|------|
| 解析路径 | utils/fs.ts 的 parsePaths | 通过 Tauri invoke 调用 ipc_parse_paths |
| 监听事件 | watch.tsx 的 onmessage | 处理 add、remove、rename、self-enoent |
| 文件列表 | store/compression.ts | watchFiles、fileMap、updateFilePath、appendWatchFiles |
| 同步移除 | watch.tsx 的 syncRemoveNonExistent | 定时移除不存在的文件，支持重命名兜底 |

## 模块职责

### 前端 (picsharp-app)

- store/compression.ts：压缩相关状态，Classic 与 Watch 共用 files/fileMap，通过 mode 切换数据源
- pages/compression/watch.tsx：Watch 主逻辑，EventSource 连接、事件处理、目录扫描
- pages/compression/watch-file-manager.tsx：Watch 文件列表展示

### Sidecar (picsharp-sidecar)

- controllers/watch/index.ts：POST /stream/watch/new-images，SSE 推送 add/remove/rename 等事件
- 使用 dirspy 监听目录，支持 ADD、REMOVE、RENAME、MOVE、SELF_ENOENT

## 路由结构

/compression -> /classic/guide, /classic/workspace, /watch/guide, /watch/workspace
/settings -> /general, /compression, /tinypng, /about
/image-compare, /update
