import request from '@/utils/request'
import type { AjaxResult } from '@/types'
import type { AiModelEnumOption, AiPlatformEnumOption, AiBillingType } from '@/constants/ai'

export interface AiModelTypeOption {
  code: string
  label: string
}

export interface AiEnumsResult {
  platforms: AiPlatformEnumOption[]
  models: AiModelEnumOption[]
  modelTypes: AiModelTypeOption[]
  billingTypes: AiBillingType[]
  allowedSites: string[]
  sites: string[]
}

export function listAiEnums(): Promise<AjaxResult<AiEnumsResult>> {
  return request({
    url: '/system/ai/enums',
    method: 'get'
  })
}
