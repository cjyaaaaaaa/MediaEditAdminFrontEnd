import request from '@/utils/request'
import type { UploadFileResult } from '@/types/api/common'

/** 上传管理端对象文件 */
export function uploadAdminObject(data: FormData): Promise<UploadFileResult> {
  return request({
    url: '/system/object/admin/upload',
    method: 'post',
    data,
    headers: { repeatSubmit: false }
  })
}
