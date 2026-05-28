import type { User, Guild } from '../types'
import { ApiClient } from '../core/api'

let api: ApiClient

export const SelfApi = {
  init(client: ApiClient) { api = client },

  async getSelf(): Promise<User> {
    return api.get('/users/@me')
  },
  async getSelfGuilds(): Promise<Guild[]> {
    return api.get('/users/@me/guilds')
  },
}
