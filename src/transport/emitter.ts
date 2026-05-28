import type { TransportEventMap, TransportEventKey } from '../types/transport'

export class TransportEmitter {
  private handlers: Map<string, Set<(...args: unknown[]) => void>> = new Map()

  on<K extends TransportEventKey>(event: K, handler: (data: TransportEventMap[K]) => void): void
  on(event: string, handler: (...args: unknown[]) => void): void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set())
    this.handlers.get(event)!.add(handler)
  }

  off<K extends TransportEventKey>(event: K, handler: (data: TransportEventMap[K]) => void): void
  off(event: string, handler: (...args: unknown[]) => void): void {
    this.handlers.get(event)?.delete(handler)
  }

  protected emit<K extends TransportEventKey>(event: K, data: TransportEventMap[K]): void
  protected emit(event: string, data?: unknown): void {
    this.handlers.get(event)?.forEach(fn => fn(data))
  }
}
