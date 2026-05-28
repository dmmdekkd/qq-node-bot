import type { ChannelBody, GroupOrPrivateBody, GroupOrPrivateBodyOptions, ParsedElems } from '../../types/api'
import type { MessageElem, Sendable, TextElem, FaceElem, ReplyElem, ImageElem, MarkdownElem, ArkElem, EmbedElem, VideoElem, VoiceElem, FileElem } from '../../types/elements'
import type { KeyboardRowData, KeyboardStyle, ButtonData } from '../../types/keyboard'
import { getFileBuffer, isUrl } from '../../utils/file'

export function toElems(content: Sendable): MessageElem[] {
  if (typeof content === 'string') return [{ type: 'text', data: { text: content } }]
  if (Array.isArray(content)) return content.map(c => typeof c === 'string' ? { type: 'text' as const, data: { text: c } } : c)
  return [content]
}

export function collectButtons(elems: MessageElem[]): { rows: KeyboardRowData[]; small?: boolean } {
  let currentRow: KeyboardRowData | null = null
  const rows: KeyboardRowData[] = []
  let hasSmall = false

  for (const elem of elems) {
    if (elem.type !== 'button') continue
    
    const data = elem.data as ButtonData
    if (!currentRow || currentRow.buttons.length >= 5) {
      currentRow = { buttons: [] }
      rows.push(currentRow)
    }
    currentRow.buttons.push({
      id: data.id,
      render_data: data.render_data,
      action: data.action,
    })
    if (data.small === true) hasSmall = true
  }

  return { rows, small: hasSmall }
}

export function buildKeyboard(rows: KeyboardRowData[], small?: boolean): { content: { rows: KeyboardRowData[]; style?: KeyboardStyle } } {
  const content: { rows: KeyboardRowData[]; style?: KeyboardStyle } = { rows }
  if (small) {
    content.style = { font_size: 'small' }
  }
  return { content }
}

export function parseElems(elems: MessageElem[]): ParsedElems {
  const textParts: string[] = []
  const markdownParts: string[] = []
  let msgType = 0
  let customMarkdown: ParsedElems['customMarkdown']
  let messageReference: { message_id: string } | undefined
  let eventId: string | undefined
  let ark: Record<string, unknown> | undefined
  let embed: Record<string, unknown> | undefined

  for (const elem of elems) {
    switch (elem.type) {
      case 'text': {
        const data = elem.data as TextElem['data']
        textParts.push(data.text)
        break
      }
      case 'face': {
        const data = elem.data as FaceElem['data']
        textParts.push(`<emoji:${data.id}>`)
        break
      }
      case 'reply': {
        const data = elem.data as ReplyElem['data']
        messageReference = { message_id: data.message_id }
        if (data.event_id) eventId = data.event_id
        break
      }
      case 'markdown': {
        const data = elem.data as MarkdownElem['data']
        msgType = 2
        if ('custom_template_id' in data) {
          customMarkdown = { custom_template_id: data.custom_template_id, params: data.params }
        } else if ('content' in data) {
          markdownParts.push(data.content)
        }
        break
      }
      case 'ark': {
        const data = elem.data as ArkElem['data']
        msgType = 3
        ark = { template_id: data.template_id, kv: data.kv }
        break
      }
      case 'embed': {
        const data = elem.data as EmbedElem['data']
        msgType = 4
        embed = { title: data.title, prompt: data.prompt, thumbnail: data.thumbnail, fields: data.fields }
        break
      }
      case 'button':
        break
    }
  }

  const { rows: buttonRows, small } = collectButtons(elems)
  let keyboard: ParsedElems['keyboard']
  if (buttonRows.length > 0) {
    keyboard = buildKeyboard(buttonRows, small)
  }

  if (keyboard && msgType === 0) {
    msgType = 2
  }

  return { textParts, markdownParts, customMarkdown, msgType, messageReference, eventId, ark, embed, keyboard, content: textParts.join('') }
}

