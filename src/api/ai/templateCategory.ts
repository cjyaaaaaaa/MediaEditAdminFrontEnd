import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types'
import type { AiTemplateMediaType, AiTemplateSourceType, CommonStatus } from '@/constants/ai'

export interface AiTemplateCategory {
  categoryId?: string
  site?: string
  userId?: string
  categoryName?: string
  sourceType?: AiTemplateSourceType
  mediaType?: AiTemplateMediaType
  sortOrder?: number
  status?: CommonStatus
  remark?: string
  createTime?: string
}

export interface TemplateCategoryQuery {
  pageNum?: number
  pageSize?: number
  categoryName?: string
  site?: string
  userId?: string
  sourceType?: AiTemplateSourceType
  mediaType?: AiTemplateMediaType
  status?: CommonStatus
}

export function listTemplateCategory(query?: TemplateCategoryQuery): Promise<TableDataInfo<AiTemplateCategory[]>> {
  return request({
    url: '/system/ai/template/category/list',
    method: 'get',
    params: query
  })
}

export function getTemplateCategory(categoryId: string): Promise<AjaxResult<AiTemplateCategory>> {
  return request({
    url: '/system/ai/template/category/' + categoryId,
    method: 'get'
  })
}

export function addTemplateCategory(data: AiTemplateCategory): Promise<AjaxResult> {
  return request({
    url: '/system/ai/template/category',
    method: 'post',
    data
  })
}

export function updateTemplateCategory(data: AiTemplateCategory): Promise<AjaxResult> {
  return request({
    url: '/system/ai/template/category',
    method: 'put',
    data
  })
}

export function delTemplateCategory(categoryId: string | string[]): Promise<AjaxResult> {
  return request({
    url: '/system/ai/template/category/' + categoryId,
    method: 'delete'
  })
}
