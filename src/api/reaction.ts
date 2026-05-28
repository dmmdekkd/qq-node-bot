import { ApiClient } from '../core/api'

let api: ApiClient

export const ReactionApi = {
  init(client: ApiClient) { api = client },

  async addReaction(channelId: string, msgId: string, emoji: string): Promise<void> {
    return api.put(`/channels/${channelId}/messages/${msgId}/reactions/${encodeURIComponent(emoji)}`)
  },
  async removeReaction(channelId: string, msgId: string, emoji: string): Promise<void> {
    return api.delete(`/channels/${channelId}/messages/${msgId}/reactions/${encodeURIComponent(emoji)}`)
  },
}
