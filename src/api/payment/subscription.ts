import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types'

export interface UserSubscription {
  subscriptionId?: string
  userId?: string
  userName?: string
  planId?: string
  planName?: string
  paymentProvider?: string
  providerSubscriptionId?: string
  providerCustomerId?: string
  status?: string
  currentPeriodStart?: string
  currentPeriodEnd?: string
  cancelledAt?: string
  expiredAt?: string
  creditAmountPerPeriod?: number
  createTime?: string
  updateTime?: string
  remark?: string
}

export interface UserSubscriptionQuery {
  pageNum?: number
  pageSize?: number
  userId?: string
  userName?: string
  paymentProvider?: string
  providerSubscriptionId?: string
  status?: string
}

export function listUserSubscription(query?: UserSubscriptionQuery): Promise<TableDataInfo<UserSubscription[]>> {
  return request({
    url: '/system/payment/subscription/list',
    method: 'get',
    params: query
  })
}

export function getUserSubscription(subscriptionId: string): Promise<AjaxResult<UserSubscription>> {
  return request({
    url: '/system/payment/subscription/' + subscriptionId,
    method: 'get'
  })
}
