<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="订单号" prop="orderNo">
        <el-input v-model="queryParams.orderNo" placeholder="请输入订单号" clearable style="width: 220px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="用户ID" prop="userId">
        <el-input-number v-model="queryParams.userId" :min="1" controls-position="right" placeholder="用户ID" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item label="计费类型" prop="billingType">
        <el-select v-model="queryParams.billingType" placeholder="计费类型" clearable style="width: 160px">
          <el-option label="一次性" value="one_time" />
          <el-option label="订阅" value="subscription" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="orderStatus">
        <el-select v-model="queryParams.orderStatus" placeholder="状态" clearable style="width: 160px">
          <el-option label="待支付" value="created" />
          <el-option label="成功" value="success" />
          <el-option label="失败" value="failed" />
          <el-option label="关闭" value="closed" />
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

    <el-table v-loading="loading" :data="orderList">
      <el-table-column label="订单ID" align="center" prop="orderId" width="90" />
      <el-table-column label="订单号" align="center" prop="orderNo" min-width="180" />
      <el-table-column label="用户" align="center" min-width="140">
        <template #default="scope">{{ scope.row.userName || scope.row.userId }}</template>
      </el-table-column>
      <el-table-column label="套餐" align="center" prop="planName" min-width="140" />
      <el-table-column label="计费类型" align="center" width="100">
        <template #default="scope">{{ scope.row.billingType === 'subscription' ? '订阅' : '一次性' }}</template>
      </el-table-column>
      <el-table-column label="金额" align="center" width="120">
        <template #default="scope">{{ formatMoney(scope.row.amountCent, scope.row.currency) }}</template>
      </el-table-column>
      <el-table-column label="积分" align="center" prop="creditAmount" width="100" />
      <el-table-column label="状态" align="center" prop="orderStatus" width="100" />
      <el-table-column label="支付时间" align="center" prop="payTime" width="180">
        <template #default="scope">{{ parseTime(scope.row.payTime) }}</template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">{{ parseTime(scope.row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="100">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['payment:order:query']">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog title="支付订单详情" v-model="open" width="680px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单号">{{ detail.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detail.orderStatus }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ detail.userName || detail.userId }}</el-descriptions-item>
        <el-descriptions-item label="套餐">{{ detail.planName }}</el-descriptions-item>
        <el-descriptions-item label="计费类型">{{ detail.billingType }}</el-descriptions-item>
        <el-descriptions-item label="订阅ID">{{ detail.subscriptionId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="金额">{{ formatMoney(detail.amountCent, detail.currency) }}</el-descriptions-item>
        <el-descriptions-item label="积分">{{ detail.creditAmount }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ parseTime(detail.payTime) }}</el-descriptions-item>
        <el-descriptions-item label="到账时间">{{ parseTime(detail.deliverTime) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="PaymentOrder">
import { listPaymentOrder, getPaymentOrder } from '@/api/payment/order'
import type { PaymentOrder, PaymentOrderQuery } from '@/api/payment/order'

const { proxy } = getCurrentInstance()
const orderList = ref<PaymentOrder[]>([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const open = ref(false)
const detail = ref<PaymentOrder>({})

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    orderNo: undefined,
    userId: undefined,
    billingType: undefined,
    orderStatus: undefined
  } as PaymentOrderQuery
})
const { queryParams } = toRefs(data)

function getList() {
  loading.value = true
  listPaymentOrder(queryParams.value).then(response => {
    orderList.value = response.rows
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

function handleDetail(row: PaymentOrder) {
  getPaymentOrder(row.orderId!).then(response => {
    detail.value = response.data || {}
    open.value = true
  })
}

function formatMoney(priceCent?: number, currency?: string) {
  return `${currency || 'USD'} ${(Number(priceCent || 0) / 100).toFixed(2)}`
}

getList()
</script>