export async function buildChannelBody(content: Sendable, msgId?: string): Promise<{ body: ChannelBody; fileImage?: Buffer } | null> {
  const elems = toElems(content)
  const parsed = parseElems(elems)
  const body: ChannelBody = {}

  let fileImage: Buffer | undefined
  for (const elem of elems) {
    if (elem.type === 'image') {
      const data = elem.data as ImageElem['data']
      const file = data.url ?? data.file
      if (typeof file === 'string' && isUrl(file)) {
        body.image = file
      } else {
        fileImage = await getFileBuffer(file)
      }
    }
  }

  body.content = parsed.content
  if (parsed.messageReference) {
    body.message_reference = parsed.messageReference
    if (parsed.eventId) body.event_id = parsed.eventId
  }
  if (parsed.ark) body.ark = parsed.ark as ChannelBody['ark']
  if (parsed.embed) body.embed = parsed.embed as ChannelBody['embed']
  if (parsed.keyboard) body.keyboard = parsed.keyboard
  if (parsed.customMarkdown) {
    body.markdown = parsed.customMarkdown
  } else if (parsed.markdownParts.length > 0) {
    body.markdown = { content: parsed.markdownParts.join('') }
  }

  if (parsed.keyboard && parsed.msgType === 0) {
    if (!body.markdown) {
      body.markdown = { content: parsed.content || ' ' }
    }
  }

  if (parsed.msgType > 0) body.msg_type = parsed.msgType

  if (!body.content && !body.image && !fileImage && !body.message_reference && !body.markdown && !body.ark && !body.embed && !body.keyboard) return null
  if (msgId) body.msg_id = msgId
  return { body, fileImage }
}

export async function buildGroupOrPrivateBody(opts: GroupOrPrivateBodyOptions): Promise<GroupOrPrivateBody | null> {
  const elems = toElems(opts.content)
  const parsed = parseElems(elems)
  const body: GroupOrPrivateBody = {
    msg_type: 0,
    msg_seq: opts.msgSeq ?? nextSeq(),
  }

  if (opts.isWakeup) body.is_wakeup = true

  const mediaElems = elems.filter(e => ['image', 'voice', 'video', 'file'].includes(e.type))
  const hasMedia = mediaElems.length > 0
  const hasText = parsed.content.length > 0

  body.content = parsed.content
  if (parsed.messageReference) {
    body.message_reference = parsed.messageReference
    if (parsed.eventId) body.event_id = parsed.eventId
  }
  if (parsed.ark) body.ark = parsed.ark as GroupOrPrivateBody['ark']
  if (parsed.embed) body.embed = parsed.embed as GroupOrPrivateBody['embed']
  if (parsed.keyboard) body.keyboard = parsed.keyboard
  if (parsed.customMarkdown) {
    body.markdown = parsed.customMarkdown
  } else if (parsed.markdownParts.length > 0) {
    body.markdown = { content: parsed.markdownParts.join('') }
  }

  if (parsed.keyboard && parsed.msgType === 0) {
    if (!body.markdown) {
      body.markdown = { content: parsed.content || ' ' }
    }
  }

  if (parsed.msgType > 0) body.msg_type = parsed.msgType

  if (hasMedia && opts.sceneOpenid) {
    const mediaElem = mediaElems[0]
    const file = getMediaFile(mediaElem)
    const fileName = getMediaFileName(mediaElem)
    if (file) {
      const fileInfo = await opts.uploadMedia(getMediaFileType(mediaElem), file, fileName)
      body.msg_type = 7
      body.media = { file_info: fileInfo }
    }
  }

  if (!body.content && body.msg_type === 0 && !body.media && !body.message_reference && !body.markdown && !body.ark && !body.embed && !body.keyboard) return null
  if (opts.msgId) body.msg_id = opts.msgId
  if (opts.eventId) body.event_id = opts.eventId
  if (opts.messageReference && !body.message_reference) {
    body.message_reference = opts.messageReference
  }
  return body
}

export function getMediaFileType(elem: MessageElem): number {
  switch (elem.type) {
    case 'image': return 1
    case 'video': return 2
    case 'voice': return 3
    case 'file': return 4
    default: return 1
  }
}

export function getMediaFile(elem: MessageElem): string | Buffer | undefined {
  switch (elem.type) {
    case 'image': return (elem.data as ImageElem['data']).file
    case 'video': return (elem.data as VideoElem['data']).file
    case 'voice': return (elem.data as VoiceElem['data']).file
    case 'file': return (elem.data as FileElem['data']).file
    default: return undefined
  }
}

export function getMediaFileName(elem: MessageElem): string | undefined {
  switch (elem.type) {
    case 'image': return (elem.data as ImageElem['data']).name
    case 'video': return (elem.data as VideoElem['data']).name
    case 'voice': return (elem.data as VoiceElem['data']).name
    case 'file': return (elem.data as FileElem['data']).name
    default: return undefined
  }
}

let msgSeq = 0
export function nextSeq(): number {
  return ++msgSeq
}
