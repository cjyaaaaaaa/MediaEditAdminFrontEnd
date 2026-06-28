<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="用户名称" prop="userName">
        <el-input v-model="queryParams.userName" placeholder="请输入用户名称" clearable style="width: 180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="用户ID" prop="userId">
        <el-input v-model="queryParams.userId" placeholder="请输入用户ID" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="状态" clearable style="width: 160px">
          <el-option label="待处理" value="pending" />
          <el-option label="生成中" value="processing" />
          <el-option label="已完成" value="completed" />
          <el-option label="失败" value="fail" />
        </el-select>
      </el-form-item>
      <el-form-item label="TaskId" prop="taskId">
        <el-input v-model="queryParams.taskId" placeholder="平台任务ID" clearable style="width: 220px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="TraceId" prop="traceId">
        <el-input v-model="queryParams.traceId" placeholder="traceId" clearable style="width: 220px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="taskList">
      <el-table-column label="任务ID" align="center" prop="videoId" width="100" />
      <el-table-column label="站点" align="center" prop="site" width="120" show-overflow-tooltip />
      <el-table-column label="用户" align="center" prop="userName" width="120" show-overflow-tooltip />
      <el-table-column label="用户ID" align="center" prop="userId" width="100" />
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 'completed'" type="success">已完成</el-tag>
          <el-tag v-else-if="scope.row.status === 'processing'" type="warning">生成中</el-tag>
          <el-tag v-else-if="scope.row.status === 'pending'" type="info">待处理</el-tag>
          <el-tag v-else-if="scope.row.status === 'fail'" type="danger">失败</el-tag>
          <el-tag v-else>{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Prompt" align="center" prop="prompt" min-width="200" show-overflow-tooltip />
      <el-table-column label="参考图" align="center" width="100">
        <template #default="scope">
          <template v-if="scope.row.userImages">
            <el-image
              v-for="(img, idx) in parseUserImages(scope.row.userImages).slice(0, 3)"
              :key="idx"
              :src="img"
              :preview-src-list="parseUserImages(scope.row.userImages)"
              fit="cover"
              style="width: 36px; height: 36px; border-radius: 4px; margin-right: 2px"
            />
          </template>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="时长" align="center" width="80">
        <template #default="scope">
          <span>{{ scope.row.duration != null ? `${scope.row.duration}s` : '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="比例" align="center" prop="ratio" width="80" />
      <el-table-column label="分辨率" align="center" prop="resolution" width="80" />
      <el-table-column label="数量" align="center" prop="count" width="60" />
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
      <el-table-column label="模型ID" align="center" prop="modelId" width="80" />
      <el-table-column label="积分" align="center" prop="creditCost" width="80" />
      <el-table-column label="预览" align="center" width="180">
        <template #default="scope">
          <video v-if="scope.row.media?.url" :src="scope.row.media.url" controls style="width: 150px; height: 84px; border-radius: 6px; object-fit: cover" />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="实际时长" align="center" width="90">
        <template #default="scope">
          <span>{{ formatDuration(scope.row.media?.durationMs) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="媒体比例" align="center" width="80">
        <template #default="scope">
          <span>{{ scope.row.media?.aspectRatio || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="媒体分辨率" align="center" width="90">
        <template #default="scope">
          <span>{{ scope.row.media?.resolution || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="文件大小" align="center" width="110">
        <template #default="scope">
          <span>{{ formatFileSize(scope.row.media?.size) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="文件名" align="center" width="160" show-overflow-tooltip>
        <template #default="scope">
          <span>{{ scope.row.media?.fileName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="对象Key" align="center" width="200" show-overflow-tooltip>
        <template #default="scope">
          <span>{{ scope.row.media?.objectKey || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="TaskId" align="center" prop="taskId" min-width="180" show-overflow-tooltip />
      <el-table-column label="TraceId" align="center" prop="traceId" min-width="180" show-overflow-tooltip />
      <el-table-column label="结果媒体ID" align="center" prop="resultMediaId" width="100" />
      <el-table-column label="错误信息" align="center" prop="errorInfo" min-width="160" show-overflow-tooltip />
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
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup lang="ts" name="VideoTask">
import { listVideoTask } from '@/api/ai/videoTask'
import { listAiEnums } from '@/api/ai/enums'
import type { AiVideoTask, VideoTaskQuery } from '@/api/ai/videoTask'

const { proxy } = getCurrentInstance()

const taskList = ref<AiVideoTask[]>([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)

const platformNameMap = ref<Record<number, string>>({})
const modelNameMap = ref<Record<string, string>>({})

const queryParams = ref<VideoTaskQuery>({
  pageNum: 1,
  pageSize: 10,
  userId: undefined,
  userName: undefined,
  status: undefined,
  traceId: undefined,
  taskId: undefined
})

function loadEnums() {
  listAiEnums().then(res => {
    const data = res.data
    if (data?.platforms) {
      const map: Record<number, string> = {}
      data.platforms.forEach(p => { map[p.platformCode] = p.platformName })
      platformNameMap.value = map
    }
    if (data?.models) {
      const map: Record<string, string> = {}
      data.models.forEach(m => {
        const key = `${m.platformCode}_${m.modelCode}`
        map[key] = m.modelInfo || m.modelName
      })
      modelNameMap.value = map
    }
  }).catch(() => {})
}

function getList() {
  loading.value = true
  listVideoTask(queryParams.value).then(response => {
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
  proxy.resetForm('queryRef')
  handleQuery()
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
