export interface AudioAction {
  status: 'START' | 'PAUSE' | 'RESUME' | 'STOP'
  audio_url?: string
  text?: string
}