export { Bot } from './bot'
export { BotEvent } from './event'
export type { BotConfig, EventName, EventContext, Sendable, ConnectionStatus, StatusEvent, Quotable } from './types'

export * as GuildApi from './api/guild'
export * as ChannelApi from './api/channel'
export * as MessageApi from './api/message'
export * as MemberApi from './api/member'
export * as PermissionApi from './api/permission'
export * as ReactionApi from './api/reaction'
export * as AudioApi from './api/audio'
export * as ScheduleApi from './api/schedule'
export * as ThreadApi from './api/thread'
export * as SelfApi from './api/self'
export * as GroupApi from './api/group'

export { parseMessage } from './message/parser'
export { segment } from './segment'
export type { Segment, TextSegment, FaceSegment, ImageSegment,
  VoiceSegment, VideoSegment, FileSegment, ReplySegment,
  ButtonSegment,
  MarkdownSegment, ArkSegment, EmbedSegment } from './types/elements'

export { Guild, Channel, Member, Group, Friend } from './entities'

export type {
  GuildMessageEvent, GroupAtEvent, GroupMessageEvent,
  C2CMessageEvent, DirectMessageEvent,
  GuildMemberAddEvent, GuildMemberRemoveEvent,
  MessageAuditPassEvent, MessageAuditRejectEvent,
} from './events'