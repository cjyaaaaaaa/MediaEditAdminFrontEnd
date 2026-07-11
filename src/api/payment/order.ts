import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types'

export interface PaymentOrder {
  orderId?: string
  orderNo?: string
  userId?: string
  userName?: string
  planId?: string
  planName?: string
  billingType?: string
  amountCent?: number
  currency?: string
  creditAmount?: number
  orderStatus?: string
  subscriptionId?: string
  payTime?: string
  deliverTime?: string
  createTime?: string
  updateTime?: string
  remark?: string
}

export interface PaymentOrderQuery {
  pageNum?: number
  pageSize?: number
  orderNo?: string
  userId?: string
  userName?: string
  billingType?: string
  orderStatus?: string
}

export function listPaymentOrder(query?: PaymentOrderQuery): Promise<TableDataInfo<PaymentOrder[]>> {
  return request({
    url: '/system/payment/order/list',
    method: 'get',
    params: query
  })
}

export function getPaymentOrder(orderId: string): Promise<AjaxResult<PaymentOrder>> {
  return request({
    url: '/system/payment/order/' + orderId,
    method: 'get'
  })
}
