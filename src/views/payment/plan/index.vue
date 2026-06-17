<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="套餐名称" prop="planName">
        <el-input v-model="queryParams.planName" placeholder="请输入套餐名称" clearable style="width: 200px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="套餐编码" prop="planCode">
        <el-input v-model="queryParams.planCode" placeholder="请输入套餐编码" clearable style="width: 200px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="计费类型" prop="billingType">
        <el-select v-model="queryParams.billingType" placeholder="计费类型" clearable style="width: 180px">
          <el-option label="一次性" value="one_time" />
          <el-option label="订阅" value="subscription" />
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
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['payment:plan:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['payment:plan:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['payment:plan:remove']">删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="planList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="ID" align="center" prop="planId" width="80" />
      <el-table-column label="套餐名称" align="center" prop="planName" min-width="140" />
      <el-table-column label="套餐编码" align="center" prop="planCode" min-width="140" />
      <el-table-column label="计费类型" align="center" prop="billingType" width="100">
        <template #default="scope">{{ scope.row.billingType === 'subscription' ? '订阅' : '一次性' }}</template>
      </el-table-column>
      <el-table-column label="价格" align="center" width="120">
        <template #default="scope">{{ formatMoney(scope.row.priceCent, scope.row.currency) }}</template>
      </el-table-column>
      <el-table-column label="积分" align="center" prop="creditAmount" width="100" />
      <el-table-column label="渠道" align="center" min-width="160">
        <template #default="scope">
          <el-tag v-for="item in scope.row.providers || []" :key="item.planProviderId || item.paymentProvider" class="mr4">
            {{ item.paymentProvider }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="排序" align="center" prop="sortOrder" width="80" />
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" align="center">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['payment:plan:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['payment:plan:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="760px" append-to-body>
      <el-form ref="planRef" :model="form" :rules="rules" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="套餐名称" prop="planName">
              <el-input v-model="form.planName" placeholder="请输入套餐名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="套餐编码" prop="planCode">
              <el-input v-model="form.planCode" placeholder="如 pro_monthly" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="计费类型" prop="billingType">
              <el-select v-model="form.billingType" style="width: 100%">
                <el-option label="一次性" value="one_time" />
                <el-option label="订阅" value="subscription" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="价格(分)" prop="priceCent">
              <el-input-number v-model="form.priceCent" :min="1" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="币种" prop="currency">
              <el-input v-model="form.currency" placeholder="USD" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="到账积分" prop="creditAmount">
              <el-input-number v-model="form.creditAmount" :min="1" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="排序" prop="sortOrder">
              <el-input-number v-model="form.sortOrder" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="form.billingType === 'subscription'" :gutter="16">
          <el-col :span="12">
            <el-form-item label="周期单位" prop="intervalUnit">
              <el-select v-model="form.intervalUnit" style="width: 100%">
                <el-option label="月" value="month" />
                <el-option label="年" value="year" />
                <el-option label="周" value="week" />
                <el-option label="日" value="day" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="周期数量" prop="intervalCount">
              <el-input-number v-model="form.intervalCount" :min="1" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-divider content-position="left">支付渠道配置</el-divider>
        <el-table :data="form.providers" border>
          <el-table-column label="支付渠道" width="160">
            <template #default="scope">
              <el-select v-model="scope.row.paymentProvider" placeholder="请选择">
                <el-option label="Lemon Squeezy" value="lemon_squeezy" />
                <el-option label="Paddle" value="paddle" />
                <el-option label="Stripe" value="stripe" />
                <el-option label="PayPal" value="paypal" />
                <el-option label="支付宝" value="alipay" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="商品ID">
            <template #default="scope">
              <el-input v-model="scope.row.providerProductId" placeholder="可选" />
            </template>
          </el-table-column>
          <el-table-column label="价格/变体ID">
            <template #default="scope">
              <el-input v-model="scope.row.providerPriceId" placeholder="Lemon variant id / Paddle price id / Stripe price id" />
            </template>
          </el-table-column>
          <el-table-column label="状态" width="120">
            <template #default="scope">
              <el-select v-model="scope.row.status">
                <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="scope">
              <el-button link type="primary" icon="Delete" @click="removeProvider(scope.$index)" />
            </template>
          </el-table-column>
        </el-table>
        <el-button class="mt12" plain icon="Plus" @click="addProvider">添加渠道</el-button>
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

<script setup lang="ts" name="PaymentPlan">
import { listPaymentPlan, getPaymentPlan, addPaymentPlan, updatePaymentPlan, delPaymentPlan } from '@/api/payment/plan'
import type { PaymentPlan, PaymentPlanQuery } from '@/api/payment/plan'

const { proxy } = getCurrentInstance()
const { sys_normal_disable } = proxy.useDict('sys_normal_disable')

const planList = ref<PaymentPlan[]>([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref<number[]>([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')

const data = reactive({
  form: {} as PaymentPlan,
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    planName: undefined,
    planCode: undefined,
    billingType: undefined,
    status: undefined
  } as PaymentPlanQuery,
  rules: {
    planName: [{ required: true, message: '套餐名称不能为空', trigger: 'blur' }],
    planCode: [{ required: true, message: '套餐编码不能为空', trigger: 'blur' }],
    billingType: [{ required: true, message: '计费类型不能为空', trigger: 'change' }],
    priceCent: [{ required: true, message: '价格不能为空', trigger: 'blur' }],
    creditAmount: [{ required: true, message: '积分不能为空', trigger: 'blur' }]
  }
})

const { queryParams, form, rules } = toRefs(data)

function getList() {
  loading.value = true
  listPaymentPlan(queryParams.value).then(response => {
    planList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

function reset() {
  form.value = {
    planId: undefined,
    planName: undefined,
    planCode: undefined,
    billingType: 'one_time',
    priceCent: 1000,
    currency: 'USD',
    creditAmount: 100,
    intervalUnit: undefined,
    intervalCount: undefined,
    sortOrder: 0,
    status: '0',
    providers: [{ paymentProvider: 'lemon_squeezy', providerPriceId: '', status: '0' }]
  }
  proxy.resetForm('planRef')
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm('queryRef')
  handleQuery()
}

function handleSelectionChange(selection: PaymentPlan[]) {
  ids.value = selection.map(item => item.planId!)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

function handleAdd() {
  reset()
  open.value = true
  title.value = '新增支付套餐'
}

function handleUpdate(row?: PaymentPlan) {
  reset()
  const planId = row?.planId || ids.value[0]
  getPaymentPlan(planId).then(response => {
    form.value = response.data || {}
    form.value.providers = form.value.providers || []
    open.value = true
    title.value = '修改支付套餐'
  })
}

function addProvider() {
  form.value.providers = form.value.providers || []
  form.value.providers.push({ paymentProvider: 'lemon_squeezy', providerPriceId: '', status: '0' })
}

function removeProvider(index: number) {
  form.value.providers?.splice(index, 1)
}

function submitForm() {
  proxy.$refs['planRef'].validate((valid: boolean) => {
    if (!valid) return
    const action = form.value.planId ? updatePaymentPlan(form.value) : addPaymentPlan(form.value)
    action.then(() => {
      proxy.$modal.msgSuccess(form.value.planId ? '修改成功' : '新增成功')
      open.value = false
      getList()
    })
  })
}

function handleDelete(row?: PaymentPlan) {
  const planIds = row?.planId || ids.value
  proxy.$modal.confirm('是否确认删除支付套餐编号为"' + planIds + '"的数据项？').then(() => {
    return delPaymentPlan(planIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess('删除成功')
  }).catch(() => {})
}

function cancel() {
  open.value = false
  reset()
}

function formatMoney(priceCent?: number, currency?: string) {
  return `${currency || 'USD'} ${(Number(priceCent || 0) / 100).toFixed(2)}`
}

getList()
</script>

<style scoped>
.mr4 {
  margin-right: 4px;
}
.mt12 {
  margin-top: 12px;
}
</style>
