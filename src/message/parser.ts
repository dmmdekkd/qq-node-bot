import type { MessageElem, ReplyElem, MarkdownElem, ArkElem, EmbedElem, ImageElem, VoiceElem, VideoElem, FileElem, FaceElem, ButtonElem, TextElem, Sendable as MessageSendable } from '../types/elements'
import type { Attachment, MentionUser, MessageReference, Sendable } from '../types'
import { isUrl, isBase64, isDataUrl } from '../utils/file'
import { toObject } from '../utils/object'

export function parseMessage(raw: string): MessageElem[]
export function parseMessage(payload: { content?: string; attachments?: Attachment[]; mentions?: MentionUser[]; message_reference?: MessageReference }): MessageElem[]
export function parseMessage(input: string | { content?: string; attachments?: Attachment[]; mentions?: MentionUser[]; message_reference?: MessageReference }): MessageElem[] {
  if (typeof input === 'string') return parseContent(input)
  return parsePayload(input)
}

export function formatSendable(content: Sendable | MessageSendable): string {
  const items = Array.isArray(content) ? content : [content]
  const elems: MessageElem[] = items.map(item => {
    if (typeof item === 'string') return { type: 'text', data: { text: item } }
    if ('data' in item) return item as MessageElem
    return payloadToElem(item as any)
  })
  return formatElems(elems)
}

function payloadToElem(payload: Record<string, any>): MessageElem {
  switch (payload.type) {
    case 'text':
      return { type: 'text', data: { text: payload.content ?? '' } }
    case 'face':
    case 'emoji':
      return { type: 'face', data: { id: payload.id ?? 0, text: payload.text ?? payload.name } }
    case 'image':
      return { type: 'image', data: { file: payload.file ?? payload.url, url: payload.url, name: payload.name } }
    case 'voice':
      return { type: 'voice', data: { file: payload.file ?? payload.url, url: payload.url, name: payload.name } }
    case 'video':
      return { type: 'video', data: { file: payload.file ?? payload.url, url: payload.url, name: payload.name } }
    case 'file':
      return { type: 'file', data: { file: payload.file ?? payload.url, url: payload.url, name: payload.name, size: payload.size } }
    case 'reply':
      return { type: 'reply', data: { message_id: payload.message_id ?? '', event_id: payload.event_id } }
    case 'markdown':
      if (payload.custom_template_id) {
        return { type: 'markdown', data: { custom_template_id: payload.custom_template_id, params: payload.params ?? [] } }
      }
      return { type: 'markdown', data: { content: payload.content ?? '' } }
    case 'ark':
      return { type: 'ark', data: { template_id: payload.template_id ?? 0, kv: payload.kv ?? [] } }
    case 'embed':
      return { type: 'embed', data: { title: payload.title ?? '', prompt: payload.prompt ?? '', thumbnail: payload.thumbnail, fields: payload.fields ?? [] } }
    case 'button':
      return { type: 'button', data: { id: payload.id, render_data: payload.render_data, action: payload.action } }
    default:
      throw new Error(`未知消息类型: ${payload.type}`)
  }
}

export function formatElems(elems: MessageElem[]): string {
  return elems.map(elem => {
    switch (elem.type) {
      case 'text': {
        const data = elem.data as TextElem['data']
        return data.text
      }
      case 'image': {
        const data = elem.data as ImageElem['data']
        const source = getMediaSource(data.file, data.url)
        return `[图片${source ? `: ${source}` : ''}]`
      }
      case 'voice': {
        const data = elem.data as VoiceElem['data']
        const source = getMediaSource(data.file, data.url)
        return `[语音${source ? `: ${source}` : ''}]`
      }
      case 'video': {
        const data = elem.data as VideoElem['data']
        const source = getMediaSource(data.file, data.url)
        return `[视频${source ? `: ${source}` : ''}]`
      }
      case 'file': {
        const data = elem.data as FileElem['data']
        const source = getMediaSource(data.file, data.url)
        return `[文件${source ? `: ${source}` : ''}${data.size ? ` ${data.size}B` : ''}]`
      }
      case 'face': {
        const data = elem.data as FaceElem['data']
        return `[表情${data.text ? `: ${data.text}` : `: ${data.id}`}]`
      }
      case 'button': {
        const data = elem.data as ButtonElem['data']
        return `[按钮: ${data.render_data?.label ?? ''}]`
      }
      case 'reply': {
        const data = elem.data as ReplyElem['data']
        return `[回复: ${data.message_id}]`
      }
      case 'markdown': {
        const data = elem.data as MarkdownElem['data']
        const mdContent = 'content' in data ? data.content : data.custom_template_id
        return `[Markdown: ${(mdContent ?? '').slice(0, 20)}]`
      }
      case 'ark': {
        const data = elem.data as ArkElem['data']
        return `[Ark: ${data.template_id}]`
      }
      case 'embed': {
        const data = elem.data as EmbedElem['data']
        return `[Embed: ${data.title}]`
      }
      default: return `[未知类型: ${elem.type}]`
    }
  }).join('')
}

