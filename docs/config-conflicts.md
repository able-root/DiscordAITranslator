# DiscordAITranslator 配置冲突矩阵

这份矩阵的目标，是把“用户看到的设置”映射到“真实持久化键”和“实际运行时读取路径”，避免把不同层的配置误当成同一个开关。

| 用户看到的配置 | 实际持久化键 | 运行时读取方法 | 已发现的冲突 / 误导点 |
| --- | --- | --- | --- |
| `当前频道自动翻译` | `translationEnabledStates` | `toggleTranslation()`、`isTranslationEnabled()`、`checkMessage()`、`shouldAutoTranslateReceivedMessage()`、`processMessageReply()` | 这是频道级启用状态，不是自动翻译策略全集。UI 文案容易让人理解成“自动翻译所有规则总开关”。 |
| `每个频道单独记录翻译开关` | `settings.general.usePerChatTranslation` | `toggleTranslation()`、`isTranslationEnabled()`、`createReceivedTranslationSignature()`、`createReplyPreviewSignature()` | 它不仅影响开关保存方式，还会改变签名中的 `channelId` 语义。开启时存 `channelId`，关闭时存 `"global"`，但当前没有迁移解释。 |
| `收到消息自动翻译策略` | `settings.filters.receivedAutoTranslatePreset` + `settings.filters.*` | `shouldSkipMixedReceivedMessages()`、`shouldSkipSameLanguageReceivedMessages()`、`shouldDropSimilarTranslations()` | 运行时判断现在已经只读细粒度 `filters.*`，不会再被隐藏 preset 覆盖；`receivedAutoTranslatePreset` 只可能残留在旧配置数据或文案里，不再参与代码路径。 |
| `只翻译新消息 / 翻译当前已加载消息` | `settings.filters.receivedAutoTranslateScope` | `getReceivedAutoTranslateScope()`、`prepareAutoTranslationChannelSession()`、`processMessages()` | 这是自动翻译会话策略，不等于频道开关。用户关闭频道自动翻译再回来时，看到这个值还在，会误以为“自动翻译又打开了”。 |
| `跳过中英混合消息` | `settings.filters.skipMixedReceivedMessages` | `shouldSkipMixedReceivedMessages()`、`analyzeTextForAutoTranslate()`、`shouldAutoTranslateReceivedMessage()` | 它只决定“整条消息是否进入自动翻译队列”，不会保护实际翻译文本里的英文片段，也不影响手动翻译。 |
| `跳过已是目标语言的消息` | `settings.filters.skipSameLanguageReceivedMessages` | `shouldSkipSameLanguageReceivedMessages()`、`analyzeTextForAutoTranslate()`、`shouldKeepAutoTranslatedResult()` | 这个判断分成“翻译前跳过”和“翻译后丢弃近似结果”两层，用户只看到一个开关，但运行时其实有前后两次过滤。 |
| `如果译文和原文几乎一样，就不显示` | `settings.filters.dropSimilarTranslations` + `settings.filters.translationSimilarityThreshold` | `shouldDropSimilarTranslations()`、`getTextSimilarityScore()`、`shouldKeepAutoTranslatedResult()` | 这不是 UI 显示层的简单隐藏，而是直接影响自动翻译结果是否保留。和“跳过同语言消息”叠加后，用户很难判断是哪一层把结果丢掉了。 |
| `收到消息允许自动翻译的源语言` | `settings.filters.receivedAutoTranslateSourceLanguages` | `getReceivedAutoTranslateSourceLanguages()`、`shouldKeepAutoTranslatedResult()` | 这条规则主要在自动翻译结果产出后做保留判定，不是一个纯前置 gate。用户可能以为“不在列表就不会发请求”，实际可能已经翻译过再丢弃。 |
| `发送前只翻译这些源语言` | `settings.filters.autoTranslateSourceLanguages` | `getAutoTranslateSourceLanguages()`、`shouldAutoTranslateSentMessage()` | 这套源语言过滤只影响发送路径，和收到消息路径完全分离，但 UI 上都叫“源语言过滤”，容易混淆。 |
| `翻译收到的消息时还显示原文` | `settings.general.showOriginalMessage` + `settings.general.showOriginalDirectly` + `settings.general.useSpoilerInReceivedOriginal` | `buildReceivedDisplayContent()`、`processMessageContent()` | 这是主消息正文显示策略，不自动影响引用预览和 embed。用户容易误以为“显示原文”是全局统一行为。 |
| `别人引用这条消息时显示译文+原文` | `settings.general.showOriginalInReplyPreview` | `getReplyPreviewDisplayContent()`、`getReplyPreviewFallbackContent()`、`processMessageReply()` | 这是回复预览专用显示策略，不作用于主消息正文。过去问题反复出现，就是因为 reply preview 是独立渲染链。 |
| `高亮译文 / 译文模块颜色` | `settings.general.highlightTranslatedMessages` + `settings.general.translatedTextColor` | `processMessageContent()`、`processEmbed()` | 它只改变当前显示态，不决定翻不翻。但用户看到颜色变化时，往往会误以为“这里代表自动翻译开关”。 |
| `聊天框翻译按钮` 这个入口本身 | 无单独持久化键；实际读写多个键 | 左键打开 `TranslateSettingsComponent`，右键 `toggleTranslation()` | 一个入口同时承担“打开设置”和“切频道自动翻译”两种职责，是当前 UI 误导最强的点之一。 |
| `旧弹窗设置` 与 `BetterDiscord 齿轮设置` | 两边都可能写 `settings.*`、`channelLanguages`、`guildLanguages`、`translationEnabledStates` | `TranslateSettingsComponent` 与 `getSettingsPanel()` | 两套入口暴露字段不一致。旧弹窗偏频道即时控制，新面板偏全局规则，但代码没有把这个边界正式写出来。 |
| `translationCache` | `translationCache[messageId]` | `getCachedReceivedTranslation()`、`translateMessage()`、`processMessageReply()` | 这是持久化缓存，不等于“当前界面正在显示的译文”。用户常把缓存命中误认为“自动翻译还没关掉”。 |
| 当前显示中的译文 | 运行时 `translatedMessages[messageId]`、`oldMessages[messageId]`、`replyPreviewTranslations[messageId]` | `processMessageContent()`、`processEmbed()`、`processMessageReply()`、`checkMessage()` | 这是内存显示态，不持久化。它与 `translationCache`、频道开关、reply preview 缓存并存，是“原文/译文来回切换”问题的直接来源。 |

