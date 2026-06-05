import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types'

export interface CreditPackage {
  packageId?: number
  packageName?: string
  productId?: string
  priceCent?: number
  creditAmount?: number
  payMode?: string
  sortOrder?: number
  status?: string
  remark?: string
  createTime?: string
}

export interface RechargePackageQuery {
  pageNum?: number
  pageSize?: number
  packageName?: string
  productId?: string
  status?: string
}

export function listRechargePackage(query?: RechargePackageQuery): Promise<TableDataInfo<CreditPackage[]>> {
  return request({
    url: '/system/ai/rechargePackage/list',
    method: 'get',
    params: query
  })
}

export function getRechargePackage(packageId: number): Promise<AjaxResult<CreditPackage>> {
  return request({
    url: '/system/ai/rechargePackage/' + packageId,
    method: 'get'
  })
}

export function addRechargePackage(data: CreditPackage): Promise<AjaxResult> {
  return request({
    url: '/system/ai/rechargePackage',
    method: 'post',
    data
  })
}

export function updateRechargePackage(data: CreditPackage): Promise<AjaxResult> {
  return request({
    url: '/system/ai/rechargePackage',
    method: 'put',
    data
  })
}

export function delRechargePackage(packageId: number | number[]): Promise<AjaxResult> {
  return request({
    url: '/system/ai/rechargePackage/' + packageId,
    method: 'delete'
  })
}
