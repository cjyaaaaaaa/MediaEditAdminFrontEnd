<template>
  <div class="app-container email-template-page">
    <div class="page-heading">
      <div>
        <h2>邮件模板</h2>
        <p>统一管理业务邮件及其多语言版本，请确保每个模板至少有一种语言。</p>
      </div>
      <el-button type="primary" icon="Plus" @click="handleAdd" v-hasPermi="['system:emailTemplate:add']">
        新建模板
      </el-button>
    </div>

    <el-card v-show="showSearch" class="filter-card" shadow="never">
      <el-form ref="queryRef" :model="queryParams" :inline="true" label-position="top">
        <el-form-item label="所属站点" prop="site">
          <el-select v-model="queryParams.site" clearable filterable placeholder="全部站点" style="width: 210px">
            <el-option v-for="site in siteOptions" :key="site.code" :label="site.label" :value="site.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="业务标签" prop="tag">
          <el-select v-model="queryParams.tag" clearable filterable placeholder="全部标签" style="width: 240px">
            <el-option v-for="tag in tagOptions" :key="tag.code" :label="`${tag.description} · ${tag.code}`" :value="tag.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="模板名称" prop="templateName">
          <el-input v-model="queryParams.templateName" clearable placeholder="输入模板名称" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" clearable placeholder="全部" style="width: 140px">
            <el-option v-for="item in sys_normal_disable" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item class="filter-actions">
          <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <div class="table-toolbar">
        <div>
          <el-button icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['system:emailTemplate:edit']">修改</el-button>
          <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['system:emailTemplate:remove']">删除</el-button>
        </div>
        <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
      </div>

      <el-table v-loading="loading" :data="rows" row-key="templateId" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="48" />
        <el-table-column label="模板" min-width="210">
          <template #default="scope">
            <div class="template-name">{{ scope.row.templateName }}</div>
            <div class="template-tag">{{ tagLabel(scope.row.tag) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="发件人" prop="fromAlias" min-width="130" />
        <el-table-column label="所属站点" min-width="150">
          <template #default="scope">
            <el-tag v-if="scope.row.site" type="info" effect="plain">{{ siteLabel(scope.row.site) }}</el-tag>
            <el-tag v-else type="warning" effect="plain">默认站点域</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="语言版本" min-width="250">
          <template #default="scope">
            <div v-if="scope.row.availableLocales?.length" class="locale-list">
              <el-tag
                v-for="locale in scope.row.availableLocales"
                :key="locale"
                :type="locale === scope.row.defaultLocale ? 'primary' : 'info'"
                effect="light"
              >
                {{ localeLabel(locale) }}<span v-if="locale === scope.row.defaultLocale"> · 默认</span>
              </el-tag>
            </div>
            <el-text v-else type="danger">未配置语言</el-text>
          </template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="90">
          <template #default="scope"><dict-tag :options="sys_normal_disable" :value="scope.row.status" /></template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="170">
          <template #default="scope">{{ parseTime(scope.row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="210" fixed="right">
          <template #default="scope">
            <el-button link type="primary" icon="Message" @click="handleTest(scope.row)" v-hasPermi="['system:emailTemplate:sendTest']">测试</el-button>
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:emailTemplate:edit']">编辑</el-button>
            <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:emailTemplate:remove']">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无邮件模板，可以先新建一个。" />
        </template>
      </el-table>
      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <el-dialog :title="title" v-model="open" width="1120px" top="4vh" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <section class="form-section">
          <div class="section-heading">
            <div><h3>基础信息</h3><p>标签用于业务代码选择模板，创建后不可修改。</p></div>
          </div>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="所属站点" prop="site">
                <el-select v-model="form.site" style="width: 100%" placeholder="选择站点">
                  <el-option v-for="site in siteOptions" :key="site.code" :label="site.label" :value="site.code" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8"><el-form-item label="模板名称" prop="templateName"><el-input v-model="form.templateName" maxlength="100" show-word-limit placeholder="例：客户邮箱验证码" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="业务标签" prop="tag"><el-select v-model="form.tag" :disabled="!!form.templateId" style="width: 100%" placeholder="选择业务标签"><el-option v-for="tag in tagOptions" :key="tag.code" :label="`${tag.description} · ${tag.code}`" :value="tag.code" /></el-select></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="发件人名称" prop="fromAlias"><el-input v-model="form.fromAlias" maxlength="100" placeholder="例：MediaEdit" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="默认语言" prop="defaultLocale"><el-select v-model="form.defaultLocale" style="width: 100%"><el-option v-for="content in form.contents" :key="content.locale" :label="localeLabel(content.locale)" :value="content.locale" /></el-select></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="状态"><el-radio-group v-model="form.status"><el-radio v-for="item in sys_normal_disable" :key="item.value" :value="item.value">{{ item.label }}</el-radio></el-radio-group></el-form-item></el-col>
          </el-row>
        </section>

        <section class="form-section language-section">
          <div class="section-heading">
            <div><h3>多语言内容</h3><p>每个语言独立维护主题和正文，请保持模板变量一致。</p></div>
            <div class="language-adder">
              <el-select v-model="pendingLocale" :disabled="!canAddLanguage" placeholder="选择要添加的语言" style="width: 220px">
                <el-option
                  v-for="option in localeOptions"
                  :key="option.code"
                  :label="`${option.description} · ${option.code}`"
                  :value="option.code"
                  :disabled="isLocaleUsed(option.code, '')"
                />
              </el-select>
              <el-button type="primary" plain icon="Plus" :disabled="!pendingLocale" @click="addLanguage">添加</el-button>
            </div>
          </div>
          <el-tabs v-model="activeLocale" type="border-card" closable @tab-remove="removeLanguage">
            <el-tab-pane v-for="content in form.contents" :key="content.locale" :name="content.locale">
              <template #label>
                <span>{{ localeLabel(content.locale) }}</span>
                <el-tag v-if="content.locale === form.defaultLocale" size="small" class="default-badge">默认</el-tag>
              </template>
              <el-alert v-if="!isContentComplete(content)" title="该语言内容尚未填写完整" type="warning" :closable="false" show-icon class="content-alert" />
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item label="语言">
                    <el-select v-model="content.locale" filterable style="width: 100%" @change="activeLocale = content.locale">
                      <el-option v-for="option in localeOptions" :key="option.code" :label="`${option.description} · ${option.code}`" :value="option.code" :disabled="isLocaleUsed(option.code, content.locale)" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="16"><el-form-item label="邮件主题"><el-input v-model="content.subject" maxlength="255" show-word-limit placeholder="输入该语言的邮件主题" /></el-form-item></el-col>
              </el-row>
              <el-form-item label="HTML 正文"><editor v-model="content.htmlContent" :min-height="240" /></el-form-item>
              <el-form-item label="纯文本正文"><el-input v-model="content.textContent" type="textarea" :rows="6" resize="vertical" placeholder="用于不支持 HTML 的邮件客户端" /></el-form-item>
            </el-tab-pane>
          </el-tabs>
        </section>

        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="3" maxlength="500" show-word-limit /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="open = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">保存模板</el-button>
      </template>
    </el-dialog>

    <el-dialog title="测试发送" v-model="testOpen" width="620px" append-to-body>
      <el-alert title="测试邮件会使用当前已保存的模板内容。" type="info" :closable="false" show-icon class="test-alert" />
      <el-form ref="testRef" :model="testForm" label-position="top">
        <el-form-item label="模板站点"><el-input :model-value="siteLabel(testTemplate.site, '默认站点域')" disabled /></el-form-item>
        <el-form-item label="收件邮箱" required><el-input v-model="testForm.recipient" placeholder="name@example.com" /></el-form-item>
        <el-form-item label="发送语言"><el-select v-model="testForm.locale" style="width: 100%"><el-option v-for="content in testTemplate.contents" :key="content.locale" :label="localeLabel(content.locale)" :value="content.locale" /></el-select></el-form-item>
        <el-divider content-position="left">模板变量</el-divider>
        <el-empty v-if="!testTemplate.variableNames?.length" :image-size="60" description="该模板没有变量" />
        <el-form-item v-for="name in testTemplate.variableNames" :key="name" :label="name" required><el-input v-model="testForm.variables[name]" :placeholder="`输入 {{${name}}} 的测试值`" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="testOpen = false">取消</el-button><el-button type="primary" :loading="testing" @click="submitTest">发送测试</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="EmailTemplate">
import { addEmailTemplate, delEmailTemplate, getEmailTemplate, getEmailTemplateLocales, getEmailTemplateTags, listEmailTemplate, testSendEmail, updateEmailTemplate } from '@/api/system/emailTemplate'
import { listCustomerSiteOptions } from '@/api/system/customerSite'
import type { EmailTemplate, EmailTemplateContent, EmailTemplateLocaleOption, EmailTemplateQuery, EmailTemplateTagOption } from '@/api/system/emailTemplate'
import type { CustomerSiteOption } from '@/api/system/customerSite'

const { proxy } = getCurrentInstance() as any
const { sys_normal_disable } = proxy.useDict('sys_normal_disable')

const rows = ref<EmailTemplate[]>([])
const tagOptions = ref<EmailTemplateTagOption[]>([])
const siteOptions = ref<CustomerSiteOption[]>([])
const localeOptions = ref<EmailTemplateLocaleOption[]>([])
const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const showSearch = ref(true)
const open = ref(false)
const testOpen = ref(false)
const total = ref(0)
const single = ref(true)
const multiple = ref(true)
const ids = ref<string[]>([])
const title = ref('')
const activeLocale = ref('en')
const pendingLocale = ref('')
const queryParams = reactive<EmailTemplateQuery>({ pageNum: 1, pageSize: 10 })
const emptyContent = (locale = 'en'): EmailTemplateContent => ({ locale, subject: '', htmlContent: '', textContent: '' })
const form = ref<EmailTemplate>({ site: '', status: '0', defaultLocale: 'en', fromAlias: 'MediaEdit', contents: [emptyContent()] })
const testTemplate = ref<EmailTemplate>({ contents: [], variableNames: [] })
const testForm = reactive({ recipient: '', locale: 'zh-CN', variables: {} as Record<string, string> })
const canAddLanguage = computed(() => (form.value.contents?.length || 0) < localeOptions.value.length)
const rules = {
  site: [{ required: true, message: '请选择所属站点', trigger: 'change' }],
  templateName: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  tag: [{ required: true, message: '请选择业务标签', trigger: 'change' }],
  defaultLocale: [{ required: true, message: '请选择默认语言', trigger: 'change' }],
  fromAlias: [{ required: true, message: '请输入发件人名称', trigger: 'blur' }]
}

function localeLabel(locale?: string) {
  const option = localeOptions.value.find((item: EmailTemplateLocaleOption) => item.code === locale)
  return option ? `${option.description} · ${option.code}` : (locale || '-')
}

function tagLabel(tag?: string) {
  const option = tagOptions.value.find((item: EmailTemplateTagOption) => item.code === tag)
  return option ? `${option.description} · ${option.code}` : (tag || '-')
}

function siteLabel(site?: string, emptyLabel = '-') {
  return siteOptions.value.find(item => item.code === site)?.label || site || emptyLabel
}

function isContentComplete(content: EmailTemplateContent) {
  return Boolean(content.locale && content.subject.trim() && content.htmlContent.trim() && content.textContent.trim())
}

function isLocaleUsed(locale: string, currentLocale: string) {
  return locale !== currentLocale && Boolean(form.value.contents?.some((item: EmailTemplateContent) => item.locale === locale))
}

async function getList() {
  loading.value = true
  try {
    const response = await listEmailTemplate(queryParams)
    rows.value = response.rows
    total.value = response.total
  } finally {
    loading.value = false
  }
}

function handleQuery() { queryParams.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function handleSelectionChange(selection: EmailTemplate[]) { ids.value = selection.map(item => item.templateId!); single.value = selection.length !== 1; multiple.value = !selection.length }

function reset() {
  form.value = { site: '', status: '0', defaultLocale: 'en', fromAlias: 'MediaEdit', contents: [emptyContent()] }
  activeLocale.value = 'en'
  pendingLocale.value = ''
  proxy.resetForm('formRef')
}

function handleAdd() { reset(); title.value = '新建邮件模板'; open.value = true }

async function handleUpdate(row?: EmailTemplate) {
  const templateId = row?.templateId || ids.value[0]
  const response = await getEmailTemplate(templateId)
  form.value = { ...response.data!, site: response.data!.site || '' }
  activeLocale.value = response.data!.defaultLocale!
  pendingLocale.value = ''
  title.value = '编辑邮件模板'
  open.value = true
}

function addLanguage() {
  if (!pendingLocale.value || isLocaleUsed(pendingLocale.value, '')) return
  form.value.contents!.push(emptyContent(pendingLocale.value))
  activeLocale.value = pendingLocale.value
  pendingLocale.value = ''
}

function removeLanguage(name: string | number) {
  if ((form.value.contents?.length || 0) <= 1) {
    proxy.$modal.msgWarning('至少保留一个语言版本')
    return
  }
  const locale = String(name)
  form.value.contents = form.value.contents!.filter((item: EmailTemplateContent) => item.locale !== locale)
  if (form.value.defaultLocale === locale) form.value.defaultLocale = form.value.contents[0].locale
  activeLocale.value = form.value.defaultLocale!
}

function validateContents() {
  const contents = form.value.contents || []
  if (!contents.length) return '至少添加一个语言版本'
  const locales = new Set<string>()
  for (const content of contents) {
    if (!isContentComplete(content)) return `请完整填写「${localeLabel(content.locale)}」的主题和正文`
    if (locales.has(content.locale)) return `语言「${localeLabel(content.locale)}」重复`
    locales.add(content.locale)
  }
  if (!locales.has(form.value.defaultLocale!)) return '默认语言必须存在对应的内容'
  return ''
}

function submit() {
  proxy.$refs.formRef.validate(async (valid: boolean) => {
    if (!valid) return
    const error = validateContents()
    if (error) { proxy.$modal.msgError(error); return }
    saving.value = true
    try {
      if (form.value.templateId) await updateEmailTemplate(form.value)
      else await addEmailTemplate(form.value)
      proxy.$modal.msgSuccess('保存成功')
      open.value = false
      getList()
    } finally {
      saving.value = false
    }
  })
}

function handleDelete(row?: EmailTemplate) {
  const target = row?.templateId || ids.value
  const name = row?.templateName || `选中的 ${ids.value.length} 个模板`
  proxy.$modal.confirm(`确认删除「${name}」？`).then(() => delEmailTemplate(target)).then(() => {
    proxy.$modal.msgSuccess('删除成功')
    getList()
  }).catch(() => {})
}

async function handleTest(row: EmailTemplate) {
  const response = await getEmailTemplate(row.templateId!)
  testTemplate.value = response.data!
  testForm.recipient = ''
  testForm.locale = response.data!.defaultLocale!
  testForm.variables = {}
  response.data!.variableNames?.forEach((name: string) => { testForm.variables[name] = '' })
  testOpen.value = true
}

async function submitTest() {
  if (!/^\S+@\S+\.\S+$/.test(testForm.recipient)) { proxy.$modal.msgError('请输入有效的收件邮箱'); return }
  const missing = testTemplate.value.variableNames?.find((name: string) => !testForm.variables[name]?.trim())
  if (missing) { proxy.$modal.msgError(`请输入变量 ${missing}`); return }
  testing.value = true
  try {
    const response = await testSendEmail({ site: testTemplate.value.site, tag: testTemplate.value.tag!, locale: testForm.locale, recipient: testForm.recipient, variables: testForm.variables })
    proxy.$modal.msgSuccess(`已受理，发送记录 ID：${response.data?.sendLogId}`)
    testOpen.value = false
  } finally {
    testing.value = false
  }
}

getEmailTemplateTags().then(response => { tagOptions.value = response.data || [] })
listCustomerSiteOptions().then(response => { siteOptions.value = response.data || [] })
getEmailTemplateLocales().then(response => { localeOptions.value = response.data || [] })
getList()
</script>

<style scoped>
.email-template-page { background: var(--el-fill-color-lighter); min-height: calc(100vh - 84px); }
.page-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.page-heading h2 { margin: 0 0 6px; color: var(--el-text-color-primary); font-size: 22px; }
.page-heading p, .section-heading p { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; }
.filter-card { margin-bottom: 16px; }
.filter-card :deep(.el-card__body) { padding-bottom: 2px; }
.filter-card :deep(.el-form-item) { margin-bottom: 16px; }
.filter-actions { padding-top: 30px; }
.table-card :deep(.el-card__body) { padding: 0 18px 18px; }
.table-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 16px 0; }
.template-name { color: var(--el-text-color-primary); font-weight: 600; }
.template-tag { margin-top: 4px; color: var(--el-text-color-secondary); font-size: 12px; }
.locale-list { display: flex; flex-wrap: wrap; gap: 6px; }
.form-section { padding: 0 2px 22px; }
.language-section { border-top: 1px solid var(--el-border-color-lighter); padding-top: 20px; }
.section-heading { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; }
.section-heading h3 { margin: 0 0 5px; color: var(--el-text-color-primary); font-size: 16px; }
.language-adder { display: flex; align-items: center; gap: 8px; }
.default-badge { margin-left: 7px; }
.content-alert, .test-alert { margin-bottom: 18px; }
:deep(.el-tabs--border-card) { border-radius: 6px; box-shadow: none; }
:deep(.el-tabs--border-card > .el-tabs__content) { padding: 22px; }
@media (max-width: 900px) {
  .page-heading { align-items: flex-start; gap: 16px; }
  .filter-actions { padding-top: 0; }
}
</style>
