import request from '@/utils/request'
import type { TableDataInfo } from '@/types'
import type { AiMediaAsset } from './imageTask'

export interface AiVideoTask {
  videoId?: string
  taskId?: string
  site?: string
  traceId?: string
  userId?: string
  userName?: string
  status?: string
  requestJson?: string
  prompt?: string
  duration?: number
  ratio?: string
  resolution?: string
  userImages?: string
  count?: number
  platformCode?: number
  modelCode?: number
  modelId?: string
  creditCost?: number
  resultMediaId?: string
  media?: AiMediaAsset
  errorInfo?: string
  note?: string
  createTime?: string
  updateTime?: string
}

export interface VideoTaskQuery {
  pageNum?: number
  pageSize?: number
  userId?: string
  userName?: string
  status?: string
  traceId?: string
  taskId?: string
  site?: string
  platformCode?: number
  modelCode?: number
  beginTime?: string
  endTime?: string
}

export function listVideoTask(query: VideoTaskQuery): Promise<TableDataInfo<AiVideoTask[]>> {
  return request({
    url: '/system/ai/videoTask/list',
    method: 'get',
    params: query
  })
}

export function editVideoTaskStatus(data: { videoId: string; status: string; errorInfo?: string }) {
  return request({
    url: '/system/ai/videoTask/status',
    method: 'put',
    data
  })
}
