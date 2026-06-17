import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types'

export interface PaymentOrder {
  orderId?: number
  orderNo?: string
  userId?: number
  userName?: string
  planId?: number
  planName?: string
  planCode?: string
  billingType?: string
  amountCent?: number
  currency?: string
  creditAmount?: number
  orderStatus?: string
  subscriptionId?: number
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
  userId?: number
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

export function getPaymentOrder(orderId: number): Promise<AjaxResult<PaymentOrder>> {
  return request({
    url: '/system/payment/order/' + orderId,
    method: 'get'
  })
}
