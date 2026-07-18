import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types'
import type { AiTemplateMediaType, AiTemplateSourceType, CommonStatus } from '@/constants/ai'

export interface AiTemplate {
  templateId?: string
  site?: string
  categoryId?: string
  categoryName?: string
  userId?: string
  userName?: string
  templateName?: string
  sourceType?: AiTemplateSourceType
  mediaType?: AiTemplateMediaType
  prompt?: string
  coverUrl?: string[]
  sortOrder?: number
  status?: CommonStatus
  remark?: string
  createTime?: string
}

export interface TemplateQuery {
  pageNum?: number
  pageSize?: number
  categoryId?: string
  keyword?: string
  sourceType?: AiTemplateSourceType
  mediaType?: AiTemplateMediaType
  status?: CommonStatus
}

export function listTemplate(query: TemplateQuery): Promise<TableDataInfo<AiTemplate[]>> {
  return request({
    url: '/system/ai/template/list',
    method: 'get',
    params: query
  })
}

export function getTemplate(templateId: string): Promise<AjaxResult<AiTemplate>> {
  return request({
    url: '/system/ai/template/' + templateId,
    method: 'get'
  })
}

export function addTemplate(data: AiTemplate): Promise<AjaxResult> {
  return request({
    url: '/system/ai/template',
    method: 'post',
    data
  })
}

export function updateTemplate(data: AiTemplate): Promise<AjaxResult> {
  return request({
    url: '/system/ai/template',
    method: 'put',
    data
  })
}

export function delTemplate(templateId: string | string[]): Promise<AjaxResult> {
  return request({
    url: '/system/ai/template/' + templateId,
    method: 'delete'
  })
}
