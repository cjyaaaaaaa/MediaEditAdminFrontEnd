import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types'

export interface AiTemplateCategory {
  categoryId?: number
  categoryName?: string
  categoryCode?: string
  sortOrder?: number
  status?: string
  remark?: string
  createTime?: string
}

export interface TemplateCategoryQuery {
  pageNum?: number
  pageSize?: number
  categoryName?: string
  categoryCode?: string
  status?: string
}

export function listTemplateCategory(query?: TemplateCategoryQuery): Promise<TableDataInfo<AiTemplateCategory[]>> {
  return request({
    url: '/system/ai/template/category/list',
    method: 'get',
    params: query
  })
}

export function getTemplateCategory(categoryId: number): Promise<AjaxResult<AiTemplateCategory>> {
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

export function delTemplateCategory(categoryId: number | number[]): Promise<AjaxResult> {
  return request({
    url: '/system/ai/template/category/' + categoryId,
    method: 'delete'
  })
}
