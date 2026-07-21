import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types'
import type { EmailTag } from './emailTemplate'

export interface EmailTagQuery { pageNum?: number; pageSize?: number; tagCode?: string; tagName?: string; status?: string }
export function listEmailTag(query: EmailTagQuery): Promise<TableDataInfo<EmailTag[]>> { return request({ url: '/system/email/tag/list', method: 'get', params: query }) }
export function listEmailTagOptions(): Promise<AjaxResult<EmailTag[]>> { return request({ url: '/system/email/tag/options', method: 'get' }) }
export function getEmailTag(id: number): Promise<AjaxResult<EmailTag>> { return request({ url: `/system/email/tag/${id}`, method: 'get' }) }
export function addEmailTag(data: EmailTag): Promise<AjaxResult> { return request({ url: '/system/email/tag', method: 'post', data }) }
export function updateEmailTag(data: EmailTag): Promise<AjaxResult> { return request({ url: '/system/email/tag', method: 'put', data }) }
export function delEmailTag(ids: number | number[]): Promise<AjaxResult> { return request({ url: `/system/email/tag/${ids}`, method: 'delete' }) }
