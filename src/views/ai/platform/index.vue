<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="平台编码" prop="platformCode">
        <el-input-number v-model="queryParams.platformCode" :min="1" controls-position="right" placeholder="平台编码" clearable style="width: 200px" />
      </el-form-item>
      <el-form-item label="平台名称" prop="platformName">
        <el-input v-model="queryParams.platformName" placeholder="请输入平台名称" clearable style="width: 200px" @keyup.enter="handleQuery" />
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
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['ai:platform:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['ai:platform:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['ai:platform:remove']">删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="platformList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="平台ID" align="center" prop="platformId" width="80" />
      <el-table-column label="平台编码" align="center" prop="platformCode" />
      <el-table-column label="平台名称" align="center" prop="platformName" />
      <el-table-column label="排序" align="center" prop="sortOrder" width="80" />
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
      <el-table-column label="操作" width="160" align="center">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['ai:platform:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['ai:platform:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="platformRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="平台编码" prop="platformCode">
          <el-select v-model="form.platformCode" placeholder="请选择平台编码" style="width: 100%">
            <el-option v-for="item in platformCodeOptions" :key="item.platformCode" :label="item.platformName + ' (' + item.platformCode + ')'" :value="item.platformCode" />
          </el-select>
        </el-form-item>
        <el-form-item label="平台名称" prop="platformName">
          <el-input v-model="form.platformName" placeholder="请输入平台名称" />
        </el-form-item>
        <el-form-item label="配置JSON" prop="configJson">
          <el-input v-model="form.configJson" type="textarea" :rows="5" placeholder='{"apiKey":"sk-xxx","authType":"Bearer","authHeader":"Authorization"}' />
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

<script setup lang="ts" name="AiPlatform">
import { listPlatform, getPlatform, addPlatform, updatePlatform, delPlatform } from '@/api/ai/platform'
import { listAiEnums } from '@/api/ai/enums'
import { AI_PLATFORM_OPTIONS } from '@/constants/ai'
import type { AiPlatformEnumOption } from '@/constants/ai'
import type { AiPlatform, AiPlatformQuery } from '@/api/ai/platform'

const { proxy } = getCurrentInstance()
const { sys_normal_disable } = proxy.useDict('sys_normal_disable')

const platformList = ref<AiPlatform[]>([])
const platformCodeOptions = ref<AiPlatformEnumOption[]>([...AI_PLATFORM_OPTIONS])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref<number[]>([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')

const data = reactive({
  form: {} as AiPlatform,
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    platformCode: undefined,
    platformName: undefined,
    status: undefined
  } as AiPlatformQuery,
  rules: {
    platformCode: [{ required: true, message: '平台编码不能为空', trigger: 'blur' }],
    platformName: [{ required: true, message: '平台名称不能为空', trigger: 'blur' }]
  }
})

const { queryParams, form, rules } = toRefs(data)

function loadEnums() {
  listAiEnums().then(res => {
    if (res.data?.platforms?.length) {
      platformCodeOptions.value = res.data.platforms
    }
  }).catch(() => {})
}

function getList() {
  loading.value = true
  listPlatform(queryParams.value).then(response => {
    platformList.value = response.rows
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
    platformId: undefined,
    platformCode: undefined,
    platformName: undefined,
    configJson: '{"apiKey":"","authType":"Bearer","authHeader":"Authorization"}',
    sortOrder: 0,
    status: '0',
    remark: undefined
  }
  proxy.resetForm('platformRef')
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm('queryRef')
  handleQuery()
}

function handleSelectionChange(selection: AiPlatform[]) {
  ids.value = selection.map(item => item.platformId!)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

function handleAdd() {
  reset()
  open.value = true
  title.value = '添加平台'
}

function handleUpdate(row?: AiPlatform) {
  reset()
  const platformId = row?.platformId || ids.value[0]
  getPlatform(platformId).then(response => {
    form.value = response.data!
    open.value = true
    title.value = '修改平台'
  })
}

function submitForm() {
  proxy.$refs['platformRef'].validate((valid: boolean) => {
    if (!valid) return
    const action = form.value.platformId ? updatePlatform(form.value) : addPlatform(form.value)
    action.then(() => {
      proxy.$modal.msgSuccess(form.value.platformId ? '修改成功' : '新增成功')
      open.value = false
      getList()
    })
  })
}

function handleDelete(row?: AiPlatform) {
  const platformIds = row?.platformId || ids.value
  proxy.$modal.confirm('是否确认删除平台编号为"' + platformIds + '"的数据项？').then(() => {
    return delPlatform(platformIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess('删除成功')
  }).catch(() => {})
}

loadEnums()
getList()
</script>
