import type {
  MessageElem,
  TextElem, FaceElem,
  ImageElem, VideoElem, VoiceElem, FileElem,
  ReplyElem, MarkdownElem,
  ArkElem, EmbedElem, ButtonElem,
} from './types/elements'
import type { ButtonRenderData, ButtonAction } from './types/keyboard'
import { isUrl, isBase64 } from './utils/file'

function resolveMediaUrl(file: string | Buffer): string | undefined {
  if (typeof file === 'string' && (isUrl(file) || isBase64(file))) return file
  return undefined
}

export const segment = {
  text(text: string): TextElem {
    return { type: 'text', data: { text } }
  },

  face(id: number, text?: string): FaceElem {
    return { type: 'face', data: { id, text } }
  },

  image(file: string | Buffer, options?: { url?: string; name?: string }): ImageElem {
    return { type: 'image', data: { file, url: options?.url ?? resolveMediaUrl(file), name: options?.name } }
  },

  video(file: string | Buffer, options?: { url?: string; name?: string }): VideoElem {
    return { type: 'video', data: { file, url: options?.url ?? resolveMediaUrl(file), name: options?.name } }
  },

  audio(file: string | Buffer, options?: { url?: string; name?: string }): VoiceElem {
    return { type: 'voice', data: { file, url: options?.url ?? resolveMediaUrl(file), name: options?.name } }
  },

  file(file: string | Buffer, options?: { url?: string; name?: string; size?: number }): FileElem {
    return { type: 'file', data: { file, url: options?.url ?? resolveMediaUrl(file), name: options?.name, size: options?.size } }
  },

  reply(messageId: string, eventId?: string): ReplyElem {
    return { type: 'reply', data: { message_id: messageId, event_id: eventId } }
  },

  button(opts: {
    id?: string
    render_data: ButtonRenderData
    action: ButtonAction
    small?: boolean
  }): ButtonElem {
    const render_data = {
      ...opts.render_data,
      visited_label: opts.render_data.visited_label ?? opts.render_data.label,
    }
    const action = {
      ...opts.action,
      permission: opts.action.permission ?? { type: 2 },
      unsupport_tips: opts.action.unsupport_tips ?? '不支持',
    }
    return { type: 'button', data: { id: opts.id, render_data, action, small: opts.small } }
  },

  markdown(contentOrId: string, params?: { key: string; values: string }[]): MarkdownElem {
    if (params) {
      return { type: 'markdown', data: { custom_template_id: contentOrId, params } }
    }
    return { type: 'markdown', data: { content: contentOrId } }
  },

  ark(templateId: number, kv: { key: string; value: string }[]): ArkElem {
    return { type: 'ark', data: { template_id: templateId, kv } }
  },

  embed(
    title: string,
    prompt: string,
    thumbnail?: Record<string, string>,
    fields?: { name: string; value: string }[],
  ): EmbedElem {
    return { type: 'embed', data: { title, prompt, thumbnail, fields: fields ?? [] } }
  },
}

export default segment