import { ApiClient } from '../../core/api'
import { getFileBase64, getFileSize } from '../../utils/file'
import { ChunkedUploadApi } from '../multipartUpload'

let api: ApiClient

export function initUploader(client: ApiClient) {
  api = client
  ChunkedUploadApi.init(client)
}

async function uploadMedia(
  openid: string,
  fileType: number,
  file: string | Buffer,
  fileName: string | undefined,
  isGroup: boolean
): Promise<string> {
  const fileSize = getFileSize(file)
  const threshold = 10 * 1024 * 1024

  if (fileSize > threshold) {
    const name = fileName ?? 'file'
    return ChunkedUploadApi.chunkedUpload(openid, fileType, name, file, isGroup)
  }

  const base64Data = await getFileBase64(file)
  const payload: Record<string, unknown> = { file_type: fileType, file_data: base64Data, srv_send_msg: false }
  if (fileName) payload.file_name = fileName
  const endpoint = isGroup ? `/v2/groups/${openid}/files` : `/v2/users/${openid}/files`
  const result = await api.post<Record<string, unknown>>(endpoint, payload)
  return result.file_info as string
}

export async function uploadGroupMedia(groupOpenid: string, fileType: number, file: string | Buffer, fileName?: string): Promise<string> {
  return uploadMedia(groupOpenid, fileType, file, fileName, true)
}

export async function uploadPrivateMedia(userOpenid: string, fileType: number, file: string | Buffer, fileName?: string): Promise<string> {
  return uploadMedia(userOpenid, fileType, file, fileName, false)
}