function getMediaSource(file: string | Buffer, url?: string): string {
  if (url) return url
  if (typeof file === 'string') {
    if (isUrl(file)) return file
    if (isBase64(file)) return 'base64'
    if (isDataUrl(file)) return 'data-url'
    return file
  }
  if (Buffer.isBuffer(file)) return `Buffer(${file.length}B)`
  return ''
}

export function formatSegments(segments: MessageElem[]): string {
  return formatElems(segments)
}

export function logSendable(logger: { info: (msg: string) => void; debug: (msg: string, data?: unknown) => void }, target: string, content: Sendable | MessageSendable, options?: unknown): void {
  const text = formatSendable(content)
  logger.info(`send to ${target}: ${text}`)
  logger.debug('send', { target, content, options })
}

function parsePayload(payload: { content?: string; attachments?: Attachment[]; mentions?: MentionUser[]; message_reference?: MessageReference }): MessageElem[] {
  const elems: MessageElem[] = []

  if (payload.message_reference) {
    elems.push({ type: 'reply', data: { message_id: payload.message_reference.message_id } })
  }

  if (payload.content) {
    elems.push(...parseContent(payload.content, payload.mentions))
  }

  if (payload.attachments) {
    for (const attachment of payload.attachments) {
      const elem = parseAttachment(attachment)
      if (elem) elems.push(elem)
    }
  }

  return elems
}

function parseContent(raw: string, mentions?: MentionUser[]): MessageElem[] {
  const elems: MessageElem[] = []
  const regex = /<[^>]+>/g
  let lastIndex = 0
  let m: RegExpExecArray | null

  while ((m = regex.exec(raw)) !== null) {
    if (m.index > lastIndex) {
      elems.push({ type: 'text', data: { text: raw.slice(lastIndex, m.index) } })
    }

    const tag = m[0]
    const elem = parseTag(tag, mentions)
    elems.push(elem)
    lastIndex = m.index + tag.length
  }

  if (lastIndex < raw.length) {
    elems.push({ type: 'text', data: { text: raw.slice(lastIndex) } })
  }

  return elems
}

function parseTag(tag: string, mentions?: MentionUser[]): MessageElem {
  const faceMatch = tag.match(/^<faceType=\d+,faceId="(\d+)"(?:,ext="([^"]*)")?>$/) || tag.match(/^<emoji:(\d+)>$/)
  if (faceMatch) {
    const id = parseInt(faceMatch[1])
    const ext = faceMatch[2]
    if (ext) {
      const decoded = toObject<{ text?: string }>(Buffer.from(ext, 'base64').toString())
      if (decoded?.text) return { type: 'face', data: { id, text: decoded.text } }
    }
    return { type: 'face', data: { id } }
  }

  const cmdEnterMatch = tag.match(/^<qqbot-cmd-enter text="([^"]*)" \/>$/)
  if (cmdEnterMatch) {
    return { type: 'markdown', data: { content: tag } }
  }

  const cmdInputMatch = tag.match(/^<qqbot-cmd-input text="([^"]*)"(?: show="([^"]*)")?(?: reference="(true|false)")? \/>$/)
  if (cmdInputMatch) {
    return { type: 'markdown', data: { content: tag } }
  }

  return { type: 'text', data: { text: tag } }
}

function parseAttachment(attachment: Attachment): MessageElem | null {
  const contentType = attachment.content_type ?? ''
  const [mediaType] = contentType.split('/')
  const url = isUrl(attachment.url) ? attachment.url : `https://${attachment.url}`
  const name = attachment.filename ?? attachment.name

  switch (mediaType) {
    case 'image':
      return { type: 'image', data: { file: url, url, name } }
    case 'audio':
    case 'voice':
      return { type: 'voice', data: { file: url, url, name } }
    case 'video':
      return { type: 'video', data: { file: url, url, name } }
    default:
      return null
  }
}