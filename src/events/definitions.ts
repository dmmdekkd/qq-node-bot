import type { EventCategory, EventDefinition, EventName, ReplyType } from '../types'
import type { EventEntry } from '../types/internal'

const EVENT_GROUPS: Record<ReplyType | 'none', Record<string, EventEntry>> = {
  channel: {
    'AT_MESSAGE_CREATE':             { name: 'guild.at', scene: '频道@', category: 'message' },
    'GUILD_MESSAGE_CREATE':          { name: 'guild.message', scene: '频道', category: 'message' },
    'GUILD_MEMBER_ADD':              { name: 'guild.member.add', scene: '成员加入', category: 'notice' },
    'GUILD_MEMBER_REMOVE':           { name: 'guild.member.remove', scene: '成员离开', category: 'notice' },
    'GUILD_MESSAGE_REACTION_ADD':    { name: 'reaction.add', scene: '表情添加', category: 'notice' },
    'GUILD_MESSAGE_REACTION_REMOVE': { name: 'reaction.remove', scene: '表情移除', category: 'notice' },
    'MESSAGE_AUDIT_PASS':            { name: 'message.audit.pass', scene: '审核通过', category: 'audit' },
    'MESSAGE_AUDIT_REJECT':          { name: 'message.audit.reject', scene: '审核拒绝', category: 'audit' },
    'AUDIO_START':                   { name: 'audio.start', scene: '音频开始', category: 'audio' },
    'AUDIO_STOP':                    { name: 'audio.stop', scene: '音频停止', category: 'audio' },
  },
  group: {
    'GROUP_AT_MESSAGE_CREATE':       { name: 'group.at', scene: '群聊@', category: 'message' },
    'GROUP_MESSAGE_CREATE':          { name: 'group.message', scene: '群聊', category: 'message' },
  },
  private: {
    'C2C_MESSAGE_CREATE':            { name: 'private.message', scene: '好友', category: 'message' },
    'C2C_AT_MESSAGE_CREATE':         { name: 'private.at', scene: '好友@', category: 'message' },
  },
  direct: {
    'DIRECT_MESSAGE_CREATE':         { name: 'direct.message', scene: '私信', category: 'message' },
  },
  none: {
    'INTERACTION_CREATE':            { name: 'interaction.create', scene: '交互', category: 'interaction' },
  },
}

export const EVENT_DEFINITIONS: Record<string, EventDefinition> = {}
for (const [replyType, events] of Object.entries(EVENT_GROUPS)) {
  for (const [eventType, def] of Object.entries(events)) {
    EVENT_DEFINITIONS[eventType] = { ...def, replyType: replyType as ReplyType }
  }
}

export const EVENT_BY_NAME: Record<string, EventDefinition> = {}
for (const def of Object.values(EVENT_DEFINITIONS)) {
  EVENT_BY_NAME[def.name] = def
}

export const MESSAGE_EVENTS = new Set<EventName>(
  Object.values(EVENT_DEFINITIONS)
    .filter(def => def.category === 'message')
    .map(def => def.name),
)

export const EVENTS_BY_CATEGORY: Record<EventCategory, EventName[]> = {
  message: [],
  notice: [],
  audio: [],
  audit: [],
  interaction: [],
}
for (const def of Object.values(EVENT_DEFINITIONS)) {
  EVENTS_BY_CATEGORY[def.category].push(def.name)
}

export function resolveEventType(payload: { _t?: string; t?: string; group_openid?: string; guild_id?: string; channel_id?: string; author?: { user_openid?: string } }): EventName | null {
  const eventType = payload._t ?? payload.t
  if (eventType && EVENT_DEFINITIONS[eventType]) {
    return EVENT_DEFINITIONS[eventType].name
  }
  if (payload.group_openid) return 'group.message'
  if (payload.guild_id || payload.channel_id) return 'guild.message'
  if (payload.author?.user_openid) return 'private.message'
  return null
}
