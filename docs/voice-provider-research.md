# Voice Provider Research

## 2026-04-02

## 背景结论

- `flash-read1` 当前阅读链路基于 `expo-speech`。
- `expo-speech` 官方文档当前只提供 `Speech.getAvailableVoicesAsync()` 获取设备可用 voice 列表，并在 `Speech.speak()` 中通过 `voice` 传入 voice identifier；也就是说，现状只能调用设备已经存在的系统 voice，不能在应用内直接下载或替换成“热门 AI 语音包”。
- 因此，“把语音包变好听”有两条路线：
  - 路线 A：继续保留 `expo-speech`，只做系统 voice 映射优化与回退提示。
  - 路线 B：替换当前底层能力，改为云端 TTS 生成音频，再由 App 播放音频。

## 候选方案

### 方案 A：继续使用 `expo-speech`

- 是否新增依赖：否
- 是否替换底层能力：否
- 结论：只能继续使用设备自带 voice，无法真正引入新的热门高质量语音包

优点：
- 不改当前架构
- 离线可用
- 无新增音频缓存、鉴权、费用与合规链路

缺点：
- 声音上限由 iOS / Android 系统 voice 决定
- 中文咬字、情感和稳定性无法通过项目内配置根本改善
- 不同设备差异很大

适用判断：
- 只适合当前 bugfix 范围
- 不适合“明显提升音质”这个诉求

### 方案 B：OpenAI Text-to-Speech

- 是否新增依赖：是
- 是否替换底层能力：是
- 结论：可显著提升自然度，但官方文档明确当前内置 voices “currently optimized for English”，不应作为中文阅读器的首选主方案

已核实能力：
- 官方文档推荐 `gpt-4o-mini-tts` 作为最新、最可靠的 TTS 模型
- 提供 13 个内置 voices
- 官方文档明确推荐 `marin` 或 `cedar` 作为最佳质量 voice
- 支持流式输出

优点：
- 接口简单
- 音色自然度高
- 适合后续做更拟人的朗读体验

缺点：
- 中文不是官方当前最强主场
- 需要新增服务端或安全代理，不能把密钥直接放客户端
- 需要补音频播放、缓存、失败回退和费用控制

适用判断：
- 适合英文内容优先的产品
- 不适合作为本项目当前中文阅读主链路的首选落地

### 方案 C：ElevenLabs Text-to-Speech

- 是否新增依赖：是
- 是否替换底层能力：是
- 结论：如果目标是“热门、好听、明显更像真人”，这是更贴近诉求的候选方案

已核实能力：
- 官方文档将 voice selection 视为对输出影响最大的因素
- `Eleven Multilingual v2` 标注为自然、稳定，适合长文本生成
- `Eleven Flash v2.5` 标注为低延迟方案
- 文档列出多语言模型，适合非纯英文内容

优点：
- 市场认知强，用户对“AI 语音包”感知明显
- 长文本与多语言能力更贴合听书
- 如果挑到合适 voice，主观听感通常会比系统 voice 提升明显

缺点：
- 需要新增云端 TTS 链路、鉴权和音频播放能力
- 生成结果有一定非确定性，需要调 voice / model / stability
- 成本、缓存策略、文本切片策略都要补设计

适用判断：
- 如果产品目标是“听感升级优先”，这是推荐优先验证的外部方案

### 方案 D：Azure AI Speech / Google Cloud Text-to-Speech

- 是否新增依赖：是
- 是否替换底层能力：是
- 结论：更偏企业级稳妥方案，中文与多语支持完整，发音可控性强，但“热门 AI 语音包感”通常不如 ElevenLabs 明显

已核实能力：
- Azure 官方文档写明 text-to-speech 支持 400+ voices、140+ languages and variants
- Azure 支持 neural / HD voices，适合电子书、有声书等场景
- Google Cloud TTS 官方文档提供 `Neural2` 和更高阶 premium voices

优点：
- 多语种覆盖完整
- 中文发音与企业稳定性通常较好
- SSML、语言控制、发音控制成熟

缺点：
- 接入复杂度和平台配置成本高于保留 `expo-speech`
- 需要新增服务端与音频播放链路
- 从产品感知上更像“稳定企业配音”，不一定是“最热门”

适用判断：
- 如果后续要求中文发音准确、可控、稳定，Azure 优先级高于 OpenAI
- 如果要求供应商成熟度与广覆盖，Google 也可列为备选

## 取舍结论

- 在“不新增依赖、不替换底层能力”的约束下，本轮无法真正解决“语音包太难听、咬字不准”的核心问题。
- 继续留在 `expo-speech` 体系内，只能做到：
  - 更稳的 voice 命中
  - 更明确的回退提示
  - 引导用户在系统层安装更高质量离线 voice
- 如果要真正提升朗读质量，需要人审后批准“替换底层能力”。

推荐结论：
- 中文阅读优先：优先评估 `ElevenLabs` 与 `Azure AI Speech`
- 英文阅读优先：`OpenAI TTS` 可作为轻量候选
- 当前项目最符合需求的下一步：先立项一个“云端 TTS 替换评估”小迭代，而不是继续调 `voicePresets`

## 建议决策

### 决策 1：如果本轮必须保持现有边界

- 不新增依赖
- 不替换 `expo-speech`
- 只保留当前系统 voice 映射优化路线
- 对外说明：当前无法在 App 内直接接入新的高质量语音包

### 决策 2：如果允许开启下一轮能力升级

- 批准替换底层 TTS 能力
- 批准新增音频播放 / 缓存 / 服务端代理相关依赖与实现
- 首选 PoC 顺序：
  1. `ElevenLabs`
  2. `Azure AI Speech`
  3. `OpenAI TTS`

原因：
- 当前用户反馈重点是“难听”“咬字不准”，属于主观听感与发音质量问题，不是预设映射问题
- `OpenAI TTS` 官方当前更偏英文优化，不宜排第一
- `ElevenLabs` 更适合先验证主观音质提升
- `Azure` 更适合验证中文发音稳定性与可控性

## 参考来源

- Expo Speech: https://docs.expo.dev/versions/latest/sdk/speech/
- OpenAI Text-to-Speech: https://developers.openai.com/api/docs/guides/text-to-speech
- ElevenLabs Text-to-Speech guide: https://elevenlabs.io/docs/eleven-creative/playground/text-to-speech
- Azure Speech synthesis: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis
- Google Cloud Text-to-Speech voices: https://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types
