export class BotError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number,
  ) {
    super(message)
    this.name = 'BotError'
  }
}

export class ApiError extends BotError {
  public traceId?: string

  constructor(status: number, body: unknown) {
    const data = body as Record<string, unknown> | undefined
    super(
      `API_${status}`,
      typeof data?.message === 'string' ? data.message : 'API request failed',
      status,
    )
    this.name = 'ApiError'
    if (typeof data?.trace_id === 'string') {
      this.traceId = data.trace_id
    }
  }
}
