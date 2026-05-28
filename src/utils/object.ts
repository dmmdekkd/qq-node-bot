export function toObject<T>(data: string): T | null {
  try {
    return JSON.parse(data) as T
  } catch {
    return null
  }
}

export function deepClone<T>(obj: T): T {
  return structuredClone(obj)
}