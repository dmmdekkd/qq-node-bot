import type { AudioAction } from '../types'
import { ApiClient } from '../core/api'

let api: ApiClient

export const AudioApi = {
  init(client: ApiClient) { api = client },

  async controlAudio(channelId: string, action: AudioAction): Promise<void> {
    return api.post(`/channels/${channelId}/audio`, action)
  },
}
