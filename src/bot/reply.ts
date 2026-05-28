import type { EventInfo, Sendable, EventPayload, Message } from '../types'
import type { MutableLoggerApi } from '../types'
import { MessageApi } from '../api/message'
import { InteractionApi, INTERACTION_CODE } from '../api/interaction'
import { formatSendable } from '../message/parser'

export interface ReplyContext {
  logger: MutableLoggerApi
}

export async function acknowledgeInteraction(ctx: ReplyContext, payload: EventPayload): Promise<void> {
  if (!payload.id) return
  try {
    await InteractionApi.respond(payload.id, INTERACTION_CODE.Success)
    ctx.logger.debug(`交互回应成功: ${payload.id}`)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    ctx.logger.error(`交互回应失败: ${message}`)
  }
}

export async function replyByEvent(ctx: ReplyContext, info: EventInfo, content: Sendable, quoteReply?: boolean): Promise<Message | undefined> {
  const text = formatSendable(content)
  if (!text || text.trim() === '') {
    ctx.logger.warn('消息内容为空，跳过发送')
    return undefined
  }
  const refId = quoteReply ? (info.msgIdx ?? info.msgId) : undefined
  const options = refId && info.msgId
    ? { msgId: info.msgId, messageReference: { message_id: refId, ignore_get_message_error: true } }
    : info.msgId
      ? { msgId: info.msgId }
      : undefined
  ctx.logger.debug('replyByEvent', { quoteReply, msgId: info.msgId, msgIdx: info.msgIdx, options })
  try {
    switch (info.replyType) {
      case 'channel':
        if (info.channelId) {
          ctx.logger.info(`send to Channel(${info.channelId}): ${text}`)
          ctx.logger.debug('send', { channelId: info.channelId, msgId: info.msgId, content })
          return await MessageApi.sendMessage(info.channelId, content, options)
        }
        break
      case 'group':
        if (info.sceneId) {
          ctx.logger.info(`send to Group(${info.sceneId}): ${text}`)
          ctx.logger.debug('send', { groupOpenid: info.sceneId, msgId: info.msgId, content })
          return await MessageApi.sendGroupMessage(info.sceneId, content, options)
        }
        break
      case 'private':
        if (info.userId) {
          ctx.logger.info(`send to User(${info.userId}): ${text}`)
          ctx.logger.debug('send', { userOpenid: info.userId, msgId: info.msgId, content })
          return await MessageApi.sendPrivateMessage(info.userId, content, options)
        }
        break
      case 'direct':
        if (info.sceneId) {
          ctx.logger.info(`send to Direct(${info.sceneId}): ${text}`)
          ctx.logger.debug('send', { guildId: info.sceneId, msgId: info.msgId, content })
          return await MessageApi.sendDirectMessage(info.sceneId, content, options)
        }
        break
      case 'none':
        ctx.logger.warn('该事件类型不支持回复')
        break
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    ctx.logger.error(`发送失败: ${message}`)
  }
  return undefined
}
