<template>
  <div class="app-container payment-page">
    <div class="page-heading">
      <div>
        <h2>支付订单</h2>
        <p>查看每次购买和订阅账期的业务结果，支付成功与积分发放以订单为准。</p>
      </div>
    </div>

    <el-card v-show="showSearch" class="filter-card" shadow="never">
      <el-form ref="queryRef" :model="queryParams" :inline="true" label-position="top">
        <el-form-item label="所属站点" prop="site">
          <el-select v-model="queryParams.site" clearable filterable placeholder="全部站点" style="width: 190px">
            <el-option v-for="site in siteOptions" :key="site.code" :label="site.label" :value="site.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单号" prop="orderNo">
          <el-input v-model="queryParams.orderNo" placeholder="输入完整订单号" clearable style="width: 240px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="用户ID" prop="userId">
          <el-input v-model="queryParams.userId" placeholder="输入用户ID" clearable style="width: 180px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="支付渠道" prop="paymentProvider">
          <el-select v-model="queryParams.paymentProvider" placeholder="全部渠道" clearable style="width: 150px">
            <el-option v-for="provider in paymentProviderOptions" :key="provider.value" :label="provider.label" :value="provider.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="计费类型" prop="billingType">
          <el-select v-model="queryParams.billingType" placeholder="全部类型" clearable style="width: 150px">
            <el-option label="一次性" value="one_time" />
            <el-option label="订阅" value="subscription" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单状态" prop="orderStatus">
          <el-select v-model="queryParams.orderStatus" placeholder="全部状态" clearable style="width: 150px">
            <el-option label="待支付" value="created" />
            <el-option label="支付成功" value="success" />
            <el-option label="支付失败" value="failed" />
            <el-option label="已关闭" value="closed" />
            <el-option label="已退款" value="refunded" />
          </el-select>
        </el-form-item>
        <el-form-item class="filter-actions">
          <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <div class="table-toolbar">
        <div class="table-summary">共 {{ total }} 笔订单</div>
        <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
      </div>
      <el-table v-loading="loading" :data="orderList" row-key="orderId">
        <el-table-column label="订单ID" width="150" fixed="left">
          <template #default="scope"><PaymentIdentifier :value="scope.row.orderId" /></template>
        </el-table-column>
        <el-table-column label="订单号" min-width="230" fixed="left">
          <template #default="scope">
            <PaymentIdentifier :value="scope.row.orderNo" />
            <div class="secondary-text">{{ siteLabel(scope.row.site) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="支付渠道" min-width="130">
          <template #default="scope">
            <el-tag v-if="scope.row.paymentProvider" :type="providerTagType(scope.row.paymentProvider)" effect="plain">{{ providerLabel(scope.row.paymentProvider) }}</el-tag>
            <span v-else class="secondary-text">-</span>
            <div class="secondary-text mode-text">{{ paymentModeLabel(scope.row.paymentMode) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="用户" min-width="210">
          <template #default="scope">
            <div class="primary-text">{{ scope.row.userName || '未设置用户名' }}</div>
            <div class="secondary-text">ID {{ scope.row.userId }}</div>
            <div class="secondary-text">{{ scope.row.userEmail || '未设置邮箱' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="套餐" min-width="160">
          <template #default="scope">
            <div class="primary-text">{{ scope.row.planName }}</div>
            <div class="secondary-text">套餐ID {{ scope.row.planId || '-' }}</div>
            <el-tag size="small" effect="light" :type="billingTypeTagType(scope.row.billingType)">{{ billingTypeLabel(scope.row.billingType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="订单金额" width="130">
          <template #default="scope"><span class="money-text">{{ formatMoney(scope.row.amountCent, scope.row.currency) }}</span></template>
        </el-table-column>
        <el-table-column label="到账积分" width="110">
          <template #default="scope">{{ Number(scope.row.creditAmount || 0).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="关联订阅ID" min-width="150">
          <template #default="scope"><PaymentIdentifier :value="scope.row.subscriptionId" /></template>
        </el-table-column>
        <el-table-column label="平台订阅ID" min-width="220">
          <template #default="scope"><PaymentIdentifier :value="scope.row.providerSubscriptionId" /></template>
        </el-table-column>
        <el-table-column label="平台客户" min-width="170">
          <template #default="scope"><PaymentIdentifier :value="scope.row.providerCustomerId" /></template>
        </el-table-column>
        <el-table-column label="订单状态" width="120">
          <template #default="scope">
            <el-tag :type="orderStatus(scope.row.orderStatus).type" effect="light">{{ orderStatus(scope.row.orderStatus).label }}</el-tag>
            <div v-if="scope.row.transactionStatus" class="secondary-text mode-text">{{ transactionStatus(scope.row.transactionStatus).label }}</div>
          </template>
        </el-table-column>
        <el-table-column label="支付时间" width="170">
          <template #default="scope">{{ scope.row.payTime ? parseTime(scope.row.payTime) : '-' }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="scope">{{ parseTime(scope.row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="90" fixed="right">
          <template #default="scope">
            <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['payment:order:query']">详情</el-button>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无符合条件的支付订单" /></template>
      </el-table>
      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <el-dialog title="支付订单详情" v-model="open" width="760px" append-to-body>
      <div class="detail-hero">
        <div>
          <div class="detail-caption">业务订单号</div>
          <PaymentIdentifier :value="detail.orderNo" />
        </div>
        <el-tag :type="orderStatus(detail.orderStatus).type" effect="light" size="large">{{ orderStatus(detail.orderStatus).label }}</el-tag>
      </div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="所属站点">{{ siteLabel(detail.site) }}</el-descriptions-item>
        <el-descriptions-item label="订单ID"><PaymentIdentifier :value="detail.orderId" /></el-descriptions-item>
        <el-descriptions-item label="最近交易ID"><PaymentIdentifier :value="detail.latestTransactionId" /></el-descriptions-item>
        <el-descriptions-item label="支付渠道">
          <el-tag v-if="detail.paymentProvider" :type="providerTagType(detail.paymentProvider)" effect="plain">{{ providerLabel(detail.paymentProvider) }}</el-tag>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="支付场景">{{ paymentModeLabel(detail.paymentMode) }}</el-descriptions-item>
        <el-descriptions-item label="交易状态">
          <el-tag v-if="detail.transactionStatus" :type="transactionStatus(detail.transactionStatus).type" effect="light">{{ transactionStatus(detail.transactionStatus).label }}</el-tag>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="用户">{{ detail.userName || '-' }}（{{ detail.userId }}）</el-descriptions-item>
        <el-descriptions-item label="用户邮箱">{{ detail.userEmail || '未设置邮箱' }}</el-descriptions-item>
        <el-descriptions-item label="套餐">
          {{ detail.planName }}
          <el-tag class="billing-type-tag" size="small" effect="light" :type="billingTypeTagType(detail.billingType)">{{ billingTypeLabel(detail.billingType) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="套餐ID"><PaymentIdentifier :value="detail.planId" /></el-descriptions-item>
        <el-descriptions-item label="订阅ID"><PaymentIdentifier :value="detail.subscriptionId" /></el-descriptions-item>
        <el-descriptions-item label="订单金额"><b>{{ formatMoney(detail.amountCent, detail.currency) }}</b></el-descriptions-item>
        <el-descriptions-item label="到账积分">{{ Number(detail.creditAmount || 0).toLocaleString() }}</el-descriptions-item>
        <el-descriptions-item label="Checkout ID"><PaymentIdentifier :value="detail.providerCheckoutId" /></el-descriptions-item>
        <el-descriptions-item label="支付对象ID"><PaymentIdentifier :value="detail.providerOrderId" /></el-descriptions-item>
        <el-descriptions-item label="Customer ID"><PaymentIdentifier :value="detail.providerCustomerId" /></el-descriptions-item>
        <el-descriptions-item label="Subscription ID"><PaymentIdentifier :value="detail.providerSubscriptionId" /></el-descriptions-item>
        <el-descriptions-item label="Event ID"><PaymentIdentifier :value="detail.providerEventId" /></el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ parseTime(detail.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ detail.updateTime ? parseTime(detail.updateTime) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ detail.payTime ? parseTime(detail.payTime) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="权益发放时间">{{ detail.deliverTime ? parseTime(detail.deliverTime) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer><el-button @click="open = false">关闭</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="PaymentOrder">
import { listPaymentOrder, getPaymentOrder } from '@/api/payment/order'
import type { PaymentOrder, PaymentOrderQuery } from '@/api/payment/order'
import { listCustomerSiteOptions } from '@/api/system/customerSite'
import type { CustomerSiteOption } from '@/api/system/customerSite'
import PaymentIdentifier from '../components/PaymentIdentifier.vue'
import { billingTypeLabel, billingTypeTagType, formatMoney, orderStatus, paymentModeLabel, paymentProviderOptions, providerLabel, providerTagType, transactionStatus } from '../common'

const { proxy } = getCurrentInstance() as any
const orderList = ref<PaymentOrder[]>([])
const siteOptions = ref<CustomerSiteOption[]>([])
const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const open = ref(false)
const detail = ref<PaymentOrder>({})
const queryParams = reactive<PaymentOrderQuery>({ pageNum: 1, pageSize: 10 })

async function getList() {
  loading.value = true
  try {
    const response = await listPaymentOrder(queryParams)
    orderList.value = response.rows
    total.value = response.total
  } finally {
    loading.value = false
  }
}

function handleQuery() { queryParams.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); queryParams.pageNum = 1; getList() }
function siteLabel(site?: string) { return siteOptions.value.find(item => item.code === site)?.label || site || '默认站点域' }

async function handleDetail(row: PaymentOrder) {
  const response = await getPaymentOrder(row.orderId!)
  detail.value = response.data || {}
  open.value = true
}

listCustomerSiteOptions().then(response => { siteOptions.value = response.data || [] })
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
.filter-actions { padding-top: 30px; }
.table-card :deep(.el-card__body) { padding: 0 18px 18px; }
.table-toolbar { display: flex; align-items: center; justify-content: space-between; min-height: 58px; }
.table-summary, .secondary-text { color: var(--el-text-color-secondary); font-size: 12px; }
.mode-text { margin-top: 5px; }
.primary-text { margin-bottom: 4px; color: var(--el-text-color-primary); font-weight: 600; }
.money-text { color: var(--el-text-color-primary); font-weight: 600; }
.billing-type-tag { margin-left: 6px; }
.detail-hero { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding: 16px; border: 1px solid var(--el-border-color-lighter); border-radius: 8px; background: var(--el-fill-color-light); }
.detail-caption { margin-bottom: 6px; color: var(--el-text-color-secondary); font-size: 12px; }
</style>
