import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types'

export interface PaymentTransaction {
  transactionId?: number
  orderId?: number
  orderNo?: string
  paymentProvider?: string
  paymentMode?: string
  planProviderId?: number
  providerCheckoutId?: string
  providerOrderId?: string
  providerCustomerId?: string
  providerSubscriptionId?: string
  providerInvoiceId?: string
  providerEventId?: string
  transactionStatus?: string
  amountCent?: number
  currency?: string
  checkoutUrl?: string
  requestBody?: string
  notifyBody?: string
  createTime?: string
  updateTime?: string
  remark?: string
}

export interface PaymentTransactionQuery {
  pageNum?: number
  pageSize?: number
  orderNo?: string
  paymentProvider?: string
  providerSubscriptionId?: string
  transactionStatus?: string
}

export function listPaymentTransaction(query?: PaymentTransactionQuery): Promise<TableDataInfo<PaymentTransaction[]>> {
  return request({
    url: '/system/payment/transaction/list',
    method: 'get',
    params: query
  })
}

export function getPaymentTransaction(transactionId: number): Promise<AjaxResult<PaymentTransaction>> {
  return request({
    url: '/system/payment/transaction/' + transactionId,
    method: 'get'
  })
}
