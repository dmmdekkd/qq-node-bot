import type { Channel as ChannelData, Sendable, BotLike } from '../types'

export class Channel {
  constructor(private data: ChannelData, private bot: BotLike) {}

  get id(): string { return this.data.id }
  get name(): string { return this.data.name }

  send(content: Sendable) { return this.bot.sendMessage(this.id, content) }
  delete() { return this.bot.deleteChannel(this.id) }
}
