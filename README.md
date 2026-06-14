# DiscordAITranslator

基于 BetterDiscord 原版 `Translator` 插件二次开发的 Discord AI 翻译插件，面向多服务商接入、频道级翻译规则和更适合日常使用的设置界面。

## 当前版本

- 作者：`ROOT94`
- 版本：`v0.0.2`
- 基础来源：[mwittrien / BetterDiscordAddons / Translator](https://github.com/mwittrien/BetterDiscordAddons/tree/master/Plugins/Translator/)
- 当前仓库：[able-root/DiscordAITranslator](https://github.com/able-root/DiscordAITranslator)

## 主要功能

- 发送消息前翻译
- 接收消息自动翻译
- 每个频道单独记录翻译开关
- 多服务商支持：DeepSeek、Azure Translator、Google Cloud Translation、DeepL、OpenAI Compatible 等
- API Key / Endpoint / Model 可视化配置
- 设置面板内置模型检测、模型列表拉取
- 译文高亮、左侧色条、原文同时显示、剧透显示
- 保护词、保护短语、包裹符规则、跳过翻译前缀
- 语言识别助手

## 推荐安装方式

推荐按下面方式安装，最省事：

1. 安装 `DiscordAITranslator.plugin.js`
2. 安装 `BDFDB Library`
3. 主题部分推荐使用 `system24` 的直链导入方式

推荐链接：

- BDFDB Library：
  [https://mwittrien.github.io/downloader/?library](https://mwittrien.github.io/downloader/?library)
- system24 主题说明页：
  [https://refact0r.github.io/system24/](https://refact0r.github.io/system24/)
- system24 主题文件页：
  [https://github.com/refact0r/system24/blob/main/theme/system24.theme.css](https://github.com/refact0r/system24/blob/main/theme/system24.theme.css)
- system24 直链导入地址：
  [https://refact0r.github.io/system24/build/system24.css](https://refact0r.github.io/system24/build/system24.css)

## 快速安装

### 1. 安装插件

把仓库里的 `DiscordAITranslator.plugin.js` 放到：

```text
%AppData%\BetterDiscord\plugins
```

然后在 BetterDiscord 插件页启用 `DiscordAITranslator`。

### 2. 安装 BDFDB Library

如果 Discord 提示缺少依赖，直接下载安装：

[BDFDB Library 下载页](https://mwittrien.github.io/downloader/?library)

### 3. 安装 system24 主题

你有两种方式：

- 方式 A：下载 `system24.theme.css` 后放进 `%AppData%\BetterDiscord\themes`
- 方式 B：在 BetterDiscord 主题导入里直接添加：

```text
https://refact0r.github.io/system24/build/system24.css
```

如果你想少折腾，推荐方式 B。

## 使用教程

### 基础使用

1. 打开插件设置
2. 在“翻译服务”里选择主服务商
3. 填入 API Key、Endpoint、Model
4. 点击“检测模型”或“获取模型列表”确认配置可用
5. 在“语言设置”里配置发送语言、接收语言、目标语言
6. 按需开启接收消息自动翻译

### 推荐配置

- 主服务商优先：`DeepSeek`、`Azure Translator`、`Google Cloud Translation`
- 如果你主要看外语频道，建议开启接收消息自动翻译
- 如果频道里专有名词很多，建议优先配置“保护规则”
- 如果你不想翻错链接、模型名、命令参数，建议保留自动保护规则

### 常用保护方式

- 用反引号包裹专有名词：`deepseek-chat`
- 用包裹符保护整段内容
- 用跳过前缀让整句不翻译，例如：`!`

## 仓库文件说明

- `DiscordAITranslator.plugin.js`：主插件
- `system24.theme.css`：本地打包的 system24 BetterDiscord 主题加载文件
- `安装教程.md`：安装步骤
- `使用说明.md`：详细使用说明
- `发布说明.md`：发布包与分发说明

## 开发与验证

已在本地使用下面命令做基础检查：

```powershell
node --check .\DiscordAITranslator.plugin.js
node --test .\tests\translation-regression.test.js
node --test .\tests\protection-regression.test.js
```

## 鸣谢

- 原版 Translator 插件作者：[mwittrien](https://github.com/mwittrien)
- system24 主题作者：[refact0r](https://github.com/refact0r)
