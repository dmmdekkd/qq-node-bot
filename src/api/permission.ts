import type { ChannelPermissions } from '../types'
import type { UpdatePermissionsPayload } from '../types/api'
import { ApiClient } from '../core/api'

let api: ApiClient

export const PermissionApi = {
  init(client: ApiClient) { api = client },

  async getPermissions(channelId: string, userId: string): Promise<ChannelPermissions> {
    return api.get(`/channels/${channelId}/members/${userId}/permissions`)
  },
  async updatePermissions(
    channelId: string,
    userId: string,
    payload: UpdatePermissionsPayload,
  ): Promise<void> {
    return api.put(`/channels/${channelId}/members/${userId}/permissions`, payload)
  },
}
