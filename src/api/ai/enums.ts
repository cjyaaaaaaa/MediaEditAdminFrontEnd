import request from '@/utils/request'
import type { AjaxResult } from '@/types'
import type { AiModelEnumOption, AiPlatformEnumOption } from '@/constants/ai'

export interface AiEnumsResult {
  platforms: AiPlatformEnumOption[]
  models: AiModelEnumOption[]
}

export function listAiEnums(): Promise<AjaxResult<AiEnumsResult>> {
  return request({
    url: '/system/ai/enums',
    method: 'get'
  })
}
