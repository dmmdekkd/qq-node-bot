import type { Schedule } from '../types'
import type { CreateSchedulePayload } from '../types/api'
import { ApiClient } from '../core/api'

let api: ApiClient

export const ScheduleApi = {
  init(client: ApiClient) { api = client },

  async getSchedules(channelId: string): Promise<Schedule[]> {
    return api.get(`/channels/${channelId}/schedules`)
  },
  async createSchedule(channelId: string, data: CreateSchedulePayload): Promise<Schedule> {
    return api.post(`/channels/${channelId}/schedules`, data)
  },
  async updateSchedule(channelId: string, scheduleId: string, data: Partial<CreateSchedulePayload>): Promise<Schedule> {
    return api.patch(`/channels/${channelId}/schedules/${scheduleId}`, data)
  },
}
