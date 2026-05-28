import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import type { BotConfig, LoggerApi } from '../types'
import { ApiError } from '../types'
import { Auth } from './auth'
import { createLogger } from '../utils/logger'

export class ApiClient {
  private http: AxiosInstance
  private auth: Auth
  private config: BotConfig
  private logger: LoggerApi

  constructor(config: BotConfig, auth: Auth, logger?: LoggerApi) {
    this.config = config
    this.auth = auth
    this.logger = logger ?? createLogger({ level: config.logLevel })

    this.http = axios.create({ baseURL: auth.baseURL, timeout: config.timeout ?? 10000 })

    this.http.interceptors.request.use(async (req) => {
      const token = await this.auth.getToken()
      req.headers.Authorization = `QQBot ${token}`
      return req
    })

    this.http.interceptors.response.use(
      (res) => res.data,
      (err) => {
        const status = err.response?.status
        const data = err.response?.data
        if (status === 401) {
          this.auth.invalidate()
        }
        this.logger.error(`API 错误: ${status}`, JSON.stringify(data))
        throw new ApiError(status ?? 0, data)
      }
    )
  }

  async get<T = unknown>(path: string, params?: Record<string, unknown>): Promise<T> {
    return this.http.get(path, { params })
  }

  async post<T = unknown>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.http.post(path, data, config)
  }

  async patch<T = unknown>(path: string, data?: unknown): Promise<T> {
    return this.http.patch(path, data)
  }

  async put<T = unknown>(path: string, data?: unknown): Promise<T> {
    return this.http.put(path, data)
  }

  async delete<T = unknown>(path: string, params?: Record<string, unknown>): Promise<T> {
    return this.http.delete(path, { params })
  }
}

export function createApiClient(config: BotConfig, auth: Auth, logger?: LoggerApi): ApiClient {
  return new ApiClient(config, auth, logger)
}
