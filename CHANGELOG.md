# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.2.1] - 2026-05-28
### Added
- **撤回消息功能**
  - 支持全场景撤回：频道、频道私信、群聊、单聊
  - `BotEvent.recall()` - 撤回当前消息或指定消息
  - `bot.recallMessage()` - 撤回频道消息
  - `bot.recallGroupMessage()` - 撤回群聊消息
  - `bot.recallPrivateMessage()` - 撤回单聊消息
  - `bot.recallDirectMessage()` - 撤回频道私信
  - 频道/频道私信支持 `hidetip` 参数隐藏提示小灰条

### Changed
- `e.reply()` 返回 `Promise<Message | undefined>`，支持获取消息 ID
- `ApiClient.delete()` 支持 `params` 参数

## [0.2.0] - 2026-05-28
### Added
- **引用回复功能**
  - 支持通过 `quoteReply` 参数引用原消息
  - 通过 `message_scene.ext` 中的 `msg_idx` 获取引用索引
  - 所有消息类型（频道/群聊/单聊/私信）均支持引用回复
- **BotEvent 事件对象增强**
  - 新增 `scene`、`sceneId`、`userId`、`username` 属性
  - 新增 `replyType` 属性，标识消息来源类型
  - 新增 `data` 属性，获取按钮交互数据
  - 新增 `msgIdx` 属性，获取消息引用索引
  - 支持 `e.reply()` 简写调用
- **图文组合消息**
  - 单条消息支持文本+图片组合发送
  - 频道、群聊、单聊均支持
- **互动召回消息**
  - `sendPrivateMessage` 支持 `isWakeup` 参数
- **工具函数**
  - `toObject` - JSON 安全解析
  - `md5` / `sha1` - 加密哈希计算
  - `buildMultipartBody` - FormData 构建
  - `logSendable` - 统一消息日志格式
- **消息格式化增强**
  - 图片/语音/视频/文件显示来源信息（URL/文件路径/base64/Buffer）

### Changed
- **模块化重构**
  - `bot.ts` 拆分为 `bot/dispatch.ts`（事件分发）+ `bot/reply.ts`（消息回复）
  - `api/message.ts` 拆分为 `api/message/builder.ts`（消息构建）+ `uploader.ts`（媒体上传）+ `stream.ts`（流式消息）
  - `types/message.ts` 拆分为 `types/elements.ts`（消息元素）+ `types/keyboard.ts`（按钮键盘）
- **类型系统优化**
  - 所有类型定义统一到 `types/` 目录
  - 移除 `enum`，改用联合类型 + `as const`
  - 移除动态 `import()`，改用顶部 `import type`
- **代码优化**
  - 提取公共逻辑：`uploadMedia`、`sendStreamMessage`、`sendWithFileImage`
  - 替换所有 `JSON.parse` 为 `toObject`
  - 替换所有 `createHash` 为 `md5` / `sha1`

### Removed
- 删除 `message/builder.ts`，合并到 `api/message/builder.ts`
- 移除所有动态导入语句

## [0.1.0] - 2026-05-24
### Added
- 初始版本
- Bot 主类，支持 WebSocket / Webhook / 中间件三种模式
- api/ 频道、子频道、消息、成员、权限、表态、音频、日程、帖子、自信息
- MessageBuilder 链式消息构建
- 文件上传支持
- 消息段解析
- 实体类（Guild / Channel / Member / Group / Friend）
- WebSocket 心跳 + Session 恢复
- ed25519 Webhook 签名验证
- 连接状态事件
- vitest 测试
- CI/CD (GitHub Actions)

[0.2.1]: https://github.com/dmmdekkd/qq-node-bot/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/dmmdekkd/qq-node-bot/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/dmmdekkd/qq-node-bot/releases/tag/v0.1.0
