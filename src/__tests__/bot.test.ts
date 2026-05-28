import { describe, it, expect } from 'vitest'
import { Bot } from '..'

describe('Bot', () => {
  it('should create instance with config', () => {
    const bot = new Bot({
      appid: 'test',
      secret: 'test',
      intents: ['GUILDS'],
      mode: 'websocket',
    })

    expect(bot).toBeDefined()
    expect(bot.config.appid).toBe('test')
    expect(bot.config.sandbox).toBe(false)
  })

  it('should have default config values', () => {
    const bot = new Bot({
      appid: 'test',
      secret: 'test',
      intents: ['GUILDS'],
      mode: 'websocket',
    })

    expect(bot.config.maxRetry).toBe(10)
    expect(bot.config.sandbox).toBe(false)
  })

  it('should have all API methods', () => {
    const bot = new Bot({
      appid: 'test',
      secret: 'test',
      intents: ['GUILDS'],
      mode: 'websocket',
    })

    expect(typeof bot.sendMessage).toBe('function')
    expect(typeof bot.sendGroupMessage).toBe('function')
    expect(typeof bot.sendPrivateMessage).toBe('function')
    expect(typeof bot.sendDirectMessage).toBe('function')
    expect(typeof bot.recallMessage).toBe('function')
    expect(typeof bot.recallGroupMessage).toBe('function')
    expect(typeof bot.recallPrivateMessage).toBe('function')
    expect(typeof bot.recallDirectMessage).toBe('function')
  })
})
