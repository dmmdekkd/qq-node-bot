import http from 'http'
import type { Bot } from '../bot'
import { ed25519 } from '@noble/curves/ed25519'
import type { LoggerApi } from '../types'
import { TransportEmitter } from './emitter'
import { toObject } from '../utils/object'

export class WebhookTransport extends TransportEmitter {
  private bot: Bot
  private server: http.Server | null = null
  private logger: LoggerApi

  constructor(bot: Bot) {
    super()
    this.bot = bot
    this.logger = bot.logger
  }

  async connect(): Promise<void> {
    const { port = 3000, path = '/qq-node-bot' } = this.bot.config

    this.server = http.createServer((req, res) => {
      if (req.method !== 'POST' || req.url !== path) {
        res.writeHead(404); res.end()
        return
      }
      let body = ''
      req.on('data', chunk => body += chunk)
      req.on('end', () => {
        const payload = toObject<{ d?: Record<string, unknown>; t?: string }>(body)
        if (!payload) {
          res.writeHead(400).end()
          return
        }
        if (this.verify(req.headers, body)) {
          this.emit('event', { ...payload.d, _t: payload.t })
          res.writeHead(204).end()
        } else {
          this.logger.warn('签名验证失败')
          res.writeHead(401).end()
        }
      })
    })
    return new Promise(resolve => {
      this.server!.listen(port, () => {
        this.logger.info(`Webhook 服务器已启动，端口: ${port}`)
        resolve()
      })
    })
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server?.close(err => err ? reject(err) : resolve())
      this.server = null
    })
  }

  private verify(headers: http.IncomingHttpHeaders, body: string): boolean {
    const signature = headers['x-signature-ed25519']
    const timestamp = headers['x-signature-timestamp']
    if (!signature || !timestamp) return false
    if (typeof signature !== 'string' || typeof timestamp !== 'string') return false
    try {
      const message = new TextEncoder().encode(timestamp + body)
      const sig = Buffer.from(signature, 'hex')
      const pubKey = Buffer.from(this.bot.config.secret, 'hex')
      return ed25519.verify(sig, message, pubKey)
    } catch {
      return false
    }
  }
}
