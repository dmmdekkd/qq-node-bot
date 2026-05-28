import type { Attachment } from './message'

export interface Guild {
  id: string
  name: string
  description?: string
  icon?: string
  owner_id: string
  member_count: number
  created_at: string
}

export interface Channel {
  id: string
  guild_id: string
  name: string
  type: number
  parent_id?: string
  position?: number
}

export interface Member {
  user: User
  joined_at: string
  roles: string[]
}

export interface User {
  id: string
  username: string
  avatar?: string
  bot: boolean
}

export interface Message {
  id: string
  channel_id?: string
  guild_id?: string
  group_openid?: string
  author: User
  content: string
  timestamp: string
  attachments?: Attachment[]
}

export interface ChannelPermissions {
  channel_id: string
  user_id: string
  permissions: string
}

export interface Schedule {
  id: string
  channel_id: string
  name: string
  description?: string
  start_time: string
  end_time: string
  creator: { id: string }
}

export interface Thread {
  id: string
  channel_id: string
  title: string
  content: string
  author: { id: string }
  created_at: string
}