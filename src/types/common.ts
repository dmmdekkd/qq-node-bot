export interface PaginationParams {
  limit?: number
  start?: string
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}