import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types'

export interface PaymentPlanProvider {
  planProviderId?: string
  planId?: string
  paymentProvider?: string
  providerProductId?: string
  providerPriceId?: string
  providerConfig?: string
  status?: string
  remark?: string
}

export interface PaymentPlan {
  planId?: string
  site?: string
  planName?: string
  description?: string
  billingType?: string
  priceCent?: number
  currency?: string
  creditAmount?: number
  intervalUnit?: string
  intervalCount?: number
  sortOrder?: number
  status?: string
  remark?: string
  providers?: PaymentPlanProvider[]
}

export interface PaymentPlanQuery {
  pageNum?: number
  pageSize?: number
  site?: string
  planName?: string
  billingType?: string
  status?: string
}

export function listPaymentPlan(query?: PaymentPlanQuery): Promise<TableDataInfo<PaymentPlan[]>> {
  return request({
    url: '/system/payment/plan/list',
    method: 'get',
    params: query
  })
}

export function getPaymentPlan(planId: string): Promise<AjaxResult<PaymentPlan>> {
  return request({
    url: '/system/payment/plan/' + planId,
    method: 'get'
  })
}

export function addPaymentPlan(data: PaymentPlan): Promise<AjaxResult> {
  return request({
    url: '/system/payment/plan',
    method: 'post',
    data
  })
}

export function updatePaymentPlan(data: PaymentPlan): Promise<AjaxResult> {
  return request({
    url: '/system/payment/plan',
    method: 'put',
    data
  })
}

export function delPaymentPlan(planId: string | string[]): Promise<AjaxResult> {
  return request({
    url: '/system/payment/plan/' + planId,
    method: 'delete'
  })
}
