<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="用户ID" prop="userId">
        <el-input v-model="queryParams.userId" placeholder="请输入用户ID" clearable style="width: 200px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="状态" clearable style="width: 160px">
          <el-option label="待处理" value="pending" />
          <el-option label="生成中" value="processing" />
          <el-option label="已完成" value="completed" />
          <el-option label="失败" value="fail" />
        </el-select>
      </el-form-item>
      <el-form-item label="站点" prop="site">
        <el-select v-model="queryParams.site" placeholder="站点" clearable style="width: 160px">
          <el-option v-for="s in siteList" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <el-form-item label="平台" prop="platformCode">
        <el-select v-model="queryParams.platformCode" placeholder="平台" clearable style="width: 160px">
          <el-option v-for="p in platformList" :key="p.platformCode" :label="p.platformName" :value="p.platformCode" />
        </el-select>
      </el-form-item>
      <el-form-item label="模型" prop="modelCode">
        <el-select v-model="queryParams.modelCode" placeholder="模型" clearable style="width: 200px">
          <el-option v-for="m in modelList" :key="`${m.platformCode}_${m.modelCode}`" :label="m.modelName" :value="m.modelCode" />
        </el-select>
      </el-form-item>
      <el-form-item label="平台任务ID" prop="taskId">
        <el-input v-model="queryParams.taskId" placeholder="平台任务ID" clearable style="width: 200px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="TraceId" prop="traceId">
        <el-input v-model="queryParams.traceId" placeholder="traceId" clearable style="width: 240px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="创建时间" prop="dateRange">
        <el-date-picker v-model="dateRange" type="daterange" range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 240px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="taskList">
      <el-table-column label="任务ID" align="center" prop="videoId" width="80" />
      <el-table-column label="站点" align="center" prop="site" width="120" show-overflow-tooltip />
      <el-table-column label="用户ID" align="center" prop="userId" width="180" show-overflow-tooltip />
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 'completed'" type="success">已完成</el-tag>
          <el-tag v-else-if="scope.row.status === 'processing'" type="warning">生成中</el-tag>
          <el-tag v-else-if="scope.row.status === 'pending'" type="info">待处理</el-tag>
          <el-tag v-else-if="scope.row.status === 'fail'" type="danger">失败</el-tag>
          <el-tag v-else>{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="错误信息" align="center" width="100" show-overflow-tooltip>
        <template #default="scope">
          <span @dblclick="copyText(scope.row.errorInfo)" style="cursor: pointer">{{ scope.row.errorInfo || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="平台" align="center" width="100">
        <template #default="scope">
          <span>{{ platformNameMap[scope.row.platformCode] || scope.row.platformCode }}</span>
        </template>
      </el-table-column>
      <el-table-column label="模型" align="center" width="160" show-overflow-tooltip>
        <template #default="scope">
          <span>{{ modelNameMap[`${scope.row.platformCode}_${scope.row.modelCode}`] || scope.row.modelCode }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Prompt" align="center" min-width="200" show-overflow-tooltip>
        <template #default="scope">
          <span @dblclick="copyText(scope.row.prompt)" style="cursor: pointer">{{ scope.row.prompt }}</span>
        </template>
      </el-table-column>
      <el-table-column label="参考图" align="center" width="100">
        <template #default="scope">
          <template v-if="scope.row.userImages">
            <el-image
              v-for="(img, idx) in parseUserImages(scope.row.userImages).slice(0, 3)"
              :key="idx"
              :src="img"
              :preview-src-list="parseUserImages(scope.row.userImages)"
              preview-teleported
              fit="cover"
              style="width: 36px; height: 36px; border-radius: 4px; margin-right: 2px"
            />
          </template>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="视频结果" align="center" width="90">
        <template #default="scope">
          <el-button v-if="scope.row.media?.url" type="primary" link @click="handleView(scope.row)">查看</el-button>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="积分" align="center" prop="creditCost" width="80" />
      <el-table-column label="媒体信息" align="center" width="260">
        <template #default="scope">
          <div class="media-meta-card">
            <div class="media-meta-item">
              <span class="media-meta-label">比例</span>
              <span class="media-meta-value">{{ scope.row.ratio || '-' }}</span>
            </div>
            <div class="media-meta-item">
              <span class="media-meta-label">分辨率</span>
              <span class="media-meta-value">{{ scope.row.resolution || '-' }}</span>
            </div>
            <div class="media-meta-item">
              <span class="media-meta-label">目标时长</span>
              <span class="media-meta-value">{{ scope.row.duration != null ? `${scope.row.duration}s` : '-' }}</span>
            </div>
            <div class="media-meta-item">
              <span class="media-meta-label">实际时长</span>
              <span class="media-meta-value">{{ formatDuration(scope.row.media?.durationMs) }}</span>
            </div>
            <div class="media-meta-item">
              <span class="media-meta-label">文件大小</span>
              <span class="media-meta-value">{{ formatFileSize(scope.row.media?.size) }}</span>
            </div>
            <div class="media-meta-item">
              <span class="media-meta-label">MIME</span>
              <span class="media-meta-value">{{ scope.row.media?.mimeType || '-' }}</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="平台任务ID" align="center" prop="taskId" min-width="160" />
      <el-table-column label="TraceId" align="center" prop="traceId" min-width="180" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" align="center" prop="updateTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.updateTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="80" fixed="right">
        <template #default="scope">
          <el-button type="primary" link @click="handleEdit(scope.row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 视频查看弹窗 -->
    <el-dialog title="视频预览" v-model="viewVisible" width="1100px" destroy-on-close>
      <video v-if="viewUrl" :src="viewUrl" controls autoplay style="width: 100%; max-height: 900px; border-radius: 8px" />
    </el-dialog>

    <!-- 编辑弹窗 -->
    <el-dialog title="编辑任务状态" v-model="editVisible" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="任务ID">
          <span>{{ editForm.videoId }}</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.status" placeholder="选择状态" style="width: 100%">
            <el-option label="待处理" value="pending" />
            <el-option label="生成中" value="processing" />
            <el-option label="已完成" value="completed" />
            <el-option label="失败" value="fail" />
          </el-select>
        </el-form-item>
        <el-form-item label="Prompt">
          <span style="word-break: break-all">{{ editForm.prompt || '-' }}</span>
        </el-form-item>
        <el-form-item label="错误信息">
          <el-input v-model="editForm.errorInfo" type="textarea" :rows="3" placeholder="错误信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取 消</el-button>
        <el-button type="primary" :loading="editLoading" @click="submitEdit">确 定</el-button>
      </template>
    </el-dialog>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup lang="ts" name="VideoTask">
import { listVideoTask, editVideoTaskStatus } from '@/api/ai/videoTask'
import { listAiEnums } from '@/api/ai/enums'
import type { AiVideoTask, VideoTaskQuery } from '@/api/ai/videoTask'

const { proxy } = getCurrentInstance()

const taskList = ref<AiVideoTask[]>([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)

const platformNameMap = ref<Record<number, string>>({})
const modelNameMap = ref<Record<string, string>>({})
const platformList = ref<Array<{ platformCode: number; platformName: string }>>([])
const modelList = ref<Array<{ platformCode: number; modelCode: number; modelName: string }>>([])
const siteList = ref<string[]>([])
const dateRange = ref<string[]>([])

const viewVisible = ref(false)
const viewUrl = ref('')

const editVisible = ref(false)
const editLoading = ref(false)
const editForm = ref({ videoId: '', status: '', prompt: '', errorInfo: '' })

const queryParams = ref<VideoTaskQuery>({
  pageNum: 1,
  pageSize: 10,
  userId: undefined,
  userName: undefined,
  status: undefined,
  traceId: undefined,
  taskId: undefined,
  site: undefined,
  platformCode: undefined,
  modelCode: undefined,
  beginTime: undefined,
  endTime: undefined
})

function loadEnums() {
  listAiEnums().then(res => {
    const data = res.data
    if (data?.platforms) {
      platformList.value = data.platforms.map((p: any) => ({ platformCode: p.platformCode, platformName: p.platformName }))
      const map: Record<number, string> = {}
      data.platforms.forEach((p: any) => { map[p.platformCode] = p.platformName })
      platformNameMap.value = map
    }
    if (data?.models) {
      modelList.value = data.models.map((m: any) => ({ platformCode: m.platformCode, modelCode: m.modelCode, modelName: m.modelName }))
      const map: Record<string, string> = {}
      data.models.forEach((m: any) => {
        const key = `${m.platformCode}_${m.modelCode}`
        map[key] = m.modelName
      })
      modelNameMap.value = map
    }
    if (data?.sites) {
      siteList.value = data.sites
    }
  }).catch(() => {})
}

function getList() {
  loading.value = true
  const params: VideoTaskQuery = { ...queryParams.value }
  if (dateRange.value && dateRange.value.length === 2) {
    params.beginTime = dateRange.value[0] + ' 00:00:00'
    params.endTime = dateRange.value[1] + ' 23:59:59'
  } else {
    params.beginTime = undefined
    params.endTime = undefined
  }
  listVideoTask(params).then(response => {
    taskList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  dateRange.value = []
  proxy.resetForm('queryRef')
  handleQuery()
}

function handleView(row: AiVideoTask) {
  viewUrl.value = row.media?.url || ''
  viewVisible.value = true
}

function handleEdit(row: AiVideoTask) {
  editForm.value = {
    videoId: row.videoId!,
    status: row.status || '',
    prompt: row.prompt || '',
    errorInfo: row.errorInfo || ''
  }
  editVisible.value = true
}

function submitEdit() {
  editLoading.value = true
  editVideoTaskStatus(editForm.value).then(() => {
    proxy.$modal.msgSuccess('修改成功')
    editVisible.value = false
    getList()
  }).finally(() => {
    editLoading.value = false
  })
}

function copyText(text?: string) {
  if (!text) return
  navigator.clipboard.writeText(text).then(() => {
    proxy.$modal.msgSuccess('已复制')
  })
}

function parseUserImages(userImages?: string): string[] {
  if (!userImages) return []
  try {
    const arr = JSON.parse(userImages)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function formatFileSize(size?: number) {
  if (size == null || size <= 0) {
    return '-'
  }
  if (size < 1024) {
    return `${size} B`
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }
  return `${(size / 1024 / 1024).toFixed(2)} MB`
}

function formatDuration(durationMs?: number) {
  if (durationMs == null || durationMs <= 0) {
    return '-'
  }
  const seconds = durationMs / 1000
  return `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)}s`
}

loadEnums()
getList()
</script>

<style lang="scss" scoped>
.media-meta-card {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-extra-light);
  text-align: left;
}

.media-meta-item {
  min-width: 0;
}

.media-meta-label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1;
}

.media-meta-value {
  display: block;
  font-size: 13px;
  color: var(--el-text-color-primary);
  line-height: 1.4;
  word-break: break-all;
}
</style>
