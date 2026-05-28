import type { Guild as GuildData, Sendable, BotLike } from '../types'

export class Guild {
  constructor(private data: GuildData, private bot: BotLike) {}

  get id(): string { return this.data.id }
  get name(): string { return this.data.name }
  get memberCount(): number { return this.data.member_count }

  channels() { return this.bot.getGuildChannels(this.id) }
  members() { return this.bot.getGuildMembers(this.id) }
}
