<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="订单号" prop="orderNo">
        <el-input v-model="queryParams.orderNo" placeholder="请输入订单号" clearable style="width: 220px" @keyup.enter="handleQuery" />
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
      <el-form-item label="状态" prop="transactionStatus">
        <el-select v-model="queryParams.transactionStatus" placeholder="状态" clearable style="width: 160px">
          <el-option label="待支付" value="created" />
          <el-option label="成功" value="success" />
          <el-option label="失败" value="failed" />
          <el-option label="已退款" value="refunded" />
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

    <el-table v-loading="loading" :data="transactionList">
      <el-table-column label="交易ID" align="center" prop="transactionId" width="90" />
      <el-table-column label="订单号" align="center" prop="orderNo" min-width="180" />
      <el-table-column label="渠道" align="center" prop="paymentProvider" width="140" />
      <el-table-column label="模式" align="center" prop="paymentMode" width="140" />
      <el-table-column label="平台订单" align="center" prop="providerOrderId" min-width="160" show-overflow-tooltip />
      <el-table-column label="订阅ID" align="center" prop="providerSubscriptionId" min-width="180" show-overflow-tooltip />
      <el-table-column label="发票ID" align="center" prop="providerInvoiceId" min-width="160" show-overflow-tooltip />
      <el-table-column label="状态" align="center" prop="transactionStatus" width="100" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">{{ parseTime(scope.row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="100">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['payment:transaction:query']">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog title="支付交易详情" v-model="open" width="760px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单号">{{ detail.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detail.transactionStatus }}</el-descriptions-item>
        <el-descriptions-item label="渠道">{{ detail.paymentProvider }}</el-descriptions-item>
        <el-descriptions-item label="模式">{{ detail.paymentMode }}</el-descriptions-item>
        <el-descriptions-item label="Checkout ID">{{ detail.providerCheckoutId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="平台订单">{{ detail.providerOrderId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="订阅ID">{{ detail.providerSubscriptionId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发票ID">{{ detail.providerInvoiceId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="结账链接" :span="2">
          <el-link v-if="detail.checkoutUrl" :href="detail.checkoutUrl" target="_blank" type="primary">打开</el-link>
          <span v-else>-</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="PaymentTransaction">
import { listPaymentTransaction, getPaymentTransaction } from '@/api/payment/transaction'
import type { PaymentTransaction, PaymentTransactionQuery } from '@/api/payment/transaction'

const { proxy } = getCurrentInstance()
const transactionList = ref<PaymentTransaction[]>([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const open = ref(false)
const detail = ref<PaymentTransaction>({})

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    orderNo: undefined,
    paymentProvider: undefined,
    providerSubscriptionId: undefined,
    transactionStatus: undefined
  } as PaymentTransactionQuery
})
const { queryParams } = toRefs(data)

function getList() {
  loading.value = true
  listPaymentTransaction(queryParams.value).then(response => {
    transactionList.value = response.rows
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

function handleDetail(row: PaymentTransaction) {
  getPaymentTransaction(row.transactionId!).then(response => {
    detail.value = response.data || {}
    open.value = true
  })
}

getList()
</script>
