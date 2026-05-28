import { ApiClient } from '../core/api'
import { INTERACTION_CODE } from '../types/api'
import type { InteractionCode } from '../types/api'

let api: ApiClient

export { INTERACTION_CODE }
export type { InteractionCode }

export const InteractionApi = {
  init(client: ApiClient) { api = client },

  async respond(interactionId: string, code: InteractionCode | number = INTERACTION_CODE.Success): Promise<void> {
    return api.put(`/interactions/${interactionId}`, { code })
  },
}
