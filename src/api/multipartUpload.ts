import type { ApiClient } from '../core/api'
import type { UploadPrepareRequest, UploadPrepareResponse, UploadPartFinishRequest, UploadCompleteResponse } from '../types/api'
import { getFileBuffer, getFileSize, calculateMD5, calculateSHA1, calculateMD5_10M, calculateFileHashes, readChunkAsync, isRemote } from '../utils/file'
import type { FileSource } from '../types'
import { rootLogger } from '../utils/logger'

let api: ApiClient
let logger = rootLogger()

const MB = 1024 * 1024

function getFileTypeLimit(fileType: number, isGroup?: boolean): number {
  const groupLimits = {
    image: 30 * MB,
    video: 100 * MB,
    voice: 20 * MB,
    file: 100 * MB,
  }
  const privateLimits = {
    image: 30 * MB,
    video: 100 * MB,
    voice: 20 * MB,
    file: 100 * MB,
  }
  const limits = isGroup ? groupLimits : privateLimits

  switch (fileType) {
    case 1: return limits.image
    case 2: return limits.video
    case 3: return limits.voice
    case 4: return limits.file
    default: return limits.file
  }
}

function getFileTypeName(fileType: number): string {
  switch (fileType) {
    case 1: return '图片'
    case 2: return '视频'
    case 3: return '语音'
    case 4: return '文件'
    default: return '文件'
  }
}

function isLocalFilePath(file: FileSource): boolean {
  if (Buffer.isBuffer(file)) return false
  if (typeof file !== 'string') return false
  return !isRemote(file)
}

export const ChunkedUploadApi = {
  init(client: ApiClient) { api = client },

  async uploadPrepare(targetId: string, fileType: number, fileName: string, fileSize: number, hashes: { md5: string; sha1: string; md5_10m: string }, isGroup: boolean): Promise<UploadPrepareResponse> {
    const endpoint = isGroup ? `/v2/groups/${targetId}/upload_prepare` : `/v2/users/${targetId}/upload_prepare`
    const payload: UploadPrepareRequest = {
      file_type: fileType,
      file_name: fileName,
      file_size: fileSize,
      md5: hashes.md5,
      sha1: hashes.sha1,
      md5_10m: hashes.md5_10m,
    }
    return api.post(endpoint, payload)
  },

  async uploadPartToCOS(presignedUrl: string, chunk: Buffer): Promise<void> {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: chunk,
      headers: { 'Content-Type': 'application/octet-stream' },
    })
    if (!response.ok) {
      throw new Error(`COS upload failed: ${response.status}`)
    }
  },

  async uploadPartFinish(targetId: string, uploadId: string, partIndex: number, blockSize: number, chunkMd5: string, isGroup: boolean): Promise<void> {
    const endpoint = isGroup ? `/v2/groups/${targetId}/upload_part_finish` : `/v2/users/${targetId}/upload_part_finish`
    const payload: UploadPartFinishRequest = {
      upload_id: uploadId,
      part_index: partIndex,
      block_size: blockSize,
      md5: chunkMd5,
    }
    await api.post(endpoint, payload)
  },

  async uploadComplete(targetId: string, uploadId: string, isGroup: boolean): Promise<UploadCompleteResponse> {
    const endpoint = isGroup ? `/v2/groups/${targetId}/files` : `/v2/users/${targetId}/files`
    return api.post(endpoint, { upload_id: uploadId })
  },

  async chunkedUpload(targetId: string, fileType: number, fileName: string, file: FileSource, isGroup: boolean): Promise<string> {
    const fileSize = getFileSize(file)
    const limit = getFileTypeLimit(fileType, isGroup)
    const typeName = getFileTypeName(fileType)

    if (fileSize > limit) {
      throw new Error(`${typeName}文件大小超过限制：${(fileSize / 1024 / 1024).toFixed(2)}MB > ${(limit / 1024 / 1024).toFixed(0)}MB`)
    }

    logger.info(`开始分片上传: ${fileName} (${(fileSize / 1024 / 1024).toFixed(2)}MB)`)

    const isLocalFile = isLocalFilePath(file)
    let hashes: { md5: string; sha1: string; md5_10m: string }

    if (isLocalFile && typeof file === 'string') {
      hashes = await calculateFileHashes(file)
    } else {
      const fileData = await getFileBuffer(file)
      hashes = {
        md5: calculateMD5(fileData),
        sha1: calculateSHA1(fileData),
        md5_10m: calculateMD5_10M(fileData),
      }
    }

    const prepareResp = await this.uploadPrepare(targetId, fileType, fileName, fileSize, hashes, isGroup)
    const { upload_id, block_size, parts } = prepareResp

    logger.info(`分片信息: ${parts.length} 个分片, 每片 ${(block_size / 1024 / 1024).toFixed(2)}MB`)

    if (isLocalFile && typeof file === 'string') {
      for (const part of parts) {
        const start = (part.index - 1) * block_size
        const actualSize = Math.min(block_size, fileSize - start)
        const chunk = await readChunkAsync(file, start, actualSize)
        const chunkMd5 = calculateMD5(chunk)

        await this.uploadPartToCOS(part.presigned_url, chunk)
        await this.uploadPartFinish(targetId, upload_id, part.index, actualSize, chunkMd5, isGroup)
        logger.info(`分片 ${part.index}/${parts.length} 上传完成`)
      }
    } else {
      const fileData = await getFileBuffer(file)
      for (const part of parts) {
        const start = (part.index - 1) * block_size
        const end = Math.min(start + block_size, fileData.length)
        const chunk = fileData.slice(start, end)
        const chunkMd5 = calculateMD5(chunk)

        await this.uploadPartToCOS(part.presigned_url, chunk)
        await this.uploadPartFinish(targetId, upload_id, part.index, chunk.length, chunkMd5, isGroup)
        logger.info(`分片 ${part.index}/${parts.length} 上传完成`)
      }
    }

    const completeResp = await this.uploadComplete(targetId, upload_id, isGroup)
    logger.info(`分片上传完成: ${fileName}`)
    return completeResp.file_info
  },
}