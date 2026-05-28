export interface GuildMessageEvent {
  id: string; channel_id: string; guild_id: string
  author: { id: string; username: string; avatar?: string }
  content: string; timestamp: string
}

export interface GroupAtEvent {
  id: string; group_openid: string
  author: { user_openid: string; username: string }
  content: string; timestamp: string
}

export interface GroupMessageEvent {
  id: string; group_openid: string
  author: { member_openid: string; username: string }
  content: string; timestamp: string
}

export interface C2CMessageEvent {
  id: string; author: { user_openid: string }
  content: string; timestamp: string
}

export interface DirectMessageEvent {
  id: string; channel_id: string; guild_id: string
  author: { id: string; username: string }
  content: string; timestamp: string
}

export interface GuildMemberAddEvent {
  guild_id: string; joined_at: string
  user: { id: string; username: string }
}

export interface GuildMemberRemoveEvent {
  guild_id: string; user: { id: string; username: string }
}

export interface MessageAuditPassEvent {
  audit_id: string; message_id: string; channel_id: string
}

export interface MessageAuditRejectEvent {
  audit_id: string; message_id: string; channel_id: string; reason: string
}
