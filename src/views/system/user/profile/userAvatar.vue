<template>
  <div class="user-info-head" @click="editCropper()">
    <img :key="avatarRefreshKey" :src="displayAvatar" title="点击上传头像" class="img-circle img-lg" />
    <el-dialog :title="title" v-model="open" width="800px" append-to-body @opened="modalOpened" @close="closeDialog">
      <el-row>
        <el-col :xs="24" :md="12" :style="{ height: '350px' }">
          <vue-cropper
            ref="cropper"
            :img="options.img"
            :info="true"
            :autoCrop="options.autoCrop"
            :autoCropWidth="options.autoCropWidth"
            :autoCropHeight="options.autoCropHeight"
            :fixedBox="options.fixedBox"
            :outputType="options.outputType"
            @realTime="realTime"
            v-if="visible"
          />
        </el-col>
        <el-col :xs="24" :md="12" :style="{ height: '350px' }">
          <div class="avatar-upload-preview">
            <img :src="options.previews.url" :style="options.previews.img" />
          </div>
        </el-col>
      </el-row>
      <br />
      <el-row>
        <el-col :lg="2" :md="2">
          <el-upload
            action="#"
            :http-request="requestUpload"
            :show-file-list="false"
            :before-upload="beforeUpload"
          >
            <el-button>
              选择
              <el-icon class="el-icon--right"><Upload /></el-icon>
            </el-button>
          </el-upload>
        </el-col>
        <el-col :lg="{ span: 1, offset: 2 }" :md="2">
          <el-button icon="Plus" @click="changeScale(1)"></el-button>
        </el-col>
        <el-col :lg="{ span: 1, offset: 1 }" :md="2">
          <el-button icon="Minus" @click="changeScale(-1)"></el-button>
        </el-col>
        <el-col :lg="{ span: 1, offset: 1 }" :md="2">
          <el-button icon="RefreshLeft" @click="rotateLeft()"></el-button>
        </el-col>
        <el-col :lg="{ span: 1, offset: 1 }" :md="2">
          <el-button icon="RefreshRight" @click="rotateRight()"></el-button>
        </el-col>
        <el-col :lg="{ span: 2, offset: 6 }" :md="2">
          <el-button type="primary" @click="uploadImg()">提 交</el-button>
        </el-col>
      </el-row>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import "vue-cropper/dist/index.css"
import { VueCropper } from "vue-cropper"
import { uploadAdminObject } from "@/api/system/object"
import { getCurrentAvatarImage, updateAvatar } from "@/api/system/user"
import useUserStore from "@/store/modules/user"
import { resolveResourceUrl } from "@/utils/objectStorageUpload"

const userStore = useUserStore()
const { proxy } = getCurrentInstance()

const open = ref<boolean>(false)
const visible = ref<boolean>(false)
const title = ref<string>("修改头像")
/** 强制刷新圆角头像，避免与上一张 对象存储地址相同导致浏览器缓存不更新 */
const avatarRefreshKey = ref(0)

/** 头像栏展示用（对象存储完整 URL，避免与裁剪用 blob 混淆） */
const displayAvatar = computed(() => {
  const v = userStore.avatar
  if (!v) {
    return ''
  }
  return resolveResourceUrl(v) || v
})

let cropperBlobUrl: string | null = null

function revokeCropperBlob() {
  if (cropperBlobUrl) {
    URL.revokeObjectURL(cropperBlobUrl)
    cropperBlobUrl = null
  }
}

/**
 * vue-cropper 在 canvas 中绘制外链图片需跨域授权。
 * 对象存储头像由后端按当前登录用户读取，再转为 blob: 供裁剪器使用。
 */
async function prepareImageForCropper() {
  revokeCropperBlob()
  const src = displayAvatar.value
  if (!src) {
    options.img = ''
    return
  }
  if (src.startsWith('data:')) {
    options.img = src
    return
  }
  if (!/^https?:\/\//i.test(src)) {
    options.img = src
    return
  }
  try {
    const blob = await getCurrentAvatarImage()
    if (!blob || blob.size === 0) {
      throw new Error('invalid avatar image')
    }
    cropperBlobUrl = URL.createObjectURL(blob)
    options.img = cropperBlobUrl
  } catch {
    options.img = src
  }
}

const options = reactive<any>({
  img: '',
  autoCrop: true,
  autoCropWidth: 200,
  autoCropHeight: 200,
  fixedBox: true,
  outputType: "png",
  filename: 'avatar',
  previews: {}
})

function editCropper() {
  open.value = true
}

async function modalOpened() {
  await prepareImageForCropper()
  await nextTick()
  visible.value = true
}

function requestUpload() {}

function rotateLeft() {
  proxy.$refs.cropper.rotateLeft()
}

function rotateRight() {
  proxy.$refs.cropper.rotateRight()
}

function changeScale(num: number) {
  num = num || 1
  proxy.$refs.cropper.changeScale(num)
}

function beforeUpload(file: File) {
  if (file.type.indexOf("image/") == -1) {
    proxy.$modal.msgError("文件格式错误，请上传图片类型,如：JPG，PNG后缀的文件。")
  } else {
    revokeCropperBlob()
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      options.img = reader.result
      options.filename = file.name
    }
  }
}

function uploadImg() {
  proxy.$refs.cropper.getCropBlob((data: Blob) => {
    const formData = new FormData()
    formData.append("file", data, options.filename)
    formData.append("directory", "admin-avatar")
    uploadAdminObject(formData).then(async (response) => {
      const raw = response.data?.url || response.data?.fileName || ''
      if (!raw) {
        proxy.$modal.msgError('未获取到头像地址')
        return
      }
      await updateAvatar(raw)
      const display = resolveResourceUrl(raw)
      if (!display) {
        proxy.$modal.msgError('未获取到头像地址')
        return
      }
      userStore.avatar = display
      avatarRefreshKey.value += 1
      visible.value = false
      revokeCropperBlob()
      options.img = ''
      open.value = false
      proxy.$modal.msgSuccess("修改成功")
    })
  })
}

function realTime(data: any) {
  options.previews = data
}

function closeDialog() {
  visible.value = false
  revokeCropperBlob()
  options.img = ''
}

onUnmounted(() => {
  revokeCropperBlob()
})
</script>

<style lang='scss' scoped>
.user-info-head {
  position: relative;
  display: inline-block;
  height: 120px;
}

.user-info-head:hover:after {
  content: "+";
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  color: #eee;
  background: rgba(0, 0, 0, 0.5);
  font-size: 24px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  cursor: pointer;
  line-height: 110px;
  border-radius: 50%;
}
</style>
