import request from '@/utils/request'
import type { AjaxResult } from '@/types'

export interface CustomerSiteOption {
  code: string
  label: string
}

export function listCustomerSiteOptions(): Promise<AjaxResult<CustomerSiteOption[]>> {
  return request({
    url: '/system/customer/site/options',
    method: 'get'
  })
}
