<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="套餐名称" prop="packageName">
        <el-input v-model="queryParams.packageName" placeholder="请输入套餐名称" clearable style="width: 200px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="道具ID" prop="productId">
        <el-input v-model="queryParams.productId" placeholder="请输入微信道具ID" clearable style="width: 220px" @keyup.enter="handleQuery" />
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
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['ai:rechargePackage:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['ai:rechargePackage:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['ai:rechargePackage:remove']">删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="packageList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="套餐ID" align="center" prop="packageId" width="90" />
      <el-table-column label="套餐名称" align="center" prop="packageName" min-width="120" />
      <el-table-column label="微信道具ID" align="center" prop="productId" min-width="180" show-overflow-tooltip />
      <el-table-column label="价格" align="center" prop="priceCent" width="110">
        <template #default="scope">
          <span>{{ formatCent(scope.row.priceCent) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="到账积分" align="center" prop="creditAmount" width="100" />
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
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['ai:rechargePackage:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['ai:rechargePackage:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="620px" append-to-body>
      <el-form ref="packageRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="套餐名称" prop="packageName">
          <el-input v-model="form.packageName" placeholder="请输入套餐名称" />
        </el-form-item>
        <el-form-item label="微信道具ID" prop="productId">
          <el-input v-model="form.productId" placeholder="需与微信虚拟支付后台道具ID一致" />
        </el-form-item>
        <el-form-item label="价格（分）" prop="priceCent">
          <el-input-number v-model="form.priceCent" controls-position="right" :min="1" :precision="0" style="width: 220px" />
        </el-form-item>
        <el-form-item label="到账积分" prop="creditAmount">
          <el-input-number v-model="form.creditAmount" controls-position="right" :min="1" :precision="0" style="width: 220px" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" controls-position="right" :min="0" :precision="0" style="width: 220px" />
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

<script setup lang="ts" name="RechargePackage">
import { listRechargePackage, getRechargePackage, addRechargePackage, updateRechargePackage, delRechargePackage } from '@/api/ai/rechargePackage'
import type { CreditPackage, RechargePackageQuery } from '@/api/ai/rechargePackage'

const { proxy } = getCurrentInstance()
const { sys_normal_disable } = proxy.useDict('sys_normal_disable')

const packageList = ref<CreditPackage[]>([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref<number[]>([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')

const data = reactive({
  form: {} as CreditPackage,
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    packageName: undefined,
    productId: undefined,
    status: undefined
  } as RechargePackageQuery,
  rules: {
    packageName: [{ required: true, message: '套餐名称不能为空', trigger: 'blur' }],
    productId: [{ required: true, message: '微信道具ID不能为空', trigger: 'blur' }],
    priceCent: [{ required: true, message: '价格不能为空', trigger: 'blur' }],
    creditAmount: [{ required: true, message: '到账积分不能为空', trigger: 'blur' }]
  }
})

const { queryParams, form, rules } = toRefs(data)

function getList() {
  loading.value = true
  listRechargePackage(queryParams.value).then(response => {
    packageList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

function formatCent(value?: number) {
  const amount = Number(value || 0)
  return '¥' + (amount / 100).toFixed(2)
}

function cancel() {
  open.value = false
  reset()
}

function reset() {
  form.value = {
    packageId: undefined,
    packageName: undefined,
    productId: undefined,
    priceCent: 100,
    creditAmount: 10,
    payMode: 'short_series_goods',
    sortOrder: 0,
    status: '0',
    remark: undefined
  }
  proxy.resetForm('packageRef')
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm('queryRef')
  handleQuery()
}

function handleSelectionChange(selection: CreditPackage[]) {
  ids.value = selection.map(item => item.packageId!)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

function handleAdd() {
  reset()
  open.value = true
  title.value = '添加充值套餐'
}

function handleUpdate(row?: CreditPackage) {
  reset()
  const packageId = row?.packageId || ids.value[0]
  getRechargePackage(packageId).then(response => {
    form.value = response.data!
    open.value = true
    title.value = '修改充值套餐'
  })
}

function submitForm() {
  proxy.$refs['packageRef'].validate((valid: boolean) => {
    if (!valid) return
    const action = form.value.packageId ? updateRechargePackage(form.value) : addRechargePackage(form.value)
    action.then(() => {
      proxy.$modal.msgSuccess(form.value.packageId ? '修改成功' : '新增成功')
      open.value = false
      getList()
    })
  })
}

function handleDelete(row?: CreditPackage) {
  const packageIds = row?.packageId || ids.value
  proxy.$modal.confirm('是否确认删除充值套餐编号为"' + packageIds + '"的数据项？').then(() => {
    return delRechargePackage(packageIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess('删除成功')
  }).catch(() => {})
}

getList()
</script>
