import type { RecallOptions } from './types/api'
import type { BotConfig, EventName, EventPayload, EventInfo, SelfInfo, Sendable, StatusEvent, MutableLoggerApi, Message } from './types'
import type { BotEvent } from './event'
import { GuildApi } from './api/guild'
import { ChannelApi } from './api/channel'
import { MessageApi } from './api/message'
import { MemberApi } from './api/member'
import { PermissionApi } from './api/permission'
import { ReactionApi } from './api/reaction'
import { AudioApi } from './api/audio'
import { ScheduleApi } from './api/schedule'
import { ThreadApi } from './api/thread'
import { SelfApi } from './api/self'
import { GroupApi } from './api/group'
import { InteractionApi } from './api/interaction'
import { FileUploader } from './utils/file'
import { WsTransport } from './transport/ws'
import { WebhookTransport } from './transport/webhook'
import { MiddlewareTransport } from './transport/middleware'
import { createApiClient } from './core/api'
import { createAuth } from './core/auth'
import { rootLogger, setLogLevel, setNamespace } from './utils/logger'
import { dispatchEvent, DispatcherContext } from './bot/dispatch'
import { replyByEvent, acknowledgeInteraction, ReplyContext } from './bot/reply'
import type { Transport } from './types'
import type { BotHandler } from './types/internal'

export { segment } from './segment'

export class Bot {
  readonly config: BotConfig
  readonly api: ReturnType<typeof createApiClient>
  readonly logger: MutableLoggerApi

  private handlers: Map<string, Set<BotHandler>> = new Map()
  private transport: Transport
  private auth: ReturnType<typeof createAuth>

  constructor(config: BotConfig) {
    this.config = { maxRetry: 10, sandbox: false, ...config }

    if (this.config.logLevel) setLogLevel(this.config.logLevel)
    setNamespace(this.config.appid)
    this.logger = rootLogger()
    this.auth = createAuth(this.config, this.logger)
    this.api = createApiClient(this.config, this.auth, this.logger)

    GuildApi.init(this.api)
    ChannelApi.init(this.api)
    MessageApi.init(this.api)
    MemberApi.init(this.api)
    PermissionApi.init(this.api)
    ReactionApi.init(this.api)
    AudioApi.init(this.api)
    ScheduleApi.init(this.api)
    ThreadApi.init(this.api)
    SelfApi.init(this.api)
    GroupApi.init(this.api)
    InteractionApi.init(this.api)
    FileUploader.init(this.api)

    this.transport = this.createTransport()
  }

  on<T extends EventName | 'status'>(
    event: T,
    handler: T extends 'status' ? (event: StatusEvent) => void : (event: BotEvent) => void,
  ): this {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set())
    this.handlers.get(event)!.add(handler as BotHandler)
    return this
  }

  off<T extends EventName | 'status'>(
    event: T,
    handler: T extends 'status' ? (event: StatusEvent) => void : (event: BotEvent) => void,
  ): this {
    this.handlers.get(event)?.delete(handler as BotHandler)
    return this
  }

  async getToken(): Promise<string> {
    return this.auth.getToken()
  }

  private async onReady(status: StatusEvent): Promise<void> {
    let username = status.user?.username || ''
    try {
      const self: SelfInfo = await SelfApi.getSelf()
      username = self.username || username
    } catch {}
    this.logger.info(`欢迎 ${username}`)
  }

  async start(): Promise<void> {
    this.logger.info('正在启动机器人...')
    this.transport.on('event', (payload: EventPayload) => this.dispatch(payload))
    this.transport.on('status', (status: StatusEvent) => {
      if (status.status === 'connected') {
        this.onReady(status)
      }
      const handlers = this.handlers.get('status')
      handlers?.forEach((fn) => {
        Promise.resolve(fn(status)).catch((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err)
          this.logger.error(`status处理器错误: ${message}`)
        })
      })
    })
    await this.transport.connect()
  }

  async stop(): Promise<void> {
    this.logger.info('正在停止机器人...')
    await this.transport.disconnect()
    this.logger.info('机器人已停止')
  }

  getGuilds = GuildApi.getGuilds
  getGuild = GuildApi.getGuild
  getGuildChannels = GuildApi.getGuildChannels

  getGroupMember = GroupApi.getGroupMember
  getGroupMembers = GroupApi.getGroupMembers

  getChannel = ChannelApi.getChannel
  createChannel = ChannelApi.createChannel
  updateChannel = ChannelApi.updateChannel
  deleteChannel = ChannelApi.deleteChannel

  sendMessage = MessageApi.sendMessage
  sendGroupMessage = MessageApi.sendGroupMessage
  sendPrivateMessage = MessageApi.sendPrivateMessage
  sendDirectMessage = MessageApi.sendDirectMessage
  recallMessage = MessageApi.recallMessage
  recallGroupMessage = MessageApi.recallGroupMessage
  recallPrivateMessage = MessageApi.recallPrivateMessage
  recallDirectMessage = MessageApi.recallDirectMessage
  sendStreamPrivateMessage = MessageApi.sendStreamPrivateMessage
  sendStreamGroupMessage = MessageApi.sendStreamGroupMessage

  getGuildMembers = MemberApi.getGuildMembers
  getGuildMember = MemberApi.getGuildMember
  muteMember = MemberApi.muteMember
  kickMember = MemberApi.kickMember

  getPermissions = PermissionApi.getPermissions
  updatePermissions = PermissionApi.updatePermissions

  addReaction = ReactionApi.addReaction
  removeReaction = ReactionApi.removeReaction

  controlAudio = AudioApi.controlAudio

  getSchedules = ScheduleApi.getSchedules
  createSchedule = ScheduleApi.createSchedule
  updateSchedule = ScheduleApi.updateSchedule

  getThreads = ThreadApi.getThreads
  createThread = ThreadApi.createThread
  deleteThread = ThreadApi.deleteThread

  getSelf = SelfApi.getSelf
  getSelfGuilds = SelfApi.getSelfGuilds

  private dispatch(payload: EventPayload): void {
    const ctx: DispatcherContext = {
      logger: this.logger,
      handlers: this.handlers,
      replyByEvent: (info, content, quoteReply) => this.replyByEvent(info, content, quoteReply),
      acknowledgeInteraction: (payload) => this.acknowledgeInteraction(payload),
    }
    dispatchEvent(ctx, payload)
  }

  private async acknowledgeInteraction(payload: EventPayload): Promise<void> {
    const ctx: ReplyContext = { logger: this.logger }
    await acknowledgeInteraction(ctx, payload)
  }

  private async replyByEvent(info: EventInfo, content: Sendable, quoteReply?: boolean): Promise<Message | undefined> {
    const ctx: ReplyContext = { logger: this.logger }
    return replyByEvent(ctx, info, content, quoteReply)
  }

  private createTransport(): Transport {
    switch (this.config.mode) {
      case 'websocket': return new WsTransport(this)
      case 'webhook': return new WebhookTransport(this)
      case 'middleware': return new MiddlewareTransport(this)
    }
  }
}
