import type { Sendable } from './elements'
import type { Message, Channel, Member } from './guild'
import type { EventPayload } from './event'

export interface BotConfig {
  appid: string
  secret: string
  sandbox?: boolean
  intents: Intent[]
  mode: 'websocket' | 'webhook' | 'middleware'
  port?: number
  path?: string
  maxRetry?: number
  timeout?: number
  logLevel?: LogLevel
  removeAt?: boolean
}

export type Intent =
  | 'GUILDS'
  | 'GUILD_MEMBERS'
  | 'GUILD_MESSAGES'
  | 'GUILD_MESSAGE_REACTIONS'
  | 'DIRECT_MESSAGE'
  | 'GROUP_AND_C2C_EVENT'
  | 'INTERACTION'
  | 'MESSAGE_AUDIT'
  | 'FORUMS_EVENT'
  | 'AUDIO_ACTION'
  | 'PUBLIC_GUILD_MESSAGES'

export type EventName =
  | 'message'
  | 'guild.message'
  | 'guild.at'
  | 'guild.member.add'
  | 'guild.member.remove'
  | 'group.message'
  | 'group.at'
  | 'private.message'
  | 'private.at'
  | 'direct.message'
  | 'reaction.add'
  | 'reaction.remove'
  | 'audio.start'
  | 'audio.stop'
  | 'message.audit.pass'
  | 'message.audit.reject'
  | 'interaction.create'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

export interface StatusEvent {
  status: ConnectionStatus
  timestamp: number
  error?: Error
  user?: SelfInfo
}

export interface SelfInfo {
  id?: string
  username?: string
  share_url?: string
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

export interface BotLike {
  config: BotConfig
  logger: LoggerLike
  api: ApiLike
  getToken(): Promise<string>
  sendMessage(channelId: string, content: Sendable, msgId?: string): Promise<Message>
  sendGroupMessage(groupOpenid: string, content: Sendable, msgId?: string, eventId?: string): Promise<Message>
  sendPrivateMessage(userOpenid: string, content: Sendable, msgId?: string, eventId?: string): Promise<Message>
  sendDirectMessage(guildId: string, content: Sendable, msgId?: string): Promise<Message>
  getGuildChannels(guildId: string): Promise<Channel[]>
  getGuildMembers(guildId: string): Promise<Member[]>
  muteMember(guildId: string, userId: string, seconds: string): Promise<void>
  kickMember(guildId: string, userId: string): Promise<void>
  deleteChannel(channelId: string): Promise<void>
}

export interface ApiLike {
  get<T = unknown>(path: string, params?: Record<string, unknown>): Promise<T>
  post<T = unknown>(path: string, data?: unknown, config?: unknown): Promise<T>
  put<T = unknown>(path: string, data?: unknown): Promise<T>
  patch<T = unknown>(path: string, data?: unknown): Promise<T>
  delete<T = unknown>(path: string): Promise<T>
}

export interface LoggerLike {
  readonly ns: string
  debug(...args: unknown[]): void
  info(...args: unknown[]): void
  warn(...args: unknown[]): void
  error(...args: unknown[]): void
  child(ns: string): LoggerLike
}

export interface Transport {
  connect(): Promise<void>
  disconnect(): Promise<void>
  on(event: 'event', handler: (payload: EventPayload) => void): void
  on(event: 'status', handler: (status: StatusEvent) => void): void
}