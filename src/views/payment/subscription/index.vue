<template>
  <div class="app-container payment-page">
    <div class="page-heading">
      <div>
        <h2>用户订阅</h2>
        <p>查看用户当前订阅状态、账期和每期权益；Stripe 订阅变更由 Webhook 同步。</p>
      </div>
    </div>

    <el-card v-show="showSearch" class="filter-card" shadow="never">
      <el-form ref="queryRef" :model="queryParams" :inline="true" label-position="top">
        <el-form-item label="所属站点" prop="site">
          <el-select v-model="queryParams.site" clearable filterable placeholder="全部站点" style="width: 190px">
            <el-option v-for="site in siteOptions" :key="site.code" :label="site.label" :value="site.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="用户ID" prop="userId">
          <el-input v-model="queryParams.userId" placeholder="输入用户ID" clearable style="width: 170px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="用户名" prop="userName">
          <el-input v-model="queryParams.userName" placeholder="搜索用户名" clearable style="width: 180px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="支付渠道" prop="paymentProvider">
          <el-select v-model="queryParams.paymentProvider" placeholder="全部渠道" clearable style="width: 170px">
            <el-option v-for="item in paymentProviderOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="平台订阅ID" prop="providerSubscriptionId">
          <el-input v-model="queryParams.providerSubscriptionId" placeholder="例如 sub_..." clearable style="width: 220px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="订阅状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 150px">
            <el-option label="生效中" value="active" />
            <el-option label="试用中" value="on_trial" />
            <el-option label="付款逾期" value="past_due" />
            <el-option label="已取消" value="cancelled" />
            <el-option label="已过期" value="expired" />
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
        <div class="table-summary">共 {{ total }} 条订阅记录</div>
        <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
      </div>
      <el-table v-loading="loading" :data="subscriptionList" row-key="subscriptionId">
        <el-table-column label="订阅ID" width="150" fixed="left">
          <template #default="scope"><PaymentIdentifier :value="scope.row.subscriptionId" /></template>
        </el-table-column>
        <el-table-column label="用户" min-width="170" fixed="left">
          <template #default="scope">
            <div class="primary-text">{{ scope.row.userName || '未设置用户名' }}</div>
            <div class="secondary-text">ID {{ scope.row.userId }} · {{ siteLabel(scope.row.site) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="订阅套餐" min-width="160">
          <template #default="scope">
            <div class="primary-text">{{ scope.row.planName }}</div>
            <div class="secondary-text">套餐ID {{ scope.row.planId || '-' }} · 每期 {{ Number(scope.row.creditAmountPerPeriod || 0).toLocaleString() }} 积分</div>
          </template>
        </el-table-column>
        <el-table-column label="渠道" width="130">
          <template #default="scope"><el-tag :type="providerTagType(scope.row.paymentProvider)" effect="plain">{{ providerLabel(scope.row.paymentProvider) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="平台订阅ID" min-width="200">
          <template #default="scope"><PaymentIdentifier :value="scope.row.providerSubscriptionId" /></template>
        </el-table-column>
        <el-table-column label="平台客户ID" min-width="170">
          <template #default="scope"><PaymentIdentifier :value="scope.row.providerCustomerId" /></template>
        </el-table-column>
        <el-table-column label="订阅状态" width="120">
          <template #default="scope"><el-tag :type="subscriptionStatus(scope.row.status).type" effect="light">{{ subscriptionStatus(scope.row.status).label }}</el-tag></template>
        </el-table-column>
        <el-table-column label="当前账期" min-width="220">
          <template #default="scope">
            <div>{{ scope.row.currentPeriodStart ? parseTime(scope.row.currentPeriodStart, '{y}-{m}-{d}') : '-' }}</div>
            <div class="secondary-text">至 {{ scope.row.currentPeriodEnd ? parseTime(scope.row.currentPeriodEnd, '{y}-{m}-{d}') : '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="取消 / 到期" min-width="170">
          <template #default="scope">
            <span v-if="scope.row.cancelledAt">{{ parseTime(scope.row.cancelledAt) }}</span>
            <span v-else-if="scope.row.expiredAt">{{ parseTime(scope.row.expiredAt) }}</span>
            <span v-else class="secondary-text">-</span>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="170">
          <template #default="scope">{{ scope.row.updateTime ? parseTime(scope.row.updateTime) : '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="90" fixed="right">
          <template #default="scope">
            <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['payment:subscription:query']">详情</el-button>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无符合条件的订阅记录" /></template>
      </el-table>
      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <el-dialog title="用户订阅详情" v-model="open" width="800px" append-to-body>
      <div class="detail-hero">
        <div>
          <div class="detail-caption">{{ detail.userName || '未设置用户名' }} · 用户ID {{ detail.userId }}</div>
          <div class="detail-title">{{ detail.planName || '-' }}</div>
        </div>
        <el-tag :type="subscriptionStatus(detail.status).type" effect="light" size="large">{{ subscriptionStatus(detail.status).label }}</el-tag>
      </div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="所属站点">{{ siteLabel(detail.site) }}</el-descriptions-item>
        <el-descriptions-item label="本地订阅ID"><PaymentIdentifier :value="detail.subscriptionId" /></el-descriptions-item>
        <el-descriptions-item label="支付渠道"><el-tag :type="providerTagType(detail.paymentProvider)" effect="plain">{{ providerLabel(detail.paymentProvider) }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="套餐ID"><PaymentIdentifier :value="detail.planId" /></el-descriptions-item>
        <el-descriptions-item label="每期积分">{{ Number(detail.creditAmountPerPeriod || 0).toLocaleString() }}</el-descriptions-item>
        <el-descriptions-item label="平台订阅ID"><PaymentIdentifier :value="detail.providerSubscriptionId" /></el-descriptions-item>
        <el-descriptions-item label="平台客户ID"><PaymentIdentifier :value="detail.providerCustomerId" /></el-descriptions-item>
        <el-descriptions-item label="账期开始">{{ detail.currentPeriodStart ? parseTime(detail.currentPeriodStart) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="账期结束">{{ detail.currentPeriodEnd ? parseTime(detail.currentPeriodEnd) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="取消时间">{{ detail.cancelledAt ? parseTime(detail.cancelledAt) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="过期时间">{{ detail.expiredAt ? parseTime(detail.expiredAt) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ parseTime(detail.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ parseTime(detail.updateTime) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-alert v-if="detail.status === 'past_due'" class="detail-alert" type="warning" :closable="false" show-icon title="该订阅付款逾期，Stripe 可能仍在重试扣款。" />
      <template #footer><el-button @click="open = false">关闭</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="UserSubscription">
import { listUserSubscription, getUserSubscription } from '@/api/payment/subscription'
import type { UserSubscription, UserSubscriptionQuery } from '@/api/payment/subscription'
import { listCustomerSiteOptions } from '@/api/system/customerSite'
import type { CustomerSiteOption } from '@/api/system/customerSite'
import PaymentIdentifier from '../components/PaymentIdentifier.vue'
import { paymentProviderOptions, providerLabel, providerTagType, subscriptionStatus } from '../common'

const { proxy } = getCurrentInstance() as any
const subscriptionList = ref<UserSubscription[]>([])
const siteOptions = ref<CustomerSiteOption[]>([])
const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const open = ref(false)
const detail = ref<UserSubscription>({})
const queryParams = reactive<UserSubscriptionQuery>({ pageNum: 1, pageSize: 10 })

async function getList() {
  loading.value = true
  try {
    const response = await listUserSubscription(queryParams)
    subscriptionList.value = response.rows
    total.value = response.total
  } finally {
    loading.value = false
  }
}

function handleQuery() { queryParams.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); queryParams.pageNum = 1; getList() }
function siteLabel(site?: string) { return siteOptions.value.find(item => item.code === site)?.label || site || '默认站点域' }

async function handleDetail(row: UserSubscription) {
  const response = await getUserSubscription(row.subscriptionId!)
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
.primary-text { margin-bottom: 4px; color: var(--el-text-color-primary); font-weight: 600; }
.detail-hero { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding: 16px; border: 1px solid var(--el-border-color-lighter); border-radius: 8px; background: var(--el-fill-color-light); }
.detail-caption { margin-bottom: 6px; color: var(--el-text-color-secondary); font-size: 12px; }
.detail-title { color: var(--el-text-color-primary); font-size: 18px; font-weight: 600; }
.detail-alert { margin-top: 16px; }
</style>
