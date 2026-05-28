import type { Attachment, MentionUser, MessageReference } from './message'
import type { Sendable } from './elements'
import type { EventName, BotLike } from './bot'

export interface EventAuthor {
  id?: string
  username?: string
  nick?: string
  bot?: boolean
  member_openid?: string
  user_openid?: string
  union_openid?: string
}

export interface EventPayload {
  _t?: string
  t?: string
  content?: string
  guild_id?: string
  channel_id?: string
  group_openid?: string
  group_id?: string
  author?: EventAuthor
  id?: string
  timestamp?: string
  message_type?: number
  message_scene?: { ext?: string[]; source?: string }
  msg_idx?: string
  attachments?: Attachment[]
  mentions?: MentionUser[]
  message_reference?: MessageReference
  member?: { nick?: string; joined_at?: string; roles?: string[] }
  seq?: number
  seq_in_channel?: string
  chat_type?: number
  scene?: string
  type?: number
  user_openid?: string
  group_member_openid?: string
  data?: {
    type?: number
    resolved?: {
      button_data?: string
      button_id?: string
      user_id?: string
      feature_id?: string
      message_id?: string
    }
  }
  version?: number
  application_id?: string
}

export type ReplyType = 'channel' | 'group' | 'private' | 'direct' | 'none'

export type EventCategory = 'message' | 'notice' | 'audio' | 'audit' | 'interaction'

export interface EventDefinition {
  name: EventName
  scene: string
  replyType: ReplyType
  category: EventCategory
}

export interface EventInfo {
  scene: string
  sceneId: string
  userId: string
  username: string
  content: string
  channelId?: string
  replyType: ReplyType
  msgId?: string
  eventId?: string
  msgIdx?: string
}

export interface EventContext<T = unknown> {
  event: T
  bot: BotLike
  reply: (content: Sendable) => Promise<void>
  type: EventName
  timestamp: number
}