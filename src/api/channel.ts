import type { Channel } from '../types'
import type { CreateChannelPayload, UpdateChannelPayload } from '../types/api'
import { ApiClient } from '../core/api'

let api: ApiClient

export const ChannelApi = {
  init(client: ApiClient) { api = client },

  async getChannel(channelId: string): Promise<Channel> {
    return api.get(`/channels/${channelId}`)
  },
  async createChannel(guildId: string, data: CreateChannelPayload): Promise<Channel> {
    return api.post(`/guilds/${guildId}/channels`, data)
  },
  async updateChannel(channelId: string, data: UpdateChannelPayload): Promise<Channel> {
    return api.patch(`/channels/${channelId}`, data)
  },
  async deleteChannel(channelId: string): Promise<void> {
    return api.delete(`/channels/${channelId}`)
  },
}
