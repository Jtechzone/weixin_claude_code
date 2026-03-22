# 微信 Claude Code Channel 设计文档

## 概述

将 `@tencent-weixin/openclaw-weixin` 的微信通信层移植为 Claude Code Channel MCP 服务器，实现微信与 Claude Code 的双向消息通信。

## 目标

- 微信消息（文本、图片、语音、视频、文件）以 `<channel>` 通知的形式到达 Claude Code 会话
- Claude 通过 `reply` MCP 工具回复，支持文本和媒体
- 扫码登录、零配置安全（仅接受登录者消息）、凭证存储在 `~/.claude/channels/wechat/`

## 架构

```
微信用户 <-> iLink Bot API (HTTP) <-> [MCP Channel 服务器 (stdio)] <-> Claude Code
```

MCP 服务器作为 Claude Code 的 stdio 子进程运行。通过对 iLink Bot API（`https://ilinkai.weixin.qq.com`）的 long-poll 循环接收入站消息，通过 MCP 工具处理出站回复。

## 项目结构

```
weixin_claw/
├── src/
│   ├── index.ts              # 入口：MCP Server + long-poll 启动
│   ├── mcp-server.ts         # MCP Channel 服务器定义 + 工具注册
│   ├── poll-loop.ts          # 微信 getUpdates long-poll 循环
│   ├── auth/
│   │   ├── accounts.ts       # 账号存储 (~/.claude/channels/wechat/)
│   │   └── login-qr.ts       # 扫码登录流程
│   ├── api/
│   │   ├── api.ts            # HTTP 通信层 (iLink Bot API)
│   │   └── types.ts          # 协议类型定义
│   ├── cdn/
│   │   ├── aes-ecb.ts        # AES-128-ECB 加解密
│   │   ├── cdn-upload.ts     # CDN 上传逻辑
│   │   ├── cdn-url.ts        # CDN URL 构建
│   │   ├── pic-decrypt.ts    # 图片解密
│   │   └── upload.ts         # 上传编排
│   ├── media/
│   │   ├── media-download.ts # 从微信 CDN 下载媒体
│   │   ├── mime.ts           # MIME 类型判断
│   │   └── silk-transcode.ts # 语音转码 (silk -> wav)
│   ├── messaging/
│   │   ├── inbound.ts        # 入站消息标准化
│   │   ├── send.ts           # 发送文本消息
│   │   └── send-media.ts     # 发送媒体消息
│   └── util/
│       ├── logger.ts         # 日志
│       ├── random.ts         # ID 生成
│       └── redact.ts         # Token/消息体脱敏
├── vendor/                   # 原始 openclaw-weixin 源码（仅供参考）
├── package.json
└── tsconfig.json
```

### 代码复用策略

从 `vendor/package/src/` 复制源文件到 `src/`，然后做适配修改：

- **直接复用**（改动极小）：`api/api.ts`、`api/types.ts`、`cdn/*`、`messaging/send.ts`、`messaging/send-media.ts`、`media/mime.ts`、`media/silk-transcode.ts`、`util/*`
- **适配修改**（去除 `openclaw/plugin-sdk` 依赖，更改存储路径）：`auth/accounts.ts`、`auth/login-qr.ts`、`media/media-download.ts`、`messaging/inbound.ts`
- **全新编写**：`index.ts`、`mcp-server.ts`、`poll-loop.ts`

## 数据流

### 入站（微信 → Claude）

1. `poll-loop` 调用 `ilink/bot/getupdates`（HTTP long-poll，35 秒超时）
2. 过滤消息：仅接受 `msg.from_user_id === savedUserId`（登录用户）
3. 如果消息包含媒体（图片/语音/视频/文件），从微信 CDN 下载到本地临时目录并解密
4. 发送 MCP notification：
   ```
   method: 'notifications/claude/channel'
   params:
     content: <文本内容>
     meta:
       chat_id: <from_user_id>
       sender: <from_user_id>
       media_path: <本地文件路径，如有媒体>
       media_type: <MIME 类型，如有媒体>
   ```
5. 缓存消息中的 `context_token`（以 chat_id 为键），用于出站回复

### 出站（Claude → 微信）

