import type { Thread } from '../types'
import type { CreateThreadPayload } from '../types/api'
import { ApiClient } from '../core/api'

let api: ApiClient

export const ThreadApi = {
  init(client: ApiClient) { api = client },

  async getThreads(channelId: string): Promise<Thread[]> {
    return api.get(`/channels/${channelId}/threads`)
  },
  async createThread(channelId: string, data: CreateThreadPayload): Promise<Thread> {
    return api.post(`/channels/${channelId}/threads`, data)
  },
  async deleteThread(channelId: string, threadId: string): Promise<void> {
    return api.delete(`/channels/${channelId}/threads/${threadId}`)
  },
}
