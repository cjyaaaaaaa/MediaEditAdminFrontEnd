import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types'

export interface EmailTemplateContent { locale: string; subject: string; htmlContent: string; textContent: string }
export interface EmailTemplate {
  templateId?: string; site?: string; tag?: string; templateName?: string
  defaultLocale?: string; fromAlias?: string; availableLocales?: string[]
  status?: string; contents?: EmailTemplateContent[]; variableNames?: string[]; remark?: string; createTime?: string
}
export interface EmailTemplateTagOption { code: string; description: string }
export interface EmailTemplateLocaleOption { code: string; description: string }
export interface EmailTemplateQuery { pageNum?: number; pageSize?: number; site?: string; tag?: string; templateName?: string; status?: string }
export interface EmailSendRequest { site?: string; tag: string; locale?: string; recipient: string; variables: Record<string, string>; trackingTags?: string[] }
export interface EmailSendResult { sendLogId: string; status: string }

export function getEmailTemplateTags(): Promise<AjaxResult<EmailTemplateTagOption[]>> {
  return request({ url: '/system/email/template/tag-options', method: 'get' })
}
export function getEmailTemplateLocales(): Promise<AjaxResult<EmailTemplateLocaleOption[]>> {
  return request({ url: '/system/email/template/locale-options', method: 'get' })
}
export function listEmailTemplate(query: EmailTemplateQuery): Promise<TableDataInfo<EmailTemplate[]>> {
  return request({ url: '/system/email/template/list', method: 'get', params: query })
}
export function getEmailTemplate(id: string): Promise<AjaxResult<EmailTemplate>> {
  return request({ url: `/system/email/template/${id}`, method: 'get' })
}
export function addEmailTemplate(data: EmailTemplate): Promise<AjaxResult<string>> {
  return request({ url: '/system/email/template', method: 'post', data })
}
export function updateEmailTemplate(data: EmailTemplate): Promise<AjaxResult> {
  return request({ url: '/system/email/template', method: 'put', data })
}
export function delEmailTemplate(ids: string | string[]): Promise<AjaxResult> {
  return request({ url: `/system/email/template/${ids}`, method: 'delete' })
}
export function testSendEmail(data: EmailSendRequest): Promise<AjaxResult<EmailSendResult>> {
  return request({ url: '/system/email/template/test-send', method: 'post', data })
}
