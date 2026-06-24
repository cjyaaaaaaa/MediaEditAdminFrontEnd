<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="平台" prop="platformId">
        <el-select v-model="queryParams.platformId" placeholder="请选择平台" clearable style="width: 200px">
          <el-option v-for="item in platformOptions" :key="item.platformId" :label="item.platformName" :value="item.platformId" />
        </el-select>
      </el-form-item>
      <el-form-item label="模型编码" prop="modelCode">
        <el-select v-model="queryParams.modelCode" placeholder="模型编码" clearable style="width: 200px">
          <el-option
            v-for="item in modelEnumOptions"
            :key="item.platformCode + '-' + item.modelCode"
            :label="item.modelName + ' (' + item.modelCode + ')'"
            :value="item.modelCode"
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
      <el-table-column label="模型编码" align="center" prop="modelCode" width="120">
        <template #default="scope">
          <span>{{ getModelName(scope.row.platformCode, scope.row.modelCode) }} ({{ scope.row.modelCode }})</span>
        </template>
      </el-table-column>
      <el-table-column label="模型名称" align="center" prop="modelName" />
      <el-table-column label="消耗积分" align="center" prop="creditCost" width="90" />
      <el-table-column label="API地址" align="center" prop="apiUrl" show-overflow-tooltip />
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

    <el-dialog :title="title" v-model="open" width="680px" append-to-body>
      <el-form ref="modelRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="所属平台" prop="platformId">
          <el-select v-model="form.platformId" placeholder="请选择平台" style="width: 100%" @change="handlePlatformChange">
            <el-option v-for="item in platformOptions" :key="item.platformId" :label="item.platformName" :value="item.platformId" />
          </el-select>
        </el-form-item>
        <el-form-item label="模型枚举" prop="modelCode">
          <el-select v-model="selectedModelKey" placeholder="请选择模型" style="width: 100%" @change="handleModelEnumChange">
            <el-option
              v-for="item in filteredModelEnumOptions"
              :key="item.platformCode + '-' + item.modelCode"
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
        <el-form-item label="消耗积分" prop="creditCost">
          <el-input-number v-model="form.creditCost" controls-position="right" :min="0" />
        </el-form-item>
        <el-form-item label="配置JSON" prop="configJson">
          <el-input v-model="form.configJson" type="textarea" :rows="3" placeholder='{"enableSyncMode":true,"enableBase64Output":false}' />
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
import { listModel, getModel, addModel, updateModel, delModel } from '@/api/ai/model'
import { optionselectPlatform } from '@/api/ai/platform'
import { listAiEnums } from '@/api/ai/enums'
import { AI_MODEL_OPTIONS, AiModelEnum, getModelName } from '@/constants/ai'
import type { AiModelEnumOption } from '@/constants/ai'
import type { AiModel, AiModelQuery } from '@/api/ai/model'
import type { AiPlatform } from '@/api/ai/platform'

const { proxy } = getCurrentInstance()
const { sys_normal_disable } = proxy.useDict('sys_normal_disable')

const modelList = ref<AiModel[]>([])
const platformOptions = ref<AiPlatform[]>([])
const modelEnumOptions = ref<AiModelEnumOption[]>([...AI_MODEL_OPTIONS])
const selectedModelKey = ref('')
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref<string[]>([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')

const filteredModelEnumOptions = computed(() => {
  const platform = platformOptions.value.find(item => item.platformId === form.value.platformId)
  if (!platform?.platformCode) {
    return modelEnumOptions.value
  }
  return modelEnumOptions.value.filter(item => item.platformCode === platform.platformCode)
})

const data = reactive({
  form: {} as AiModel,
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    platformId: undefined,
    modelCode: undefined,
    status: undefined
  } as AiModelQuery,
  rules: {
    platformId: [{ required: true, message: '请选择平台', trigger: 'change' }],
    modelCode: [{ required: true, message: '请选择模型', trigger: 'change' }],
    modelName: [{ required: true, message: '模型名称不能为空', trigger: 'blur' }],
    apiUrl: [{ required: true, message: 'API地址不能为空', trigger: 'blur' }],
    creditCost: [{ required: true, message: '消耗积分不能为空', trigger: 'blur' }]
  }
})

const { queryParams, form, rules } = toRefs(data)

function modelEnumKey(item: AiModelEnumOption) {
  return `${item.platformCode}-${item.modelCode}`
}

function parseModelEnumKey(key: string) {
  const [platformCode, modelCode] = key.split('-').map(Number)
  return { platformCode, modelCode }
}

function handlePlatformChange() {
  selectedModelKey.value = ''
  form.value.modelCode = undefined
  form.value.platformCode = platformOptions.value.find(item => item.platformId === form.value.platformId)?.platformCode
}

function handleModelEnumChange(key: string) {
  const { platformCode, modelCode } = parseModelEnumKey(key)
  const modelEnum = modelEnumOptions.value.find(item => item.platformCode === platformCode && item.modelCode === modelCode)
  if (!modelEnum) return
  form.value.platformCode = platformCode
  form.value.modelCode = modelCode
  form.value.modelName = modelEnum.modelName
}

function syncSelectedModelKey() {
  if (form.value.platformCode != null && form.value.modelCode != null) {
    selectedModelKey.value = `${form.value.platformCode}-${form.value.modelCode}`
  } else {
    selectedModelKey.value = ''
  }
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

function cancel() {
  open.value = false
  reset()
}

function reset() {
  form.value = {
    modelId: undefined,
    platformId: undefined,
    platformCode: AiModelEnum.SEEDREAM_V4_5.platformCode,
    modelCode: AiModelEnum.SEEDREAM_V4_5.modelCode,
    modelName: AiModelEnum.SEEDREAM_V4_5.modelName,
    apiUrl: undefined,
    creditCost: 10,
    configJson: '{"enableSyncMode":true,"enableBase64Output":false}',
    sortOrder: 0,
    status: '0',
    remark: undefined
  }
  selectedModelKey.value = modelEnumKey(AiModelEnum.SEEDREAM_V4_5)
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
    open.value = true
    title.value = '修改模型'
  })
}

function submitForm() {
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
