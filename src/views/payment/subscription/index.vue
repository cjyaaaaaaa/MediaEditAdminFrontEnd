<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="用户ID" prop="userId">
        <el-input-number v-model="queryParams.userId" :min="1" controls-position="right" placeholder="用户ID" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item label="用户名" prop="userName">
        <el-input v-model="queryParams.userName" placeholder="请输入用户名" clearable style="width: 180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="渠道" prop="paymentProvider">
        <el-select v-model="queryParams.paymentProvider" placeholder="支付渠道" clearable style="width: 180px">
          <el-option label="Lemon Squeezy" value="lemon_squeezy" />
          <el-option label="Paddle" value="paddle" />
          <el-option label="Stripe" value="stripe" />
          <el-option label="PayPal" value="paypal" />
          <el-option label="支付宝" value="alipay" />
        </el-select>
      </el-form-item>
      <el-form-item label="订阅ID" prop="providerSubscriptionId">
        <el-input v-model="queryParams.providerSubscriptionId" placeholder="第三方订阅ID" clearable style="width: 220px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="状态" clearable style="width: 160px">
          <el-option label="Active" value="active" />
          <el-option label="On Trial" value="on_trial" />
          <el-option label="Past Due" value="past_due" />
          <el-option label="Cancelled" value="cancelled" />
          <el-option label="Expired" value="expired" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="subscriptionList">
      <el-table-column label="订阅ID" align="center" prop="subscriptionId" width="90" />
      <el-table-column label="用户" align="center" min-width="140">
        <template #default="scope">{{ scope.row.userName || scope.row.userId }}</template>
      </el-table-column>
      <el-table-column label="套餐" align="center" prop="planName" min-width="140" />
      <el-table-column label="渠道" align="center" prop="paymentProvider" width="140" />
      <el-table-column label="平台订阅ID" align="center" prop="providerSubscriptionId" min-width="190" show-overflow-tooltip />
      <el-table-column label="状态" align="center" prop="status" width="110" />
      <el-table-column label="每期积分" align="center" prop="creditAmountPerPeriod" width="110" />
      <el-table-column label="周期结束" align="center" prop="currentPeriodEnd" width="180">
        <template #default="scope">{{ parseTime(scope.row.currentPeriodEnd) }}</template>
      </el-table-column>
      <el-table-column label="取消时间" align="center" prop="cancelledAt" width="180">
        <template #default="scope">{{ parseTime(scope.row.cancelledAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="100">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['payment:subscription:query']">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog title="用户订阅详情" v-model="open" width="720px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订阅ID">{{ detail.subscriptionId }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detail.status }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ detail.userName || detail.userId }}</el-descriptions-item>
        <el-descriptions-item label="套餐">{{ detail.planName }}</el-descriptions-item>
        <el-descriptions-item label="渠道">{{ detail.paymentProvider }}</el-descriptions-item>
        <el-descriptions-item label="平台订阅ID">{{ detail.providerSubscriptionId }}</el-descriptions-item>
        <el-descriptions-item label="平台客户ID">{{ detail.providerCustomerId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="每期积分">{{ detail.creditAmountPerPeriod }}</el-descriptions-item>
        <el-descriptions-item label="周期开始">{{ parseTime(detail.currentPeriodStart) }}</el-descriptions-item>
        <el-descriptions-item label="周期结束">{{ parseTime(detail.currentPeriodEnd) }}</el-descriptions-item>
        <el-descriptions-item label="取消时间">{{ parseTime(detail.cancelledAt) }}</el-descriptions-item>
        <el-descriptions-item label="过期时间">{{ parseTime(detail.expiredAt) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="UserSubscription">
import { listUserSubscription, getUserSubscription } from '@/api/payment/subscription'
import type { UserSubscription, UserSubscriptionQuery } from '@/api/payment/subscription'

const { proxy } = getCurrentInstance()
const subscriptionList = ref<UserSubscription[]>([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const open = ref(false)
const detail = ref<UserSubscription>({})

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    userId: undefined,
    userName: undefined,
    paymentProvider: undefined,
    providerSubscriptionId: undefined,
    status: undefined
  } as UserSubscriptionQuery
})
const { queryParams } = toRefs(data)

function getList() {
  loading.value = true
  listUserSubscription(queryParams.value).then(response => {
    subscriptionList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm('queryRef')
  handleQuery()
}

function handleDetail(row: UserSubscription) {
  getUserSubscription(row.subscriptionId!).then(response => {
    detail.value = response.data || {}
    open.value = true
  })
}

getList()
</script>
