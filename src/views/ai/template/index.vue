<template>
  <div class="app-container">
    <el-tabs v-model="activeSourceType" class="source-tabs" @tab-change="handleSourceTabChange">
      <el-tab-pane label="系统" :name="AiTemplateSourceTypeEnum.SYSTEM" />
      <el-tab-pane label="用户" :name="AiTemplateSourceTypeEnum.USER" />
    </el-tabs>

    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="模板名称" prop="keyword">
        <el-input v-model="queryParams.keyword" placeholder="请输入模板名称/Prompt" clearable style="width: 220px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="媒体类型" prop="mediaType">
        <el-select v-model="queryParams.mediaType" placeholder="媒体类型" clearable style="width: 140px" @change="handleQueryTypeChange">
          <el-option v-for="item in mediaTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="分类" prop="categoryId">
        <el-select v-model="queryParams.categoryId" placeholder="请选择分类" clearable style="width: 180px">
          <el-option v-for="item in queryCategoryOptions" :key="item.categoryId" :label="formatCategoryLabel(item)" :value="item.categoryId" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="状态" clearable style="width: 120px">
          <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col v-if="activeSourceType === AiTemplateSourceTypeEnum.SYSTEM" :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['ai:template:add']">新增模板</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['ai:template:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['ai:template:remove']">删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="templateList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="ID" align="center" prop="templateId" width="80" />
      <el-table-column label="封面" align="center" width="92">
        <template #default="scope">
          <el-badge v-if="firstCover(scope.row.coverUrl)" :value="coverCount(scope.row.coverUrl)" :hidden="coverCount(scope.row.coverUrl) <= 1" type="info">
            <el-image
              :src="resolveResourceUrl(firstCover(scope.row.coverUrl))"
              :preview-src-list="coverPreviewList(scope.row.coverUrl)"
              preview-teleported
              fit="cover"
              class="table-cover"
            />
          </el-badge>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="模板名称" align="center" prop="templateName" min-width="140" show-overflow-tooltip />
      <el-table-column label="站点" align="center" prop="site" width="130">
        <template #default="scope">{{ scope.row.site || '-' }}</template>
      </el-table-column>
      <el-table-column v-if="activeSourceType === AiTemplateSourceTypeEnum.USER" label="用户ID" align="center" prop="userId" min-width="160" />
      <el-table-column label="媒体类型" align="center" prop="mediaType" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.mediaType === AiTemplateMediaTypeEnum.VIDEO ? 'warning' : 'success'">{{ formatMediaType(scope.row.mediaType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="分类" align="center" prop="categoryName" width="120">
        <template #default="scope">{{ scope.row.categoryName || '-' }}</template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="scope">
          <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="Prompt" align="center" prop="prompt" min-width="260" show-overflow-tooltip />
      <el-table-column label="排序" align="center" prop="sortOrder" width="80" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="170">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="230" align="center" fixed="right">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handlePreview(scope.row)" v-hasPermi="['ai:template:query']">预览</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['ai:template:edit']">修改</el-button>
          <el-button link type="primary" icon="Switch" @click="handleStatusChange(scope.row)" v-hasPermi="['ai:template:edit']">
            {{ scope.row.status === CommonStatusEnum.NORMAL ? '下架' : '上架' }}
          </el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['ai:template:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="760px" append-to-body>
      <el-form ref="templateRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="模板名称" prop="templateName">
              <el-input v-model="form.templateName" placeholder="请输入模板名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="媒体类型" prop="mediaType">
              <el-radio-group v-model="form.mediaType" @change="handleFormTypeChange">
                <el-radio-button v-for="item in mediaTypeOptions" :key="item.value" :value="item.value">{{ item.label }}</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类" prop="categoryId">
              <el-select v-model="form.categoryId" placeholder="可不选择分类" clearable style="width: 100%">
                <el-option v-for="item in formCategoryOptions" :key="item.categoryId" :label="formatCategoryLabel(item)" :value="item.categoryId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sortOrder">
              <el-input-number v-model="form.sortOrder" controls-position="right" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="封面图" prop="coverUrl">
              <image-upload v-model="coverUploadValue" action="/oss/uploadToDir" :data="{ directory: 'ai-template' }" :limit="5" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="Prompt" prop="prompt">
              <el-input v-model="form.prompt" type="textarea" :rows="5" placeholder="请输入模板提示词" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog title="模板预览" v-model="previewOpen" width="680px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="模板名称">{{ previewForm.templateName }}</el-descriptions-item>
        <el-descriptions-item label="媒体类型">{{ formatMediaType(previewForm.mediaType) }}</el-descriptions-item>
        <el-descriptions-item label="分类">{{ previewForm.categoryName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="来源">{{ formatSourceType(previewForm.sourceType) }}</el-descriptions-item>
        <el-descriptions-item label="状态"><dict-tag :options="sys_normal_disable" :value="previewForm.status" /></el-descriptions-item>
        <el-descriptions-item label="排序">{{ previewForm.sortOrder ?? 0 }}</el-descriptions-item>
        <el-descriptions-item label="Prompt" :span="2">{{ previewForm.prompt }}</el-descriptions-item>
      </el-descriptions>
      <div v-if="coverPreviewList(previewForm.coverUrl).length" class="preview-cover-list">
        <el-image
          v-for="url in coverPreviewList(previewForm.coverUrl)"
          :key="url"
          class="preview-cover"
          :src="url"
          :preview-src-list="coverPreviewList(previewForm.coverUrl)"
          preview-teleported
          fit="cover"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="AiTemplate">
import { listTemplate, getTemplate, addTemplate, updateTemplate, delTemplate } from '@/api/ai/template'
import { listTemplateCategory } from '@/api/ai/templateCategory'
import { resolveResourceUrl } from '@/utils/objectStorageUpload'
import { AI_TEMPLATE_MEDIA_TYPE_OPTIONS, AI_TEMPLATE_SOURCE_TYPE_OPTIONS, AiTemplateMediaTypeEnum, AiTemplateSourceTypeEnum, CommonStatusEnum } from '@/constants/ai'
import type { AiTemplate, TemplateQuery } from '@/api/ai/template'
import type { AiTemplateCategory } from '@/api/ai/templateCategory'
import type { AiTemplateSourceType } from '@/constants/ai'

const { proxy } = getCurrentInstance()
const { sys_normal_disable } = proxy.useDict('sys_normal_disable')

const mediaTypeOptions = AI_TEMPLATE_MEDIA_TYPE_OPTIONS

const sourceTypeOptions = AI_TEMPLATE_SOURCE_TYPE_OPTIONS
const activeSourceType = ref<AiTemplateSourceType>(AiTemplateSourceTypeEnum.SYSTEM)

const templateList = ref<AiTemplate[]>([])
const categoryOptions = ref<AiTemplateCategory[]>([])
const open = ref(false)
const previewOpen = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref<string[]>([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')
const previewForm = ref<AiTemplate>({})

const data = reactive({
  form: {} as AiTemplate,
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    categoryId: undefined,
    keyword: undefined,
    sourceType: AiTemplateSourceTypeEnum.SYSTEM,
    mediaType: undefined,
    status: undefined
  } as TemplateQuery,
  rules: {
    templateName: [{ required: true, message: '模板名称不能为空', trigger: 'blur' }],
    mediaType: [{ required: true, message: '请选择媒体类型', trigger: 'change' }],
    prompt: [{ required: true, message: 'Prompt不能为空', trigger: 'blur' }]
  }
})

const { queryParams, form, rules } = toRefs(data)

const coverUploadValue = computed({
  get: () => (form.value.coverUrl || []).join(','),
  set: (value: string | string[]) => {
    form.value.coverUrl = normalizeCoverValue(value)
  }
})

const formCategoryOptions = computed(() => categoryOptions.value.filter(item => {
  const mediaMatched = !form.value.mediaType || item.mediaType === form.value.mediaType
  const sourceMatched = !form.value.sourceType || item.sourceType === form.value.sourceType
  return mediaMatched && sourceMatched
}))

const queryCategoryOptions = computed(() => categoryOptions.value.filter(item => {
  const mediaMatched = !queryParams.value.mediaType || item.mediaType === queryParams.value.mediaType
  const sourceMatched = item.sourceType === activeSourceType.value
  return mediaMatched && sourceMatched
}))

function normalizeCoverValue(value?: string | string[]) {
  if (!value) return []
  return Array.isArray(value) ? value.filter(Boolean) : value.split(',').map(item => item.trim()).filter(Boolean)
}

function firstCover(value?: string[] | string) {
  return normalizeCoverValue(value)[0]
}

function coverPreviewList(value?: string[] | string) {
  return normalizeCoverValue(value).map(item => resolveResourceUrl(item))
}

function coverCount(value?: string[] | string) {
  return normalizeCoverValue(value).length
}

function formatMediaType(value?: string) {
  return mediaTypeOptions.find(item => item.value === value)?.label || value || '-'
}

function formatSourceType(value?: string) {
  const option = sourceTypeOptions.find(item => item.value === value)
  if (option) return option.label
  return value || '-'
}

function formatCategoryLabel(item: AiTemplateCategory) {
  return `${item.categoryName} / ${formatMediaType(item.mediaType)} / ${formatSourceType(item.sourceType)}`
}

function getList() {
  loading.value = true
  queryParams.value.sourceType = activeSourceType.value
  listTemplate(queryParams.value).then(response => {
    templateList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

function loadCategories() {
  listTemplateCategory({ pageNum: 1, pageSize: 500, status: CommonStatusEnum.NORMAL }).then(response => {
    categoryOptions.value = response.rows || []
  })
}

function cancel() {
  open.value = false
  reset()
}

function reset() {
  form.value = {
    templateId: undefined,
    categoryId: undefined,
    templateName: undefined,
    sourceType: activeSourceType.value,
    mediaType: AiTemplateMediaTypeEnum.IMAGE,
    prompt: undefined,
    coverUrl: [],
    sortOrder: 0,
    status: CommonStatusEnum.NORMAL,
    remark: undefined
  }
  proxy.resetForm('templateRef')
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function handleQueryTypeChange() {
  const exists = queryCategoryOptions.value.some(item => item.categoryId === queryParams.value.categoryId)
  if (!exists) {
    queryParams.value.categoryId = undefined
  }
}

function handleFormTypeChange() {
  const exists = formCategoryOptions.value.some(item => item.categoryId === form.value.categoryId)
  if (!exists) {
    form.value.categoryId = undefined
  }
}

function resetQuery() {
  proxy.resetForm('queryRef')
  queryParams.value.sourceType = activeSourceType.value
  handleQuery()
}

function handleSourceTabChange() {
  queryParams.value.sourceType = activeSourceType.value
  queryParams.value.categoryId = undefined
  queryParams.value.pageNum = 1
  ids.value = []
  single.value = true
  multiple.value = true
  getList()
}

function handleSelectionChange(selection: AiTemplate[]) {
  ids.value = selection.map(item => item.templateId!)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

function handleAdd() {
  reset()
  open.value = true
  title.value = '添加系统模板'
}

function handleUpdate(row?: AiTemplate) {
  reset()
  const templateId = row?.templateId || ids.value[0]
  getTemplate(templateId).then(response => {
    form.value = {
      ...response.data!,
      coverUrl: normalizeCoverValue(response.data?.coverUrl as any)
    }
    open.value = true
    title.value = '修改模板'
  })
}

function submitForm() {
  proxy.$refs['templateRef'].validate((valid: boolean) => {
    if (!valid) return
    form.value.coverUrl = normalizeCoverValue(form.value.coverUrl as any)
    const action = form.value.templateId ? updateTemplate(form.value) : addTemplate(form.value)
    action.then(() => {
      proxy.$modal.msgSuccess(form.value.templateId ? '修改成功' : '新增成功')
      open.value = false
      getList()
    })
  })
}

function handleDelete(row?: AiTemplate) {
  const templateIds = row?.templateId || ids.value
  proxy.$modal.confirm('是否确认删除模板编号为"' + templateIds + '"的数据项？').then(() => {
    return delTemplate(templateIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess('删除成功')
  }).catch(() => {})
}

function handlePreview(row: AiTemplate) {
  getTemplate(row.templateId!).then(response => {
    previewForm.value = response.data || row
    previewOpen.value = true
  })
}

function handleStatusChange(row: AiTemplate) {
  const nextStatus = row.status === CommonStatusEnum.NORMAL ? CommonStatusEnum.DISABLED : CommonStatusEnum.NORMAL
  const label = nextStatus === CommonStatusEnum.NORMAL ? '上架' : '下架'
  proxy.$modal.confirm(`是否确认${label}模板"${row.templateName}"？`).then(() => {
    return updateTemplate({
      ...row,
      status: nextStatus,
      coverUrl: normalizeCoverValue(row.coverUrl as any)
    })
  }).then(() => {
    proxy.$modal.msgSuccess(`${label}成功`)
    getList()
  }).catch(() => {})
}

loadCategories()
getList()
</script>

<style scoped lang="scss">
.source-tabs {
  margin-bottom: 16px;
}

.preview-cover-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 18px;
}

.preview-cover {
  width: 140px;
  height: 140px;
  border-radius: 8px;
}

.table-cover {
  width: 56px;
  height: 56px;
  border-radius: 6px;
}
</style>
