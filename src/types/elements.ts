import type { ButtonData } from './keyboard'

export interface MessageElemMap {
  text:      { text: string }
  face:      { id: number; text?: string }
  image:     { file: string | Buffer; url?: string; name?: string }
  video:     { file: string | Buffer; url?: string; name?: string }
  voice:     { file: string | Buffer; url?: string; name?: string }
  file:      { file: string | Buffer; url?: string; name?: string; size?: number }
  reply:     { message_id: string; event_id?: string }
  markdown:  { content: string } | { custom_template_id: string; params: { key: string; values: string }[] }
  ark:       { template_id: number; kv: { key: string; value: string }[] }
  embed:     { title: string; prompt: string; thumbnail?: Record<string, string>; fields: { name: string; value: string }[] }
  button:    ButtonData
}

export type MessageElemType = keyof MessageElemMap

export type MessageElem<T extends MessageElemType = MessageElemType> = {
  type: T
  data: MessageElemMap[T]
}

export type TextElem      = MessageElem<'text'>
export type FaceElem      = MessageElem<'face'>
export type ImageElem     = MessageElem<'image'>
export type VideoElem     = MessageElem<'video'>
export type VoiceElem     = MessageElem<'voice'>
export type FileElem      = MessageElem<'file'>
export type ReplyElem     = MessageElem<'reply'>
export type MarkdownElem  = MessageElem<'markdown'>
export type ArkElem       = MessageElem<'ark'>
export type EmbedElem     = MessageElem<'embed'>
export type ButtonElem    = MessageElem<'button'>

export type Segment = MessageElem
export type TextSegment = TextElem
export type FaceSegment = FaceElem
export type ImageSegment = ImageElem
export type VideoSegment = VideoElem
export type VoiceSegment = VoiceElem
export type FileSegment = FileElem
export type ReplySegment = ReplyElem
export type ButtonSegment = ButtonElem
export type MarkdownSegment = MarkdownElem
export type ArkSegment = ArkElem
export type EmbedSegment = EmbedElem

export type RepeatableCombineElem = string | TextElem | FaceElem | ButtonElem

type SingleWithRepeatEnd<T extends MessageElem> = [T, ...RepeatableCombineElem[]]
type SingleWithRepeat<T extends MessageElem> = [...RepeatableCombineElem[], T] | SingleWithRepeatEnd<T>

type WithReply<T extends MessageElem> =
  | T
  | [T]
  | SingleWithRepeat<T>
  | [ReplyElem, ...SingleWithRepeat<T>]
  | [ReplyElem, ...RepeatableCombineElem[]]

export type Sendable =
  | RepeatableCombineElem
  | RepeatableCombineElem[]
  | WithReply<ImageElem | MarkdownElem | ArkElem | EmbedElem | VideoElem | VoiceElem | FileElem>
