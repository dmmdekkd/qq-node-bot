import type { LogLevel } from './bot'
import type { ApiClient } from '../core/api'
import type { UploadResult } from './api'

export type LogLevels = readonly ['silent', 'error', 'warn', 'info', 'debug']

export type LevelName = LogLevels[number]

export type ColorMap = Record<Exclude<LevelName, 'silent'>, string>

export type ConsoleMethod = 'error' | 'log'

export type LoggerApi = {
  debug(...args: unknown[]): void
  info(...args: unknown[]): void
  warn(...args: unknown[]): void
  error(...args: unknown[]): void
  child(ns: string): LoggerApi
  readonly ns: string
}

export type MutableLoggerApi = LoggerApi & {
  setNamespace(ns: string): void
  setLevel(level: LogLevel): void
}

export type LoggerOptions = {
  level?: LogLevel
  ns?: string
}

export type FileSource = string | Buffer

export type FileUploaderApi = {
  init(client: ApiClient): void
  uploadImage(channelId: string, file: Buffer, fileName?: string): Promise<UploadResult>
  uploadVoice(channelId: string, file: Buffer, fileName?: string): Promise<UploadResult>
  uploadFile(channelId: string, file: Buffer, fileName: string): Promise<UploadResult>
}

export type QuoteChar = '"' | "'"