<template>
  <div class="app-container">
    <el-tabs v-model="activeSourceType" class="source-tabs" @tab-change="handleSourceTabChange">
      <el-tab-pane label="系统" :name="AiTemplateSourceTypeEnum.SYSTEM" />
      <el-tab-pane label="用户" :name="AiTemplateSourceTypeEnum.USER" />
    </el-tabs>

    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="分类名称" prop="categoryName">
        <el-input v-model="queryParams.categoryName" placeholder="请输入分类名称" clearable style="width: 200px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="媒体类型" prop="mediaType">
        <el-select v-model="queryParams.mediaType" placeholder="媒体类型" clearable style="width: 140px">
          <el-option v-for="item in mediaTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="状态" clearable style="width: 160px">
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
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['ai:templateCategory:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['ai:templateCategory:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['ai:templateCategory:remove']">删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="categoryList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="分类ID" align="center" prop="categoryId" width="90" />
      <el-table-column label="分类名称" align="center" prop="categoryName" />
      <el-table-column label="站点" align="center" prop="site" width="130">
        <template #default="scope">{{ siteLabel(scope.row.site) }}</template>
      </el-table-column>
      <el-table-column v-if="activeSourceType === AiTemplateSourceTypeEnum.USER" label="用户ID" align="center" prop="userId" min-width="160" />
      <el-table-column label="媒体类型" align="center" prop="mediaType" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.mediaType === AiTemplateMediaTypeEnum.VIDEO ? 'warning' : 'success'">{{ formatMediaType(scope.row.mediaType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="排序" align="center" prop="sortOrder" width="90" />
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="230" align="center" fixed="right">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['ai:templateCategory:edit']">修改</el-button>
          <el-button link type="primary" icon="Switch" @click="handleStatusChange(scope.row)" v-hasPermi="['ai:templateCategory:edit']">
            {{ scope.row.status === CommonStatusEnum.NORMAL ? '下架' : '上架' }}
          </el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['ai:templateCategory:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="560px" append-to-body>
      <el-form ref="categoryRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="分类名称" prop="categoryName">
          <el-input v-model="form.categoryName" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="所属站点" prop="site">
          <el-select v-model="form.site" placeholder="请选择所属站点" filterable style="width: 100%">
            <el-option v-for="site in siteOptions" :key="site.code" :label="site.label" :value="site.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="媒体类型" prop="mediaType">
          <el-radio-group v-model="form.mediaType">
            <el-radio-button v-for="item in mediaTypeOptions" :key="item.value" :value="item.value">{{ item.label }}</el-radio-button>
          </el-radio-group>
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

<script setup lang="ts" name="TemplateCategory">
import { listTemplateCategory, getTemplateCategory, addTemplateCategory, updateTemplateCategory, delTemplateCategory } from '@/api/ai/templateCategory'
import { listCustomerSiteOptions } from '@/api/system/customerSite'
import { AI_TEMPLATE_MEDIA_TYPE_OPTIONS, AiTemplateMediaTypeEnum, AiTemplateSourceTypeEnum, CommonStatusEnum } from '@/constants/ai'
import type { AiTemplateCategory, TemplateCategoryQuery } from '@/api/ai/templateCategory'
import type { AiTemplateSourceType } from '@/constants/ai'
import type { CustomerSiteOption } from '@/api/system/customerSite'

const { proxy } = getCurrentInstance()
const { sys_normal_disable } = proxy.useDict('sys_normal_disable')

const mediaTypeOptions = AI_TEMPLATE_MEDIA_TYPE_OPTIONS
const siteOptions = ref<CustomerSiteOption[]>([])

const activeSourceType = ref<AiTemplateSourceType>(AiTemplateSourceTypeEnum.SYSTEM)

const categoryList = ref<AiTemplateCategory[]>([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref<string[]>([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')

const data = reactive({
  form: {} as AiTemplateCategory,
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    categoryName: undefined,
    sourceType: AiTemplateSourceTypeEnum.SYSTEM,
    mediaType: undefined,
    status: undefined
  } as TemplateCategoryQuery,
  rules: {
    categoryName: [{ required: true, message: '分类名称不能为空', trigger: 'blur' }],
    site: [{ required: true, message: '请选择所属站点', trigger: 'change' }],
    mediaType: [{ required: true, message: '请选择媒体类型', trigger: 'change' }]
  }
})

const { queryParams, form, rules } = toRefs(data)

function formatMediaType(value?: string) {
  return mediaTypeOptions.find(item => item.value === value)?.label || value || '-'
}

function siteLabel(site?: string) {
  return siteOptions.value.find(item => item.code === site)?.label || site || '-'
}

function getList() {
  loading.value = true
  queryParams.value.sourceType = activeSourceType.value
  listTemplateCategory(queryParams.value).then(response => {
    categoryList.value = response.rows
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
    categoryId: undefined,
    site: undefined,
    categoryName: undefined,
    sourceType: activeSourceType.value,
    mediaType: AiTemplateMediaTypeEnum.IMAGE,
    sortOrder: 0,
    status: CommonStatusEnum.NORMAL,
    remark: undefined
  }
  proxy.resetForm('categoryRef')
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm('queryRef')
  queryParams.value.sourceType = activeSourceType.value
  handleQuery()
}

function handleSourceTabChange() {
  queryParams.value.sourceType = activeSourceType.value
  queryParams.value.pageNum = 1
  ids.value = []
  single.value = true
  multiple.value = true
  getList()
}

function handleSelectionChange(selection: AiTemplateCategory[]) {
  ids.value = selection.map(item => item.categoryId!)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

function handleAdd() {
  reset()
  open.value = true
  title.value = '添加系统模板分类'
}

function handleUpdate(row?: AiTemplateCategory) {
  reset()
  const categoryId = row?.categoryId || ids.value[0]
  getTemplateCategory(categoryId).then(response => {
    form.value = response.data!
    open.value = true
    title.value = '修改模板分类'
  })
}

function submitForm() {
  proxy.$refs['categoryRef'].validate((valid: boolean) => {
    if (!valid) return
    const action = form.value.categoryId ? updateTemplateCategory(form.value) : addTemplateCategory(form.value)
    action.then(() => {
      proxy.$modal.msgSuccess(form.value.categoryId ? '修改成功' : '新增成功')
      open.value = false
      getList()
    })
  })
}

function handleDelete(row?: AiTemplateCategory) {
  const categoryIds = row?.categoryId || ids.value
  proxy.$modal.confirm('是否确认删除模板分类编号为"' + categoryIds + '"的数据项？').then(() => {
    return delTemplateCategory(categoryIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess('删除成功')
  }).catch(() => {})
}

function handleStatusChange(row: AiTemplateCategory) {
  const nextStatus = row.status === CommonStatusEnum.NORMAL ? CommonStatusEnum.DISABLED : CommonStatusEnum.NORMAL
  const label = nextStatus === CommonStatusEnum.NORMAL ? '上架' : '下架'
  proxy.$modal.confirm(`是否确认${label}模板分类"${row.categoryName}"？`).then(() => {
    return updateTemplateCategory({
      ...row,
      status: nextStatus
    })
  }).then(() => {
    proxy.$modal.msgSuccess(`${label}成功`)
    getList()
  }).catch(() => {})
}

listCustomerSiteOptions().then(response => {
  siteOptions.value = response.data || []
})
getList()
</script>

<style scoped lang="scss">
.source-tabs {
  margin-bottom: 16px;
}
</style>
