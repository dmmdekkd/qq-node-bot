import WebSocket from 'ws'
import type { Bot } from '../bot'
import type { ConnectionStatus, EventPayload, SelfInfo, StatusEvent, LoggerApi } from '../types'
import type { GatewayResponse, WsFrame } from '../types/transport'
import { TransportEmitter } from './emitter'
import { toObject } from '../utils/object'

export class WsTransport extends TransportEmitter {
  private bot: Bot
  private ws: WebSocket | null = null
  private retryCount = 0
  private sessionId: string | null = null
  private seq: number = 0
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private heartbeatAck: boolean = true
  private _status: ConnectionStatus = 'disconnected'
  private logger: LoggerApi

  constructor(bot: Bot) {
    super()
    this.bot = bot
    this.logger = bot.logger
  }

  get status(): ConnectionStatus { return this._status }

  async connect(): Promise<void> {
    const url = await this.getGatewayUrl()
    this._status = 'connecting'
    this.emit('status', { status: 'connecting', timestamp: Date.now() })

    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      this.retryCount = 0
    }

    this.ws.onmessage = (raw) => {
      const frame = toObject<WsFrame>(raw.data.toString())
      if (!frame) return

      switch (frame.op) {
        case 0:
          this.seq = frame.s ?? this.seq
          if (frame.t === 'READY') {
            this.sessionId = frame.d.session_id ?? this.sessionId
            this._status = 'connected'
            this.emit('status', { status: 'connected', timestamp: Date.now(), user: frame.d.user as SelfInfo | undefined })
          } else if (frame.t === 'RESUMED') {
            this._status = 'connected'
            this.logger.info('会话恢复成功')
            this.emit('status', { status: 'connected', timestamp: Date.now() })
          } else {
            this.emit('event', { ...frame.d, _t: frame.t } as EventPayload)
          }
          break
        case 10:
          this.sessionId = null
          this.startHeartbeat(frame.d.heartbeat_interval ?? 41250)
          this.identify()
          break
        case 11:
          this.heartbeatAck = true
          break
        case 7:
          this.logger.warn('服务端要求重连')
          this.reconnect()
          break
        case 9:
          this.logger.warn('会话无效，重置并重连')
          this.sessionId = null
          this.seq = 0
          this.reconnect()
          break
      }
    }

    this.ws.onclose = (ev) => {
      this.logger.warn(`连接关闭: code=${ev.code}`)
      this.stopHeartbeat()
      this._status = 'disconnected'
      this.emit('status', { status: 'disconnected', timestamp: Date.now() })
      this.reconnect()
    }

    this.ws.onerror = (ev) => {
      this.logger.error('连接错误:', ev.message)
      this.ws?.close()
    }
  }

  async disconnect(): Promise<void> {
    this.stopHeartbeat()
    this.ws?.close(1000, 'client closing')
    this.ws = null
    this.sessionId = null
    this.seq = 0
    this._status = 'disconnected'
  }

  private async identify(): Promise<void> {
    const token = await this.bot.getToken()
    const d: Record<string, unknown> = {
      token: `QQBot ${token}`,
      intents: this.calcIntents(),
      shard: [0, 1],
    }
    if (this.sessionId) {
      d.session_id = this.sessionId
      d.seq = this.seq
    }
    this.ws?.send(JSON.stringify({ op: 2, d }))
  }

  private calcIntents(): number {
    const intentMap: Record<string, number> = {
      GUILDS: 1 << 0, GUILD_MEMBERS: 1 << 1, GUILD_MESSAGES: 1 << 9,
      GUILD_MESSAGE_REACTIONS: 1 << 10, DIRECT_MESSAGE: 1 << 12,
      GROUP_AND_C2C_EVENT: 1 << 25, INTERACTION: 1 << 26,
      MESSAGE_AUDIT: 1 << 27, FORUMS_EVENT: 1 << 28,
      AUDIO_ACTION: 1 << 29, PUBLIC_GUILD_MESSAGES: 1 << 30,
    }
    return this.bot.config.intents.reduce((acc: number, i: string) => acc | (intentMap[i] ?? 0), 0)
  }

  private startHeartbeat(interval: number): void {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (!this.heartbeatAck) {
        this.logger.warn('心跳超时，关闭连接')
        this.ws?.close()
        return
      }
      this.heartbeatAck = false
      this.ws?.send(JSON.stringify({ op: 1, d: this.seq }))
    }, interval)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = null
  }

  private async getGatewayUrl(): Promise<string> {
    const res = await this.bot.api.get<GatewayResponse>('/gateway')
    return res.url
  }

  private reconnect(): void {
    if (this._status === 'reconnecting') return
    const maxRetry = this.bot.config.maxRetry ?? 10
    if (this.retryCount >= maxRetry) {
      this.logger.error(`已达最大重试次数 (${maxRetry})，停止重连`)
      this._status = 'disconnected'
      this.emit('status', { status: 'disconnected', timestamp: Date.now(), error: new Error('max retries') })
      return
    }
    this._status = 'reconnecting'
    this.emit('status', { status: 'reconnecting', timestamp: Date.now() })
    this.retryCount++
    const delay = Math.min(1000 * 2 ** this.retryCount, 30000)
    this.logger.info(`第 ${this.retryCount} 次重连，${delay}ms 后尝试...`)
    setTimeout(() => this.connect(), delay)
  }
}
