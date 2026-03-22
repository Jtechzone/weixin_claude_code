# weixin-claude-code

微信 Channel 插件 for Claude Code —— 通过微信与 Claude Code 双向通信。

基于 [`@tencent-weixin/openclaw-weixin`](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin) v1.0.2 的通信层移植，适配 Claude Code 的 [Channel](https://docs.anthropic.com/en/docs/claude-code/channels) 功能实现。

[English](./README_EN.md)

## 功能

- 在微信中给 Claude Code 发消息，Claude 直接在终端中处理并回复到微信
- 支持文本、图片、语音、视频、文件等全媒体类型
- 微信扫码登录，零配置即用
- 收到消息时自动显示"对方正在输入..."状态
- Claude 回复自动转为纯文本（微信不支持 Markdown）

## 前置要求

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) v2.1.80+
- [Bun](https://bun.sh/) 运行时
- claude.ai 账号登录（不支持 API Key 认证）

## 安装

```bash
# 1. 添加插件源
/plugin marketplace add Dcatfly/weixin_claude_code

# 2. 安装插件
/plugin install weixin-claude-code@Dcatfly-weixin_claude_code
```

## 使用

### 启动

```bash
claude --dangerously-load-development-channels plugin:weixin-claude-code@weixin-claude-code
```

> 自定义 Channel 目前处于研究预览阶段，需要使用 `--dangerously-load-development-channels` 标志启动。

### 首次登录

启动后 Claude 会提示你调用 `login` 工具，扫描二维码完成微信连接：

1. Claude 调用 login 工具，展示二维码（如被折叠按 `ctrl+o` 展开）
2. 用微信扫描二维码
3. 在微信中确认登录
4. 连接成功，开始收发消息

### 收发消息

连接成功后，你在微信中发送的消息会实时推送到 Claude Code 会话中。Claude 处理后通过 `reply` 工具将回复发回微信。

**发送文本**：直接在微信中输入文字

**发送媒体**：支持发送图片、语音、视频、文件，Claude 会下载并处理

**接收回复**：Claude 的回复会自动转为纯文本发送到微信

### 可用工具

| 工具 | 说明 |
|------|------|
| `login` | 发起微信扫码登录 |
| `reply` | 回复微信消息（支持文本和媒体） |
| `status` | 查询当前连接状态 |
| `logout` | 登出微信并清除凭证 |

### 登出

在 Claude Code 中调用 `logout` 工具即可断开微信连接并清除本地凭证。

## 工作原理

```
微信用户 <-> 微信服务器 <-> iLink Bot API <-> [本插件 MCP Server] <-> Claude Code
```

插件作为 MCP Channel 服务器运行，通过 iLink Bot API 的 long-poll 机制接收微信消息，然后以 Channel notification 的形式推送到 Claude Code 会话中。Claude 通过 reply 工具将回复发回微信。

## 局限性

- **仅接受登录者自己的消息** —— 其他人发的消息和群消息会被过滤，这是安全设计
- **不支持 Claude Code 原生命令** —— 微信消息是作为对话内容处理的，无法触发 `/clear`、`/compact` 等 CLI 命令
- **Session 过期需手动重新登录** —— 微信 session 过期后需要重新调用 `login` 扫码
- **Channel 功能处于研究预览阶段** —— 需要 `--dangerously-load-development-channels` 标志
- **需要 claude.ai 登录** —— 不支持 Console 或 API Key 认证
- **二维码显示可能被折叠** —— 在 Claude Code 中按 `ctrl+o` 展开查看

## 数据存储

凭证和同步数据存储在 `~/.claude/channels/wechat/` 目录下：

```
~/.claude/channels/wechat/
├── accounts.json              # 账号列表
├── accounts/<id>.json         # 登录凭证（仅所有者可读）
└── sync/<id>.sync.json        # 消息同步断点
```

登出时所有数据会被自动清除。

## 许可证

MIT
