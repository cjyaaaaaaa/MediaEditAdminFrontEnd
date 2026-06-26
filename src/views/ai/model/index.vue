<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="平台" prop="platformId">
        <el-select v-model="queryParams.platformId" placeholder="请选择平台" clearable style="width: 200px">
          <el-option v-for="item in platformOptions" :key="item.platformId" :label="item.platformName" :value="item.platformId" />
        </el-select>
      </el-form-item>
      <el-form-item label="模型类型" prop="modelType">
        <el-select v-model="queryParams.modelType" placeholder="模型类型" clearable style="width: 160px" @change="handleQueryTypeChange">
          <el-option v-for="item in modelTypeOptions" :key="item.code" :label="item.label" :value="item.code" />
        </el-select>
      </el-form-item>
      <el-form-item label="模型名称" prop="modelName">
        <el-select
          v-model="queryParams.modelName"
          placeholder="选择或输入模型名称"
          clearable filterable allow-create default-first-option
          style="width: 220px"
        >
          <el-option
            v-for="item in queryFilteredModelOptions"
            :key="modelEnumKey(item)"
            :label="item.modelName"
            :value="item.modelName"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="状态" clearable style="width: 200px">
          <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['ai:model:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['ai:model:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['ai:model:remove']">删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="modelList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="模型ID" align="center" prop="modelId" width="80" />
      <el-table-column label="平台" align="center" prop="platformName" />
      <el-table-column label="模型编码" align="center" prop="modelCode" width="100" />
      <el-table-column label="模型名称" align="center" prop="modelName" />
      <el-table-column label="类型" align="center" prop="modelType" width="80">
        <template #default="scope">
          <el-tag :type="modelTypeTagType(scope.row.modelType)" size="small">
            {{ modelTypeLabel(scope.row.modelType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="计费方式 / 价格" align="center" prop="billingType" min-width="160">
        <template #default="scope">
          <div>
            <el-tag size="small" type="info">{{ getBillingTypeInfo(scope.row.billingType) }}</el-tag>
          </div>
          <div class="credit-config-text">{{ formatCreditConfig(scope.row.billingType, scope.row.creditConfig) }}</div>
        </template>
      </el-table-column>
      <el-table-column label="API地址" align="left" prop="apiUrl" min-width="200">
        <template #default="scope">
          <span style="display:block;word-break:break-all;background:#f0f9ff;border-radius:4px;padding:4px 6px;font-size:12px;color:#0369a1;cursor:pointer"
            :title="'点击复制'" @click="copyText(scope.row.apiUrl)">{{ scope.row.apiUrl }}</span>
        </template>
      </el-table-column>
      <el-table-column label="配置JSON" align="left" prop="configJson" min-width="200">
        <template #default="scope">
          <pre v-if="scope.row.configJson" style="margin:0;font-size:12px;white-space:pre-wrap;word-break:break-all;text-align:left;background:#f0fdf4;border-radius:4px;padding:4px 6px;color:#15803d;cursor:pointer"
            title="点击复制" @click="copyText(scope.row.configJson)">{{ formatJson(scope.row.configJson) }}</pre>
          <span v-else class="text-gray-400">-</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="scope">
          <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" align="center">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['ai:model:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['ai:model:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="720px" append-to-body>
      <el-form ref="modelRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="所属平台" prop="platformId">
          <el-select v-model="form.platformId" placeholder="请选择平台" style="width: 100%" @change="handlePlatformChange">
            <el-option v-for="item in platformOptions" :key="item.platformId" :label="item.platformName" :value="item.platformId" />
          </el-select>
        </el-form-item>
        <el-form-item label="模型类型" prop="modelType">
          <el-select v-model="form.modelType" placeholder="请选择模型类型" style="width: 100%" @change="handleModelTypeChange">
            <el-option v-for="item in modelTypeOptions" :key="item.code" :label="item.label" :value="item.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="模型枚举" prop="modelCode" v-if="form.modelType !== 'other'">
          <el-select
            v-model="selectedModelKey"
            :placeholder="form.modelType ? '请选择模型' : '请先选择模型类型'"
            :disabled="!form.modelType || form.modelType === 'other'"
            style="width: 100%"
            @change="handleModelEnumChange"
          >
            <el-option
              v-for="item in filteredModelEnumOptions"
              :key="modelEnumKey(item)"
              :label="item.modelName + ' (' + item.modelCode + ')'"
              :value="modelEnumKey(item)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="模型名称" prop="modelName">
          <el-input v-model="form.modelName" placeholder="请输入模型名称" />
        </el-form-item>
        <el-form-item label="API地址" prop="apiUrl">
          <el-input v-model="form.apiUrl" placeholder="完整 API URL" />
        </el-form-item>
        <el-form-item label="计费方式" prop="billingType">
          <el-select v-model="form.billingType" placeholder="请选择计费方式" style="width: 100%">
            <el-option v-for="item in billingTypeList" :key="item.code" :label="item.info" :value="item.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格配置" prop="creditConfig">
          <div v-if="!form.billingType" class="text-gray-400">
            请先选择计费方式
          </div>

          <!-- 按秒计费 -->
          <div v-else-if="form.billingType === 'per_second'">
            <el-form-item label="每秒价格" label-width="80px">
              <el-input-number v-model="creditConfigData.per_second.credit_per_second" :min="0" :precision="0" style="width: 200px" />
              <span class="ml-2">credit/秒</span>
            </el-form-item>
          </div>

          <!-- 按分辨率计费 -->
          <div v-else-if="form.billingType === 'per_resolution'" class="resolution-pricing">
            <el-row :gutter="10">
              <el-col :span="12">
                <div class="pricing-item">
                  <span class="resolution-label">480p:</span>
                  <el-input-number v-model="creditConfigData.per_resolution['480p'].credit_per_second" :min="0" :precision="0" size="small" />
                  <span class="credit-unit">credit/秒</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="pricing-item">
                  <span class="resolution-label">540p:</span>
                  <el-input-number v-model="creditConfigData.per_resolution['540p'].credit_per_second" :min="0" :precision="0" size="small" />
                  <span class="credit-unit">credit/秒</span>
                </div>
              </el-col>
            </el-row>
            <el-row :gutter="10" style="margin-top: 10px">
              <el-col :span="12">
                <div class="pricing-item">
                  <span class="resolution-label">720p:</span>
                  <el-input-number v-model="creditConfigData.per_resolution['720p'].credit_per_second" :min="0" :precision="0" size="small" />
                  <span class="credit-unit">credit/秒</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="pricing-item">
                  <span class="resolution-label">1080p:</span>
                  <el-input-number v-model="creditConfigData.per_resolution['1080p'].credit_per_second" :min="0" :precision="0" size="small" />
                  <span class="credit-unit">credit/秒</span>
                </div>
              </el-col>
            </el-row>
            <el-row :gutter="10" style="margin-top: 10px">
              <el-col :span="12">
                <div class="pricing-item">
                  <span class="resolution-label">2k:</span>
                  <el-input-number v-model="creditConfigData.per_resolution['2k'].credit_per_second" :min="0" :precision="0" size="small" />
                  <span class="credit-unit">credit/秒</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="pricing-item">
                  <span class="resolution-label">4k:</span>
                  <el-input-number v-model="creditConfigData.per_resolution['4k'].credit_per_second" :min="0" :precision="0" size="small" />
                  <span class="credit-unit">credit/秒</span>
                </div>
              </el-col>
            </el-row>
          </div>

          <!-- 按单次任务计费 -->
          <div v-else-if="form.billingType === 'per_task'">
            <el-form-item label="每次任务价格" label-width="100px">
              <el-input-number v-model="creditConfigData.per_task.credit_per_task" :min="0" :precision="0" style="width: 200px" />
              <span class="ml-2">credit/次</span>
            </el-form-item>
          </div>

          <!-- 按每张计费 -->
          <div v-else-if="form.billingType === 'per_picture'">
            <el-form-item label="每张价格" label-width="80px">
              <el-input-number v-model="creditConfigData.per_picture.credit_per_picture" :min="0" :precision="0" style="width: 200px" />
              <span class="ml-2">credit/张</span>
            </el-form-item>
          </div>
        </el-form-item>
        <el-form-item label="配置JSON" prop="configJson">
          <el-input v-model="form.configJson" type="textarea" :rows="6" placeholder="请输入扩展配置 JSON（可选）" />
          <el-button size="small" style="margin-top:4px" @click="formatConfigJson">一键格式化</el-button>
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" controls-position="right" :min="0" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="AiModel">
import { ElMessage } from 'element-plus'
import { listModel, getModel, addModel, updateModel, delModel } from '@/api/ai/model'
import { optionselectPlatform } from '@/api/ai/platform'
import { listAiEnums } from '@/api/ai/enums'
import type { AiModelTypeOption } from '@/api/ai/enums'
import { AI_MODEL_OPTIONS, AI_BILLING_TYPES, getModelName, getBillingTypeInfo, formatCreditConfig } from '@/constants/ai'
import type { AiModelEnumOption } from '@/constants/ai'
import type { AiModel, AiModelQuery } from '@/api/ai/model'
import type { AiPlatform } from '@/api/ai/platform'

const { proxy } = getCurrentInstance()
const { sys_normal_disable } = proxy.useDict('sys_normal_disable')

const modelList = ref<AiModel[]>([])
const platformOptions = ref<AiPlatform[]>([])
const modelEnumOptions = ref<AiModelEnumOption[]>([...AI_MODEL_OPTIONS])
const modelTypeOptions = ref<AiModelTypeOption[]>([])
const billingTypeList = AI_BILLING_TYPES
const selectedModelKey = ref('')
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref<string[]>([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')

const creditConfigData = reactive({
  per_picture: { credit_per_picture: 0 },
  per_second: { credit_per_second: 0 },
  per_resolution: {
    '480p': { credit_per_second: 0 },
    '540p': { credit_per_second: 0 },
    '720p': { credit_per_second: 0 },
    '1080p': { credit_per_second: 0 },
    '2k': { credit_per_second: 0 },
    '4k': { credit_per_second: 0 },
  },
  per_task: { credit_per_task: 0 },
})

const queryFilteredModelOptions = computed(() => {
  const type = queryParams.value.modelType
  if (!type || type === 'other') return []
  return modelEnumOptions.value.filter(item => item.modelType === type)
})

const filteredModelEnumOptions = computed(() => {
  const type = form.value.modelType
  if (!type || type === 'other') return []
  const platform = platformOptions.value.find(item => item.platformId === form.value.platformId)
  let options = modelEnumOptions.value.filter(item => item.modelType === type)
  if (platform?.platformCode) {
    options = options.filter(item => item.platformCode === platform.platformCode)
  }
  return options
})

const data = reactive({
  form: {} as AiModel,
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    platformId: undefined,
    modelCode: undefined,
    modelName: undefined,
    modelType: undefined,
    status: undefined
  } as AiModelQuery,
  rules: {
    platformId: [{ required: true, message: '请选择平台', trigger: 'change' }],
    modelCode: [{ required: true, message: '请选择模型', trigger: 'change' }],
    modelName: [{ required: true, message: '模型名称不能为空', trigger: 'blur' }],
    apiUrl: [{ required: true, message: 'API地址不能为空', trigger: 'blur' }],
    billingType: [{ required: true, message: '请选择计费方式', trigger: 'change' }],
    creditConfig: [{ required: true, message: '请配置价格', trigger: 'blur' }],
  }
})

const { queryParams, form, rules } = toRefs(data)

function modelEnumKey(item: AiModelEnumOption) {
  return `${item.platformCode}-${item.modelType}-${item.modelCode}`
}

function parseModelEnumKey(key: string) {
  const parts = key.split('-')
  return { platformCode: Number(parts[0]), modelType: parts[1], modelCode: Number(parts[2]) }
}

function handlePlatformChange() {
  selectedModelKey.value = ''
  form.value.modelCode = undefined
  form.value.platformCode = platformOptions.value.find(item => item.platformId === form.value.platformId)?.platformCode
}

function handleQueryTypeChange() {
  queryParams.value.modelCode = undefined
  queryParams.value.modelName = undefined
}

function handleModelTypeChange() {
  selectedModelKey.value = ''
  form.value.modelCode = undefined
  form.value.modelName = ''
}

function handleModelEnumChange(key: string) {
  const { platformCode, modelType, modelCode } = parseModelEnumKey(key)
  const modelEnum = modelEnumOptions.value.find(
    item => item.platformCode === platformCode && item.modelType === modelType && item.modelCode === modelCode
  )
  if (!modelEnum) return
  form.value.platformCode = platformCode
  form.value.modelCode = modelCode
  form.value.modelType = modelType
  form.value.modelName = modelEnum.modelName
}

function syncSelectedModelKey() {
  if (form.value.platformCode != null && form.value.modelType && form.value.modelCode != null) {
    selectedModelKey.value = `${form.value.platformCode}-${form.value.modelType}-${form.value.modelCode}`
  } else {
    selectedModelKey.value = ''
  }
}

function resetCreditConfigData() {
  creditConfigData.per_picture.credit_per_picture = 0
  creditConfigData.per_second.credit_per_second = 0
  creditConfigData.per_resolution['480p'].credit_per_second = 0
  creditConfigData.per_resolution['540p'].credit_per_second = 0
  creditConfigData.per_resolution['720p'].credit_per_second = 0
  creditConfigData.per_resolution['1080p'].credit_per_second = 0
  creditConfigData.per_resolution['2k'].credit_per_second = 0
  creditConfigData.per_resolution['4k'].credit_per_second = 0
  creditConfigData.per_task.credit_per_task = 0
}

function parseCreditConfig(billingType: string | undefined, creditConfig: string | undefined) {
  if (!billingType || !creditConfig) return
  try {
    const parsed = JSON.parse(creditConfig)
    const typeData = parsed[billingType]
    if (!typeData) return
    if (billingType === 'per_picture' && typeData.credit_per_picture != null) {
      creditConfigData.per_picture.credit_per_picture = typeData.credit_per_picture
    } else if (billingType === 'per_second' && typeData.credit_per_second != null) {
      creditConfigData.per_second.credit_per_second = typeData.credit_per_second
    } else if (billingType === 'per_task' && typeData.credit_per_task != null) {
      creditConfigData.per_task.credit_per_task = typeData.credit_per_task
    } else if (billingType === 'per_resolution') {
      for (const res of ['480p', '540p', '720p', '1080p', '2k', '4k'] as const) {
        if (typeData[res]?.credit_per_second != null) {
          creditConfigData.per_resolution[res].credit_per_second = typeData[res].credit_per_second
        }
      }
    }
  } catch (_) {}
}

function buildCreditConfig(): string {
  const billingType = form.value.billingType
  if (!billingType) return ''
  return JSON.stringify({ [billingType]: (creditConfigData as any)[billingType] })
}

function modelTypeLabel(code?: string) {
  return modelTypeOptions.value.find(t => t.code === code)?.label || code || '其他'
}

function modelTypeTagType(code?: string): 'primary' | 'success' | 'info' {
  if (code === 'image') return 'primary'
  if (code === 'video') return 'success'
  return 'info'
}

function loadPlatforms() {
  optionselectPlatform().then(res => {
    platformOptions.value = res.data || []
  })
}

function loadEnums() {
  listAiEnums().then(res => {
    if (res.data?.models?.length) {
      modelEnumOptions.value = res.data.models
    }
    if (res.data?.modelTypes?.length) {
      modelTypeOptions.value = res.data.modelTypes
    }
  }).catch(() => {})
}

function getList() {
  loading.value = true
  listModel(queryParams.value).then(response => {
    modelList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

function copyText(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

function formatJson(raw: string) {
  try { return JSON.stringify(JSON.parse(raw), null, 2) } catch { return raw }
}


function formatConfigJson() {
  const raw = form.value.configJson
  if (!raw?.trim()) return
  try {
    form.value.configJson = JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    ElMessage.warning('JSON 格式不正确，无法格式化')
  }
}

function cancel() {
  open.value = false
  reset()
}

function reset() {
  form.value = {
    modelId: undefined,
    platformId: undefined,
    platformCode: undefined,
    modelCode: undefined,
    modelName: undefined,
    modelType: undefined,
    apiUrl: undefined,
    billingType: undefined,
    creditConfig: undefined,
    configJson: undefined,
    sortOrder: 0,
    status: '0',
    remark: undefined
  }
  selectedModelKey.value = ''
  resetCreditConfigData()
  proxy.resetForm('modelRef')
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm('queryRef')
  handleQuery()
}

function handleSelectionChange(selection: AiModel[]) {
  ids.value = selection.map(item => item.modelId!)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

function handleAdd() {
  reset()
  open.value = true
  title.value = '添加模型'
}

function handleUpdate(row?: AiModel) {
  reset()
  const modelId = row?.modelId || ids.value[0]
  getModel(modelId).then(response => {
    form.value = response.data!
    syncSelectedModelKey()
    resetCreditConfigData()
    parseCreditConfig(form.value.billingType, form.value.creditConfig)
    open.value = true
    title.value = '修改模型'
  })
}

function submitForm() {
  form.value.creditConfig = buildCreditConfig()
  proxy.$refs['modelRef'].validate((valid: boolean) => {
    if (!valid) return
    const action = form.value.modelId ? updateModel(form.value) : addModel(form.value)
    action.then(() => {
      proxy.$modal.msgSuccess(form.value.modelId ? '修改成功' : '新增成功')
      open.value = false
      getList()
    })
  })
}

function handleDelete(row?: AiModel) {
  const modelIds = row?.modelId || ids.value
  proxy.$modal.confirm('是否确认删除模型编号为"' + modelIds + '"的数据项？').then(() => {
    return delModel(modelIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess('删除成功')
  }).catch(() => {})
}

loadEnums()
loadPlatforms()
getList()
</script>

<style scoped>
.resolution-pricing .pricing-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.resolution-pricing .resolution-label {
  width: 50px;
  font-size: 13px;
  color: #606266;
}
.resolution-pricing .credit-unit {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}
.credit-config-text {
  font-size: 12px;
  color: #606266;
  margin-top: 2px;
}
</style>
