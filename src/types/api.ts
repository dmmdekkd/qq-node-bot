import type { Sendable } from './elements'
import type { KeyboardRowData, KeyboardStyle } from './keyboard'

export interface MessageReference {
  message_id: string
  ignore_get_message_error?: boolean
}

export interface ChannelBody {
  content?: string
  msg_id?: string
  event_id?: string
  image?: string
  message_reference?: MessageReference
  msg_type?: number
  markdown?: Record<string, unknown>
  ark?: Record<string, unknown>
  embed?: Record<string, unknown>
  keyboard?: Record<string, unknown>
}

export interface GroupOrPrivateBody {
  msg_type: number
  msg_seq: number
  content?: string
  msg_id?: string
  event_id?: string
  message_reference?: MessageReference
  media?: { file_info: string }
  markdown?: Record<string, unknown>
  ark?: Record<string, unknown>
  embed?: Record<string, unknown>
  keyboard?: Record<string, unknown>
  is_wakeup?: boolean
}

export interface GroupOrPrivateBodyOptions {
  content: Sendable
  msgId?: string
  msgSeq?: number
  sceneOpenid?: string
  eventId?: string
  messageReference?: MessageReference
  isWakeup?: boolean
  uploadMedia: (fileType: number, file: string | Buffer, fileName?: string) => Promise<string>
}

export interface SendMessageOptions {
  msgId?: string
  eventId?: string
  msgSeq?: number
  messageReference?: MessageReference
  isWakeup?: boolean
}

export interface RecallOptions {
  hidetip?: boolean
}

export interface CreateChannelPayload {
  name: string
  type: number
  position?: number
  parent_id?: string
  sub_type?: number
}

export interface UpdateChannelPayload {
  name?: string
  position?: number
  parent_id?: string
}

export interface UpdatePermissionsPayload {
  add?: string
  remove?: string
}

export interface CreateSchedulePayload {
  name: string
  description?: string
  start_time: string
  end_time: string
}

export interface CreateThreadPayload {
  title: string
  content: string
  format?: 0 | 1
}

export interface GroupMember {
  member_openid: string
  union_openid?: string
  union_user_account?: string
}

export const INTERACTION_CODE = {
  Success: 0,
  Failed: 1,
  FrequencyLimit: 2,
  Duplicate: 3,
  NoPermission: 4,
  AdminOnly: 5,
} as const

export type InteractionCode = (typeof INTERACTION_CODE)[keyof typeof INTERACTION_CODE]

export interface UploadResult {
  url: string
  file_uuid?: string
  file_info?: string
  ttl?: number
}

export interface StreamPayload {
  state: number
  id?: string
  index: number
  reset: boolean
}

export interface StreamMessageBody {
  msg_type: number
  markdown: { content: string }
  msg_seq: number
  stream: StreamPayload
}

export interface StreamOptions {
  maxChars?: number
  interval?: number
}

export interface UploadPrepareRequest {
  file_type: number
  file_name: string
  file_size: number
  md5: string
  sha1: string
  md5_10m: string
}

export interface UploadPrepareResponse {
  upload_id: string
  block_size: number
  parts: Array<{ index: number; presigned_url: string }>
  concurrency: number
  retry_timeout: number
}

export interface UploadPartFinishRequest {
  upload_id: string
  part_index: number
  block_size: number
  md5: string
}

export interface UploadCompleteRequest {
  upload_id: string
}

export interface UploadCompleteResponse {
  file_uuid: string
  file_info: string
  ttl: number
}

export const FILE_SIZE_THRESHOLD = 10 * 1024 * 1024

export interface ParsedElems {
  textParts: string[]
  markdownParts: string[]
  customMarkdown?: { custom_template_id: string; params: { key: string; values: string }[] }
  msgType: number
  messageReference?: { message_id: string }
  eventId?: string
  ark?: Record<string, unknown>
  embed?: Record<string, unknown>
  keyboard?: { content: { rows: KeyboardRowData[]; style?: KeyboardStyle } }
  content: string
}