import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types'

export interface CustomerIdentity {
  identityId?: number
  provider?: string
  providerUserId?: string
  email?: string
  displayName?: string
  status?: string
}

export interface CustomerUser {
  userId?: number
  userName?: string
  nickName?: string
  email?: string
  phonenumber?: string
  avatar?: string
  creditBalance?: number
  status?: string
  loginDate?: string
  createTime?: string
  identities?: CustomerIdentity[]
}

export interface CustomerUserQuery {
  pageNum?: number
  pageSize?: number
  userId?: number
  userName?: string
  nickName?: string
  email?: string
  status?: string
}

export function listCustomerUser(query: CustomerUserQuery): Promise<TableDataInfo<CustomerUser[]>> {
  return request({ url: '/system/customer/user/list', method: 'get', params: query })
}

export function getCustomerUser(userId: number): Promise<AjaxResult<CustomerUser>> {
  return request({ url: '/system/customer/user/' + userId, method: 'get' })
}

export function changeCustomerUserStatus(userId: number, status: string): Promise<AjaxResult> {
  return request({ url: '/system/customer/user/changeStatus', method: 'put', data: { userId, status } })
}

export function resetCustomerUserPassword(userId: number, password: string): Promise<AjaxResult> {
  return request({ url: '/system/customer/user/resetPwd', method: 'put', data: { userId, password } })
}

export function editCustomerUserCredit(data: { userId: number; amount: number; remark?: string }): Promise<AjaxResult & { creditBalance?: number }> {
  return request({ url: '/system/customer/user/editCredit', method: 'put', data })
}
