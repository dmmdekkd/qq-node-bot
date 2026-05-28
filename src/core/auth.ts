import type { BotConfig, LoggerApi } from '../types'
import type { TokenResponse } from '../types/core'
import { createLogger } from '../utils/logger'

const TOKEN_URL = 'https://bots.qq.com/app/getAppAccessToken'

export class Auth {
  private config: BotConfig
  private token: string | null = null
  private expiresAt: number = 0
  private logger: LoggerApi

  constructor(config: BotConfig, logger?: LoggerApi) {
    this.config = config
    this.logger = logger ?? createLogger({ level: config.logLevel })
  }

  async getToken(): Promise<string> {
    if (this.token && Date.now() < this.expiresAt) {
      return this.token
    }
    return this.refresh()
  }

  invalidate(): void {
    this.token = null
    this.expiresAt = 0
  }

  private async refresh(): Promise<string> {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appId: this.config.appid,
        clientSecret: this.config.secret,
      }),
    })
    const data = (await res.json()) as TokenResponse
    if (!data.access_token) {
      const errMsg = data.error_description ?? data.error ?? JSON.stringify(data)
      this.logger.error('获取 access_token 失败:', errMsg)
      throw new Error(`获取 access_token 失败: ${errMsg}`)
    }
    this.token = data.access_token
    this.expiresAt = Date.now() + (data.expires_in ?? 7200) * 1000 - 60000
    return this.token
  }

  get baseURL(): string {
    return this.config.sandbox
      ? 'https://sandbox.api.sgroup.qq.com'
      : 'https://api.sgroup.qq.com'
  }
}

export function createAuth(config: BotConfig, logger?: LoggerApi): Auth {
  return new Auth(config, logger)
}
