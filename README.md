# flash-read1

`flash-read1` 是一个基于 Expo + React Native + TypeScript 的读书 App 阅读体验骨架，当前版本已覆盖书架管理、卷页翻书阅读、阅读进度状态维护、本地轻量听书、英文页一键翻译入口，以及目录导读 / AI 导读面板，并支持从远端服务器拉取全文分页内容。

## 当前范围

- 书架页：展示书籍、阅读进度、最近阅读入口
- 阅读页：书籍标题、章节内容、卷页翻书动效、边缘点击翻页、页码信息、听书控制、Google Translate 跳转
- 阅读页增强：目录导读跳页、AI 导读建议、原 PDF 总页数提示、远端全文同步
- 本地状态：用 Context + `useReducer` 管理书库与阅读会话
- Mock 数据：内置两本英文技术书的导读页，并预留远端 PDF / 全文 JSON 清单接入位
- 本地语音：使用 `expo-speech` 朗读当前页内容，并根据预设映射系统可用音色

## 技术选型

- Expo Managed Workflow
- React Native
- TypeScript
- 原生 `Animated` + `PanResponder` 实现卷页视觉与边缘快速翻页
- `expo-speech` 实现端侧 TTS 听书

## 快速启动

```bash
npm install
npm run start
```

如需在模拟器中运行：

```bash
npm run ios
npm run android
```

如需启用远端 PDF / 全文加载，请配置：

```bash
EXPO_PUBLIC_READER_CONTENT_BASE_URL=https://your-static-host.example.com
EXPO_PUBLIC_READER_ASSET_BASE_URL=https://your-static-host.example.com
```

远端全文 JSON 至少需要返回：

```ts
type RemoteBookContentPayload = {
  pages: string[];
  translatedPages?: string[];
  tableOfContents?: {
    title: string;
    summary: string;
    pageIndex: number;
    pdfPageLabel?: string;
  }[];
  totalPdfPages?: number;
  sourcePdfLabel?: string;
  sourcePdfUri?: string;
  description?: string;
};
```

## 文档

- 产品需求：[docs/prd.md](./docs/prd.md)
- 技术方案：[docs/spec.md](./docs/spec.md)
- 改动摘要：[change_summary.md](./change_summary.md)
- 风险摘要：[risk_summary.md](./risk_summary.md)

## 目录

```text
flash-read1/
├── docs/
├── src/
│   ├── app/
│   ├── components/
│   ├── data/
│   ├── features/
│   ├── state/
│   ├── theme/
│   └── types/
├── App.tsx
├── app.json
├── index.ts
├── package.json
└── tsconfig.json
```

## 后续建议

后续迭代可继续补充：

- 持久化存储与云端同步
- 真正的导航栈和 Tab 信息架构
- EPUB/TXT 解析
- 内嵌 PDF 渲染与正式翻译服务
- 字体、主题、亮度与目录面板
- 搜索、书城、评论和社交阅读能力
- 进度持久化与听书队列播放
