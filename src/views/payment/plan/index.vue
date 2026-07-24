<template>
  <div class="app-container payment-page">
    <div class="page-heading">
      <div>
        <h2>支付套餐</h2>
        <p>统一维护一次性与订阅商品，以及各支付渠道对应的商品配置。</p>
      </div>
    </div>

    <el-card v-show="showSearch" class="filter-card" shadow="never">
    <el-form :model="queryParams" ref="queryRef" :inline="true" label-position="top">
      <el-form-item label="站点" prop="site">
        <el-select v-model="queryParams.site" placeholder="站点" clearable style="width: 160px">
          <el-option v-for="site in siteOptions" :key="site.code" :label="site.label" :value="site.code" />
        </el-select>
      </el-form-item>
      <el-form-item label="套餐名称" prop="planName">
        <el-input v-model="queryParams.planName" placeholder="请输入套餐名称" clearable style="width: 200px" @keyup.enter="handleQuery" />
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
    </el-card>

    <el-card shadow="never" class="table-card">
    <el-row :gutter="10" class="table-toolbar">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['payment:plan:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['payment:plan:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['payment:plan:remove']">删除</el-button>
      </el-col>
      <div class="toolbar-spacer" />
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="planList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="套餐ID" width="150" fixed="left">
        <template #default="scope"><PaymentIdentifier :value="scope.row.planId" /></template>
      </el-table-column>
      <el-table-column label="站点" align="center" prop="site" min-width="120">
        <template #default="scope">{{ siteLabel(scope.row.site) }}</template>
      </el-table-column>
      <el-table-column label="套餐名称" align="center" prop="planName" min-width="140" />
      <el-table-column label="套餐描述" prop="description" min-width="180">
        <template #default="scope">
          <span class="desc-cell">{{ scope.row.description }}</span>
        </template>
      </el-table-column>
      <el-table-column label="计费类型" align="center" prop="billingType" width="100">
        <template #default="scope"><el-tag effect="plain" type="info">{{ billingTypeLabel(scope.row.billingType) }}</el-tag></template>
      </el-table-column>
      <el-table-column label="订阅周期" align="center" width="110">
        <template #default="scope">{{ scope.row.billingType === 'subscription' ? intervalLabel(scope.row.intervalUnit, scope.row.intervalCount) : '-' }}</template>
      </el-table-column>
      <el-table-column label="价格" align="center" width="120">
        <template #default="scope">{{ formatMoney(scope.row.priceCent, scope.row.currency) }}</template>
      </el-table-column>
      <el-table-column label="积分" align="center" prop="creditAmount" width="100" />
      <el-table-column label="渠道" align="center" min-width="160">
        <template #default="scope">
          <el-tag v-for="item in scope.row.providers || []" :key="item.planProviderId || item.paymentProvider" class="mr4">
            {{ providerLabel(item.paymentProvider) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="渠道商品 / 价格" min-width="240">
        <template #default="scope">
          <div v-for="item in scope.row.providers || []" :key="`${item.paymentProvider}-${item.planProviderId || item.providerProductId || item.providerPriceId}`" class="provider-id-line">
            <span class="secondary-text">{{ providerLabel(item.paymentProvider) }}</span>
            <PaymentIdentifier :value="item.providerProductId || item.providerPriceId" />
          </div>
          <span v-if="!scope.row.providers?.length" class="secondary-text">-</span>
        </template>
      </el-table-column>
      <el-table-column label="排序" align="center" prop="sortOrder" width="80" />
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="更新时间" width="170">
        <template #default="scope">{{ scope.row.updateTime ? parseTime(scope.row.updateTime) : parseTime(scope.row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160" align="center">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['payment:plan:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['payment:plan:remove']">删除</el-button>
        </template>
      </el-table-column>
      <template #empty><el-empty description="暂无支付套餐，可以先新建一个套餐" /></template>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <el-dialog :title="title" v-model="open" width="760px" append-to-body>
      <el-form ref="planRef" :model="form" :rules="rules" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="站点" prop="site">
              <el-select v-model="form.site" placeholder="请选择站点" style="width: 100%">
                <el-option v-for="site in siteOptions" :key="site.code" :label="site.label" :value="site.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="套餐名称" prop="planName">
              <el-input v-model="form.planName" placeholder="请输入套餐名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="套餐描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入套餐描述" />
        </el-form-item>
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

        <el-divider content-position="left">Stripe 渠道配置</el-divider>
        <el-alert class="provider-tip" type="info" :closable="false" show-icon>
          <template #default>当前后台仅开放 Stripe。填写 <code>prod_...</code> 商品ID，结账时自动校验该商品的默认价格；后续恢复其他渠道时会在这里扩展。</template>
        </el-alert>
        <el-table :data="form.providers" border>
          <el-table-column label="配置ID" width="150">
            <template #default="scope"><PaymentIdentifier :value="scope.row.planProviderId" /></template>
          </el-table-column>
          <el-table-column label="支付渠道" width="160">
            <template #default="scope">
              <el-tag :type="providerTagType(scope.row.paymentProvider)" effect="plain">{{ providerLabel(scope.row.paymentProvider) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="商品ID">
            <template #default="scope">
              <el-input
                v-model="scope.row.providerProductId"
                placeholder="Stripe Product ID（prod_...，必填）"
              />
            </template>
          </el-table-column>
          <el-table-column label="价格/变体ID">
            <template #default="scope">
              <el-input
                v-model="scope.row.providerPriceId"
                disabled
                placeholder="自动使用商品默认价格"
              />
            </template>
          </el-table-column>
          <el-table-column label="状态" width="120">
            <template #default="scope">
              <el-select v-model="scope.row.status">
                <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </template>
          </el-table-column>
        </el-table>
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
import { listCustomerSiteOptions } from '@/api/system/customerSite'
import type { CustomerSiteOption } from '@/api/system/customerSite'
import { billingTypeLabel, intervalLabel, providerLabel, providerTagType } from '../common'
import PaymentIdentifier from '../components/PaymentIdentifier.vue'

const { proxy } = getCurrentInstance()
const { sys_normal_disable } = proxy.useDict('sys_normal_disable')

const planList = ref<PaymentPlan[]>([])
const siteOptions = ref<CustomerSiteOption[]>([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref<string[]>([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')

const data = reactive({
  form: {} as PaymentPlan,
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    site: undefined,
    planName: undefined,
    billingType: undefined,
    status: undefined
  } as PaymentPlanQuery,
  rules: {
    site: [{ required: true, message: '站点不能为空', trigger: 'change' }],
    planName: [{ required: true, message: '套餐名称不能为空', trigger: 'blur' }],
    description: [{ required: true, message: '套餐描述不能为空', trigger: 'blur' }],
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
    site: undefined,
    planName: undefined,
    description: undefined,
    billingType: 'one_time',
    priceCent: 1000,
    currency: 'USD',
    creditAmount: 100,
    intervalUnit: undefined,
    intervalCount: undefined,
    sortOrder: 0,
    status: '0',
    providers: [buildStripeProvider()]
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
    form.value.providers = normalizeStripeProviders(form.value.providers)
    open.value = true
    title.value = '修改支付套餐'
  })
}

function buildStripeProvider() {
  return { paymentProvider: 'stripe', providerProductId: '', providerPriceId: undefined, status: '0' }
}

function normalizeStripeProviders(providers?: any[]) {
  const stripeProvider = providers?.find(item => item.paymentProvider === 'stripe')
  return [{ ...buildStripeProvider(), ...(stripeProvider || {}) }]
}

function submitForm() {
  proxy.$refs['planRef'].validate((valid: boolean) => {
    if (!valid) return
    form.value.providers = normalizeStripeProviders(form.value.providers)
    const stripeProvider = form.value.providers[0]
    if (!stripeProvider.providerProductId?.startsWith('prod_')) {
      proxy.$modal.msgError('Stripe渠道必须填写prod_开头的商品ID')
      return
    }
    form.value.providers?.forEach(item => {
      item.paymentProvider = 'stripe'
      item.providerPriceId = undefined
    })
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
  proxy.$modal.confirm('是否确认删除支付套餐编号为"' + planIds + '"的数据项？对应支付渠道配置也会同步删除。').then(() => {
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

function siteLabel(site?: string) {
  return siteOptions.value.find((item: CustomerSiteOption) => item.code === site)?.label || site || '-'
}

function loadEnums() {
  listCustomerSiteOptions().then(res => {
    siteOptions.value = res.data || []
  }).catch(() => {})
}

loadEnums()
getList()
</script>

<style scoped>
.payment-page { background: var(--el-fill-color-lighter); min-height: calc(100vh - 84px); }
.page-heading { margin-bottom: 18px; }
.page-heading h2 { margin: 0 0 6px; color: var(--el-text-color-primary); font-size: 22px; }
.page-heading p { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; }
.filter-card { margin-bottom: 16px; }
.filter-card :deep(.el-card__body) { padding-bottom: 2px; }
.filter-card :deep(.el-form-item) { margin-bottom: 16px; }
.table-card :deep(.el-card__body) { padding: 0 18px 18px; }
.table-toolbar { display: flex; align-items: center; min-height: 58px; margin: 0; }
.toolbar-spacer { flex: 1; }
.secondary-text { color: var(--el-text-color-secondary); font-size: 12px; }
.provider-tip { margin-bottom: 14px; }
.provider-id-line { display: grid; grid-template-columns: 82px minmax(0, 1fr); gap: 6px; align-items: start; margin: 2px 0; text-align: left; }
.mr4 {
  margin-right: 4px;
}
.mt12 {
  margin-top: 12px;
}
.desc-cell {
  white-space: pre-line;
  text-align: left;
  line-height: 1.5;
}
</style>
