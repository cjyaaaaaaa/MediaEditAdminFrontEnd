<template>
  <div class="app-container ai-config-page">
    <div class="page-heading">
      <div>
        <h2>业务配置</h2>
        <p>按站点维护支付等后端运行配置，配置键由系统枚举统一管理。</p>
      </div>
    </div>

    <el-alert
      class="secret-alert"
      type="warning"
      show-icon
      :closable="false"
      title="该页面会完整展示配置中的密钥，请仅向必要的管理员授予访问权限。"
    />

    <el-card v-show="showSearch" class="filter-card" shadow="never">
      <el-form ref="queryRef" :model="queryParams" :inline="true" label-position="top">
        <el-form-item label="站点" prop="site">
          <el-select v-model="queryParams.site" clearable placeholder="全部站点" style="width: 190px">
            <el-option v-for="site in siteOptions" :key="site.code" :label="site.label" :value="site.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="配置名称" prop="configName">
          <el-input
            v-model="queryParams.configName"
            clearable
            placeholder="请输入配置名称"
            style="width: 220px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="配置键" prop="configKey">
          <el-select v-model="queryParams.configKey" clearable placeholder="全部配置类型" style="width: 220px">
            <el-option v-for="item in configOptions" :key="item.code" :label="item.label" :value="item.code" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-row :gutter="10" class="table-toolbar">
        <el-col :span="1.5">
          <el-button type="primary" plain icon="Plus" v-hasPermi="['ai:config:add']" @click="handleAdd">新增</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="success"
            plain
            icon="Edit"
            :disabled="single"
            v-hasPermi="['ai:config:edit']"
            @click="handleUpdate()"
          >修改</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="danger"
            plain
            icon="Delete"
            :disabled="multiple"
            v-hasPermi="['ai:config:remove']"
            @click="handleDelete()"
          >删除</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="warning"
            plain
            icon="Refresh"
            v-hasPermi="['ai:config:refresh']"
            @click="handleRefreshCache"
          >刷新缓存</el-button>
        </el-col>
        <div class="toolbar-spacer" />
        <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
      </el-row>

      <el-table v-loading="loading" :data="configList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="配置ID" prop="configId" width="190">
          <template #default="scope"><code class="identifier">{{ scope.row.configId }}</code></template>
        </el-table-column>
        <el-table-column label="站点" prop="site" width="140">
          <template #default="scope"><el-tag effect="plain">{{ siteLabel(scope.row.site) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="配置名称" prop="configName" min-width="150" />
        <el-table-column label="配置键" prop="configKey" min-width="170">
          <template #default="scope"><code class="config-key">{{ scope.row.configKey }}</code></template>
        </el-table-column>
        <el-table-column label="配置值（完整显示）" min-width="360">
          <template #default="scope"><pre class="json-preview">{{ formatJson(scope.row.configValue) }}</pre></template>
        </el-table-column>
        <el-table-column label="更新时间" width="170">
          <template #default="scope">{{ parseTime(scope.row.updateTime || scope.row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" v-hasPermi="['ai:config:edit']" @click="handleUpdate(scope.row)">修改</el-button>
            <el-button link type="danger" icon="Delete" v-hasPermi="['ai:config:remove']" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无业务配置，可以先新增一个站点配置" /></template>
      </el-table>

      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>

    <el-dialog v-model="open" :title="title" width="760px" append-to-body destroy-on-close>
      <el-form ref="configRef" :model="form" :rules="rules" label-width="96px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="所属站点" prop="site">
              <el-select v-model="form.site" placeholder="请选择站点" style="width: 100%">
                <el-option v-for="site in siteOptions" :key="site.code" :label="site.label" :value="site.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="配置类型" prop="configKey">
              <el-select
                v-model="form.configKey"
                :disabled="Boolean(form.configId)"
                placeholder="请选择配置类型"
                style="width: 100%"
              >
                <el-option v-for="item in configOptions" :key="item.code" :label="item.label" :value="item.code" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="配置名称">
          <el-input :model-value="selectedConfigName" disabled placeholder="选择配置类型后自动生成" />
        </el-form-item>

        <el-form-item label="配置JSON" prop="configValue">
          <div class="json-editor-wrap">
            <el-input
              v-model="form.configValue"
              class="json-editor"
              type="textarea"
              :rows="14"
              spellcheck="false"
              placeholder='请输入合法 JSON，例如 {"apiKey":"rk_test_xxx"}'
            />
            <el-button class="format-button" text type="primary" @click="formatFormJson">格式化 JSON</el-button>
          </div>
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" :loading="submitting" @click="submitForm">保存配置</el-button>
          <el-button @click="open = false">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="AiConfig">
import {
  addAiConfig,
  deleteAiConfig,
  getAiConfig,
  listAiConfig,
  listAiConfigOptions,
  refreshAiConfigCache,
  updateAiConfig,
  type AiConfig,
  type AiConfigOption,
  type AiConfigQuery
} from '@/api/system/aiConfig'
import { listCustomerSiteOptions, type CustomerSiteOption } from '@/api/system/customerSite'

