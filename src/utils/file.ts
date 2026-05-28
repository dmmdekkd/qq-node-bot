import { readFileSync, statSync, createReadStream, openSync, readSync, closeSync } from 'fs'
import { createHash } from 'crypto'
import { FormData } from 'formdata-node'
import type { ApiClient } from '../core/api'
import type { UploadResult } from '../types/api'
import type { FileSource, FileUploaderApi } from '../types'
import { md5, sha1 } from './crypto'

let api: ApiClient

export function isUrl(file: unknown): boolean {
  return typeof file === 'string' && /^https?:\/\//.test(file)
}

export function isBase64(file: unknown): boolean {
  return typeof file === 'string' && file.startsWith('base64://')
}

export function isDataUrl(file: unknown): boolean {
  return typeof file === 'string' && file.startsWith('data:')
}

export function isRemote(file: unknown): boolean {
  return isUrl(file) || isBase64(file) || isDataUrl(file)
}

export async function getFileBase64(file: FileSource): Promise<string> {
  if (Buffer.isBuffer(file)) return file.toString('base64')
  if (typeof file !== 'string') return ''

  try {
    const buf = await getFileBuffer(file)
    return buf.toString('base64')
  } catch {
    return ''
  }
}

export async function getFileBuffer(file: FileSource): Promise<Buffer> {
  if (Buffer.isBuffer(file)) return file
  if (typeof file !== 'string') return Buffer.alloc(0)

  if (isUrl(file)) {
    const res = await fetch(file)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return Buffer.from(await res.arrayBuffer())
  }

  if (isBase64(file)) {
    return Buffer.from(file.slice(9), 'base64')
  }

  if (isDataUrl(file)) {
    const base64 = file.split(',')[1] ?? ''
    return Buffer.from(base64, 'base64')
  }

  return readFileSync(file)
}

export function getFileSize(file: FileSource): number {
  if (Buffer.isBuffer(file)) return file.length
  if (typeof file !== 'string') return 0

  if (isUrl(file)) return 0
  if (isBase64(file)) return Buffer.byteLength(file.slice(9), 'base64')
  if (isDataUrl(file)) return Buffer.byteLength(file.split(',')[1] ?? '', 'base64')

  try {
    return statSync(file).size
  } catch {
    return 0
  }
}

export function calculateMD5(data: Buffer): string {
  return md5(data)
}

export function calculateSHA1(data: Buffer): string {
  return sha1(data)
}

export function calculateMD5_10M(data: Buffer): string {
  const chunk = data.slice(0, 10 * 1024 * 1024)
  return md5(chunk)
}

export async function calculateFileHashes(filePath: string): Promise<{ md5: string; sha1: string; md5_10m: string }> {
  const md5Hash = createHash('md5')
  const sha1Hash = createHash('sha1')
  const md5_10mHash = createHash('md5')
  let bytesRead10m = 0
  const limit10m = 10 * 1024 * 1024

  const stream = createReadStream(filePath)

  for await (const chunk of stream) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    md5Hash.update(buffer)
    sha1Hash.update(buffer)
    if (bytesRead10m < limit10m) {
      const remaining = limit10m - bytesRead10m
      const toHash = buffer.slice(0, remaining)
      md5_10mHash.update(toHash)
      bytesRead10m += toHash.length
    }
  }

  return {
    md5: md5Hash.digest('hex'),
    sha1: sha1Hash.digest('hex'),
    md5_10m: md5_10mHash.digest('hex'),
  }
}

export function readChunk(filePath: string, start: number, size: number): Buffer {
  const fd = openSync(filePath, 'r')
  const buffer = Buffer.alloc(size)
  readSync(fd, buffer, 0, size, start)
  closeSync(fd)
  return buffer
}

export async function readChunkAsync(filePath: string, start: number, size: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const stream = createReadStream(filePath, { start, end: start + size - 1 })
    const chunks: Buffer[] = []
    stream.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}

function createFormData(file: Buffer, fieldName: string, fileName: string): FormData {
  const form = new FormData()
  form.set(fieldName, new Blob([file]), fileName)
  return form
}

export function buildMultipartBody(body: Record<string, unknown>, fileFieldName: string, fileData: Buffer, fileName: string): FormData {
  const form = new FormData()
  for (const [key, value] of Object.entries(body)) {
    if (value !== undefined && value !== null) {
      form.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
    }
  }
  form.set(fileFieldName, new Blob([fileData]), fileName)
  return form
}

async function uploadFile(
  channelId: string,
  file: Buffer,
  fieldName: string,
  fileName: string,
  endpoint: string
): Promise<UploadResult> {
  const form = createFormData(file, fieldName, fileName)
  return api.post(endpoint, form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const FileUploader: FileUploaderApi = {
  init: (client: ApiClient) => { api = client },
  uploadImage: (channelId, file, fileName) =>
    uploadFile(channelId, file, 'file_image', fileName ?? 'image.png', `/channels/${channelId}/files/images`),
  uploadVoice: (channelId, file, fileName) =>
    uploadFile(channelId, file, 'file_voice', fileName ?? 'voice.amr', `/channels/${channelId}/files/voices`),
  uploadFile: (channelId, file, fileName) =>
    uploadFile(channelId, file, 'file', fileName, `/channels/${channelId}/files`),
} satisfies FileUploaderApi