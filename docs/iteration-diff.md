# Iteration Diff

## 2026-04-03 (Reader Overlay Controls Tuning)

### 本次需求增量

- 阅读页顶部布局继续收紧，避免头部信息、主题切换和听书控件把内容区压得过窄
- 主题切换改为更小的 logo 化入口，主题面板以悬浮托盘方式展开
- 听书区默认只保留当前声音和主按钮，语音预设面板收纳到头部小入口中

### 本次实现边界

- 仅继续调整 `src/features/reader/ReaderScreen.tsx` 的局部布局与样式
- 不改朗读逻辑、不改翻页逻辑、不新增全局状态与依赖
- 文档仅同步本次控件收纳与布局层级变化

### 受影响模块

- `src/features/reader/ReaderScreen.tsx`
- `docs/iteration-diff.md`
- `docs/changelog.md`

## 2026-04-03 (Reader Controls Compact Layout)

### 本次需求增量

- 阅读页顶部控件改为更紧凑的收纳式布局，避免返回、标题、主题切换和听书入口全部堆叠
- 主题切换改为头部小图标入口，展开后再显示主题选项
- 听书区默认只展示当前声音与一个主按钮，详细语音预设和回退说明收纳到独立面板

### 本次实现边界

- 仅调整 `src/features/reader/ReaderScreen.tsx` 的局部布局与交互层级
- 不改全局状态结构，不新增依赖，不重写翻页或朗读底层逻辑
- 继续保留语音预设切换、主题切换与回退提示，只改变默认展示密度

### 受影响模块

- `src/features/reader/ReaderScreen.tsx`
- `docs/iteration-diff.md`
- `docs/changelog.md`

## 2026-04-03 (Doubao TTS + Book Search Research)

### 本次需求增量

- 调研“豆包语音包”能否接入当前阅读器
- 调研“书籍搜索功能”在当前项目中的最小可行方案
- 输出候选方案、依赖影响和取舍结论，不直接修改业务代码

### 本次实现边界

- 仅更新 `docs/` 调研结论
- 不改 `src/features/reader/`、`src/data/` 现有业务逻辑
- 不新增依赖，不替换当前朗读底层

### 受影响模块

- `docs/voice-provider-research.md`
- `docs/open-issues.md`
- `docs/iteration-diff.md`
- `docs/changelog.md`

## 2026-04-03 (Reader Theme Refresh)

### 本次需求增量

- 阅读主题新增一款赛博朋克风格配色，保留现有主题轮换入口
- 阅读页头部、阅读容器和底部控制区重新排版，提升层次感与沉浸感
- 在不改变翻页和朗读主链路的前提下，补充背景氛围、信息徽标和更完整的控制面板视觉

### 本次实现边界

- 仅调整 `src/theme/` 与阅读页局部 UI，不扩展到书架或全局设置
- 不新增依赖，不引入渐变库、动画库或新的导航结构
- 继续保留局部主题状态，不做持久化

### 受影响模块

- `src/theme/tokens.ts`
- `src/features/reader/ReaderScreen.tsx`
- `docs/iteration-diff.md`
- `docs/spec.md`
- `docs/open-issues.md`
- `docs/changelog.md`

## 2026-04-03 (Chinese ElevenLabs PoC)

### 本次需求增量

- 中文朗读链路新增 ElevenLabs PoC，优先尝试云端中文音色
- 不新增客户端依赖，继续保留 `expo-speech` 作为默认回退方案
- 阅读页增加云端朗读状态提示，让用户能看见当前是否命中 ElevenLabs PoC

### 本次实现边界

- 仅中文预设接入 ElevenLabs
- 仅在运行环境支持直接播放生成音频时播放云端结果
- 未配置 `EXPO_PUBLIC_ELEVENLABS_API_KEY`、云端请求失败或环境不支持时自动回退到本地朗读
- 不引入新的原生音频 SDK，不在本轮补服务端代理或缓存

### 受影响模块

- `src/data/voicePresets.ts`
- `src/features/reader/elevenlabs.ts`
- `src/features/reader/ReaderScreen.tsx`
- `docs/spec.md`
- `docs/open-issues.md`
- `docs/changelog.md`

## 2026-03-29 (Reader Bugfix + UI Density Iteration)

### 本次需求增量

- 修复语音预设切换后多预设命中同一系统 voice，导致“只有一个能用”的体验问题
- 调整翻页提示文案的布局层级，避免操作提示侵占纸张正文区域
- 轻量优化阅读页视觉密度与 mock 书页内容长度，验证单页容纳更多正文后的阅读效果
- 将语音预设改为更接近主流系统离线中文 / 英文 voice 的目标分组，并在 UI 上明确展示目标音色与实际回退结果

### 与既有 PRD/spec 的差异

- 本轮仍是阅读器增量迭代，不新增新的产品模块或系统能力
- 语音预设策略从“按关键词找近似 voice”细化为“尽量分散命中不同 voice + 命中失败时显式回退说明”
- 翻页提示从“正文纸张内的说明文案”调整为“纸张外或边缘热区的辅助提示”
- 阅读页范围从“保持当前内容密度”调整为“在不破坏手势与控制区的前提下，提升单页信息量与沉浸感”

### 本次实现边界

- 继续使用 `expo-speech`，不引入新 TTS 服务、云端语音或音频缓存
- 不直接引入外部 CDN 语音包；本轮仅能基于设备已安装的离线系统 voice 做映射与回退
- 保持现有 Context + reducer 状态模型，不新增新的状态容器
- 不重做卷页动画机制，仅允许微调提示层级、纸张内边距、正文高度和 mock 文本
- 不新增导航、目录、真实排版引擎、搜索、持久化和主题系统

### 受影响模块

- `src/features/reader/voice-utils.ts`
- `src/data/voicePresets.ts`
- `src/features/reader/ReaderScreen.tsx`
- `src/data/mockBooks.ts`
- `docs/prd.md`
- `docs/spec.md`
- `docs/changelog.md`
- `docs/open-issues.md`

### 非目标

- 不承诺所有设备上每个预设都能绑定完全不同的真实音色
- 不处理 `expo-speech` 底层平台差异以外的外部语音资源安装问题
- 不把本轮 UI 微调扩展为全局品牌改版或多主题设计

### 验收补充

- 至少两个语音预设在支持多 voice 的设备或模拟环境下可命中不同 voice
- 当设备 voice 有限或未命中预设时，界面需明确提示已回退到默认或近似 voice
- 纸张正文区域不再出现“轻触上一页/下一页”等操作文案
- 阅读页单页正文展示量高于上一版，且不遮挡顶部返回、页码、语音控制
- 翻页后自动停止上一页朗读、切换语音预设先停止当前朗读、退出阅读页停止朗读仍成立
