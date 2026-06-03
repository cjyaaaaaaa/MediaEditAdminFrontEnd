import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types'

export interface AiImageTemplate {
  templateId?: number
  categoryId?: number
  categoryName?: string
  userId?: number
  userName?: string
  templateName?: string
  sourceType?: string
  auditStatus?: string
  taskType?: string
  prompt?: string
  coverUrl?: string
  platformCode?: number
  modelCode?: number
  width?: number
  height?: number
  tags?: string
  usageCount?: number
  sortOrder?: number
  status?: string
  rejectReason?: string
  remark?: string
  createTime?: string
}

export interface TemplateQuery {
  pageNum?: number
  pageSize?: number
  categoryId?: number
  keyword?: string
  sourceType?: string
  auditStatus?: string
  taskType?: string
  status?: string
}

export function listTemplate(query: TemplateQuery): Promise<TableDataInfo<AiImageTemplate[]>> {
  return request({
    url: '/system/ai/template/list',
    method: 'get',
    params: query
  })
}

export function getTemplate(templateId: number): Promise<AjaxResult<AiImageTemplate>> {
  return request({
    url: '/system/ai/template/' + templateId,
    method: 'get'
  })
}

export function addTemplate(data: AiImageTemplate): Promise<AjaxResult> {
  return request({
    url: '/system/ai/template',
    method: 'post',
    data
  })
}

export function updateTemplate(data: AiImageTemplate): Promise<AjaxResult> {
  return request({
    url: '/system/ai/template',
    method: 'put',
    data
  })
}

export function auditTemplate(data: AiImageTemplate): Promise<AjaxResult> {
  return request({
    url: '/system/ai/template/audit',
    method: 'put',
    data
  })
}

export function delTemplate(templateId: number | number[]): Promise<AjaxResult> {
  return request({
    url: '/system/ai/template/' + templateId,
    method: 'delete'
  })
}
