# agents.md

本文件是项目速览，供迭代时快速理解项目现状。

## Project Summary
- repo: flash-read1
- tech_stack: node, react, typescript
- key_files: package.json, README.md, tsconfig.json

## PRD Key Points
# flash-read1 PRD

## 1. 项目背景

`flash-read1` 当前已具备书架、卷页翻页和本地轻量听书骨架，但阅读页仍存在两个直接影响体验的问题：语音预设容易命中同一系统 voice，用户感知为“只有一个语音包能用”；翻页提示文案出现在纸张正文区域，侵占了可读内容空间。本轮在不扩大产品范围的前提下，收敛为一次面向阅读主链路的小范围修复与体验微调。

## 2. 本轮目标

- 修复语音预设映射策略，让多个预设在支持环境下尽量可区分
- 在设备 voice 有限时，为语音回退提供明确反馈，避免用户误判为功能失效
- 将翻页操作提示从正文纸张中移出，恢复正文区的阅读优先级
- 轻量提升阅读页的内容密度和沉浸感，观察“每页更多正文”后的显示效果
- 保持现有书架、翻页手势、朗读控制和阅读进度行为不回归

## 3. 目标用户

- 碎片化阅读的移动端用户
- 需要边读边听、会主动切换语音预设的用户
- 用当前阅读器骨架验证交互和视觉密度的内部研发与设计团队

## 4. 使用场景

### 场景 A：切换语音预设后继续听书

1. 用户在阅读页打开语音预设列表
2. 用户切换到另一种语音风格并开始朗读
3. 系统优先匹配与当前预设更接近的可用 voice
4. 若设备可用 voice 不足，界面明确说明已回退为默认或近似 voice

### 场景 B：阅读正文时不被翻页文案干扰

1. 用户进入阅读页查看纸张正文
2. 纸张中部只展示章节内容，不显示“轻触上一页/下一页”等辅助操作文案
3. 用户仍可通过左右边缘热区或滑动手势完成翻页

### 场景 C：单页承载更多内容

1. 用户在阅读页持续浏览多页内容
2. 单页正文显示量较上一版更高，减少“内容被提示占位”和过早翻页的感觉
3. 顶部返回、页码、语音控制仍然清晰可用

## Spec Key Points
# flash-read1 Technical Spec

## 1. 架构前提

### 1.1 运行时与框架

- 保持 Expo Managed Workflow
- 保持 React Native + TypeScript
- 保持顶层界面状态切换，不引入新的导航层
- 听书仍基于 `expo-speech`

### 1.2 本轮不变项

- 不调整 App Shell、书架页与阅读页的整体模块边界
- 不替换 Context + `useReducer` 状态管理
- 不引入新的第三方 TTS、持久化、手势或动画依赖
- 不改变翻页时先停止朗读的主流程顺序

## 2. 受影响目录

```text
docs/
├── iteration-diff.md
├── prd.md
├── spec.md
├── changelog.md
└── open-issues.md

src/
├── data/
│   ├── mockBooks.ts
│   └── voicePresets.ts
└── features/
    └── reader/
        ├── ReaderScreen.tsx
        └── voice-utils.ts
```

## 3. 关键数据模型

### 3.1 继续沿用的数据

- `Book.pages`: 仍是 mock 分页数组，本轮只增加内容长度与展示验证
- `selectedVoicePresetId`: 仍作为当前语音预设选择源
- `isNarrationActive` / `isNarrationPaused`: 仍驱动阅读页听书控制 UI
- `narrationBookId` / `narrationPageByBookId`: 仍用于约束“只朗读当前页”

### 3.2 本轮新增的派生信息

- `matchedVoice`: 基于 `availableVoices` 和当前 `voicePreset` 计算出的最佳匹配 voice

## Notes
- 优先按 spec 进行增量修改，不重建项目。
- 迭代修复优先修改 reader 相关模块与语音映射逻辑。