const { proxy } = getCurrentInstance()
const configList = ref<AiConfig[]>([])
const configOptions = ref<AiConfigOption[]>([])
const siteOptions = ref<CustomerSiteOption[]>([])
const loading = ref(false)
const submitting = ref(false)
const showSearch = ref(true)
const open = ref(false)
const total = ref(0)
const ids = ref<string[]>([])
const single = ref(true)
const multiple = ref(true)
const title = ref('')

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    site: undefined,
    configName: undefined,
    configKey: undefined
  } as AiConfigQuery,
  form: {} as AiConfig,
  rules: {
    site: [{ required: true, message: '请选择所属站点', trigger: 'change' }],
    configKey: [{ required: true, message: '请选择配置类型', trigger: 'change' }],
    configValue: [
      { required: true, message: '请输入配置JSON', trigger: 'blur' },
      { validator: validateJson, trigger: 'blur' }
    ]
  }
})

const { queryParams, form, rules } = toRefs(data)
const selectedConfigName = computed(() => configOptions.value.find(
  (item: AiConfigOption) => item.code === form.value.configKey
)?.label || '')

function validateJson(_rule: unknown, value: string, callback: (error?: Error) => void) {
  if (!value) return callback()
  try {
    JSON.parse(value)
    callback()
  } catch {
    callback(new Error('请输入合法的 JSON'))
  }
}

async function loadOptions() {
  const [configResponse, siteResponse] = await Promise.all([listAiConfigOptions(), listCustomerSiteOptions()])
  configOptions.value = configResponse.data || []
  siteOptions.value = siteResponse.data || []
}

async function getList() {
  loading.value = true
  try {
    const response = await listAiConfig(queryParams.value)
    configList.value = response.rows
    total.value = response.total
  } finally {
    loading.value = false
  }
}

function reset() {
  form.value = {
    configId: undefined,
    site: siteOptions.value[0]?.code,
    configKey: undefined,
    configValue: '{\n  \n}',
    remark: undefined
  }
  proxy.resetForm('configRef')
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm('queryRef')
  handleQuery()
}

function handleSelectionChange(selection: AiConfig[]) {
  ids.value = selection.map(item => item.configId!)
  single.value = selection.length !== 1
  multiple.value = selection.length === 0
}

function handleAdd() {
  reset()
  title.value = '新增业务配置'
  open.value = true
}

async function handleUpdate(row?: AiConfig) {
  reset()
  const configId = row?.configId || ids.value[0]
  if (!configId) return
  const response = await getAiConfig(configId)
  form.value = response.data
  form.value.configValue = formatJson(form.value.configValue)
  title.value = '修改业务配置'
  open.value = true
}

function handleDelete(row?: AiConfig) {
  const configIds = row?.configId || ids.value
  if (!configIds || (Array.isArray(configIds) && !configIds.length)) return
  proxy.$modal.confirm('确认删除所选业务配置吗？删除后相关功能将无法读取该配置。').then(async () => {
    await deleteAiConfig(configIds)
    proxy.$modal.msgSuccess('删除成功')
    await getList()
  }).catch(() => undefined)
}

async function handleRefreshCache() {
  await refreshAiConfigCache()
  proxy.$modal.msgSuccess('刷新缓存成功')
}

function formatJson(value?: string) {
  if (!value) return ''
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

function formatFormJson() {
  try {
    form.value.configValue = JSON.stringify(JSON.parse(form.value.configValue || ''), null, 2)
    proxy.$modal.msgSuccess('JSON 已格式化')
  } catch {
    proxy.$modal.msgError('当前内容不是合法 JSON')
  }
}

function siteLabel(site?: string) {
  return siteOptions.value.find((item: CustomerSiteOption) => item.code === site)?.label || site || '-'
}

function submitForm() {
  proxy.$refs.configRef.validate(async (valid: boolean) => {
    if (!valid) return
    submitting.value = true
    try {
      form.value.configValue = JSON.stringify(JSON.parse(form.value.configValue || ''), null, 2)
      if (form.value.configId) {
        await updateAiConfig(form.value)
      } else {
        await addAiConfig(form.value)
      }
      proxy.$modal.msgSuccess(form.value.configId ? '修改成功' : '新增成功')
      open.value = false
      await getList()
    } finally {
      submitting.value = false
    }
  })
}

onMounted(async () => {
  await loadOptions()
  await getList()
})
</script>

<style scoped>
.ai-config-page {
  --config-border: #e5e7eb;
}

.page-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-heading h2 {
  margin: 0;
  color: #1f2937;
  font-size: 22px;
  line-height: 1.35;
}

.page-heading p {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.secret-alert,
.filter-card {
  margin-bottom: 16px;
}

.table-toolbar {
  align-items: center;
  margin-bottom: 14px;
}

.toolbar-spacer {
  flex: 1;
}

.identifier,
.config-key {
  color: #374151;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
}

.config-key {
  display: inline-block;
  padding: 3px 7px;
  border: 1px solid var(--config-border);
  border-radius: 6px;
  background: #f8fafc;
}

.json-preview {
  max-height: 150px;
  margin: 0;
  overflow: auto;
  color: #334155;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-all;
}

.json-editor-wrap {
  position: relative;
  width: 100%;
}

.format-button {
  position: absolute;
  top: 6px;
  right: 8px;
  z-index: 1;
}

:deep(.json-editor textarea) {
  padding-top: 40px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .page-heading {
    display: block;
  }
}
</style>
