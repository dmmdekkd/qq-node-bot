import type { EventName, EventPayload, Sendable, ReplyType, EventInfo, Message } from './types'
import type { RecallOptions } from './types/api'

export class BotEvent {
  readonly type: EventName
  readonly timestamp: number
  readonly content: string
  readonly author: EventPayload['author']
  readonly guildId?: string
  readonly channelId?: string
  readonly groupOpenid?: string
  readonly userOpenid?: string
  readonly msgId?: string
  readonly attachments?: EventPayload['attachments']
  readonly mentions?: EventPayload['mentions']
  readonly raw: EventPayload
  readonly msgIdx?: string

  private readonly _info: EventInfo

  constructor(
    payload: EventPayload,
    eventName: EventName,
    info: EventInfo,
    private readonly _replyFn: (content: Sendable, quoteReply?: boolean) => Promise<Message | undefined>,
    private readonly _recallFn?: (msgId: string) => Promise<void>,
  ) {
    this.type = eventName
    this.timestamp = Date.now()
    this.content = payload?.content ?? ''
    this.author = payload?.author
    this.guildId = payload?.guild_id
    this.channelId = payload?.channel_id
    this.groupOpenid = payload?.group_openid
    this.userOpenid = payload?.author?.user_openid
    this.msgId = payload?.id
    this.attachments = payload?.attachments
    this.mentions = payload?.mentions
    this.raw = payload ?? {}
    this._info = info
    this.msgIdx = info.msgIdx
  }

  get scene(): string { return this._info.scene }
  get sceneId(): string { return this._info.sceneId }
  get userId(): string { return this._info.userId }
  get username(): string { return this._info.username }
  get replyType(): ReplyType { return this._info.replyType }
  get data(): string { return this.raw?.data?.resolved?.button_data ?? '' }

  reply(content: Sendable, quoteReply?: boolean): Promise<Message | undefined> {
    return this._replyFn(content, quoteReply)
  }

  recall(msgId?: string): Promise<void> {
    if (!this._recallFn) {
      return Promise.resolve()
    }
    return this._recallFn(msgId ?? this.msgId ?? '')
  }
}
