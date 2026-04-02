# Open Issues

- `expo-speech` 的可用 voice 由设备平台决定。本轮只能保证“尽量区分预设 + 失败时显式回退提示”，不能保证所有预设在所有设备上都映射到不同音色。
- ElevenLabs PoC 当前只覆盖中文预设，且直接依赖 `EXPO_PUBLIC_ELEVENLABS_API_KEY`；正式环境仍需要服务端代理和密钥保护。
- 当前 PoC 没有新增原生音频播放依赖，云端合成音频只在支持 `Audio` / `Blob` / `URL.createObjectURL` 的运行环境内直接播放；其他环境会自动回退 `expo-speech`。
- 已补充 `docs/voice-provider-research.md`：如果要明显提升“好听程度”和咬字准确性，需要批准替换当前 `expo-speech` 底层方案；仅调整预设表不足以解决核心问题。
- 阅读页内容密度提升后，需要在小屏设备上重点复测边缘热区与正文滚动的冲突风险。
- 阅读主题切换当前为阅读页局部状态，关闭阅读页后不会持久保存，需要后续根据产品决策再决定是否升级到全局偏好。
