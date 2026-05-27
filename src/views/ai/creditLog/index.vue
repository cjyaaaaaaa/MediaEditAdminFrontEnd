<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="用户名称" prop="userName">
        <el-input v-model="queryParams.userName" placeholder="请输入用户名称" clearable style="width: 200px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="业务类型" prop="bizType">
        <el-select v-model="queryParams.bizType" placeholder="业务类型" clearable style="width: 200px">
          <el-option label="文生图" value="ai_generate" />
          <el-option label="图生图" value="ai_edit" />
          <el-option label="文生图退还" value="ai_generate_refund" />
          <el-option label="图生图退还" value="ai_edit_refund" />
          <el-option label="管理员调整" value="admin_recharge" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="logList">
      <el-table-column label="流水ID" align="center" prop="logId" width="80" />
      <el-table-column label="用户" align="center" prop="userName" />
      <el-table-column label="模型" align="center" prop="modelName" />
      <el-table-column label="变动积分" align="center" prop="changeAmount" width="100">
        <template #default="scope">
          <span :style="{ color: scope.row.changeAmount >= 0 ? '#67C23A' : '#F56C6C' }">{{ scope.row.changeAmount >= 0 ? '+' : '' }}{{ scope.row.changeAmount }}</span>
        </template>
      </el-table-column>
      <el-table-column label="变动后余额" align="center" prop="balanceAfter" width="110" />
      <el-table-column label="业务类型" align="center" prop="bizType" width="120">
        <template #default="scope">
          <span v-if="scope.row.bizType === 'ai_generate'">文生图</span>
          <span v-else-if="scope.row.bizType === 'ai_edit'">图生图</span>
          <span v-else-if="scope.row.bizType === 'ai_generate_refund'">文生图退还</span>
          <span v-else-if="scope.row.bizType === 'ai_edit_refund'">图生图退还</span>
          <span v-else-if="scope.row.bizType === 'admin_recharge'">管理员调整</span>
          <span v-else>{{ scope.row.bizType }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip />
      <el-table-column label="时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup lang="ts" name="CreditLog">
import { listCreditLog } from '@/api/ai/creditLog'
import type { UserCreditLog, CreditLogQuery } from '@/api/ai/creditLog'

const { proxy } = getCurrentInstance()

const logList = ref<UserCreditLog[]>([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)

const queryParams = ref<CreditLogQuery>({
  pageNum: 1,
  pageSize: 10,
  userName: undefined,
  bizType: undefined
})

function getList() {
  loading.value = true
  listCreditLog(queryParams.value).then(response => {
    logList.value = response.rows
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

getList()
</script>
