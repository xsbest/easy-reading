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
- `voiceLookupReady`: 标记 voice 列表是否已经完成探测，用于控制回退提示的显示时机
- 以上均为阅读页局部派生状态，不进入全局 reducer

## 4. 关键数据流变化

### 4.1 语音预设解析

1. `ReaderScreen` 启动后调用 `Speech.getAvailableVoicesAsync()`
2. `availableVoices` 传入 `resolveVoiceForPreset`
3. `voice-utils.ts` 根据预设关键词、语言和候选排序计算最佳命中
4. 若多个预设可能命中同一 voice，需要通过更严格的打分或匹配约束尽量拉开差异
5. 若无可用命中，则返回 `null`，由阅读页走系统默认或近似 voice 的提示分支

### 4.2 语音播放与回退提示

1. 用户点击播放时，阅读页读取当前 `matchedVoice`
2. 若有命中 voice，则把 `identifier` 传给 `expo-speech`
3. 若未命中，则不阻塞播放，但以轻量文案说明当前使用默认或近似 voice
4. 用户切换语音预设、翻页或关闭阅读页时，先执行 `Speech.stop()`，再更新全局朗读状态

### 4.3 阅读页提示布局

1. 纸张正文层只承载章节正文与必要页内信息
2. 翻页操作提示迁移到纸张外层、边缘热区或辅助说明区
3. 点击热区与手势交互保持原逻辑，不新增新的交互入口
4. 文案层级必须弱于正文与主控制区，避免视觉抢夺

### 4.4 内容密度与 mock 数据

1. `mockBooks.ts` 增加每本书的示例页文本长度或页数
2. `ReaderScreen` 调整纸张内边距、可滚动正文高度或相关排版参数
3. 在不修改真实分页引擎前提下，用 mock 数据验证“每页更多内容”的效果

## 5. 状态管理策略

- 继续使用 React Context + `useReducer`
- 本轮只允许增加阅读页局部 UI 状态，不新增全局 action
- 原因：
  - 迭代范围局限在现有阅读器内部
  - 语音探测结果和提示展示更适合保留在页面级别
  - 减少 bugfix 迭代对全局状态机的扰动

## 6. UI 与交互策略

### 6.1 阅读页视觉层级

- 第一层：正文纸张，优先承载章节内容
- 第二层：顶部书名/返回、底部页码与语音控制
- 第三层：翻页辅助提示，仅作为边缘引导，不进入正文中心区域

### 6.2 阅读页微调原则

- 优先增加正文可视空间，再决定提示与装饰位置
- 控制留白压缩幅度，避免密度提升后出现拥挤阅读感
- 提示文案要弱化，不和正文、书名、听书控件竞争注意力
- 延续现有组件结构，避免一次 bugfix 迭代演变成样式重写

## 7. 依赖策略

### 7.1 保留依赖

- `expo`
- `react`
- `react-native`
- `expo-status-bar`
- `expo-speech`

### 7.2 本轮明确不引入

- 新的 TTS SDK 或云服务
- 持久化库
- Reanimated / Gesture Handler
- 导航库

## 8. 边界条件

- 当前页索引仍不能小于 `0` 或超过总页数上限
- 翻页动画执行中仍不可重复触发下一次翻页
- 边缘点击区不能遮挡顶部返回与底部听书控件
- mock 内容变长后，正文滚动能力必须保持可用
- 当前设备不支持或拒绝语音能力时，界面保持可读且不阻塞阅读
- 未命中预设 voice 时允许播放默认 voice，但必须提供回退说明
- 设备 voice 很少时，只要求“尽量区分”，不要求所有预设都独占不同 voice

## 9. 风险与回退方案

### 9.1 风险

- `expo-speech` 返回的 voice 元数据在不同平台字段不一致，可能导致打分策略偏差
- 语音预设关键词若过宽，仍可能让多个预设落到同一 voice
- 阅读页增加内容密度后，边缘热区与正文滚动之间可能出现新的冲突
- UI 微调若仅依赖静态数值，可能在小屏设备上出现挤压

### 9.2 回退方案

- 若无法稳定命中不同 voice，至少保留有序候选和显式回退提示
- 若纸张外提示影响布局，可降级为更轻的边缘标签或页外 footnote
- 若内容密度调整在小屏设备上过挤，优先回退内边距和字号，不回退到正文内提示

## 10. 验收映射

- PRD 范围与非目标已更新到 `docs/prd.md`
- 本轮差异与受影响模块已更新到 `docs/iteration-diff.md`
- 语音映射、提示布局、内容密度的技术约束与数据流已记录在本文件
- coder 可据此修改 `voice-utils.ts`、`voicePresets.ts`、`ReaderScreen.tsx`、`mockBooks.ts`
- tester 可据此独立验证语音区分、回退提示、正文无提示占位和既有朗读停止逻辑
