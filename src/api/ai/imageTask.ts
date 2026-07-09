import request from '@/utils/request'
import type { TableDataInfo } from '@/types'

export interface AiImageTask {
  imageId?: string
  site?: string
  traceId?: string
  userId?: string
  userName?: string
  status?: string
  requestJson?: string
  prompt?: string
  userImages?: string
  ratio?: string
  resolution?: string
  width?: number
  height?: number
  platformCode?: number
  modelCode?: number
  modelId?: string
  creditCost?: number
  platformTaskId?: string
  resultMediaId?: string
  count?: number
  media?: AiMediaAsset
  errorInfo?: string
  createTime?: string
  updateTime?: string
}

export interface AiMediaAsset {
  mediaId?: string
  mediaType?: string
  url?: string
  objectKey?: string
  fileName?: string
  mimeType?: string
  size?: number
  width?: number
  height?: number
  aspectRatio?: string
  resolution?: string
  durationMs?: number
  createTime?: string
}

export interface ImageTaskQuery {
  pageNum?: number
  pageSize?: number
  userId?: string
  userName?: string
  status?: string
  traceId?: string
  site?: string
  platformCode?: number
  modelCode?: number
  platformTaskId?: string
  beginTime?: string
  endTime?: string
}

export function listImageTask(query: ImageTaskQuery): Promise<TableDataInfo<AiImageTask[]>> {
  return request({
    url: '/system/ai/imageTask/list',
    method: 'get',
    params: query
  })
}

export function editImageTaskStatus(data: { imageId: string; status: string; errorInfo?: string }) {
  return request({
    url: '/system/ai/imageTask/status',
    method: 'put',
    data
  })
}
