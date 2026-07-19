<template>
  <div class="app-container payment-page">
    <div class="page-heading">
      <div>
        <h2>支付交易</h2>
        <p>追踪订单对应的 Checkout、PaymentIntent、Invoice 和 Subscription 等渠道对象。</p>
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
          <el-input v-model="queryParams.orderNo" placeholder="输入完整订单号" clearable style="width: 230px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="支付渠道" prop="paymentProvider">
          <el-select v-model="queryParams.paymentProvider" placeholder="全部渠道" clearable style="width: 170px">
            <el-option v-for="item in paymentProviderOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="平台订阅ID" prop="providerSubscriptionId">
          <el-input v-model="queryParams.providerSubscriptionId" placeholder="例如 sub_..." clearable style="width: 220px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="交易状态" prop="transactionStatus">
          <el-select v-model="queryParams.transactionStatus" placeholder="全部状态" clearable style="width: 150px">
            <el-option label="待支付" value="created" />
            <el-option label="交易成功" value="success" />
            <el-option label="交易失败" value="failed" />
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
        <div class="table-summary">共 {{ total }} 条渠道交易</div>
        <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
      </div>
      <el-table v-loading="loading" :data="transactionList" row-key="transactionId">
        <el-table-column label="交易ID" width="150" fixed="left">
          <template #default="scope"><PaymentIdentifier :value="scope.row.transactionId" /></template>
        </el-table-column>
        <el-table-column label="业务订单" min-width="230" fixed="left">
          <template #default="scope">
            <PaymentIdentifier :value="scope.row.orderNo" />
            <div class="secondary-text">订单ID {{ scope.row.orderId || '-' }} · {{ siteLabel(scope.row.site) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="渠道 / 场景" min-width="150">
          <template #default="scope">
            <el-tag :type="providerTagType(scope.row.paymentProvider)" effect="plain">{{ providerLabel(scope.row.paymentProvider) }}</el-tag>
            <div class="secondary-text mode-text">{{ paymentModeLabel(scope.row.paymentMode) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="Checkout / 支付对象" min-width="190">
          <template #default="scope"><PaymentIdentifier :value="scope.row.providerCheckoutId || scope.row.providerOrderId" /></template>
        </el-table-column>
        <el-table-column label="平台客户" min-width="170">
          <template #default="scope"><PaymentIdentifier :value="scope.row.providerCustomerId" /></template>
        </el-table-column>
        <el-table-column label="平台订阅" min-width="180">
          <template #default="scope"><PaymentIdentifier :value="scope.row.providerSubscriptionId" /></template>
        </el-table-column>
        <el-table-column label="平台账单" min-width="170">
          <template #default="scope"><PaymentIdentifier :value="scope.row.providerInvoiceId" /></template>
        </el-table-column>
        <el-table-column label="平台事件" min-width="170">
          <template #default="scope"><PaymentIdentifier :value="scope.row.providerEventId" /></template>
        </el-table-column>
        <el-table-column label="交易金额" width="125">
          <template #default="scope"><span class="money-text">{{ formatMoney(scope.row.amountCent, scope.row.currency) }}</span></template>
        </el-table-column>
        <el-table-column label="交易状态" width="120">
          <template #default="scope">
            <el-tag :type="transactionStatus(scope.row.transactionStatus).type" effect="light">{{ transactionStatus(scope.row.transactionStatus).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="scope">{{ parseTime(scope.row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="90" fixed="right">
          <template #default="scope">
            <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['payment:transaction:query']">详情</el-button>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无符合条件的支付交易" /></template>
      </el-table>
      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <el-dialog title="支付交易详情" v-model="open" width="820px" append-to-body>
      <div class="detail-hero">
        <div>
          <div class="detail-caption">业务订单号</div>
          <PaymentIdentifier :value="detail.orderNo" />
        </div>
        <el-tag :type="transactionStatus(detail.transactionStatus).type" effect="light" size="large">{{ transactionStatus(detail.transactionStatus).label }}</el-tag>
      </div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="所属站点">{{ siteLabel(detail.site) }}</el-descriptions-item>
        <el-descriptions-item label="交易ID"><PaymentIdentifier :value="detail.transactionId" /></el-descriptions-item>
        <el-descriptions-item label="本地订单ID"><PaymentIdentifier :value="detail.orderId" /></el-descriptions-item>
        <el-descriptions-item label="支付渠道"><el-tag :type="providerTagType(detail.paymentProvider)" effect="plain">{{ providerLabel(detail.paymentProvider) }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="支付场景">{{ paymentModeLabel(detail.paymentMode) }}</el-descriptions-item>
        <el-descriptions-item label="交易金额"><b>{{ formatMoney(detail.amountCent, detail.currency) }}</b></el-descriptions-item>
        <el-descriptions-item label="渠道配置ID"><PaymentIdentifier :value="detail.planProviderId" /></el-descriptions-item>
        <el-descriptions-item label="Checkout ID"><PaymentIdentifier :value="detail.providerCheckoutId" /></el-descriptions-item>
        <el-descriptions-item label="支付对象ID"><PaymentIdentifier :value="detail.providerOrderId" /></el-descriptions-item>
        <el-descriptions-item label="Customer ID"><PaymentIdentifier :value="detail.providerCustomerId" /></el-descriptions-item>
        <el-descriptions-item label="Subscription ID"><PaymentIdentifier :value="detail.providerSubscriptionId" /></el-descriptions-item>
        <el-descriptions-item label="Invoice ID"><PaymentIdentifier :value="detail.providerInvoiceId" /></el-descriptions-item>
        <el-descriptions-item label="Event ID"><PaymentIdentifier :value="detail.providerEventId" /></el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ parseTime(detail.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ detail.updateTime ? parseTime(detail.updateTime) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="结账链接" :span="2">
          <el-link v-if="detail.checkoutUrl" :href="detail.checkoutUrl" target="_blank" type="primary" icon="TopRight">打开 Stripe 托管结账页</el-link>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="请求摘要" :span="2">
          <pre class="payload-preview">{{ detail.requestBody || '-' }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="回调摘要" :span="2">
          <pre class="payload-preview">{{ detail.notifyBody || '-' }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer><el-button @click="open = false">关闭</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="PaymentTransaction">
import { listPaymentTransaction, getPaymentTransaction } from '@/api/payment/transaction'
import type { PaymentTransaction, PaymentTransactionQuery } from '@/api/payment/transaction'
import { listCustomerSiteOptions } from '@/api/system/customerSite'
import type { CustomerSiteOption } from '@/api/system/customerSite'
import PaymentIdentifier from '../components/PaymentIdentifier.vue'
import { formatMoney, paymentModeLabel, paymentProviderOptions, providerLabel, providerTagType, transactionStatus } from '../common'

const { proxy } = getCurrentInstance() as any
const transactionList = ref<PaymentTransaction[]>([])
const siteOptions = ref<CustomerSiteOption[]>([])
const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const open = ref(false)
const detail = ref<PaymentTransaction>({})
const queryParams = reactive<PaymentTransactionQuery>({ pageNum: 1, pageSize: 10 })

async function getList() {
  loading.value = true
  try {
    const response = await listPaymentTransaction(queryParams)
    transactionList.value = response.rows
    total.value = response.total
  } finally {
    loading.value = false
  }
}

function handleQuery() { queryParams.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); queryParams.pageNum = 1; getList() }
function siteLabel(site?: string) { return siteOptions.value.find(item => item.code === site)?.label || site || '默认站点域' }

async function handleDetail(row: PaymentTransaction) {
  const response = await getPaymentTransaction(row.transactionId!)
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
.money-text { color: var(--el-text-color-primary); font-weight: 600; }
.payload-preview { max-height: 180px; margin: 0; overflow: auto; white-space: pre-wrap; word-break: break-all; color: var(--el-text-color-regular); font-family: var(--el-font-family); font-size: 12px; line-height: 1.5; }
.detail-hero { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding: 16px; border: 1px solid var(--el-border-color-lighter); border-radius: 8px; background: var(--el-fill-color-light); }
.detail-caption { margin-bottom: 6px; color: var(--el-text-color-secondary); font-size: 12px; }
</style>