1. Claude 调用 `reply` 工具，传入 `chat_id`、`text`，可选 `media_path`
2. 查找缓存的 `context_token`
3. 纯文本：直接调用 `ilink/bot/sendmessage`
4. 带媒体：AES-128-ECB 加密文件 → 从 `ilink/bot/getuploadurl` 获取预签名上传地址 → 上传到微信 CDN → 发送引用 CDN 资源的消息

## MCP 工具

### `reply` — 回复微信消息

```typescript
{
  name: 'reply',
  inputSchema: {
    properties: {
      chat_id: { type: 'string', description: '目标用户 ID（从 <channel> 标签的 chat_id 属性获取）' },
      text: { type: 'string', description: '回复文本内容' },
      media_path: { type: 'string', description: '可选，本地文件绝对路径（图片/视频/文件）' },
    },
    required: ['chat_id', 'text'],
  },
}
```

### `login` — 发起微信扫码登录

```typescript
{
  name: 'login',
  inputSchema: { properties: {} },
}
```

### `status` — 查询连接状态

```typescript
{
  name: 'status',
  inputSchema: { properties: {} },
}
```

### Instructions（系统指令）

> 微信消息以 `<channel source="wechat" chat_id="..." sender="...">` 格式到达。文本内容在标签体内，媒体附件通过 media_path 属性指向本地临时文件。用 reply 工具回复，传入 chat_id。如需发送文件，设置 media_path 为本地文件绝对路径。

## 认证与登录

### 首次登录

1. Claude Code 启动 Channel → MCP 服务器启动
2. 检查 `~/.claude/channels/wechat/accounts/` 下是否有已保存的凭证
3. **有凭证** → 直接启动 long-poll 循环
4. **无凭证** → 发送 notification 提醒用户调用 `login` 工具
5. `login` 工具 → 请求 iLink API 获取二维码 → 返回二维码 URL 给 Claude → Claude 展示给用户
6. 后台轮询扫码状态 → 确认后保存 `bot_token` + `userId` 到 `~/.claude/channels/wechat/accounts/<accountId>.json`
7. 自动启动 long-poll

### 会话过期

- iLink API 返回 errcode `-14` → session 过期
- 暂停 long-poll，发 notification 通知用户连接已断开
- 用户调用 `login` 工具重新认证

## 存储结构

```
~/.claude/channels/wechat/
├── accounts.json           # 账号 ID 列表
├── accounts/
│   └── <accountId>.json    # { token, baseUrl, userId, savedAt }
└── sync/
    └── <accountId>.buf     # getUpdates 的 get_updates_buf 断点
```

## 安全门控

- 扫码登录时，iLink API 返回 `ilink_user_id`（扫码人的微信 ID）
- 保存到 `accounts/<accountId>.json` 的 `userId` 字段
- 每条入站消息检查 `msg.from_user_id === savedUserId`
- 不匹配则静默丢弃，不发送 notification 给 Claude
- 零配置，扫码即生效

## 错误处理

| 场景 | 处理方式 |
|------|----------|
| long-poll 超时 | 正常行为，立即重试 |
| 连续 3 次 API 失败 | 退避 30 秒后重试 |
| session 过期 (errcode -14) | 暂停 poll，通知用户重新登录 |
| 媒体下载/上传失败 | 通知 Claude 失败原因，文本消息正常送达 |
| MCP 连接断开 | 进程退出，由 Claude Code 重新拉起 |

## 依赖

- `@modelcontextprotocol/sdk` — MCP 服务器实现
- `qrcode-terminal` — 终端二维码显示
- `zod` — Schema 校验
- `typescript`（dev）— 类型检查与编译

运行时要求：Node.js >= 22（原生 fetch）。

## iLink Bot API 端点

| 端点 | 用途 |
|------|------|
| `ilink/bot/get_bot_qrcode` | 获取登录二维码 |
| `ilink/bot/get_qrcode_status` | 轮询扫码状态 |
| `ilink/bot/getupdates` | Long-poll 接收入站消息 |
| `ilink/bot/sendmessage` | 发送消息 |
| `ilink/bot/sendtyping` | 发送输入状态指示 |
| `ilink/bot/getconfig` | 获取 bot 配置 |
| `ilink/bot/getuploadurl` | 获取 CDN 预签名上传地址 |