## 审计结论

### 1. 当前最核心的冲突不是“值没存住”，而是“语义没分层”

用户目前看到的“自动翻译”至少混合了三种不同概念：

- 频道是否启用翻译
- 收到消息后是否自动排队翻译
- 翻译结果在界面上如何显示

这三者在代码里分属不同状态源，但 UI 没有明确区分。

### 2. preset 是历史冲突源，当前已退出代码路径

当前细粒度规则虽然已经在界面上出现，但：

- `shouldSkipMixedReceivedMessages()`
- `shouldSkipSameLanguageReceivedMessages()`
- `shouldDropSimilarTranslations()`

现在这三条运行时判断已经只读取细粒度 `filters.*`，不会再继续读取 `receivedAutoTranslatePreset` 的语义。

剩余问题变成：

- 旧用户配置里可能仍带有 `receivedAutoTranslatePreset`
- 文案与历史文档容易默认它还在运行时覆盖细粒度规则
- 仓库里仍有可继续清理的遗留文案

也就是说，这一层已经从“行为冲突”降级成了“历史模型未清理完”的维护问题。

### 3. 混合语言问题不是简单开关问题

“跳过中英混合消息”只影响自动翻译准入，不会影响：

- 手动翻译
- 缓存命中
- 文本保护链
- 引用预览回填

因此如果要真正解决“中文句子里的英文术语被翻译”，不能只改 auto queue，必须补上文本保护或新的混合语言策略层。

## 建议的后续落点

后续修复时，建议先从以下三个问题统一建模开始：

1. 频道启用状态
2. 自动翻译策略状态
3. 显示策略状态

只要这三类状态没有被强制拆开，后面无论修 reply preview、混合语言还是缓存恢复，都会不断出现“局部修好了，另一条显示路径又漏掉”的情况。
