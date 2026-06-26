import request from '@/utils/request'
import type { TableDataInfo } from '@/types'

export interface AiImageTask {
  imageId?: string
  traceId?: string
  userId?: string
  userName?: string
  status?: string
  requestJson?: string
  prompt?: string
  userImages?: string
  width?: number
  height?: number
  platformCode?: number
  modelCode?: number
  modelId?: string
  creditCost?: number
  platformTaskId?: string
  resultMediaId?: string
  media?: AiMediaAsset
  errorInfo?: string
  createTime?: string
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
}

export function listImageTask(query: ImageTaskQuery): Promise<TableDataInfo<AiImageTask[]>> {
  return request({
    url: '/system/ai/imageTask/list',
    method: 'get',
    params: query
  })
}
