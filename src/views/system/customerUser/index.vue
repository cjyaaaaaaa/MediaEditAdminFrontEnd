<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="用户ID" prop="userId">
        <el-input v-model="queryParams.userId" placeholder="用户ID" clearable style="width: 160px" />
      </el-form-item>
      <el-form-item label="账号" prop="userName">
        <el-input v-model="queryParams.userName" placeholder="请输入账号" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="站点" prop="site">
        <el-input v-model="queryParams.site" placeholder="请输入站点" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="queryParams.email" placeholder="请输入邮箱" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="用户状态" clearable style="width: 140px">
          <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
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

    <el-table v-loading="loading" :data="userList">
      <el-table-column label="用户ID" align="center" prop="userId" width="90" />
      <el-table-column label="账号" align="center" prop="userName" min-width="150" show-overflow-tooltip />
      <el-table-column label="站点" align="center" prop="site" min-width="120" show-overflow-tooltip />
      <el-table-column label="邮箱" align="center" prop="email" min-width="180" show-overflow-tooltip />
      <el-table-column label="登录渠道" align="center" min-width="150">
        <template #default="scope">
          <el-tag v-for="identity in scope.row.identities" :key="identity.identityId" class="mr5" type="info">
            {{ providerLabel(identity.provider) }}
          </el-tag>
          <span v-if="!scope.row.identities?.length">-</span>
        </template>
      </el-table-column>
      <el-table-column label="邮箱验证" align="center" width="90">
        <template #default="scope">
          <el-tag :type="scope.row.emailVerified === '1' ? 'success' : 'info'" size="small">
            {{ scope.row.emailVerified === '1' ? '已验证' : '未验证' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="积分" align="center" prop="creditBalance" width="90" />
      <el-table-column label="状态" align="center" width="90">
        <template #default="scope">
          <el-switch v-model="scope.row.status" active-value="0" inactive-value="1"
            @change="handleStatusChange(scope.row)" v-hasPermi="['system:customerUser:edit']" />
        </template>
      </el-table-column>
      <el-table-column label="最后登录" align="center" width="170">
        <template #default="scope">{{ parseTime(scope.row.loginDate) || '-' }}</template>
      </el-table-column>
      <el-table-column label="注册时间" align="center" width="170">
        <template #default="scope">{{ parseTime(scope.row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="220" fixed="right">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['system:customerUser:query']">详情</el-button>
          <el-button link type="primary" icon="Key" @click="handleResetPwd(scope.row)" v-hasPermi="['system:customerUser:resetPwd']">重置密码</el-button>
          <el-button link type="primary" icon="Coin" @click="handleEditCredit(scope.row)" v-hasPermi="['system:customerUser:editCredit']">积分</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:customerUser:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog title="客户用户详情" v-model="detailOpen" width="860px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户ID">{{ detail.userId }}</el-descriptions-item>
        <el-descriptions-item label="账号">{{ detail.userName }}</el-descriptions-item>
        <el-descriptions-item label="站点">{{ detail.site || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detail.status === '0' ? 'success' : 'danger'" size="small">
            {{ detail.status === '0' ? '正常' : '停用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ detail.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱验证">
          <el-tag :type="detail.emailVerified === '1' ? 'success' : 'info'" size="small">
            {{ detail.emailVerified === '1' ? '已验证' : '未验证' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="手机号">{{ detail.phonenumber || '-' }}</el-descriptions-item>
        <el-descriptions-item label="密码登录">
          <el-tag :type="detail.passwordLoginEnabled === '1' ? 'success' : 'info'" size="small">
            {{ detail.passwordLoginEnabled === '1' ? '已启用' : '未启用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="积分余额">{{ detail.creditBalance }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ detail.sex === '0' ? '男' : detail.sex === '1' ? '女' : '未知' }}</el-descriptions-item>
        <el-descriptions-item label="最后登录时间">{{ parseTime(detail.loginDate) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="最后登录IP">{{ detail.loginIp || '-' }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ parseTime(detail.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ detail.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="头像" :span="2">
          <template v-if="detail.avatar">
            <el-image :src="detail.avatar" style="width:48px;height:48px;border-radius:4px" fit="cover" :preview-src-list="[detail.avatar]" preview-teleported>
              <template #error>
                <div style="width:48px;height:48px;border-radius:4px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:12px">无法加载</div>
              </template>
            </el-image>
            <div style="font-size:11px;color:#999;margin-top:2px;word-break:break-all;max-width:400px">{{ detail.avatar }}</div>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="第三方身份" :span="2">
          <div v-for="identity in detail.identities" :key="identity.identityId" style="margin-bottom:4px">
            <el-tag type="info" size="small" class="mr5">{{ providerLabel(identity.provider) }}</el-tag>
            {{ identity.displayName || '-' }}
            <span v-if="identity.email" class="ml5 text-gray">（{{ identity.email }}）</span>
            <span v-if="identity.providerUserId" class="ml5 text-gray">ID: {{ identity.providerUserId }}</span>
          </div>
          <span v-if="!detail.identities?.length">-</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog title="调整积分" v-model="creditOpen" width="440px" append-to-body>
      <el-form ref="creditRef" :model="creditForm" :rules="creditRules" label-width="90px">
        <el-form-item label="用户"><el-input :model-value="creditForm.userName" disabled /></el-form-item>
        <el-form-item label="当前积分"><el-input :model-value="String(creditForm.currentBalance)" disabled /></el-form-item>
        <el-form-item label="调整数量" prop="amount">
          <el-input-number v-model="creditForm.amount" controls-position="right" :step="1" />
          <div class="form-tip">正数增加，负数扣减</div>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="creditForm.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitCredit">确定</el-button>
        <el-button @click="creditOpen = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="CustomerUser">
import {
  changeCustomerUserStatus, deleteCustomerUser, editCustomerUserCredit, getCustomerUser, listCustomerUser,
  resetCustomerUserPassword, type CustomerUser, type CustomerUserQuery
} from '@/api/system/customerUser'

const { proxy } = getCurrentInstance()
const { sys_normal_disable } = proxy.useDict('sys_normal_disable')
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const userList = ref<CustomerUser[]>([])
const detailOpen = ref(false)
const detail = ref<CustomerUser>({})
const creditOpen = ref(false)
const creditForm = ref({ userId: '', userName: '', currentBalance: 0, amount: 0, remark: '' })
const creditRules = { amount: [{ required: true, message: '调整数量不能为空', trigger: 'blur' }] }
const queryParams = ref<CustomerUserQuery>({ pageNum: 1, pageSize: 10 })

function getList() {
  loading.value = true
  listCustomerUser(queryParams.value).then(res => {
    userList.value = res.rows
    total.value = res.total
    loading.value = false
  })
}

function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function providerLabel(provider?: string) {
  return provider === 'wechat_miniapp' ? '微信小程序' : provider === 'google' ? 'Google' : provider || '未知'
}

function handleDetail(row: CustomerUser) {
  getCustomerUser(row.userId!).then(res => { detail.value = res.data || {}; detailOpen.value = true })
}

function handleStatusChange(row: CustomerUser) {
  const text = row.status === '0' ? '启用' : '停用'
  proxy.$modal.confirm(`确认要${text}客户“${row.userName}”吗？`).then(() =>
    changeCustomerUserStatus(row.userId!, row.status!)
  ).then(() => proxy.$modal.msgSuccess(text + '成功')).catch(() => {
    row.status = row.status === '0' ? '1' : '0'
  })
}

function handleResetPwd(row: CustomerUser) {
  proxy.$prompt(`请输入“${row.userName}”的新密码`, '重置密码', {
    inputPattern: /^.{5,20}$/,
    inputErrorMessage: '密码长度必须介于5到20个字符'
  }).then(({ value }: { value: string }) => resetCustomerUserPassword(row.userId!, value))
    .then(() => proxy.$modal.msgSuccess('密码重置成功')).catch(() => {})
}

function handleEditCredit(row: CustomerUser) {
  creditForm.value = { userId: row.userId!, userName: row.userName || '', currentBalance: row.creditBalance || 0, amount: 0, remark: '' }
  creditOpen.value = true
}

function submitCredit() {
  proxy.$refs.creditRef.validate((valid: boolean) => {
    if (!valid) return
    if (creditForm.value.amount === 0) return proxy.$modal.msgError('调整积分不能为0')
    editCustomerUserCredit(creditForm.value).then(res => {
      proxy.$modal.msgSuccess(`调整成功，当前积分：${res.creditBalance}`)
      creditOpen.value = false
      getList()
    })
  })
}

function handleDelete(row: CustomerUser) {
  proxy.$modal.confirm(`确认要删除客户"${row.userName}"吗？删除后该用户可重新注册。`).then(() =>
    deleteCustomerUser(row.userId!)
  ).then(() => {
    proxy.$modal.msgSuccess('删除成功')
    getList()
  }).catch(() => {})
}

getList()
</script>
