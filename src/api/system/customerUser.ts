import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types'

export interface CustomerIdentity {
  identityId?: string
  provider?: string
  providerUserId?: string
  email?: string
  displayName?: string
  status?: string
}

export interface CustomerUser {
  userId?: string
  site?: string
  userName?: string
  email?: string
  phonenumber?: string
  sex?: string
  avatar?: string
  emailVerified?: string
  passwordLoginEnabled?: string
  creditBalance?: number
  status?: string
  loginIp?: string
  loginDate?: string
  createTime?: string
  remark?: string
  identities?: CustomerIdentity[]
}

export interface CustomerUserQuery {
  pageNum?: number
  pageSize?: number
  userId?: string
  site?: string
  userName?: string
  email?: string
  status?: string
}

export function listCustomerUser(query: CustomerUserQuery): Promise<TableDataInfo<CustomerUser[]>> {
  return request({ url: '/system/customer/user/list', method: 'get', params: query })
}

export function getCustomerUser(userId: string): Promise<AjaxResult<CustomerUser>> {
  return request({ url: '/system/customer/user/' + userId, method: 'get' })
}

export function changeCustomerUserStatus(userId: string, status: string): Promise<AjaxResult> {
  return request({ url: '/system/customer/user/changeStatus', method: 'put', data: { userId, status } })
}

export function resetCustomerUserPassword(userId: string, password: string): Promise<AjaxResult> {
  return request({ url: '/system/customer/user/resetPwd', method: 'put', data: { userId, password } })
}

export function editCustomerUserCredit(data: { userId: string; amount: number; remark?: string }): Promise<AjaxResult & { creditBalance?: number }> {
  return request({ url: '/system/customer/user/editCredit', method: 'put', data })
}

export function deleteCustomerUser(userId: string): Promise<AjaxResult> {
  return request({ url: '/system/customer/user/' + userId, method: 'delete' })
}
