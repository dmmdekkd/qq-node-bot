import { createHash } from 'crypto'

export function md5(data: string | Buffer): string {
  return createHash('md5').update(data).digest('hex')
}

export function sha1(data: string | Buffer): string {
  return createHash('sha1').update(data).digest('hex')
}
