<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="订单号" prop="orderNo">
        <el-input v-model="queryParams.orderNo" placeholder="请输入订单号" clearable style="width: 220px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="用户" prop="userName">
        <el-input v-model="queryParams.userName" placeholder="请输入用户名称" clearable style="width: 180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="支付模式" prop="payMode">
        <el-select v-model="queryParams.payMode" placeholder="支付模式" clearable style="width: 180px">
          <el-option label="微信支付" value="wx_jsapi" />
          <el-option label="扫码支付" value="wx_native" />
          <el-option label="道具直购" value="short_series_goods" />
          <el-option label="代币充值" value="short_series_coin" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="orderStatus">
        <el-select v-model="queryParams.orderStatus" placeholder="状态" clearable style="width: 140px">
          <el-option label="待支付" value="created" />
          <el-option label="已到账" value="success" />
          <el-option label="失败" value="failed" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="orderList">
      <el-table-column label="订单ID" align="center" prop="orderId" width="90" />
      <el-table-column label="订单号" align="center" prop="orderNo" min-width="190" show-overflow-tooltip />
      <el-table-column label="用户" align="center" prop="userName" width="130" show-overflow-tooltip />
      <el-table-column label="套餐" align="center" prop="packageName" width="120">
        <template #default="scope">
          <span>{{ scope.row.packageName || '自定义充值' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="支付模式" align="center" prop="payMode" width="110">
        <template #default="scope">
          <span>{{ formatMode(scope.row.payMode) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="金额" align="center" prop="amountCent" width="100">
        <template #default="scope">
          <span>{{ formatCent(scope.row.amountCent) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="到账积分" align="center" prop="creditAmount" width="100" />
      <el-table-column label="状态" align="center" prop="orderStatus" width="100">
        <template #default="scope">
          <el-tag :type="statusType(scope.row.orderStatus)">{{ formatStatus(scope.row.orderStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="微信订单号" align="center" prop="wxOrderId" min-width="150" show-overflow-tooltip />
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="90" align="center" fixed="right">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['ai:rechargeOrder:query']">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog title="充值订单详情" v-model="detailOpen" width="760px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单号">{{ detail.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ formatStatus(detail.orderStatus) }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ detail.userName }}（{{ detail.userId }}）</el-descriptions-item>
        <el-descriptions-item label="openid">{{ detail.openid }}</el-descriptions-item>
        <el-descriptions-item label="套餐">{{ detail.packageName || '自定义充值' }}</el-descriptions-item>
        <el-descriptions-item label="道具ID">{{ detail.productId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="支付模式">{{ formatMode(detail.payMode) }}</el-descriptions-item>
        <el-descriptions-item label="购买数量">{{ detail.buyQuantity }}</el-descriptions-item>
        <el-descriptions-item label="金额">{{ formatCent(detail.amountCent) }}</el-descriptions-item>
        <el-descriptions-item label="到账积分">{{ detail.creditAmount }}</el-descriptions-item>
        <el-descriptions-item label="微信订单号">{{ detail.wxOrderId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="微信流水号">{{ detail.wxTransactionId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ parseTime(detail.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="到账时间">{{ parseTime(detail.deliverTime) || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-divider />
      <el-form label-width="90px">
        <el-form-item label="signData">
          <el-input v-model="detail.signData" type="textarea" :rows="3" readonly />
        </el-form-item>
        <el-form-item label="回调原文">
          <el-input v-model="detail.notifyBody" type="textarea" :rows="4" readonly />
        </el-form-item>
        <el-form-item label="查单原文">
          <el-input v-model="detail.queryBody" type="textarea" :rows="4" readonly />
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="RechargeOrder">
import { listRechargeOrder, getRechargeOrder } from '@/api/ai/rechargeOrder'
import type { CreditRechargeOrder, RechargeOrderQuery } from '@/api/ai/rechargeOrder'

const { proxy } = getCurrentInstance()

const orderList = ref<CreditRechargeOrder[]>([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const detailOpen = ref(false)
const detail = ref<CreditRechargeOrder>({})

const queryParams = ref<RechargeOrderQuery>({
  pageNum: 1,
  pageSize: 10,
  orderNo: undefined,
  userName: undefined,
  payMode: undefined,
  orderStatus: undefined
})

function getList() {
  loading.value = true
  listRechargeOrder(queryParams.value).then(response => {
    orderList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

function formatCent(value?: number) {
  const amount = Number(value || 0)
  return '¥' + (amount / 100).toFixed(2)
}

function formatMode(mode?: string) {
  if (mode === 'wx_jsapi') return '微信支付'
  if (mode === 'wx_native') return '扫码支付'
  if (mode === 'short_series_goods') return '道具直购'
  if (mode === 'short_series_coin') return '代币充值'
  return mode || '-'
}

function formatStatus(status?: string) {
  if (status === 'created') return '待支付'
  if (status === 'success') return '已到账'
  if (status === 'failed') return '失败'
  return status || '-'
}

function statusType(status?: string) {
  if (status === 'success') return 'success'
  if (status === 'failed') return 'danger'
  return 'warning'
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm('queryRef')
  handleQuery()
}

function handleDetail(row: CreditRechargeOrder) {
  getRechargeOrder(row.orderId!).then(response => {
    detail.value = response.data || {}
    detailOpen.value = true
  })
}

getList()
</script>
