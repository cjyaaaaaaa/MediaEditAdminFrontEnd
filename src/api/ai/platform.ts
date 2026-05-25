import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types'

export interface AiPlatform {
  platformId?: number
  platformCode?: number
  platformName?: string
  configJson?: string
  status?: string
  sortOrder?: number
  remark?: string
}

export interface AiPlatformQuery {
  pageNum?: number
  pageSize?: number
  platformCode?: number
  platformName?: string
  status?: string
}

export function listPlatform(query: AiPlatformQuery): Promise<TableDataInfo<AiPlatform[]>> {
  return request({
    url: '/system/ai/platform/list',
    method: 'get',
    params: query
  })
}

export function getPlatform(platformId: number): Promise<AjaxResult<AiPlatform>> {
  return request({
    url: '/system/ai/platform/' + platformId,
    method: 'get'
  })
}

export function addPlatform(data: AiPlatform): Promise<AjaxResult> {
  return request({
    url: '/system/ai/platform',
    method: 'post',
    data
  })
}

export function updatePlatform(data: AiPlatform): Promise<AjaxResult> {
  return request({
    url: '/system/ai/platform',
    method: 'put',
    data
  })
}

export function delPlatform(platformId: number | number[]): Promise<AjaxResult> {
  return request({
    url: '/system/ai/platform/' + platformId,
    method: 'delete'
  })
}

export function optionselectPlatform(): Promise<AjaxResult<AiPlatform[]>> {
  return request({
    url: '/system/ai/platform/optionselect',
    method: 'get'
  })
}
