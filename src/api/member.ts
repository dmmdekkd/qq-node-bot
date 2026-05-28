import type { Member } from '../types'
import { ApiClient } from '../core/api'

let api: ApiClient

export const MemberApi = {
  init(client: ApiClient) { api = client },

  async getGuildMembers(guildId: string): Promise<Member[]> {
    return api.get(`/guilds/${guildId}/members`)
  },
  async getGuildMember(guildId: string, userId: string): Promise<Member> {
    return api.get(`/guilds/${guildId}/members/${userId}`)
  },
  async muteMember(guildId: string, userId: string, seconds: string): Promise<void> {
    return api.patch(`/guilds/${guildId}/members/${userId}/mute`, {
      mute_seconds: seconds,
    })
  },
  async kickMember(guildId: string, userId: string): Promise<void> {
    return api.delete(`/guilds/${guildId}/members/${userId}`)
  },
}
