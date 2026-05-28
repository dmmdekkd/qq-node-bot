import type { Sendable, BotLike } from '../types'

export class Friend {
  constructor(private openid: string, private bot: BotLike) {}

  send(content: Sendable) { return this.bot.sendPrivateMessage(this.openid, content) }
}
