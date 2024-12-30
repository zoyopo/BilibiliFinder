<template>
  <div class="container">
    <div class="download-logo fr ac jc">
      <img src="../assets/images/logo.png" alt="">
    </div>
    <div class="download-box">
      <a-input v-model:value="videoUrl" size="large" placeholder="请输入视频地址" @keydown.enter="download" @click.right="showContextmenu">
        <template #addonAfter>
          <ArrowDownOutlined v-if="!loading" :style="{fontSize: '18px', color: '#ffffff'}" @click="download" />
          <LoadingOutlined v-else :style="{fontSize: '18px', color: '#ffffff'}" />
        </template>
      </a-input>
    </div>
    <div class="setting">
      <SettingOutlined :style="{fontSize: '18px'}" @click="settingDrawer.open()" />
    </div>
    <div class="user">
      <UserOutlined :style="{fontSize: '18px'}" @click="userModal.toogleVisible()" />
    </div>
  </div>
  <UserModal ref="userModal" />
  <SettingDrawer ref="settingDrawer" />
  <LoginModal ref="loginModal" />
  <VideoModal ref="videoModal" />
</template>

<script lang="ts" setup>
import { message } from 'ant-design-vue'
import { UserOutlined, ArrowDownOutlined, SettingOutlined, LoadingOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import { store } from '../store'
import { checkUrl, checkLogin, checkUrlRedirect, parseHtml } from '../core/bilibili'
import UserModal from '../components/UserModal/index.vue'
import SettingDrawer from '../components/SettingDrawer/index.vue'
import LoginModal from '../components/LoginModal/index.vue'
import VideoModal from '../components/VideoModal/index.vue'
import { VideoData } from '@/type'

const videoUrl = ref<string | null>(null)
const loading = ref<boolean>(false)
const userModal = ref<any>(null)
const settingDrawer = ref<any>(null)
const loginModal = ref<any>(null)
const videoModal = ref<any>(null)

const showContextmenu = () => {
  window.electron.showContextmenu('home')
}

const download = async () => {
  console.log('download')
  const res = await window.electron.search('cham')
  let videoInfoList:Array<VideoData> = []
  // res.forEach(async (vidUrl:string) => {
  //   const _vidUrl = vidUrl.replace('//', 'https://')
  //   const videoInfo = await handleDownload(_vidUrl)
  //   videoInfoList.push(videoInfo as VideoData)
  // })
  // videoModal.value.open(videoInfoList)
  Promise.all(res.map((vidUrl:string) => vidUrl.replace('//', 'https://')).map((vUrl:string) => handleDownload(vUrl))).then((list:Array<VideoData>) => {
    videoInfoList = list
    videoModal.value.open(videoInfoList)
  }).catch((err:any) => {
    console.log(err)
  })
}

const handleDownload = async (vidUrl:string):Promise<VideoData|undefined> => {
  loading.value = true
  if (!vidUrl) {
    message.warn('请输入视频地址')
    loading.value = false
    return
  }
  const videoType = checkUrl(vidUrl)
  if (!videoType) {
    message.error('请输入正确的视频地址')
    loading.value = false
    return
  }
  // 检查登陆状态
  // if (store.baseStore().allowLogin) {
  //   const status = await checkLogin(store.settingStore().SESSDATA)
  //   store.baseStore().setLoginStatus(status)
  //   if (status === 0) {
  //     loginModal.value.open()
  //     loading.value = false
  //     return
  //   }
  // }
  // 检查是否有重定向
  const { body, url } = await checkUrlRedirect(vidUrl)
  // 解析html
  try {
    const videoInfo = await parseHtml(body, videoType, url) as VideoData
    loading.value = false
    return videoInfo
  } catch (error: any) {
    loading.value = false
    if (error === -1) {
      message.error('解析错误或者不支持当前视频')
    } else {
      message.error(`解析错误：${error}`)
    }
  }
}
</script>

<style lang="less" scoped>
.container{
  box-sizing: border-box;
  padding: 16px;
  position: relative;
  height: calc(100% - 28px);
  .download-logo{
    margin: 130px 0px 50px 0px;
    img{
      transform: scale(.6);
    }
  }
  .download-box{
    padding: 0px 64px;
    :deep(.ant-input-group-addon){
      background: @primary-color;
      border: none;
    }
    .icon{
      color: #ffffff;
      font-size: 18px;
    }
  }
  .setting{
    position: absolute;
    left: 16px;
    bottom: 16px;
    z-index: 100;
    color: @primary-color;
    font-size: 16px;
  }
  .user{
    position: absolute;
    right: 16px;
    bottom: 16px;
    z-index: 100;
    color: @primary-color;
    font-size: 16px;
  }
}
</style>
