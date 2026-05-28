import type { EventPayload, EventInfo, EventName, ReplyType, Message } from '../types'
import type { MutableLoggerApi } from '../types'
import type { Sendable } from '../types/elements'
import type { RecallOptions } from '../types/api'
import { EVENT_BY_NAME, MESSAGE_EVENTS, resolveEventType } from '../events'
import { parseMessage, formatSegments } from '../message/parser'
import { BotEvent } from '../event'
import type { BotHandler } from '../types/internal'
import { MessageApi } from '../api/message'

export interface DispatcherContext {
  logger: MutableLoggerApi
  handlers: Map<string, Set<BotHandler>>
  replyByEvent: (info: EventInfo, content: Sendable, quoteReply?: boolean) => Promise<Message | undefined>
  acknowledgeInteraction: (payload: EventPayload) => Promise<void>
}

export function normalizePayload(payload: EventPayload): void {
  if (!payload.msg_idx && payload.message_scene?.ext) {
    const prefix = 'msg_idx='
    for (const item of payload.message_scene.ext) {
      if (item.startsWith(prefix)) {
        payload.msg_idx = item.substring(prefix.length)
        break
      }
    }
  }
}

export function resolveEvent(payload: EventPayload): EventName {
  const result = resolveEventType(payload)
  if (result) return result
  return 'guild.message'
}

export function extractEventInfo(eventName: string, payload: EventPayload): EventInfo {
  if (eventName === 'interaction.create') {
    return extractInteractionInfo(payload)
  }

  const author = payload.author
  const def = EVENT_BY_NAME[eventName]
  const scene = def?.scene ?? eventName
  const replyType = def?.replyType ?? 'channel'
  const userId = author?.id || author?.member_openid || author?.user_openid || ''
  const username = author?.username || author?.nick || payload.member?.nick || ''
  const content = payload.content ?? ''
  const { sceneId, channelId } = extractSceneIds(replyType, payload)
  return { scene, sceneId, userId, username, content, channelId, replyType, msgId: payload.id, msgIdx: payload.msg_idx }
}

function extractInteractionInfo(payload: EventPayload): EventInfo {
  const chatType = payload.chat_type
  const sceneLabel = payload.scene === 'c2c' ? '好友交互' : payload.scene === 'group' ? '群聊交互' : '频道交互'

  let replyType: ReplyType
  let sceneId = ''
  let channelId: string | undefined
  let userId = ''
  let username = ''

  switch (chatType) {
    case 0:
      replyType = 'channel'
      sceneId = payload.guild_id && payload.channel_id ? `${payload.guild_id}/${payload.channel_id}` : ''
      channelId = payload.channel_id
      userId = payload.data?.resolved?.user_id ?? ''
      break
    case 1:
      replyType = 'group'
      sceneId = payload.group_openid ?? ''
      userId = payload.group_member_openid ?? ''
      break
    case 2:
      replyType = 'private'
      userId = payload.user_openid ?? ''
      break
    default:
      replyType = 'none'
  }

  const buttonData = payload.data?.resolved?.button_data ?? ''
  const buttonId = payload.data?.resolved?.button_id ?? ''
  const content = buttonId ? `[按钮: ${buttonId}]${buttonData ? ` ${buttonData}` : ''}` : buttonData

  return { scene: sceneLabel, sceneId, userId, username, content, channelId, replyType, msgId: undefined }
}

function extractSceneIds(replyType: ReplyType, payload: EventPayload): { sceneId: string; channelId?: string } {
  switch (replyType) {
    case 'channel':
      return { sceneId: payload.guild_id && payload.channel_id ? `${payload.guild_id}/${payload.channel_id}` : '', channelId: payload.channel_id }
    case 'direct':
      return { sceneId: payload.guild_id ?? '' }
    case 'group':
      return { sceneId: payload.group_openid ?? '' }
    case 'private':
    case 'none':
      return { sceneId: '' }
  }
}

function createRecallFn(info: EventInfo, payload: EventPayload): ((msgId: string) => Promise<void>) | undefined {
  const msgId = payload.id
  if (!msgId) return undefined

  switch (info.replyType) {
    case 'channel':
      if (!payload.channel_id) return undefined
      return (id: string) => MessageApi.recallMessage(payload.channel_id!, id)
    case 'direct':
      if (!payload.guild_id) return undefined
      return (id: string) => MessageApi.recallDirectMessage(payload.guild_id!, id)
    case 'group':
      if (!payload.group_openid) return undefined
      return (id: string) => MessageApi.recallGroupMessage(payload.group_openid!, id)
    case 'private':
      if (!payload.author?.user_openid) return undefined
      return (id: string) => MessageApi.recallPrivateMessage(payload.author!.user_openid!, id)
    case 'none':
      return undefined
  }
}

export function formatEventLog(info: EventInfo, display?: string): string {
  const sourcePart = info.sceneId ? `${info.scene}(${info.sceneId})` : info.scene
  const userPart = info.username ? `${info.username}(${info.userId})` : info.userId
  const content = display ?? info.content
  return userPart ? `${sourcePart} > ${userPart}: ${content}` : `${sourcePart}: ${content}`
}

export function dispatchEvent(ctx: DispatcherContext, payload: EventPayload): void {
  if (!payload || typeof payload !== 'object') return
  normalizePayload(payload)
  const eventName = resolveEvent(payload)
  const info = extractEventInfo(eventName, payload)
  const segments = MESSAGE_EVENTS.has(eventName) ? parseMessage(payload) : null
  const display = segments ? formatSegments(segments) : ''
  ctx.logger.info(formatEventLog(info, display))
  ctx.logger.debug(eventName, segments ? { ...payload, segments } : payload)

  if (eventName === 'interaction.create') {
    ctx.acknowledgeInteraction(payload)
  }

  const recallFn = createRecallFn(info, payload)
  const event = new BotEvent(payload, eventName, info, (content, quoteReply) => ctx.replyByEvent(info, content, quoteReply), recallFn)
  ctx.handlers.get(eventName)?.forEach((fn) => {
    Promise.resolve(fn(event)).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      ctx.logger.error(`事件处理器错误: ${message}`)
    })
  })
  if (eventName !== 'message' && MESSAGE_EVENTS.has(eventName)) {
    ctx.handlers.get('message')?.forEach((fn) => {
      Promise.resolve(fn(event)).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err)
        ctx.logger.error(`message处理器错误: ${message}`)
      })
    })
  }
}
