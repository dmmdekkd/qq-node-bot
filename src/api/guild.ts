import type { Guild, Channel } from '../types'
import { ApiClient } from '../core/api'

let api: ApiClient

export const GuildApi = {
  init(client: ApiClient) { api = client },

  async getGuilds(): Promise<Guild[]> {
    return api.get('/guilds')
  },
  async getGuild(guildId: string): Promise<Guild> {
    return api.get(`/guilds/${guildId}`)
  },
  async getGuildChannels(guildId: string): Promise<Channel[]> {
    return api.get(`/guilds/${guildId}/channels`)
  },
}
