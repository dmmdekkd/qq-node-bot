import type { KeyboardRowData } from './keyboard'

export interface Attachment {
  content_type?: string
  type?: 'image' | 'voice' | 'video' | 'file'
  url: string
  size?: number
  name?: string
  filename?: string
  width?: number
  height?: number
  duration?: number
  id?: string
}

export interface MentionUser {
  id: string
  username?: string
  avatar?: string
  bot?: boolean
  member_openid?: string
  user_openid?: string
  union_openid?: string
}

export interface Quotable {
  id?: string
  event_id?: string
}

export interface MessageReference {
  message_id: string
}

export interface ArkMessage {
  template_id: number
  params: { key: string; value: string }[]
}

export interface EmbedMessage {
  title: string
  prompt?: string
  thumbnail?: string
  fields: { name: string; value: string }[]
}

export interface MarkdownMessage {
  content: string
  custom_template_id?: string
  params?: { key: string; value: string }[]
}

export interface KeyboardMessage {
  id?: string
  content?: {
    rows: KeyboardRowData[]
  }
}
