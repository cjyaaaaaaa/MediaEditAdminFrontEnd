import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types'

export interface PaymentOrder {
  orderId?: string
  site?: string
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
  latestTransactionId?: string
  paymentProvider?: string
  paymentMode?: string
  transactionStatus?: string
  providerCheckoutId?: string
  providerOrderId?: string
  providerCustomerId?: string
  providerSubscriptionId?: string
  providerInvoiceId?: string
  providerEventId?: string
  createTime?: string
  updateTime?: string
  remark?: string
}

export interface PaymentOrderQuery {
  pageNum?: number
  pageSize?: number
  site?: string
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
