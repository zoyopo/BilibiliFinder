<template>
  <a-modal
    width="750px"
    wrapClassName="custom-modal-padding"
    :visible="visible"
    :confirmLoading="confirmLoading"
    :okButtonProps="{ disabled: !(quality !== -1 && selected.length !== 0) }"
    :closable="true"
    :maskClosable="false"
    title="当前视频信息"
    okText="下载"
    cancelText="全选"
    @cancel="handleAllSelectToggle"
    @ok="handleDownload">
    <div class="custom-scroll-bar-4-modal">
      <div class="video-modal" style="overflow: hidden" v-for="(videoInfo,videoIndex) in videoInfoList" :key="videoInfo.url">
        <div class="video-info fr">
          <div class="image">
            <a-image :src="videoInfo.cover" />
          </div>
          <div class="content fc jsa pl16">
            <div class="text-active ellipsis-2" @click="openBrowser(videoInfo.url)">{{ videoInfo.title }}</div>
            <div class="ellipsis-1">up：<span v-for="(item, index) in videoInfo.up" :key="index" class="text-active mr8" @click="openBrowser(`https://space.bilibili.com/${item.mid}`)">{{item.name}}</span></div>
          </div>
        </div>
        <div class="mt16">
          选择清晰度：
          <div class="mt8">
            <a-radio-group v-model:value="quality">
              <a-radio class="custom-radio" v-for="(item, index) in videoInfo.qualityOptions" :key="index" :value="item.value">
                {{ item.label }}
              </a-radio>
            </a-radio-group>
          </div>
        </div>
        <div v-if="videoInfo.page && videoInfo.page.length > 1" class="fr ac jsb mt16">
          <div>这是一个多P视频，请选择</div>

        </div>
        <div v-if="videoInfo.page && videoInfo.page.length > 1" class="fr ac warp mt16">
          <div v-for="(item, index) in videoInfo.page" :key="index" :class="['video-item', selected.includes(item.page) ? 'active' : '']" @click="toggle(item.page,videoIndex)">
            <a-tooltip>
              <template #title>
                {{ item.title }}
              </template>
              <span class="ellipsis-1">{{ item.title }}</span>
            </a-tooltip>
          </div>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script lang="ts" setup>
import { ref, toRaw } from 'vue'
import { useRouter } from 'vue-router'
import { store } from '../../store'
import { getDownloadList, addDownload } from '../../core/bilibili'
import { userQuality } from '../../assets/data/quality'
import { VideoData } from '../../type'
import { videoData } from '../../assets/data/default'
import { sleep } from '../../utils'

const visible = ref<boolean>(false)
const confirmLoading = ref<boolean>(false)
const quality = ref<number>(-1)
const videoInfoList = ref<Array<VideoData>>([videoData])
const selected = ref<Array<number[]>>([] as [])
const allSelected = ref<boolean>(false)
const router = useRouter()
const isAllSelected = ref(false)

const handleAllSelectToggle = () => {
  // visible.value = false
  // confirmLoading.value = false
  // quality.value = -1
  // selected.value = []
  onAllSelectedChange(isAllSelected.value)
}

const handleDownload = async () => {
  confirmLoading.value = true
  Promise.all(videoInfoList.value.map((videoInfo: any) => getDownloadList(videoInfo, toRaw(selected.value), quality.value))).then((downloadLists) => {
    Promise.all(downloadLists.map((list) => {
      return downloadByDownloadList(list)
    })).then(res => {
      router.push({ name: 'download' })
    })
    console.log('下载完成')
  }).catch((err: any) => {
    console.log(err)
  })
  // 获取当前选中视频的下载数据
  // const list = await getDownloadList(toRaw(videoInfo.value), toRaw(selected.value), quality.value)
}

const downloadByDownloadList = async (list:any) => {
  console.log(list)
  const taskList = addDownload(list)
  store.taskStore().setTask(taskList)
  let count = 0
  let selectedTask = ''
  for (const key in taskList) {
    const task = taskList[key]
    if (task.status === 1) {
      window.electron.downloadVideo(task)
      count += 1
      if (!selectedTask) selectedTask = task.id
    }
    await sleep(300)
  }
  store.baseStore().addDownloadingTaskCount(count)
  confirmLoading.value = false
  visible.value = false
  store.taskStore().setRightTaskId(selectedTask)
}

const open = (data: Array<VideoData>) => {
  // const quality = userQuality[store.baseStore().loginStatus]
  // data.qualityOptions.filter((item: any) => quality.includes(item.value))
  videoInfoList.value = data
  visible.value = true
  // 如果是单p，则默认选中
  // if (videoInfo.value.page.length === 1) {
  videoInfoList.value.forEach((videoInfo: any) => {
    selected.value.push([videoInfo.value.page[0].page])
  })
}

const onAllSelectedChange = (_isAllSelected: boolean) => {
  // allSelected.value = e.target.checked
  // selected.value = []
  // if (e.target.checked) {

  if (!_isAllSelected) {
    videoInfoList.value.forEach((videoInfo: any) => {
      const vds:any = []
      videoInfo.value.page.forEach((element: any) => {
        vds.push(element.page)
        selected.value.push(vds)
      })
    })
    isAllSelected.value = true
  } else {
    const result:any = []
    videoInfoList.value.forEach((videoInfo: any) => {
      result.push([])
    })
    selected.value = result
    isAllSelected.value = false
  }
  // }
}

const toggle = (page: number, videoIndex:number) => {
  const index = selected.value[videoIndex].indexOf(page)
  if (index === -1) {
    selected.value[videoIndex].push(page)
  } else {
    selected.value[videoIndex].splice(index, 1)
  }
}

const openBrowser = (url: string) => {
  window.electron.openBrowser(url)
}

defineExpose({
  open
})

</script>

<style scoped lang="less">
.video-modal{
  height: 260px;
  overflow-y: overlay;
  .video-info{
    height: 71.25px;
    .image{
      flex: none;
      width: 114px;
      overflow: hidden;
      position: relative;
      img{
        display: block;
        width: 100%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
    }
    .content{
      box-sizing: border-box;
      flex: none;
      width: 358px;
    }
  }
  .video-item{
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    width: 100px;
    height: 50px;
    border: 1px solid #eeeeee;
    background: #ffffff;
    margin: 0px 18px 18px 0px;
    padding: 8px;
    cursor: pointer;
    overflow: hidden;
    user-select: none;
    &.active{
      color: #ffffff;
      background: @primary-color;
      border: 1px solid @primary-color;
    }
  }
}
.custom-radio{
  width: 130px;
}
</style>
