import type { Bot } from '../bot'
import type { EventPayload, LoggerApi } from '../types'
import type { MiddlewareRequest, MiddlewareResponse } from '../types/transport'
import { TransportEmitter } from './emitter'

export class MiddlewareTransport extends TransportEmitter {
  private bot: Bot
  private logger: LoggerApi

  constructor(bot: Bot) {
    super()
    this.bot = bot
    this.logger = bot.logger
  }

  async connect(): Promise<void> {
    this.logger.info('Middleware 模式已就绪')
  }

  async disconnect(): Promise<void> {}

  middleware(): (req: MiddlewareRequest, res: MiddlewareResponse, next: () => void) => void {
    return (req: MiddlewareRequest, res: MiddlewareResponse, next: () => void) => {
      if (req.method === 'POST') {
        const body = req.body
        if (body) {
          const d = body.d as Record<string, unknown> | undefined
          const t = body.t as string | undefined
          this.emit('event', { ...d, _t: t } as EventPayload)
        }
        res.status?.(204)
        res.end?.()
      } else {
        next()
      }
    }
  }
}