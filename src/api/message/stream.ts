import type { Message } from '../../types'
import type { StreamMessageBody, StreamOptions } from '../../types/api'
import { ApiClient } from '../../core/api'
import { nextSeq } from './builder'

let api: ApiClient

export function initStream(client: ApiClient) {
  api = client
}

async function sendStreamMessage(
  endpoint: string,
  content: string,
  options?: StreamOptions
): Promise<Message> {
  const maxChars = options?.maxChars ?? 50
  const interval = options?.interval ?? 100

  const chunks = splitByLines(content, maxChars)
  let streamId: string | undefined
  let seq = nextSeq()

  for (let i = 0; i < chunks.length; i++) {
    const payload: StreamMessageBody = {
      msg_type: 2,
      markdown: { content: chunks[i] },
      msg_seq: seq++,
      stream: {
        state: 1,
        id: streamId,
        index: i,
        reset: false,
      },
    }

    const result = await api.post<Message>(endpoint, payload)
    if (result.id) streamId = result.id

    if (i < chunks.length - 1) {
      await sleep(interval)
    }
  }

  const finalPayload: StreamMessageBody = {
    msg_type: 2,
    markdown: { content },
    msg_seq: seq,
    stream: {
      state: 10,
      id: streamId,
      index: 1,
      reset: true,
    },
  }

  return api.post<Message>(endpoint, finalPayload)
}

export async function sendStreamPrivateMessage(userOpenid: string, content: string, options?: StreamOptions): Promise<Message> {
  return sendStreamMessage(`/v2/users/${userOpenid}/messages`, content, options)
}

export async function sendStreamGroupMessage(groupOpenid: string, content: string, options?: StreamOptions): Promise<Message> {
  return sendStreamMessage(`/v2/groups/${groupOpenid}/messages`, content, options)
}

function splitByLines(text: string, maxChars: number): string[] {
  const lines = text.split('\n')
  const chunks: string[] = []
  let current = ''

  for (let i = 0; i < lines.length; i++) {
    const piece = i < lines.length - 1 ? lines[i] + '\n' : lines[i]

    if (current.length + piece.length <= maxChars) {
      current += piece
    } else {
      if (current) {
        if (!current.endsWith('\n')) current += '\n'
        chunks.push(current)
      }
      current = piece
    }
  }

  if (current) {
    if (!current.endsWith('\n')) current += '\n'
    chunks.push(current)
  }

  return chunks
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
