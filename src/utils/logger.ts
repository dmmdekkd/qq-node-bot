import type { LogLevel, LogLevels, LevelName, ColorMap, LoggerApi, MutableLoggerApi, LoggerOptions } from '../types'

const levels: LogLevels = ['silent', 'error', 'warn', 'info', 'debug'] as const

const colors: ColorMap = {
  info:  '36',
  error: '31;1',
  warn:  '33',
  debug: '90',
} satisfies ColorMap

const timeColor = '30;1'
const nsColor = '36'

function formatTime(): string {
  const now = new Date()
  return [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map(n => n.toString().padStart(2, '0'))
    .join(':')
}

function colorize(s: string, c: string): string {
  return process.stdout?.isTTY ? `\x1B[${c}m${s}\x1B[0m` : s
}

function stringifyArg(arg: unknown): string {
  return typeof arg === 'string' ? arg : JSON.stringify(arg)
}

function getConsoleMethod(level: LevelName): 'error' | 'log' {
  return levels.indexOf(level) <= 1 ? 'error' : 'log'
}

function createLoggerInternal(options: LoggerOptions): MutableLoggerApi {
  let levelIndex = levels.indexOf(options.level ?? 'info')
  let ns = options.ns ?? 'bot'

  function log(level: LevelName, args: unknown[]): void {
    if (level === 'silent') return
    const lvlIdx = levels.indexOf(level)
    if (lvlIdx > levelIndex) return

    const msg = args.map(stringifyArg).join(' ')
    const output = [
      colorize(level.toUpperCase(), colors[level]),
      colorize(formatTime(), timeColor),
      colorize(`[${ns}]`, nsColor),
      msg,
    ].join(' ')

    console[getConsoleMethod(level)](output)
  }

  return {
    debug: (...args: unknown[]) => log('debug', args),
    info: (...args: unknown[]) => log('info', args),
    warn: (...args: unknown[]) => log('warn', args),
    error: (...args: unknown[]) => log('error', args),
    child: (childNs: string) => createLoggerInternal({ level: levels[levelIndex], ns: `${ns}:${childNs}` }),
    setNamespace: (newNs: string) => { ns = newNs },
    setLevel: (newLevel: LogLevel) => { levelIndex = levels.indexOf(newLevel) },
    get ns() { return ns },
  } satisfies MutableLoggerApi
}

let _rootLogger: MutableLoggerApi = createLoggerInternal({ level: 'info', ns: 'bot' })

export function setLogLevel(level: LogLevel): void {
  _rootLogger.setLevel(level)
}

export function setNamespace(ns: string): void {
  _rootLogger.setNamespace(ns)
}

export function rootLogger(): MutableLoggerApi {
  return _rootLogger
}

export function createLogger(options?: LoggerOptions): MutableLoggerApi {
  return createLoggerInternal(options ?? {})
}

export const Logger = {
  setLogLevel,
  setNamespace,
  rootLogger,
  createLogger,
}