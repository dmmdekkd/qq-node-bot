import type { BotLike } from '../types'
import type { MemberData } from '../types/internal'

export class Member {
  constructor(private data: MemberData, private guildId: string, private bot: BotLike) {}

  get userId(): string { return this.data.user?.id ?? '' }
  get username(): string { return this.data.user?.username ?? '' }

  mute(seconds: string) { return this.bot.muteMember(this.guildId, this.userId, seconds) }
  kick() { return this.bot.kickMember(this.guildId, this.userId) }
}
