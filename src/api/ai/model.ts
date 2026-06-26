import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types'

export interface AiModel {
  modelId?: string
  platformId?: string
  platformName?: string
  platformCode?: number
  modelCode?: number
  modelName?: string
  apiUrl?: string
  billingType?: string
  creditConfig?: string
  configJson?: string
  status?: string
  sortOrder?: number
  remark?: string
}

export interface AiModelQuery {
  pageNum?: number
  pageSize?: number
  platformId?: string
  platformCode?: number
  modelCode?: number
  modelName?: string
  status?: string
}

export function listModel(query: AiModelQuery): Promise<TableDataInfo<AiModel[]>> {
  return request({
    url: '/system/ai/model/list',
    method: 'get',
    params: query
  })
}

export function getModel(modelId: string): Promise<AjaxResult<AiModel>> {
  return request({
    url: '/system/ai/model/' + modelId,
    method: 'get'
  })
}

export function addModel(data: AiModel): Promise<AjaxResult> {
  return request({
    url: '/system/ai/model',
    method: 'post',
    data
  })
}

export function updateModel(data: AiModel): Promise<AjaxResult> {
  return request({
    url: '/system/ai/model',
    method: 'put',
    data
  })
}

export function delModel(modelId: string | string[]): Promise<AjaxResult> {
  return request({
    url: '/system/ai/model/' + modelId,
    method: 'delete'
  })
}
