import request from '@/utils/request'
import type { TableDataInfo } from '@/types'

export interface EmailSendLog {
  sendLogId: string
  site?: string
  recipient: string
  tag?: string
  templateName?: string
  fromAlias?: string
  requestedLocale?: string
  actualLocale?: string
  trackingTags?: string[]
  sendStatus: string
  errorMessage?: string
  sentTime?: string
  createTime?: string
}

export interface EmailSendLogQuery {
  pageNum?: number
  pageSize?: number
  site?: string
  tag?: string
  sendStatus?: string
  recipient?: string
  createTimeStart?: string
  createTimeEnd?: string
}

export function listEmailSendLog(query: EmailSendLogQuery): Promise<TableDataInfo<EmailSendLog[]>> {
  return request({ url: '/system/email/log/list', method: 'get', params: query })
}
