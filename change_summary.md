# Change Summary

- 更新 `docs/iteration-diff.md`、`docs/prd.md`、`docs/spec.md`，补充卷页视觉、边缘点击翻页与语音预设需求
- 重写 `ReaderScreen` 阅读交互，增加书脊阴影、卷页层、背页预览和左右边缘快速翻页热点
- 新增语音预设数据与 voice 匹配工具，支持知性女声、元气女声、沉稳男声、播客男声四种预设
- 扩展 `LibraryState`，保存当前语音预设选择，并在翻页或切换预设时停止当前朗读避免串页
- 更新 `README.md`、`docs/changelog.md` 和 `docs/open-issues.md`，保持文档与实现一致
