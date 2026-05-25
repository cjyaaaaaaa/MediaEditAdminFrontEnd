/** AI 平台枚举 */
export const AiPlatformEnum = {
  GPTPROTO: { platformCode: 1, platformName: 'gptproto' }
} as const

/** AI 模型枚举 */
export const AiModelEnum = {
  SEEDREAM_V4_5: { platformCode: 1, modelCode: 1, modelName: 'seedream_v4_5' },
  SEEDREAM_V4_5_EDIT: { platformCode: 1, modelCode: 2, modelName: 'seedream_v4_5_edit' }
} as const

export interface AiPlatformEnumOption {
  platformCode: number
  platformName: string
}

export interface AiModelEnumOption {
  platformCode: number
  modelCode: number
  modelName: string
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
