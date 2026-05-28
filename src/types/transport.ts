import type { EventPayload, StatusEvent } from '../types'

export interface GatewayResponse {
  url: string
}

export interface WsFrame {
  op: number
  s?: number
  t?: string
  d: Record<string, unknown> & { session_id?: string; heartbeat_interval?: number; user?: unknown }
}

export interface MiddlewareRequest {
  method?: string
  body?: Record<string, unknown>
}

export interface MiddlewareResponse {
  status?: (code: number) => MiddlewareResponse
  end?: () => void
}

export type TransportEventMap = {
  event: EventPayload
  status: StatusEvent
}

export type TransportEventKey = keyof TransportEventMap
