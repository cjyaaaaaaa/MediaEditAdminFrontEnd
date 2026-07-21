import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types'

export interface AiConfig {
  configId?: string
  site?: string
  configName?: string
  configKey?: string
  configValue?: string
  createBy?: string
  createTime?: string
  updateBy?: string
  updateTime?: string
  remark?: string
}

export interface AiConfigQuery {
  pageNum?: number
  pageSize?: number
  site?: string
  configName?: string
  configKey?: string
}

export interface AiConfigOption {
  code: string
  label: string
}

export function listAiConfig(query?: AiConfigQuery): Promise<TableDataInfo<AiConfig[]>> {
  return request({
    url: '/system/ai/config/list',
    method: 'get',
    params: query
  })
}

export function listAiConfigOptions(): Promise<AjaxResult<AiConfigOption[]>> {
  return request({
    url: '/system/ai/config/options',
    method: 'get'
  })
}

export function getAiConfig(configId: string): Promise<AjaxResult<AiConfig>> {
  return request({
    url: `/system/ai/config/${configId}`,
    method: 'get'
  })
}

export function addAiConfig(data: AiConfig): Promise<AjaxResult<string>> {
  return request({
    url: '/system/ai/config',
    method: 'post',
    data
  })
}

export function updateAiConfig(data: AiConfig): Promise<AjaxResult> {
  return request({
    url: '/system/ai/config',
    method: 'put',
    data
  })
}

export function deleteAiConfig(configIds: string | string[]): Promise<AjaxResult> {
  return request({
    url: `/system/ai/config/${configIds}`,
    method: 'delete'
  })
}

export function refreshAiConfigCache(): Promise<AjaxResult> {
  return request({
    url: '/system/ai/config/refreshCache',
    method: 'delete'
  })
}
