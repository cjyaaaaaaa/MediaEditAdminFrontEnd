<template>
  <div class="app-container">
    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch">
      <el-form-item label="标签编码" prop="tagCode"><el-input v-model="queryParams.tagCode" clearable @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item label="标签名称" prop="tagName"><el-input v-model="queryParams.tagName" clearable @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item label="状态" prop="status"><el-select v-model="queryParams.status" clearable style="width: 120px"><el-option v-for="d in sys_normal_disable" :key="d.value" :label="d.label" :value="d.value" /></el-select></el-form-item>
      <el-form-item><el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button><el-button icon="Refresh" @click="resetQuery">重置</el-button></el-form-item>
    </el-form>
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['system:emailTag:add']">新增</el-button></el-col>
      <el-col :span="1.5"><el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['system:emailTag:edit']">修改</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['system:emailTag:remove']">删除</el-button></el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>
    <el-table v-loading="loading" :data="rows" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" /><el-table-column label="ID" prop="tagId" width="80" />
      <el-table-column label="标签名称" prop="tagName" /><el-table-column label="标签编码" prop="tagCode" />
      <el-table-column label="状态" prop="status" width="100"><template #default="s"><dict-tag :options="sys_normal_disable" :value="s.row.status" /></template></el-table-column>
      <el-table-column label="创建时间" prop="createTime" width="180"><template #default="s">{{ parseTime(s.row.createTime) }}</template></el-table-column>
      <el-table-column label="操作" width="150"><template #default="s"><el-button link type="primary" icon="Edit" @click="handleUpdate(s.row)" v-hasPermi="['system:emailTag:edit']">修改</el-button><el-button link type="primary" icon="Delete" @click="handleDelete(s.row)" v-hasPermi="['system:emailTag:remove']">删除</el-button></template></el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    <el-dialog :title="title" v-model="open" width="560px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="标签名称" prop="tagName"><el-input v-model="form.tagName" maxlength="100" /></el-form-item>
        <el-form-item label="标签编码" prop="tagCode"><el-input v-model="form.tagCode" maxlength="64" :disabled="!!form.tagId" /></el-form-item>
        <el-form-item label="状态" prop="status"><el-radio-group v-model="form.status"><el-radio v-for="d in sys_normal_disable" :key="d.value" :value="d.value">{{ d.label }}</el-radio></el-radio-group></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" @click="submit">确定</el-button><el-button @click="open=false">取消</el-button></template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts" name="EmailTag">
import { addEmailTag, delEmailTag, getEmailTag, listEmailTag, updateEmailTag } from '@/api/system/emailTag'
import type { EmailTagQuery } from '@/api/system/emailTag'
import type { EmailTag } from '@/api/system/emailTemplate'
const { proxy } = getCurrentInstance() as any
const { sys_normal_disable } = proxy.useDict('sys_normal_disable')
const rows = ref<EmailTag[]>([]), loading = ref(false), showSearch = ref(true), open = ref(false), total = ref(0), single = ref(true), multiple = ref(true), ids = ref<number[]>([]), title = ref('')
const queryParams = reactive<EmailTagQuery>({ pageNum: 1, pageSize: 10 })
const form = ref<EmailTag>({ status: '0' })
const rules = { tagName: [{ required: true, message: '标签名称不能为空', trigger: 'blur' }], tagCode: [{ required: true, message: '标签编码不能为空', trigger: 'blur' }] }
function getList() { loading.value = true; listEmailTag(queryParams).then(r => { rows.value=r.rows; total.value=r.total }).finally(() => loading.value=false) }
function handleQuery() { queryParams.pageNum=1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function handleSelectionChange(v: EmailTag[]) { ids.value=v.map(i=>i.tagId!); single.value=v.length!==1; multiple.value=!v.length }
function reset() { form.value={ status:'0' }; proxy.resetForm('formRef') }
function handleAdd() { reset(); title.value='新增邮件标签'; open.value=true }
function handleUpdate(row?: EmailTag) { const id=row?.tagId||ids.value[0]; getEmailTag(id).then(r=>{form.value=r.data!; title.value='修改邮件标签'; open.value=true}) }
function submit() { proxy.$refs.formRef.validate((valid:boolean)=>{ if(!valid)return; (form.value.tagId?updateEmailTag(form.value):addEmailTag(form.value)).then(()=>{proxy.$modal.msgSuccess('保存成功');open.value=false;getList()}) }) }
function handleDelete(row?: EmailTag) { const target=row?.tagId||ids.value; proxy.$modal.confirm(`确认删除标签 ${target}？`).then(()=>delEmailTag(target)).then(()=>{proxy.$modal.msgSuccess('删除成功');getList()}).catch(()=>{}) }
getList()
</script>
