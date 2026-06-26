/** AI 平台枚举 */
export const AiPlatformEnum = {
  GPTPROTO: { platformCode: 1, platformName: 'gptproto' }
} as const

/** AI 模型枚举（前端本地兜底，正式数据从后端拉取） */
export const AiModelEnum = {
  SEEDREAM_V4_5:      { platformCode: 1, modelType: 'image', modelCode: 1, modelName: 'seedream_v4_5',      modelInfo: '即梦 4.5 文生图' },
  SEEDREAM_V4_5_EDIT: { platformCode: 1, modelType: 'image', modelCode: 2, modelName: 'seedream_v4_5_edit', modelInfo: '即梦 4.5 图生图' },
} as const

export interface AiPlatformEnumOption {
  platformCode: number
  platformName: string
}

export interface AiModelEnumOption {
  platformCode: number
  modelType: string
  modelCode: number
  modelName: string
  modelInfo: string
}

export const AI_PLATFORM_OPTIONS: AiPlatformEnumOption[] = Object.values(AiPlatformEnum)

export const AI_MODEL_OPTIONS: AiModelEnumOption[] = Object.values(AiModelEnum)

export function getPlatformName(platformCode?: number) {
  return AI_PLATFORM_OPTIONS.find(item => item.platformCode === platformCode)?.platformName || String(platformCode ?? '')
}

export function getModelName(platformCode?: number, modelCode?: number) {
  return AI_MODEL_OPTIONS.find(item => item.platformCode === platformCode && item.modelCode === modelCode)?.modelName
    || String(modelCode ?? '')
}

export function getModelInfo(platformCode?: number, modelCode?: number) {
  const item = AI_MODEL_OPTIONS.find(option => option.platformCode === platformCode && option.modelCode === modelCode)
  return item?.modelInfo || item?.modelName || String(modelCode ?? '')
}

export interface AiBillingType {
  code: string
  info: string
}

export const AI_BILLING_TYPES: AiBillingType[] = [
  { code: 'per_picture',    info: '按张计费' },
  { code: 'per_second',     info: '按秒计费' },
  { code: 'per_resolution', info: '按分辨率计费' },
  { code: 'per_task',       info: '按单次任务计费' },
]

export function getBillingTypeInfo(code?: string): string {
  return AI_BILLING_TYPES.find(item => item.code === code)?.info || code || ''
}

export function formatCreditConfig(billingType?: string, creditConfig?: string): string {
  if (!billingType || !creditConfig) return '-'
  try {
    const cfg = JSON.parse(creditConfig)
    if (billingType === 'per_picture') {
      const v = cfg.per_picture?.credit_per_picture
      return v != null ? `${v} credit/张` : '-'
    }
    if (billingType === 'per_second') {
      const v = cfg.per_second?.credit_per_second
      return v != null ? `${v} credit/秒` : '-'
    }
    if (billingType === 'per_task') {
      const v = cfg.per_task?.credit_per_task
      return v != null ? `${v} credit/次` : '-'
    }
    if (billingType === 'per_resolution') {
      const res = cfg.per_resolution
      if (!res) return '-'
      return (['480p', '540p', '720p', '1080p', '2k', '4k'] as const)
        .filter(r => res[r]?.credit_per_second != null)
        .map(r => `${r}:${res[r].credit_per_second}`)
        .join('  ') + ' credit/秒'
    }
  } catch (_) {}
  return '-'
}
