import type { Message } from '../types'
import type { SendMessageOptions, ChannelBody, RecallOptions } from '../types/api'
import type { Sendable } from '../types/elements'
import { ApiClient } from '../core/api'
import { getFileBuffer, buildMultipartBody } from '../utils/file'
import { buildChannelBody, buildGroupOrPrivateBody } from './message/builder'
import { initUploader, uploadGroupMedia, uploadPrivateMedia } from './message/uploader'
import { sendStreamPrivateMessage, sendStreamGroupMessage } from './message/stream'

let api: ApiClient

async function sendWithFileImage(endpoint: string, body: ChannelBody, fileImage: Buffer): Promise<Message> {
  const form = buildMultipartBody(body as Record<string, unknown>, 'file_image', fileImage, 'image.png')
  return api.post(endpoint, form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const MessageApi = {
  init(client: ApiClient) {
    api = client
    initUploader(client)
  },

  async sendMessage(channelId: string, content: Sendable, options?: SendMessageOptions): Promise<Message> {
    const result = await buildChannelBody(content, options?.msgId)
    if (!result) throw new Error('消息内容为空，无法发送')
    const { body } = result
    let { fileImage } = result
    if (body.image && !fileImage) {
      fileImage = await getFileBuffer(body.image)
      if (fileImage.length > 0) delete body.image
    }
    if (fileImage && fileImage.length > 0) {
      return sendWithFileImage(`/channels/${channelId}/messages`, body, fileImage)
    }
    return api.post(`/channels/${channelId}/messages`, body)
  },

  async sendGroupMessage(groupOpenid: string, content: Sendable, options?: SendMessageOptions): Promise<Message> {
    const body = await buildGroupOrPrivateBody({
      content,
      msgId: options?.msgId,
      msgSeq: options?.msgSeq,
      sceneOpenid: groupOpenid,
      eventId: options?.eventId,
      messageReference: options?.messageReference,
      uploadMedia: (ft, file, fn) => uploadGroupMedia(groupOpenid, ft, file, fn),
    })
    if (!body) throw new Error('消息内容为空，无法发送')
    return api.post(`/v2/groups/${groupOpenid}/messages`, body)
  },

  async sendPrivateMessage(userOpenid: string, content: Sendable, options?: SendMessageOptions): Promise<Message> {
    const body = await buildGroupOrPrivateBody({
      content,
      msgId: options?.msgId,
      msgSeq: options?.msgSeq,
      sceneOpenid: userOpenid,
      eventId: options?.eventId,
      messageReference: options?.messageReference,
      isWakeup: options?.isWakeup,
      uploadMedia: (ft, file, fn) => uploadPrivateMedia(userOpenid, ft, file, fn),
    })
    if (!body) throw new Error('消息内容为空，无法发送')
    return api.post(`/v2/users/${userOpenid}/messages`, body)
  },

  async sendDirectMessage(guildId: string, content: Sendable, options?: SendMessageOptions): Promise<Message> {
    const result = await buildChannelBody(content, options?.msgId)
    if (!result) throw new Error('消息内容为空，无法发送')
    const { body } = result
    let { fileImage } = result
    if (body.image && !fileImage) {
      fileImage = await getFileBuffer(body.image)
      if (fileImage.length > 0) delete body.image
    }
    if (fileImage && fileImage.length > 0) {
      return sendWithFileImage(`/dms/${guildId}/messages`, body, fileImage)
    }
    return api.post(`/dms/${guildId}/messages`, body)
  },

  async recallMessage(channelId: string, msgId: string, options?: RecallOptions): Promise<void> {
    const params = options?.hidetip !== undefined ? { hidetip: options.hidetip } : undefined
    return api.delete(`/channels/${channelId}/messages/${msgId}`, params)
  },

  async recallGroupMessage(groupOpenid: string, msgId: string): Promise<void> {
    return api.delete(`/v2/groups/${groupOpenid}/messages/${msgId}`)
  },

  async recallPrivateMessage(userOpenid: string, msgId: string): Promise<void> {
    return api.delete(`/v2/users/${userOpenid}/messages/${msgId}`)
  },

  async recallDirectMessage(guildId: string, msgId: string, options?: RecallOptions): Promise<void> {
    const params = options?.hidetip !== undefined ? { hidetip: options.hidetip } : undefined
    return api.delete(`/dms/${guildId}/messages/${msgId}`, params)
  },

  async sendStreamPrivateMessage(userOpenid: string, content: string, options?: { maxChars?: number; interval?: number }): Promise<Message> {
    return sendStreamPrivateMessage(userOpenid, content, options)
  },

  async sendStreamGroupMessage(groupOpenid: string, content: string, options?: { maxChars?: number; interval?: number }): Promise<Message> {
    return sendStreamGroupMessage(groupOpenid, content, options)
  },
}
