<template>
  <span v-if="value" class="payment-identifier">
    <el-tooltip :content="value" placement="top" :show-after="500">
      <span class="identifier-text">{{ value }}</span>
    </el-tooltip>
    <el-button class="copy-button" link icon="CopyDocument" aria-label="复制编号" @click.stop="copyValue" />
  </span>
  <span v-else class="empty-value">-</span>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'

const props = defineProps<{ value?: string }>()

async function copyValue() {
  if (!props.value) return
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(props.value)
  } else {
    const textarea = document.createElement('textarea')
    textarea.value = props.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    textarea.remove()
  }
  ElMessage.success({ message: '编号已复制', duration: 1200 })
}
</script>

<style scoped>
.payment-identifier { display: inline-flex; align-items: flex-start; max-width: 100%; gap: 2px; }
.identifier-text { min-width: 0; color: var(--el-text-color-regular); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; line-height: 18px; overflow-wrap: anywhere; white-space: normal; word-break: break-all; }
.copy-button { flex: none; opacity: 0; transition: opacity .15s ease; }
.payment-identifier:hover .copy-button, .copy-button:focus-visible { opacity: 1; }
.empty-value { color: var(--el-text-color-placeholder); }
</style>
