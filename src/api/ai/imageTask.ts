import request from '@/utils/request'
import type { TableDataInfo } from '@/types'

export interface AiImageTask {
  imageId?: number
  traceId?: string
  userId?: number
  userName?: string
  taskType?: string
  status?: string
  requestJson?: string
  prompt?: string
  userImages?: string
  width?: number
  height?: number
  platformCode?: number
  modelCode?: number
  modelId?: number
  creditCost?: number
  platformTaskId?: string
  resultMediaId?: number
  media?: AiMediaAsset
  errorInfo?: string
  createTime?: string
}

export interface AiMediaAsset {
  mediaId?: number
  mediaType?: string
  url?: string
  objectKey?: string
  fileName?: string
  mimeType?: string
  size?: number
  width?: number
  height?: number
  durationMs?: number
  createTime?: string
}

export interface ImageTaskQuery {
  pageNum?: number
  pageSize?: number
  userId?: number
  userName?: string
  taskType?: string
  status?: string
  traceId?: string
}

export function listImageTask(query: ImageTaskQuery): Promise<TableDataInfo<AiImageTask[]>> {
  return request({
    url: '/system/ai/imageTask/list',
    method: 'get',
    params: query
  })
}
