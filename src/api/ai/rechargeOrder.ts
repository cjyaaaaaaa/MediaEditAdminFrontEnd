import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types'

export interface CreditRechargeOrder {
  orderId?: number
  orderNo?: string
  userId?: number
  userName?: string
  openid?: string
  packageId?: number
  packageName?: string
  productId?: string
  payMode?: string
  amountCent?: number
  creditAmount?: number
  buyQuantity?: number
  orderStatus?: string
  wxOrderId?: string
  wxTransactionId?: string
  signData?: string
  paySig?: string
  attach?: string
  notifyBody?: string
  queryBody?: string
  payTime?: string
  deliverTime?: string
  createTime?: string
  updateTime?: string
  remark?: string
}

export interface RechargeOrderQuery {
  pageNum?: number
  pageSize?: number
  orderNo?: string
  userId?: number
  userName?: string
  payMode?: string
  orderStatus?: string
}

export function listRechargeOrder(query?: RechargeOrderQuery): Promise<TableDataInfo<CreditRechargeOrder[]>> {
  return request({
    url: '/system/ai/rechargeOrder/list',
    method: 'get',
    params: query
  })
}

export function getRechargeOrder(orderId: number): Promise<AjaxResult<CreditRechargeOrder>> {
  return request({
    url: '/system/ai/rechargeOrder/' + orderId,
    method: 'get'
  })
}
