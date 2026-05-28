import type { GroupMember } from '../types/api'
import { ApiClient } from '../core/api'

let api: ApiClient

export const GroupApi = {
  init(client: ApiClient) { api = client },

  async getGroupMember(groupOpenid: string, memberOpenid: string): Promise<GroupMember> {
    return api.get(`/v2/groups/${groupOpenid}/members/${memberOpenid}`)
  },
  async getGroupMembers(groupOpenid: string): Promise<GroupMember[]> {
    return api.get(`/v2/groups/${groupOpenid}/members`)
  },
}
