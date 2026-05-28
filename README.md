# qq-node-bot

QQ 官方机器人开发 SDK，基于 Node.js 实现。

## 特性

- 支持 WebSocket / Webhook / 中间件三种连接模式
- 频道、群聊、单聊、私信消息发送
- 引用回复
- 流式消息发送
- 互动召回
- 表情表态
- 音频控制
- 日程管理
- 帖子管理
- 权限管理

### 消息段支持

- 文本消息
- 图片消息
- 图文消息
- 视频消息
- 语音消息
- 文件消息
- 表情消息
- 按钮消息
- Markdown消息
- Ark消息
- Embed消息

## 安装

```bash
npm install qq-node-bot
# 或
pnpm add qq-node-bot
```

## 快速开始

```typescript
import { Bot, segment } from 'qq-node-bot'

const bot = new Bot({
  appId: 'YOUR_APP_ID',
  token: 'YOUR_TOKEN',
  intents: ['GROUP_AT_MESSAGE_CREATE', 'C2C_MESSAGE_CREATE'],
})

bot.on('GROUP_AT_MESSAGE_CREATE', async (e) => {
  await e.reply('Hello!')
})

bot.start()
```

## 发送消息

```typescript
// 文本消息
await e.reply('Hello!')

// 图片消息
await e.reply(segment.image('https://example.com/img.png'))

// 图文组合
await e.reply([
  segment.text('这是一张图片：'),
  segment.image('https://example.com/img.png')
])

// 引用回复
await e.reply('收到！', true)

// 按钮消息
await e.reply([
  segment.text('请选择：'),
  segment.button({
    id: 'btn1',
    render_data: { label: '点击我', visited_label: '已点击' },
    action: { type: 2, permission: { type: 2 } }
  })
])
```

## 主动消息

```typescript
// 发送群消息
await bot.sendGroupMessage(groupOpenid, 'Hello!')

// 发送私聊消息
await bot.sendPrivateMessage(userOpenid, 'Hello!')

// 发送频道消息
await bot.sendMessage(channelId, 'Hello!')

// 发送私信
await bot.sendDirectMessage(guildId, 'Hello!')
```

## 事件监听

```typescript
bot.on('GROUP_MESSAGE_CREATE', async (e) => {
  console.log(e.content)      // 消息内容
  console.log(e.groupOpenid)  // 群 openid
  console.log(e.userId)       // 用户 openid
  console.log(e.replyType)    // 回复类型
})

// 频道消息
bot.on('GUILD_MESSAGE_CREATE', async (e) => {
  console.log(e.guildId)      // 频道 ID
  console.log(e.channelId)    // 子频道 ID
})

// 私聊消息
bot.on('C2C_MESSAGE_CREATE', async (e) => {
  await e.reply('收到私聊消息')
})

// 成员加入
bot.on('GUILD_MEMBER_ADD', async (e) => {
  console.log(e.guildId)
})
```

## API

```typescript
// 获取频道列表
const guilds = await bot.getSelfGuilds()

// 获取频道成员
const members = await bot.getGuildMembers(guildId)

// 获取群成员
const member = await bot.getGroupMember(groupOpenid, userOpenid)

// 添加表态
await bot.addReaction(channelId, messageId, emoji)

// 创建日程
await bot.createSchedule(channelId, schedule)

// 获取帖子
await bot.getThreads(guildId)
```

## 许可证

MIT
