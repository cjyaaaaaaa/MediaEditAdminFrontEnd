import request from '@/utils/request'
import type { TableDataInfo } from '@/types'

export interface UserCreditLog {
  logId?: number
  userId?: number
  userName?: string
  modelId?: number
  modelName?: string
  changeAmount?: number
  balanceAfter?: number
  bizType?: string
  remark?: string
  createTime?: string
}

export interface CreditLogQuery {
  pageNum?: number
  pageSize?: number
  userId?: number
  userName?: string
  bizType?: string
}

export function listCreditLog(query: CreditLogQuery): Promise<TableDataInfo<UserCreditLog[]>> {
  return request({
    url: '/system/ai/creditLog/list',
    method: 'get',
    params: query
  })
}
