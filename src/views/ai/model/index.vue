<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="平台" prop="platformId">
        <el-select v-model="queryParams.platformId" placeholder="请选择平台" clearable style="width: 200px">
          <el-option v-for="item in platformOptions" :key="item.platformId" :label="item.platformName" :value="item.platformId" />
        </el-select>
      </el-form-item>
      <el-form-item label="模型类型" prop="modelType">
        <el-select v-model="queryParams.modelType" placeholder="模型类型" clearable style="width: 160px" @change="handleQueryTypeChange">
          <el-option v-for="item in modelTypeOptions" :key="item.code" :label="item.label" :value="item.code" />
        </el-select>
      </el-form-item>
      <el-form-item label="模型名称" prop="modelName">
        <el-select
          v-model="queryParams.modelName"
          placeholder="选择或输入模型名称"
          clearable filterable allow-create default-first-option
          style="width: 220px"
        >
          <el-option
            v-for="item in queryFilteredModelOptions"
            :key="modelEnumKey(item)"
            :label="item.modelName"
            :value="item.modelName"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="模型编码" prop="modelCode">
        <el-input-number v-model="queryParams.modelCode" placeholder="模型编码" :controls="false" :min="1" clearable style="width: 160px" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="状态" clearable style="width: 200px">
          <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['ai:model:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['ai:model:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['ai:model:remove']">删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="modelList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="模型ID" align="center" prop="modelId" width="80" />
      <el-table-column label="平台" align="center" prop="platformName" />
      <el-table-column label="平台编码" align="center" prop="platformCode" width="100" />
      <el-table-column label="模型名称" align="center" prop="modelName" />
      <el-table-column label="模型编码" align="center" prop="modelCode" width="100" />
      <el-table-column label="模型类型" align="center" prop="modelType" width="100">
        <template #default="scope">
          <el-tag :type="modelTypeTagType(scope.row.modelType)" size="small">
            {{ modelTypeLabel(scope.row.modelType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="计费方式 / 价格" align="left" prop="billingType" min-width="220">
        <template #default="scope">
          <div style="margin-bottom:6px">
            <el-tag size="small" type="info">{{ getBillingTypeInfo(scope.row.billingType) }}</el-tag>
          </div>
          <div v-if="scope.row.billingType && scope.row.creditConfig">
            <!-- per_second -->
            <template v-if="scope.row.billingType === 'per_second'">
              <span class="price-item">{{ getCreditValue(scope.row.creditConfig, 'per_second.credit_per_second') }} <span class="price-unit">credit/秒</span></span>
            </template>
            <!-- per_task -->
            <template v-else-if="scope.row.billingType === 'per_task'">
              <span class="price-item">{{ getCreditValue(scope.row.creditConfig, 'per_task.credit_per_task') }} <span class="price-unit">credit/次</span></span>
            </template>
            <!-- per_resolution: 两列网格 -->
            <template v-else-if="scope.row.billingType === 'per_resolution'">
              <div class="display-pricing-grid">
                <div v-for="r in ['480p','540p','720p','1080p','2k','4k']" :key="r" class="display-pricing-item">
                  <span class="display-resolution-label">{{ r }}:</span>
                  <span class="display-price-value">{{ getCreditValue(scope.row.creditConfig, `per_resolution.${r}`) }}</span>
                </div>
              </div>
              <div class="price-unit">credit</div>
            </template>
            <!-- per_resolution_duration: 表格 -->
            <template v-else-if="scope.row.billingType === 'per_resolution_duration'">
              <table class="display-quality-table">
                <thead>
                  <tr>
                    <th>分辨率</th>
                    <th>credit/秒</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in ['480p','540p','720p','1080p','2k','4k']" :key="r">
                    <td class="display-quality-label">{{ r }}</td>
                    <td>{{ getCreditValue(scope.row.creditConfig, `per_resolution_duration.${r}`) }}</td>
                  </tr>
                </tbody>
              </table>
            </template>
            <!-- per_quality_resolution: 矩阵表格 -->
            <template v-else-if="scope.row.billingType === 'per_quality_resolution'">
              <table class="display-quality-table">
                <thead>
                  <tr>
                    <th>质量 / 分辨率</th>
                    <th v-for="r in ['1k','2k','4k']" :key="r">{{ r }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="q in ['low','medium','high']" :key="q">
                    <td class="display-quality-label">{{ q === 'low' ? '低' : q === 'medium' ? '中' : '高' }} ({{ q }})</td>
                    <td v-for="r in ['1k','2k','4k']" :key="r">{{ getCreditValue(scope.row.creditConfig, `per_quality_resolution.${q}.${r}`) }}</td>
                  </tr>
                </tbody>
              </table>
              <div class="price-unit">单位：credit/张</div>
            </template>
          </div>
          <div v-else class="text-gray-400" style="font-size:12px">-</div>
        </template>
      </el-table-column>
      <el-table-column label="模型配置" align="left" min-width="280">
        <template #default="scope">
          <!-- API URL -->
          <div style="margin-bottom:6px">
            <div style="font-size:12px;color:#303133;font-weight:bold;margin-bottom:2px">API URL</div>
            <!-- 编辑态 -->
            <div v-if="editingField?.modelId === scope.row.modelId && editingField?.field === 'apiUrl'">
              <el-input
                v-model="editingValue"
                type="textarea"
                :autosize="{ minRows: 1 }"
                size="small"
                placeholder="API URL"
              />
              <div style="display:flex;gap:8px;margin-top:4px">
                <el-button size="small" type="primary" @click="saveField(scope.row)">保存</el-button>
                <el-button size="small" @click="cancelEditField">取消</el-button>
              </div>
            </div>
            <!-- 展示态 -->
            <span v-else-if="scope.row.apiUrl" style="display:block;word-break:break-all;background:#f0f9ff;border-radius:4px;padding:2px 6px;font-size:12px;color:#0369a1;cursor:pointer"
              title="点击编辑" @click="startEditField(scope.row, 'apiUrl')">{{ scope.row.apiUrl }}</span>
            <span v-else style="font-size:12px;color:#909399;cursor:pointer" @click="startEditField(scope.row, 'apiUrl')">点击添加</span>
          </div>
          <!-- 模型配置 -->
          <div>
            <div style="font-size:12px;color:#303133;font-weight:bold;margin-bottom:2px">模型配置</div>
            <!-- 编辑态 -->
            <div v-if="editingField?.modelId === scope.row.modelId && editingField?.field === 'configJson'">
              <el-input
                v-model="editingValue"
                type="textarea"
                :autosize="{ minRows: 1 }"
                size="small"
                placeholder="模型配置 JSON"
              />
              <div style="display:flex;gap:8px;margin-top:4px">
                <el-button size="small" @click="editingValue = formatJson(editingValue) || editingValue">格式化</el-button>
                <el-button size="small" type="primary" @click="saveField(scope.row)">保存</el-button>
                <el-button size="small" @click="cancelEditField">取消</el-button>
              </div>
            </div>
            <!-- 展示态 -->
            <pre v-else-if="scope.row.configJson" style="margin:0;font-size:12px;white-space:pre-wrap;word-break:break-all;text-align:left;background:#f0fdf4;border-radius:4px;padding:2px 6px;color:#15803d;cursor:pointer"
              title="点击编辑" @click="startEditField(scope.row, 'configJson')">{{ formatJson(scope.row.configJson) }}</pre>
            <span v-else style="font-size:12px;color:#909399;cursor:pointer" @click="startEditField(scope.row, 'configJson')">点击添加</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="left" min-width="300">
        <template #default="scope">
          <!-- 编辑态 -->
          <div v-if="editingRemarkId === scope.row.modelId" style="display:flex;flex-direction:column;gap:6px">
            <div>
              <div class="remark-label">对接文档地址：</div>
              <el-input
                v-model="remarkData[scope.row.modelId]['对接文档地址']"
                type="textarea"
                :autosize="{ minRows: 1 }"
                size="small"
                placeholder="对接文档地址"
                @input="remarkData[scope.row.modelId] = { ...remarkData[scope.row.modelId] }"
              />
            </div>
            <div>
              <div class="remark-label">模型说明：</div>
              <el-input
                v-model="remarkData[scope.row.modelId]['模型说明']"
                type="textarea"
                :autosize="{ minRows: 1 }"
                size="small"
                placeholder="模型说明"
                @input="remarkData[scope.row.modelId] = { ...remarkData[scope.row.modelId] }"
              />
            </div>
            <div>
              <div class="remark-label">参数说明：</div>
              <el-input
                v-model="remarkData[scope.row.modelId]['参数说明']"
                type="textarea"
                :autosize="{ minRows: 1 }"
                size="small"
                placeholder="参数说明"
                @input="remarkData[scope.row.modelId] = { ...remarkData[scope.row.modelId] }"
              />
            </div>
            <div>
              <div class="remark-label">前端JSON参数：</div>
              <el-input
                v-model="remarkData[scope.row.modelId]['前端json参数']"
                type="textarea"
                :autosize="{ minRows: 1 }"
                size="small"
                placeholder="前端JSON参数"
                @input="remarkData[scope.row.modelId] = { ...remarkData[scope.row.modelId] }"
              />
              <el-button size="small" style="margin-top:4px" @click="formatRemarkField(scope.row.modelId)">格式化</el-button>
            </div>
            <div style="display:flex;gap:8px">
              <el-button size="small" type="primary" @click="saveRemark(scope.row)">保存</el-button>
              <el-button size="small" @click="cancelEditRemark">取消</el-button>
            </div>
          </div>
          <!-- 展示态 -->
          <div v-else style="display:flex;flex-direction:column;gap:10px;cursor:pointer" @click="editingRemarkId = scope.row.modelId">
            <div v-if="remarkData[scope.row.modelId]?.['对接文档地址']">
              <div class="remark-label">对接文档地址：</div>
              <div style="font-size:12px;color:#0369a1;word-break:break-all">{{ remarkData[scope.row.modelId]['对接文档地址'] }}</div>
            </div>
            <div v-if="remarkData[scope.row.modelId]?.['模型说明']">
              <div class="remark-label">模型说明：</div>
              <div style="font-size:12px">{{ remarkData[scope.row.modelId]['模型说明'] }}</div>
            </div>
            <div v-if="remarkData[scope.row.modelId]?.['参数说明']">
              <div class="remark-label">参数说明：</div>
              <div style="font-size:12px">{{ remarkData[scope.row.modelId]['参数说明'] }}</div>
            </div>
            <div v-if="remarkData[scope.row.modelId]?.['前端json参数']">
              <div class="remark-label">前端JSON参数：</div>
              <pre style="margin:0;font-size:12px;white-space:pre-wrap;word-break:break-all;text-align:left;background:#fdf6ec;border-radius:4px;padding:4px 6px;color:#b45309">{{ formatJson(remarkData[scope.row.modelId]['前端json参数']) }}</pre>
            </div>
            <span v-if="!remarkData[scope.row.modelId]?.['对接文档地址'] && !remarkData[scope.row.modelId]?.['模型说明'] && !remarkData[scope.row.modelId]?.['参数说明'] && !remarkData[scope.row.modelId]?.['前端json参数']" class="text-gray-400" style="font-size:12px">点击添加备注</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="scope">
          <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" align="center">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['ai:model:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['ai:model:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="720px" append-to-body>
      <el-form ref="modelRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="所属平台" prop="platformId">
          <el-select v-model="form.platformId" placeholder="请选择平台" style="width: 100%" @change="handlePlatformChange">
            <el-option v-for="item in platformOptions" :key="item.platformId" :label="item.platformName" :value="item.platformId" />
          </el-select>
        </el-form-item>
        <el-form-item label="模型类型" prop="modelType">
          <el-select v-model="form.modelType" placeholder="请选择模型类型" style="width: 100%" @change="handleModelTypeChange">
            <el-option v-for="item in modelTypeOptions" :key="item.code" :label="item.label" :value="item.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="模型名称" prop="modelName">
          <el-select
            v-if="form.modelType && form.modelType !== 'other'"
            v-model="selectedModelKey"
            placeholder="请选择模型名称"
            style="width: 100%"
            @change="handleModelEnumChange"
          >
            <el-option
              v-for="item in filteredModelEnumOptions"
              :key="modelEnumKey(item)"
              :label="item.modelName"
              :value="modelEnumKey(item)"
            />
          </el-select>
          <el-input v-else v-model="form.modelName" placeholder="请输入模型名称" />
        </el-form-item>
        <el-form-item label="模型编码" v-if="form.modelType && form.modelType !== 'other'">
          <el-input :value="form.modelCode" disabled placeholder="选择模型名称后自动填充" />
        </el-form-item>
        <el-form-item label="计费方式" prop="billingType">
          <el-select v-model="form.billingType" placeholder="请选择计费方式" style="width: 100%">
            <el-option v-for="item in billingTypeList" :key="item.code" :label="item.info" :value="item.code">
              <el-tooltip :content="item.description" placement="right" :disabled="!item.description" effect="light">
                <span style="display:block">{{ item.info }}</span>
              </el-tooltip>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="价格配置" prop="creditConfig">
          <div v-if="!form.billingType" class="text-gray-400">
            请先选择计费方式
          </div>

          <!-- 按秒计费 -->
          <div v-else-if="form.billingType === 'per_second'">
            <el-form-item label="每秒价格" label-width="80px">
              <el-input-number v-model="creditConfigData.per_second.credit_per_second" :min="0" :precision="0" style="width: 200px" />
              <span class="ml-2">credit/秒</span>
            </el-form-item>
          </div>

          <!-- 按分辨率计费 -->
          <div v-else-if="form.billingType === 'per_resolution'" class="quality-resolution-pricing">
            <table class="pricing-table">
              <thead>
                <tr>
                  <th class="quality-header">分辨率</th>
                  <th class="resolution-header">credit</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in (['480p', '540p', '720p', '1080p', '2k', '4k'] as const)" :key="r">
                  <td class="quality-label">{{ r }}</td>
                  <td class="price-cell">
                    <el-input-number
                      v-model="creditConfigData.per_resolution[r]"
                      :min="0" :precision="0" size="small" controls-position="right"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 按分辨率和时长计费 -->
          <div v-else-if="form.billingType === 'per_resolution_duration'" class="quality-resolution-pricing">
            <table class="pricing-table">
              <thead>
                <tr>
                  <th class="quality-header">分辨率</th>
                  <th class="resolution-header">credit/秒</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in (['480p', '540p', '720p', '1080p', '2k', '4k'] as const)" :key="r">
                  <td class="quality-label">{{ r }}</td>
                  <td class="price-cell">
                    <el-input-number
                      v-model="creditConfigData.per_resolution_duration[r]"
                      :min="0" :precision="0" size="small" controls-position="right"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 按单次任务计费 -->
          <div v-else-if="form.billingType === 'per_task'">
            <el-form-item label="每次任务价格" label-width="100px">
              <el-input-number v-model="creditConfigData.per_task.credit_per_task" :min="0" :precision="0" style="width: 200px" />
              <span class="ml-2">credit/次</span>
            </el-form-item>
          </div>

          <!-- 按质量和分辨率计费 -->
          <div v-else-if="form.billingType === 'per_quality_resolution'" class="quality-resolution-pricing">
            <table class="pricing-table">
              <thead>
                <tr>
                  <th class="quality-header">质量 / 分辨率</th>
                  <th v-for="r in ['1k', '2k', '4k']" :key="r" class="resolution-header">{{ r }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="q in (['low', 'medium', 'high'] as const)" :key="q">
                  <td class="quality-label">{{ q === 'low' ? '低' : q === 'medium' ? '中' : '高' }} ({{ q }})</td>
                  <td v-for="r in (['1k', '2k', '4k'] as const)" :key="r" class="price-cell">
                    <el-input-number
                      v-model="creditConfigData.per_quality_resolution[q][r]"
                      :min="0" :precision="0" size="small" controls-position="right"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="credit-unit-hint">单位：credit/张</div>
          </div>

          <!-- 当前 JSON 值展示 -->
          <div v-if="form.billingType && currentCreditConfigJson" class="original-json-display">
            <div class="original-json-label">当前 JSON 值：</div>
            <pre class="original-json-content">{{ currentCreditConfigJson }}</pre>
          </div>
        </el-form-item>
        <el-form-item label="乘以数量(n)" v-if="form.billingType">
          <el-switch v-model="multiplyByN" />
          <span style="margin-left:10px;font-size:12px;color:#909399">开启后积分 = 单价 × n（生成数量）</span>
        </el-form-item>
        <el-form-item label="API地址" prop="apiUrl">
          <el-input v-model="form.apiUrl" placeholder="完整 API URL" />
        </el-form-item>
        <el-form-item label="模型配置JSON" prop="configJson">
          <el-input v-model="form.configJson" type="textarea" :rows="6" placeholder="请输入扩展配置 JSON（可选）" />
          <el-button size="small" style="margin-top:4px" @click="formatConfigJson">一键格式化</el-button>
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" controls-position="right" :min="0" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="5" placeholder="请输入备注" />
          <el-button size="small" style="margin-top:4px" @click="formatRemark">一键格式化</el-button>
          <el-button size="small" style="margin-top:4px" @click="insertRemarkTemplate">插入模板</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="AiModel">
import { ElMessage } from 'element-plus'
import { listModel, getModel, addModel, updateModel, delModel } from '@/api/ai/model'
import { optionselectPlatform } from '@/api/ai/platform'
import { listAiEnums } from '@/api/ai/enums'
import type { AiModelTypeOption } from '@/api/ai/enums'
import { AI_MODEL_OPTIONS, getModelName, formatCreditConfig } from '@/constants/ai'
import type { AiModelEnumOption, AiBillingType } from '@/constants/ai'
import type { AiModel, AiModelQuery } from '@/api/ai/model'
import type { AiPlatform } from '@/api/ai/platform'

const { proxy } = getCurrentInstance()
const { sys_normal_disable } = proxy.useDict('sys_normal_disable')

const REMARK_TEMPLATE_OBJ = { '对接文档地址': '', '模型说明': '', '参数说明': '', '前端json参数': '' }

const remarkData = reactive<Record<string, any>>({})
const editingRemarkId = ref<string | null>(null)

const editingField = ref<{ modelId: string; field: 'apiUrl' | 'configJson' } | null>(null)
const editingValue = ref('')

function startEditField(row: AiModel, field: 'apiUrl' | 'configJson') {
  if (!row.modelId) return
  editingField.value = { modelId: row.modelId, field }
  const raw = (row as any)[field] || ''
  editingValue.value = field === 'configJson' ? (formatJson(raw) || raw) : raw
}

function saveField(row: AiModel) {
  if (!editingField.value) return
  const { field } = editingField.value
  const updateData = { ...row, [field]: editingValue.value }
  updateModel(updateData).then(() => {
    (row as any)[field] = editingValue.value
    editingField.value = null
    ElMessage.success('已保存')
  })
}

function cancelEditField() {
  editingField.value = null
}

function initRemarkData(list: AiModel[]) {
  for (const row of list) {
    if (row.modelId) {
      try {
        remarkData[row.modelId] = row.remark ? JSON.parse(row.remark) : { ...REMARK_TEMPLATE_OBJ }
      } catch {
        remarkData[row.modelId] = { ...REMARK_TEMPLATE_OBJ }
      }
    }
  }
}

function saveRemark(row: AiModel) {
  const data = remarkData[row.modelId!]
  if (!data) return
  const newRemark = JSON.stringify(data, null, 2)
  updateModel({ ...row, remark: newRemark }).then(() => {
    row.remark = newRemark
    editingRemarkId.value = null
    ElMessage.success('备注已保存')
  })
}

function cancelEditRemark() {
  if (editingRemarkId.value) {
    // 恢复原始值
    const row = modelList.value.find(r => r.modelId === editingRemarkId.value)
    if (row) {
      try {
        remarkData[row.modelId!] = row.remark ? JSON.parse(row.remark) : { ...REMARK_TEMPLATE_OBJ }
      } catch {
        remarkData[row.modelId!] = { ...REMARK_TEMPLATE_OBJ }
      }
    }
  }
  editingRemarkId.value = null
}

function formatRemarkField(modelId: string) {
  const data = remarkData[modelId]
  if (!data) return
  const raw = data['前端json参数']
  if (!raw || (typeof raw === 'string' && !raw.trim())) return
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    data['前端json参数'] = JSON.stringify(parsed, null, 2)
    remarkData[modelId] = { ...data }
  } catch {
    ElMessage.warning('前端JSON参数格式不正确')
  }
}

const REMARK_TEMPLATE = `{
  "对接文档地址": "",
  "模型说明": "",
  "参数说明": "",
  "前端json参数": ""
}`

function insertRemarkTemplate() {
  form.value.remark = REMARK_TEMPLATE
}

function formatRemark() {
  const raw = form.value.remark
  if (raw == null || (typeof raw === 'string' && !raw.trim())) return
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    form.value.remark = JSON.stringify(parsed, null, 2)
  } catch {
    ElMessage.warning('备注不是合法的 JSON 格式')
  }
}

const modelList = ref<AiModel[]>([])
const platformOptions = ref<AiPlatform[]>([])
const modelEnumOptions = ref<AiModelEnumOption[]>([...AI_MODEL_OPTIONS])
const modelTypeOptions = ref<AiModelTypeOption[]>([])
const billingTypeList = ref<AiBillingType[]>([])
const selectedModelKey = ref('')
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref<string[]>([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')

const multiplyByN = ref(false)

const creditConfigData = reactive({
  per_second: { credit_per_second: 0 },
  per_resolution: {
    '480p': 0,
    '540p': 0,
    '720p': 0,
    '1080p': 0,
    '2k': 0,
    '4k': 0,
  },
  per_resolution_duration: {
    '480p': 0,
    '540p': 0,
    '720p': 0,
    '1080p': 0,
    '2k': 0,
    '4k': 0,
  },
  per_quality_resolution: {
    low:    { '1k': 0, '2k': 0, '4k': 0 },
    medium: { '1k': 0, '2k': 0, '4k': 0 },
    high:   { '1k': 0, '2k': 0, '4k': 0 },
  },
  per_task: { credit_per_task: 0 },
})

const queryFilteredModelOptions = computed(() => {
  const type = queryParams.value.modelType
  if (!type || type === 'other') return []
  return modelEnumOptions.value.filter(item => item.modelType === type)
})

const filteredModelEnumOptions = computed(() => {
  const type = form.value.modelType
  if (!type || type === 'other') return []
  const platform = platformOptions.value.find(item => item.platformId === form.value.platformId)
  let options = modelEnumOptions.value.filter(item => item.modelType === type)
  if (platform?.platformCode) {
    options = options.filter(item => item.platformCode === platform.platformCode)
  }
  return options
})

const data = reactive({
  form: {} as AiModel,
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    platformId: undefined,
    modelCode: undefined,
    modelName: undefined,
    modelType: undefined,
    status: undefined
  } as AiModelQuery,
  rules: {
    platformId: [{ required: true, message: '请选择平台', trigger: 'change' }],
    modelCode: [{ required: true, message: '请选择模型', trigger: 'change' }],
    modelName: [{ required: true, message: '模型名称不能为空', trigger: 'blur' }],
    apiUrl: [{ required: true, message: 'API地址不能为空', trigger: 'blur' }],
    billingType: [{ required: true, message: '请选择计费方式', trigger: 'change' }],
    creditConfig: [{ required: true, message: '请配置价格', trigger: 'blur' }],
  }
})

const { queryParams, form, rules } = toRefs(data)

function modelEnumKey(item: AiModelEnumOption) {
  return `${item.platformCode}-${item.modelType}-${item.modelCode}`
}

function parseModelEnumKey(key: string) {
  const parts = key.split('-')
  return { platformCode: Number(parts[0]), modelType: parts[1], modelCode: Number(parts[2]) }
}

function handlePlatformChange() {
  selectedModelKey.value = ''
  form.value.modelCode = undefined
  form.value.platformCode = platformOptions.value.find(item => item.platformId === form.value.platformId)?.platformCode
}

function handleQueryTypeChange() {
  queryParams.value.modelCode = undefined
  queryParams.value.modelName = undefined
}

function handleModelTypeChange() {
  selectedModelKey.value = ''
  form.value.modelCode = undefined
  form.value.modelName = ''
}

function handleModelEnumChange(key: string) {
  const { platformCode, modelType, modelCode } = parseModelEnumKey(key)
  const modelEnum = modelEnumOptions.value.find(
    item => item.platformCode === platformCode && item.modelType === modelType && item.modelCode === modelCode
  )
  if (!modelEnum) return
  form.value.platformCode = platformCode
  form.value.modelCode = modelCode
  form.value.modelType = modelType
  form.value.modelName = modelEnum.modelName
}

function syncSelectedModelKey() {
  if (form.value.platformCode != null && form.value.modelType && form.value.modelCode != null) {
    selectedModelKey.value = `${form.value.platformCode}-${form.value.modelType}-${form.value.modelCode}`
  } else {
    selectedModelKey.value = ''
  }
}

function resetCreditConfigData() {
  multiplyByN.value = false
  creditConfigData.per_second.credit_per_second = 0
  creditConfigData.per_resolution['480p'] = 0
  creditConfigData.per_resolution['540p'] = 0
  creditConfigData.per_resolution['720p'] = 0
  creditConfigData.per_resolution['1080p'] = 0
  creditConfigData.per_resolution['2k'] = 0
  creditConfigData.per_resolution['4k'] = 0
  creditConfigData.per_resolution_duration['480p'] = 0
  creditConfigData.per_resolution_duration['540p'] = 0
  creditConfigData.per_resolution_duration['720p'] = 0
  creditConfigData.per_resolution_duration['1080p'] = 0
  creditConfigData.per_resolution_duration['2k'] = 0
  creditConfigData.per_resolution_duration['4k'] = 0
  for (const q of ['low', 'medium', 'high'] as const) {
    creditConfigData.per_quality_resolution[q]['1k'] = 0
    creditConfigData.per_quality_resolution[q]['2k'] = 0
    creditConfigData.per_quality_resolution[q]['4k'] = 0
  }
  creditConfigData.per_task.credit_per_task = 0
}

function getCreditValue(creditConfig: string | undefined, path: string): string {
  if (!creditConfig) return '-'
  try {
    const cfg = JSON.parse(creditConfig)
    const keys = path.split('.')
    let val: any = cfg
    for (const k of keys) {
      val = val?.[k]
      if (val == null) return '-'
    }
    return String(val)
  } catch {
    return '-'
  }
}

function parseCreditConfig(billingType: string | undefined, creditConfig: string | undefined) {
  if (!billingType || !creditConfig) return
  try {
    const parsed = JSON.parse(creditConfig)
    multiplyByN.value = !!parsed.multiplyByN
    const typeData = parsed[billingType]
    if (!typeData) return
    if (billingType === 'per_second' && typeData.credit_per_second != null) {
      creditConfigData.per_second.credit_per_second = typeData.credit_per_second
    } else if (billingType === 'per_task' && typeData.credit_per_task != null) {
      creditConfigData.per_task.credit_per_task = typeData.credit_per_task
    } else if (billingType === 'per_resolution') {
      for (const res of ['480p', '540p', '720p', '1080p', '2k', '4k'] as const) {
        if (typeData[res] != null) {
          creditConfigData.per_resolution[res] = typeData[res]
        }
      }
    } else if (billingType === 'per_resolution_duration') {
      for (const res of ['480p', '540p', '720p', '1080p', '2k', '4k'] as const) {
        if (typeData[res] != null) {
          creditConfigData.per_resolution_duration[res] = typeData[res]
        }
      }
    } else if (billingType === 'per_quality_resolution') {
      for (const q of ['low', 'medium', 'high'] as const) {
        const qData = typeData[q]
        if (!qData) continue
        for (const r of ['1k', '2k', '4k'] as const) {
          if (qData[r] != null) {
            creditConfigData.per_quality_resolution[q][r] = qData[r]
          }
        }
      }
    }
  } catch (_) {}
}

function filterNonZeroValues(obj: any): any {
  if (obj == null) return undefined
  if (typeof obj !== 'object') {
    return (obj != null && obj > 0) ? obj : undefined
  }
  const result: any = {}
  for (const [key, value] of Object.entries(obj)) {
    const filtered = filterNonZeroValues(value)
    if (filtered !== undefined) {
      result[key] = filtered
    }
  }
  return Object.keys(result).length > 0 ? result : undefined
}

function buildCreditConfig(): string {
  const billingType = form.value.billingType
  if (!billingType) return ''
  const rawData = (creditConfigData as any)[billingType]
  const filteredData = filterNonZeroValues(rawData) || {}
  const config: Record<string, any> = { [billingType]: filteredData }
  if (multiplyByN.value) config.multiplyByN = true
  return JSON.stringify(config)
}

const currentCreditConfigJson = computed(() => {
  const billingType = form.value.billingType
  if (!billingType) return ''
  const rawData = (creditConfigData as any)[billingType]
  const filteredData = filterNonZeroValues(rawData) || {}
  const config: Record<string, any> = { [billingType]: filteredData }
  if (multiplyByN.value) config.multiplyByN = true
  return JSON.stringify(config, null, 2)
})

function modelTypeLabel(code?: string) {
  return modelTypeOptions.value.find(t => t.code === code)?.label || code || '其他'
}

function getBillingTypeInfo(code?: string): string {
  return billingTypeList.value.find(item => item.code === code)?.info || code || ''
}

function modelTypeTagType(code?: string): 'primary' | 'success' | 'info' {
  if (code === 'image') return 'primary'
  if (code === 'video') return 'success'
  return 'info'
}

function loadPlatforms() {
  optionselectPlatform().then(res => {
    platformOptions.value = res.data || []
  })
}

function loadEnums() {
  listAiEnums().then(res => {
    if (res.data?.models?.length) {
      modelEnumOptions.value = res.data.models
    }
    if (res.data?.modelTypes?.length) {
      modelTypeOptions.value = res.data.modelTypes
    }
    if (res.data?.billingTypes?.length) {
      billingTypeList.value = res.data.billingTypes
    }
  }).catch(() => {})
}

function getList() {
  loading.value = true
  listModel(queryParams.value).then(response => {
    modelList.value = response.rows
    total.value = response.total
    initRemarkData(response.rows)
    loading.value = false
  })
}

function copyText(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

function formatJson(raw: string) {
  try { return JSON.stringify(JSON.parse(raw), null, 2) } catch { return raw }
}


function formatConfigJson() {
  const raw = form.value.configJson
  if (raw == null || (typeof raw === 'string' && !raw.trim())) return
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    form.value.configJson = JSON.stringify(parsed, null, 2)
  } catch {
    ElMessage.warning('JSON 格式不正确，无法格式化')
  }
}

function cancel() {
  open.value = false
  reset()
}

function reset() {
  form.value = {
    modelId: undefined,
    platformId: undefined,
    platformCode: undefined,
    modelCode: undefined,
    modelName: undefined,
    modelType: undefined,
    apiUrl: undefined,
    billingType: undefined,
    creditConfig: undefined,
    configJson: undefined,
    sortOrder: 0,
    status: '0',
    remark: REMARK_TEMPLATE
  }
  selectedModelKey.value = ''
  resetCreditConfigData()
  proxy.resetForm('modelRef')
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm('queryRef')
  handleQuery()
}

function handleSelectionChange(selection: AiModel[]) {
  ids.value = selection.map(item => item.modelId!)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

function handleAdd() {
  reset()
  open.value = true
  title.value = '添加模型'
}

function handleUpdate(row?: AiModel) {
  reset()
  const modelId = row?.modelId || ids.value[0]
  getModel(modelId).then(response => {
    form.value = response.data!
    // 确保 configJson 始终为格式化字符串（后端可能返回 JSON object）
    if (form.value.configJson != null) {
      try {
        const parsed = typeof form.value.configJson === 'string' ? JSON.parse(form.value.configJson) : form.value.configJson
        form.value.configJson = JSON.stringify(parsed, null, 2)
      } catch { /* 非 JSON，保持原值 */ }
    }
    // 备注：尝试 JSON 解析并格式化，为空时填入模板
    if (form.value.remark) {
      try {
        const parsed = typeof form.value.remark === 'string' ? JSON.parse(form.value.remark) : form.value.remark
        form.value.remark = JSON.stringify(parsed, null, 2)
      } catch { /* 非 JSON，保持原值 */ }
    } else {
      form.value.remark = REMARK_TEMPLATE
    }
    syncSelectedModelKey()
    resetCreditConfigData()
    parseCreditConfig(form.value.billingType, form.value.creditConfig)
    open.value = true
    title.value = '修改模型'
  })
}

function submitForm() {
  form.value.creditConfig = buildCreditConfig()
  // 提交前自动格式化 configJson，确保格式化效果保存到后端
  if (form.value.configJson) {
    try {
      const parsed = typeof form.value.configJson === 'string' ? JSON.parse(form.value.configJson) : form.value.configJson
      form.value.configJson = JSON.stringify(parsed, null, 2)
    } catch { /* 非 JSON，保持原值 */ }
  }
  // 提交前自动格式化备注 JSON
  if (form.value.remark) {
    try {
      const parsed = typeof form.value.remark === 'string' ? JSON.parse(form.value.remark) : form.value.remark
      form.value.remark = JSON.stringify(parsed, null, 2)
    } catch { /* 非 JSON，保持原值 */ }
  }
  proxy.$refs['modelRef'].validate((valid: boolean) => {
    if (!valid) return
    const action = form.value.modelId ? updateModel(form.value) : addModel(form.value)
    action.then(() => {
      proxy.$modal.msgSuccess(form.value.modelId ? '修改成功' : '新增成功')
      open.value = false
      getList()
    })
  })
}

function handleDelete(row?: AiModel) {
  const modelIds = row?.modelId || ids.value
  proxy.$modal.confirm('是否确认删除模型编号为"' + modelIds + '"的数据项？').then(() => {
    return delModel(modelIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess('删除成功')
  }).catch(() => {})
}

loadEnums()
loadPlatforms()
getList()
</script>

<style scoped>
.resolution-pricing .pricing-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.resolution-pricing .resolution-label {
  width: 50px;
  font-size: 13px;
  color: #606266;
}
.resolution-pricing .credit-unit {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}
.credit-config-text {
  font-size: 12px;
  color: #606266;
  margin-top: 2px;
}
.quality-resolution-pricing .pricing-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 6px;
}
.quality-resolution-pricing .pricing-table th,
.quality-resolution-pricing .pricing-table td {
  border: 1px solid #e4e7ed;
  padding: 8px 6px;
  text-align: center;
}
.quality-resolution-pricing .quality-header {
  background: #f5f7fa;
  font-weight: 500;
  font-size: 13px;
  color: #606266;
  width: 140px;
}
.quality-resolution-pricing .resolution-header {
  background: #f5f7fa;
  font-weight: 500;
  font-size: 13px;
  color: #606266;
}
.quality-resolution-pricing .quality-label {
  background: #fafafa;
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}
.quality-resolution-pricing .price-cell {
  padding: 4px;
}
.quality-resolution-pricing .price-cell .el-input-number {
  width: 120px;
}
.quality-resolution-pricing .credit-unit-hint {
  font-size: 12px;
  color: #909399;
}
.remark-label {
  font-size: 12px;
  color: #606266;
  font-weight: bold;
  margin-bottom: 2px;
}
.price-detail {
  font-size: 12px;
  line-height: 1.4;
}
.price-unit {
  color: #909399;
  font-size: 11px;
  margin-top: 4px;
}
.price-item {
  font-size: 13px;
  color: #303133;
  font-weight: 600;
}
/* 两列网格（per_resolution / per_resolution_duration） */
.display-pricing-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px 12px;
}
.display-pricing-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  line-height: 1.6;
}
.display-resolution-label {
  color: #606266;
  white-space: nowrap;
  min-width: 40px;
}
.display-price-value {
  color: #303133;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
/* 矩阵表格（per_quality_resolution） */
.display-quality-table {
  border-collapse: collapse;
  width: 100%;
  font-size: 12px;
}
.display-quality-table th,
.display-quality-table td {
  border: 1px solid #e4e7ed;
  padding: 3px 6px;
  text-align: center;
}
.display-quality-table th {
  background: #f5f7fa;
  font-weight: 500;
  color: #606266;
}
.display-quality-table .display-quality-label {
  background: #fafafa;
  font-weight: 500;
  color: #606266;
  text-align: left;
  white-space: nowrap;
}
.display-quality-table td:not(.display-quality-label) {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #303133;
}
/* 原 JSON 值展示 */
.original-json-display {
  margin-top: 12px;
  padding: 8px 10px;
  background: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}
.original-json-label {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
  margin-bottom: 4px;
}
.original-json-content {
  margin: 0;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  color: #606266;
  line-height: 1.5;
}
</style>
