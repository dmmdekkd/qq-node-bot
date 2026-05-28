export interface ButtonRenderData {
  label: string
  visited_label?: string
  style: number
}

export interface ButtonAction {
  type: number
  permission?: { type: number; specify_user_ids?: string[]; specify_role_ids?: string[] }
  data: string
  reply?: boolean
  enter?: boolean
  anchor?: number
  click_limit?: number
  at_bot_show_channel_list?: boolean
  unsupport_tips?: string
}

export interface ButtonData {
  id?: string
  render_data: ButtonRenderData
  action: ButtonAction
  small?: boolean
}

export interface KeyboardButtonData {
  id?: string
  render_data: ButtonRenderData
  action: ButtonAction
}

export interface KeyboardRowData {
  buttons: KeyboardButtonData[]
}

export interface KeyboardStyle {
  font_size: 'small' | 'normal'
}

export interface KeyboardContent {
  rows: KeyboardRowData[]
  style?: KeyboardStyle
}
