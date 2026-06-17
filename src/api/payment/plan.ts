import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types'

export interface PaymentPlanProvider {
  planProviderId?: number
  planId?: number
  paymentProvider?: string
  providerProductId?: string
  providerPriceId?: string
  providerConfig?: string
  status?: string
  remark?: string
}

export interface PaymentPlan {
  planId?: number
  planName?: string
  planCode?: string
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
  planName?: string
  planCode?: string
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

export function getPaymentPlan(planId: number): Promise<AjaxResult<PaymentPlan>> {
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

export function delPaymentPlan(planId: number | number[]): Promise<AjaxResult> {
  return request({
    url: '/system/payment/plan/' + planId,
    method: 'delete'
  })
}
