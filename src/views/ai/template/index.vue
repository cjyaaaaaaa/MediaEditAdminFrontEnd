<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="模板名称" prop="keyword">
        <el-input v-model="queryParams.keyword" placeholder="请输入模板名称/标签" clearable style="width: 220px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="分类" prop="categoryId">
        <el-select v-model="queryParams.categoryId" placeholder="请选择分类" clearable style="width: 180px">
          <el-option v-for="item in categoryOptions" :key="item.categoryId" :label="item.categoryName" :value="item.categoryId" />
        </el-select>
      </el-form-item>
      <el-form-item label="来源" prop="sourceType">
        <el-select v-model="queryParams.sourceType" placeholder="来源" clearable style="width: 140px">
          <el-option label="系统模板" value="system" />
          <el-option label="用户模板" value="user" />
        </el-select>
      </el-form-item>
      <el-form-item label="审核" prop="auditStatus">
        <el-select v-model="queryParams.auditStatus" placeholder="审核状态" clearable style="width: 140px">
          <el-option label="待审核" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已驳回" value="rejected" />
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
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['ai:template:add']">新增系统模板</el-button>
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
          <el-image
            v-if="scope.row.coverUrl"
            :src="resolveResourceUrl(scope.row.coverUrl)"
            :preview-src-list="[resolveResourceUrl(scope.row.coverUrl)]"
            fit="cover"
            style="width: 56px; height: 56px; border-radius: 6px"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="模板名称" align="center" prop="templateName" min-width="130" show-overflow-tooltip />
      <el-table-column label="分类" align="center" prop="categoryName" width="110" />
      <el-table-column label="来源" align="center" prop="sourceType" width="90">
        <template #default="scope">
          <el-tag :type="scope.row.sourceType === 'system' ? 'success' : 'info'">{{ formatSourceType(scope.row.sourceType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="类型" align="center" prop="taskType" width="90">
        <template #default="scope">
          <span>{{ formatTaskType(scope.row.taskType) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核" align="center" prop="auditStatus" width="90">
        <template #default="scope">
          <el-tag :type="auditTagType(scope.row.auditStatus)">{{ formatAuditStatus(scope.row.auditStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="scope">
          <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="尺寸" align="center" width="105">
        <template #default="scope">
          <span>{{ scope.row.width }}x{{ scope.row.height }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Prompt" align="center" prop="prompt" min-width="220" show-overflow-tooltip />
      <el-table-column label="使用" align="center" prop="usageCount" width="80" />
      <el-table-column label="排序" align="center" prop="sortOrder" width="80" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="170">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" align="center" fixed="right">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handlePreview(scope.row)" v-hasPermi="['ai:template:query']">预览</el-button>
          <el-button
            v-if="scope.row.auditStatus === 'pending'"
            link
            type="primary"
            icon="Check"
            @click="handleAudit(scope.row, 'approved')"
            v-hasPermi="['ai:template:audit']"
          >通过</el-button>
          <el-button
            v-if="scope.row.auditStatus === 'pending'"
            link
            type="primary"
            icon="Close"
            @click="openRejectDialog(scope.row)"
            v-hasPermi="['ai:template:audit']"
          >驳回</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['ai:template:edit']">修改</el-button>
          <el-button link type="primary" icon="Switch" @click="handleStatusChange(scope.row)" v-hasPermi="['ai:template:edit']">
            {{ scope.row.status === '0' ? '下架' : '上架' }}
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
            <el-form-item label="分类" prop="categoryId">
              <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%">
                <el-option v-for="item in categoryOptions" :key="item.categoryId" :label="item.categoryName" :value="item.categoryId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源" prop="sourceType">
              <el-select v-model="form.sourceType" placeholder="请选择来源" style="width: 100%">
                <el-option label="系统模板" value="system" />
                <el-option label="用户模板" value="user" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="审核状态" prop="auditStatus">
              <el-select v-model="form.auditStatus" placeholder="请选择审核状态" style="width: 100%">
                <el-option label="待审核" value="pending" />
                <el-option label="已通过" value="approved" />
                <el-option label="已驳回" value="rejected" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务类型" prop="taskType">
              <el-radio-group v-model="form.taskType">
                <el-radio value="generate">文生图</el-radio>
                <el-radio value="edit">图生图</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="封面图" prop="coverUrl">
              <image-upload v-model="form.coverUrl" action="/oss/uploadToDir" :data="{ directory: 'ai-template' }" :limit="1" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="Prompt" prop="prompt">
              <el-input v-model="form.prompt" type="textarea" :rows="4" placeholder="请输入模板提示词" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="平台编码" prop="platformCode">
              <el-input-number v-model="form.platformCode" controls-position="right" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模型编码" prop="modelCode">
              <el-input-number v-model="form.modelCode" controls-position="right" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="宽度" prop="width">
              <el-input-number v-model="form.width" controls-position="right" :min="64" :step="64" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="高度" prop="height">
              <el-input-number v-model="form.height" controls-position="right" :min="64" :step="64" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标签" prop="tags">
              <el-input v-model="form.tags" placeholder="多个标签用逗号分隔" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sortOrder">
              <el-input-number v-model="form.sortOrder" controls-position="right" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="驳回原因" prop="rejectReason">
              <el-input v-model="form.rejectReason" type="textarea" :rows="2" placeholder="审核驳回时填写" />
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
        <el-descriptions-item label="分类">{{ previewForm.categoryName }}</el-descriptions-item>
        <el-descriptions-item label="来源">{{ formatSourceType(previewForm.sourceType) }}</el-descriptions-item>
        <el-descriptions-item label="审核">{{ formatAuditStatus(previewForm.auditStatus) }}</el-descriptions-item>
        <el-descriptions-item label="任务类型">{{ formatTaskType(previewForm.taskType) }}</el-descriptions-item>
        <el-descriptions-item label="尺寸">{{ previewForm.width }}x{{ previewForm.height }}</el-descriptions-item>
        <el-descriptions-item label="平台/模型">{{ previewForm.platformCode }} / {{ previewForm.modelCode }}</el-descriptions-item>
        <el-descriptions-item label="使用次数">{{ previewForm.usageCount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="标签" :span="2">{{ previewForm.tags || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Prompt" :span="2">{{ previewForm.prompt }}</el-descriptions-item>
        <el-descriptions-item label="驳回原因" :span="2">{{ previewForm.rejectReason || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-image
        v-if="previewForm.coverUrl"
        class="preview-cover"
        :src="resolveResourceUrl(previewForm.coverUrl)"
        :preview-src-list="[resolveResourceUrl(previewForm.coverUrl)]"
        fit="cover"
      />
    </el-dialog>

    <el-dialog title="驳回模板" v-model="rejectOpen" width="520px" append-to-body>
      <el-form ref="rejectRef" :model="rejectForm" :rules="rejectRules" label-width="90px">
        <el-form-item label="驳回原因" prop="rejectReason">
          <el-input v-model="rejectForm.rejectReason" type="textarea" :rows="4" placeholder="请输入驳回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitReject">确 定</el-button>
          <el-button @click="rejectOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="AiTemplate">
import { listTemplate, getTemplate, addTemplate, updateTemplate, auditTemplate, delTemplate } from '@/api/ai/template'
import { listTemplateCategory } from '@/api/ai/templateCategory'
import { resolveResourceUrl } from '@/utils/objectStorageUpload'
import type { AiImageTemplate, TemplateQuery } from '@/api/ai/template'
import type { AiTemplateCategory } from '@/api/ai/templateCategory'

const { proxy } = getCurrentInstance()
const { sys_normal_disable } = proxy.useDict('sys_normal_disable')

const templateList = ref<AiImageTemplate[]>([])
const categoryOptions = ref<AiTemplateCategory[]>([])
const open = ref(false)
const previewOpen = ref(false)
const rejectOpen = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref<number[]>([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')
const previewForm = ref<AiImageTemplate>({})
const rejectForm = ref<AiImageTemplate>({})

const data = reactive({
  form: {} as AiImageTemplate,
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    categoryId: undefined,
    keyword: undefined,
    sourceType: undefined,
    auditStatus: undefined,
    taskType: undefined,
    status: undefined
  } as TemplateQuery,
  rules: {
    templateName: [{ required: true, message: '模板名称不能为空', trigger: 'blur' }],
    categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
    sourceType: [{ required: true, message: '请选择来源', trigger: 'change' }],
    auditStatus: [{ required: true, message: '请选择审核状态', trigger: 'change' }],
    taskType: [{ required: true, message: '请选择任务类型', trigger: 'change' }],
    prompt: [{ required: true, message: 'Prompt不能为空', trigger: 'blur' }],
    coverUrl: [{ required: true, message: '请上传封面图', trigger: 'change' }],
    platformCode: [{ required: true, message: '平台编码不能为空', trigger: 'blur' }],
    modelCode: [{ required: true, message: '模型编码不能为空', trigger: 'blur' }],
    width: [{ required: true, message: '宽度不能为空', trigger: 'blur' }],
    height: [{ required: true, message: '高度不能为空', trigger: 'blur' }]
  },
  rejectRules: {
    rejectReason: [{ required: true, message: '驳回原因不能为空', trigger: 'blur' }]
  }
})

const { queryParams, form, rules, rejectRules } = toRefs(data)

function getList() {
  loading.value = true
  listTemplate(queryParams.value).then(response => {
    templateList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

function loadCategories() {
  listTemplateCategory({ pageNum: 1, pageSize: 100, status: '0' }).then(response => {
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
    sourceType: 'system',
    auditStatus: 'approved',
    taskType: 'generate',
    prompt: undefined,
    coverUrl: undefined,
    platformCode: 1,
    modelCode: 1,
    width: 1024,
    height: 1024,
    tags: undefined,
    usageCount: 0,
    sortOrder: 0,
    status: '0',
    rejectReason: undefined,
    remark: undefined
  }
  proxy.resetForm('templateRef')
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm('queryRef')
  handleQuery()
}

function handleSelectionChange(selection: AiImageTemplate[]) {
  ids.value = selection.map(item => item.templateId!)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

function handleAdd() {
  reset()
  open.value = true
  title.value = '添加系统模板'
}

function handleUpdate(row?: AiImageTemplate) {
  reset()
  const templateId = row?.templateId || ids.value[0]
  getTemplate(templateId).then(response => {
    form.value = response.data!
    open.value = true
    title.value = '修改模板'
  })
}

function submitForm() {
  proxy.$refs['templateRef'].validate((valid: boolean) => {
    if (!valid) return
    const action = form.value.templateId ? updateTemplate(form.value) : addTemplate(form.value)
    action.then(() => {
      proxy.$modal.msgSuccess(form.value.templateId ? '修改成功' : '新增成功')
      open.value = false
      getList()
    })
  })
}

function handleDelete(row?: AiImageTemplate) {
  const templateIds = row?.templateId || ids.value
  proxy.$modal.confirm('是否确认删除模板编号为"' + templateIds + '"的数据项？').then(() => {
    return delTemplate(templateIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess('删除成功')
  }).catch(() => {})
}

function handlePreview(row: AiImageTemplate) {
  getTemplate(row.templateId!).then(response => {
    previewForm.value = response.data || row
    previewOpen.value = true
  })
}

function handleAudit(row: AiImageTemplate, auditStatus: string, rejectReason?: string) {
  const label = auditStatus === 'approved' ? '通过' : '驳回'
  proxy.$modal.confirm(`是否确认${label}模板"${row.templateName}"？`).then(() => {
    return auditTemplate({
      templateId: row.templateId,
      auditStatus,
      rejectReason
    })
  }).then(() => {
    proxy.$modal.msgSuccess(`${label}成功`)
    getList()
  }).catch(() => {})
}

function openRejectDialog(row: AiImageTemplate) {
  rejectForm.value = {
    templateId: row.templateId,
    templateName: row.templateName,
    auditStatus: 'rejected',
    rejectReason: undefined
  }
  rejectOpen.value = true
  proxy.resetForm('rejectRef')
}

function submitReject() {
  proxy.$refs['rejectRef'].validate((valid: boolean) => {
    if (!valid) return
    handleAudit(rejectForm.value, 'rejected', rejectForm.value.rejectReason)
    rejectOpen.value = false
  })
}

function handleStatusChange(row: AiImageTemplate) {
  const nextStatus = row.status === '0' ? '1' : '0'
  const label = nextStatus === '0' ? '上架' : '下架'
  proxy.$modal.confirm(`是否确认${label}模板"${row.templateName}"？`).then(() => {
    return updateTemplate({
      ...row,
      status: nextStatus
    })
  }).then(() => {
    proxy.$modal.msgSuccess(`${label}成功`)
    getList()
  }).catch(() => {})
}

function formatSourceType(value?: string) {
  if (value === 'system') return '系统'
  if (value === 'user') return '用户'
  return value || '-'
}

function formatTaskType(value?: string) {
  if (value === 'edit') return '图生图'
  if (value === 'generate') return '文生图'
  return value || '-'
}

function formatAuditStatus(value?: string) {
  if (value === 'pending') return '待审核'
  if (value === 'approved') return '已通过'
  if (value === 'rejected') return '已驳回'
  return value || '-'
}

function auditTagType(value?: string) {
  if (value === 'approved') return 'success'
  if (value === 'rejected') return 'danger'
  return 'warning'
}

loadCategories()
getList()
</script>

<style scoped lang="scss">
.preview-cover {
  display: block;
  width: 220px;
  height: 220px;
  margin: 18px auto 0;
  border-radius: 8px;
}
</style>
