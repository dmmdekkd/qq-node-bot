import type { BotEvent } from '../event'
import type { StatusEvent, EventDefinition } from '../types'

export type BotHandler = (data: BotEvent | StatusEvent) => void

export type EventEntry = Omit<EventDefinition, 'replyType'>

export interface MemberData {
  user?: { id?: string; username?: string }
}
