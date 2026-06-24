<template>
  <div class="app-container email-log-page">
    <div class="page-heading">
      <div>
        <h2>邮件发送日志</h2>
        <p>查看所有通过系统发出的邮件及其状态。</p>
      </div>
    </div>

    <el-card v-show="showSearch" class="filter-card" shadow="never">
      <el-form ref="queryRef" :model="queryParams" :inline="true" label-position="top">
        <el-form-item label="所属站点" prop="site">
          <el-select v-model="queryParams.site" clearable filterable placeholder="全部站点" style="width: 210px">
            <el-option v-for="site in siteOptions" :key="site" :label="site" :value="site" />
          </el-select>
        </el-form-item>
        <el-form-item label="业务标签" prop="tag">
          <el-select v-model="queryParams.tag" clearable filterable placeholder="全部标签" style="width: 240px">
            <el-option v-for="tag in tagOptions" :key="tag.code" :label="`${tag.description} · ${tag.code}`" :value="tag.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="发送状态" prop="sendStatus">
          <el-select v-model="queryParams.sendStatus" clearable placeholder="全部状态" style="width: 140px">
            <el-option label="待发送" value="pending" />
            <el-option label="发送成功" value="success" />
            <el-option label="发送失败" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item label="收件邮箱" prop="recipient">
          <el-input v-model="queryParams.recipient" clearable placeholder="搜索邮箱" @keyup.enter="handleQuery" style="width: 200px" />
        </el-form-item>
        <el-form-item label="创建时间" prop="createTimeRange">
          <el-date-picker
            v-model="createTimeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 380px"
          />
        </el-form-item>
        <el-form-item class="filter-actions">
          <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <div class="table-toolbar">
        <div />
        <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
      </div>

      <el-table v-loading="loading" :data="rows">
        <el-table-column label="收件人" prop="recipient" min-width="200" show-overflow-tooltip />
        <el-table-column label="所属站点" min-width="140">
          <template #default="scope">
            <el-tag v-if="scope.row.site" type="info" effect="plain">{{ scope.row.site }}</el-tag>
            <el-tag v-else type="warning" effect="plain">默认站点域</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="业务标签" min-width="160">
          <template #default="scope">{{ tagLabel(scope.row.tag) }}</template>
        </el-table-column>
        <el-table-column label="发送状态" width="110">
          <template #default="scope">
            <el-tag :type="statusType(scope.row.sendStatus)" effect="light">
              {{ statusLabel(scope.row.sendStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="实际语言" prop="actualLocale" width="110" />
        <el-table-column label="发送时间" width="170">
          <template #default="scope">{{ scope.row.sentTime ? parseTime(scope.row.sentTime) : '-' }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="scope">{{ parseTime(scope.row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="scope">
            <el-button
              v-if="scope.row.errorMessage"
              link
              type="danger"
              icon="Warning"
              @click="showError(scope.row)"
            >
              错误
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无邮件发送记录" />
        </template>
      </el-table>
      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <el-dialog title="发送错误详情" v-model="errorOpen" width="640px" append-to-body>
      <div class="error-info">
        <div class="error-meta">
          <span><b>收件人：</b>{{ currentLog?.recipient }}</span>
          <span><b>业务标签：</b>{{ tagLabel(currentLog?.tag) }}</span>
        </div>
        <el-alert type="error" :closable="false" show-icon>
          <template #default>
            <pre class="error-message">{{ currentLog?.errorMessage }}</pre>
          </template>
        </el-alert>
      </div>
      <template #footer>
        <el-button @click="errorOpen = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="EmailSendLog">
import { listEmailSendLog } from '@/api/system/emailSendLog'
import { getEmailTemplateSites, getEmailTemplateTags } from '@/api/system/emailTemplate'
import type { EmailSendLog } from '@/api/system/emailSendLog'
import type { EmailTemplateTagOption } from '@/api/system/emailTemplate'

const { proxy } = getCurrentInstance() as any

const rows = ref<EmailSendLog[]>([])
const tagOptions = ref<EmailTemplateTagOption[]>([])
const siteOptions = ref<string[]>([])
const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const errorOpen = ref(false)
const currentLog = ref<EmailSendLog | null>(null)
const createTimeRange = ref<[string, string] | null>(null)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 20,
  site: undefined as string | undefined,
  tag: undefined as string | undefined,
  sendStatus: undefined as string | undefined,
  recipient: undefined as string | undefined,
  createTimeStart: undefined as string | undefined,
  createTimeEnd: undefined as string | undefined,
})

function tagLabel(tag?: string) {
  const option = tagOptions.value.find((item: EmailTemplateTagOption) => item.code === tag)
  return option ? `${option.description} · ${option.code}` : (tag || '-')
}

function statusType(status: string) {
  if (status === 'success') return 'success'
  if (status === 'failed') return 'danger'
  return 'warning'
}

function statusLabel(status: string) {
  if (status === 'success') return '发送成功'
  if (status === 'failed') return '发送失败'
  return '待发送'
}

async function getList() {
  loading.value = true
  try {
    const response = await listEmailSendLog(queryParams)
    rows.value = response.rows
    total.value = response.total
  } finally {
    loading.value = false
  }
}

function handleQuery() {
  queryParams.createTimeStart = createTimeRange.value?.[0]
  queryParams.createTimeEnd = createTimeRange.value?.[1]
  queryParams.pageNum = 1
  getList()
}

function resetQuery() {
  createTimeRange.value = null
  proxy.resetForm('queryRef')
  queryParams.createTimeStart = undefined
  queryParams.createTimeEnd = undefined
  queryParams.pageNum = 1
  getList()
}

function showError(row: EmailSendLog) {
  currentLog.value = row
  errorOpen.value = true
}

getEmailTemplateTags().then(response => { tagOptions.value = response.data || [] })
getEmailTemplateSites().then(response => { siteOptions.value = response.data || [] })
getList()
</script>

<style scoped>
.email-log-page { background: var(--el-fill-color-lighter); min-height: calc(100vh - 84px); }
.page-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.page-heading h2 { margin: 0 0 6px; color: var(--el-text-color-primary); font-size: 22px; }
.page-heading p { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; }
.filter-card { margin-bottom: 16px; }
.filter-card :deep(.el-card__body) { padding-bottom: 2px; }
.filter-card :deep(.el-form-item) { margin-bottom: 16px; }
.filter-actions { padding-top: 30px; }
.table-card :deep(.el-card__body) { padding: 0 18px 18px; }
.table-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 16px 0; }
.error-info { display: flex; flex-direction: column; gap: 14px; }
.error-meta { display: flex; gap: 24px; font-size: 14px; color: var(--el-text-color-regular); }
.error-message { margin: 0; font-family: monospace; font-size: 13px; white-space: pre-wrap; word-break: break-all; }
</style>
