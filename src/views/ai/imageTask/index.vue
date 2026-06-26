<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="用户名称" prop="userName">
        <el-input v-model="queryParams.userName" placeholder="请输入用户名称" clearable style="width: 200px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="状态" clearable style="width: 160px">
          <el-option label="生成中" value="processing" />
          <el-option label="已完成" value="completed" />
          <el-option label="失败" value="fail" />
        </el-select>
      </el-form-item>
      <el-form-item label="TraceId" prop="traceId">
        <el-input v-model="queryParams.traceId" placeholder="traceId" clearable style="width: 240px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="taskList">
      <el-table-column label="任务ID" align="center" prop="imageId" width="80" />
      <el-table-column label="用户" align="center" prop="userName" width="120" />
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 'completed'" type="success">已完成</el-tag>
          <el-tag v-else-if="scope.row.status === 'processing'" type="warning">生成中</el-tag>
          <el-tag v-else-if="scope.row.status === 'fail'" type="danger">失败</el-tag>
          <el-tag v-else>{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Prompt" align="center" prop="prompt" min-width="200" show-overflow-tooltip />
      <el-table-column label="积分" align="center" prop="creditCost" width="80" />
      <el-table-column label="文件大小" align="center" width="100">
        <template #default="scope">
          <span>{{ formatFileSize(scope.row.media?.size) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="MIME" align="center" width="120" show-overflow-tooltip>
        <template #default="scope">
          <span>{{ scope.row.media?.mimeType || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="预览" align="center" width="100">
        <template #default="scope">
          <el-image
            v-if="scope.row.media?.url"
            :src="scope.row.media.url"
            :preview-src-list="[scope.row.media.url]"
            fit="cover"
            style="width: 56px; height: 56px; border-radius: 6px"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="TraceId" align="center" prop="traceId" min-width="180" show-overflow-tooltip />
      <el-table-column label="错误信息" align="center" prop="errorInfo" min-width="160" show-overflow-tooltip />
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup lang="ts" name="ImageTask">
import { listImageTask } from '@/api/ai/imageTask'
import type { AiImageTask, ImageTaskQuery } from '@/api/ai/imageTask'

const { proxy } = getCurrentInstance()

const taskList = ref<AiImageTask[]>([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)

const queryParams = ref<ImageTaskQuery>({
  pageNum: 1,
  pageSize: 10,
  userName: undefined,
  status: undefined,
  traceId: undefined
})

function getList() {
  loading.value = true
  listImageTask(queryParams.value).then(response => {
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

getList()
</script>
