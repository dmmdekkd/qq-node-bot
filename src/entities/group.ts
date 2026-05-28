import type { Sendable, BotLike } from '../types'

export class Group {
  constructor(private openid: string, private bot: BotLike) {}

  send(content: Sendable) { return this.bot.sendGroupMessage(this.openid, content) }
}
