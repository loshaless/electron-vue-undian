<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { PageName } from '../constants/enum/PageName';
import { IpcChannels } from '../constants/enum/IpcChannels';
import SelectComponent from '../components/SelectComponent.vue';

/* CHANGE PAGE */
function changePage(pageName: PageName) {
  backgroundName.value = pageName
  window.ipcRenderer.send(IpcChannels.CHANGE_PAGE, pageName)
}

/* UPLOAD BACKGROUND */
const backgroundName = ref(PageName.HOME)
function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;

  if (input.files?.[0]) {
    const file = input.files[0]
    const reader = new FileReader();
    reader.onload = (e) => {
      window.ipcRenderer.send(IpcChannels.UPLOAD_IMAGE_TO_DB, reader.result, backgroundName.value)
    };
    reader.readAsDataURL(file);
  }
}

/* GET CATEGORY */
const categoryOptions = ref([])
onMounted(() => {
  window.ipcRenderer.send(IpcChannels.GET_CATEGORY_JOIN_PRIZE)
})

const selectedCategoryId = ref<number>(0)
window.ipcRenderer.on(IpcChannels.GET_CATEGORY_JOIN_PRIZE, (event, category) => {
  categoryOptions.value = category
})

/* SCROLL SPEED */
const scrollTime = ref<number>(5000)
function sendScrollTimeSettings() {
  window.ipcRenderer.send(IpcChannels.WINNER_PAGE_SET_SCROLL_TIME, scrollTime.value)
}

/* scroll state */
const isScrolling = ref<boolean>(false)

/* START SCROLL */
function startScroll() {
  window.ipcRenderer.send(IpcChannels.WINNER_PAGE_START_SCROLL)
  isScrolling.value = true
}

/* STOP SCROLL */
function stopScroll() {
  window.ipcRenderer.send(IpcChannels.WINNER_PAGE_STOP_SCROLL)
  isScrolling.value = false
}

/* RESTART SCROLL */
function restartScroll() {
  window.ipcRenderer.send(IpcChannels.WINNER_PAGE_RESTART_SCROLL)
}

/* SET CATEGORY  */
function setCategory() {
  scrollProgressPercentage.value = '0%'
  window.ipcRenderer.send(IpcChannels.WINNER_PAGE_SET_CATEGORY, selectedCategoryId.value)
}

/* PROGRESS SCROLL */
const scrollProgressPercentage = ref<string>('0%')
window.ipcRenderer.on(IpcChannels.WINNER_PAGE_GET_PROGRESS, (event, progress) => {
  scrollProgressPercentage.value = progress
})

/* HEIGHT AND WIDTH */
const height = ref(400)
const width = ref(800)

/* SEND HEIGHT AND WIDTH */
function sendHeightWidthSettings() {
  window.ipcRenderer.send(IpcChannels.WINNER_PAGE_SET_HEIGHT_WIDTH, height.value, width.value)
}

/* VERTICAL OFFSET */
const verticalOffset = ref(200)
function sendVerticalOffset() {
  window.ipcRenderer.send(IpcChannels.WINNER_PAGE_SET_VERTICAL_OFFSET, verticalOffset.value)
}
</script>

<template>
  <!-- PAGE SETTING -->
  <div class="m-5 p-5 rounded-lg card">
    <h3 class="font-bold text-2xl mb-1">Switch Page</h3>
      <div class="flex gap-3 mt-3 items-center">
        <button
          :class="[
            {'cursor-not-allowed button-selected': backgroundName === PageName.HOME},
            {'button-standby': backgroundName !== PageName.HOME}
          ]"
          class="p-2 rounded-md text-black"
          @click="changePage(PageName.HOME)"
        >
          Home Page
        </button>
        <button
          :class="[
            {'cursor-not-allowed button-selected': backgroundName === PageName.ROLLER},
            {'button-standby': backgroundName !== PageName.ROLLER}
          ]"
          class="p-2 rounded-md text-black"
          @click="changePage(PageName.ROLLER)"
        >
          Roller Page
        </button>
        <button
          :class="[
            {'cursor-not-allowed button-selected': backgroundName === PageName.WINNER},
            {'button-standby': backgroundName !== PageName.WINNER}
          ]"
          class="p-2 rounded-md text-black"
          @click="changePage(PageName.WINNER)"
        >
          Winner Page
        </button>
      </div>

      <!-- Background Upload -->
    <div class="mt-8">
      <label
        for="file-upload"
        class="button-selected p-2 rounded-md cursor-pointer"
      >
        Upload {{ backgroundName }} Background
      </label>
      <input
        id="file-upload"
        type="file"
        @change="handleFileUpload"
        accept="image/*"
        class="hidden"
      />
    </div>

    <!-- Winner Page Settings -->
    <div
      v-if="backgroundName === PageName.WINNER"
      class="mt-5 flex flex-col gap-3"
    >
      <p class="font-bold">Winner Page Settings</p>
      <div class="flex gap-3 items-center">
        <p>Category: </p>
        <select-component
          @update:modelValue="selectedCategoryId = $event; setCategory()"
          :options="categoryOptions"
          :model-value="selectedCategoryId"
        />
      </div>

      <!-- SCROLL TIME -->
      <div class="flex gap-3 items-center">
        <p>Scroll Time: </p>
        <input
          type="number"
          v-model="scrollTime"
          class="border-gray-300 rounded p-1 border"
        >
        <button
          class="p-2 rounded-md button-selected"
          @click="sendScrollTimeSettings"
        >
          Set Scroll Time
        </button>
      </div>

      <!-- SCROLL CONTROL -->
      <div class="flex gap-3 items-center" v-if="selectedCategoryId !== 0">
        <img
          v-if="!isScrolling"
          src="/icon-play.png"
          alt="start"
          class="w-10 cursor-pointer hover:scale-110"
          @click="startScroll"
        />
        <img
          v-if="isScrolling"
          src="/icon-stop.png"
          alt="stop"
          class="w-10 cursor-pointer hover:scale-110"
          @click="stopScroll"
        />
        <img
          v-if="!isScrolling"
          src="/icon-restart.png"
          alt="restart"
          class="w-10 cursor-pointer hover:scale-110"
          @click="restartScroll"
        />
      </div>

      <!-- HEIGHT AND WIDTH -->
      <h2 class="font-bold">Height and Width Screen</h2>
      <div class="flex gap-3 items-center">
        <p>Height: </p>
        <input
          type="number"
          v-model="height"
          class="border-gray-300 rounded p-1 border"
        >
        <p>Width: </p>
        <input
          type="number"
          v-model="width"
          class="border-gray-300 rounded p-1 border"
        >
        <button
          class="p-2 rounded-md button-selected"
          @click="sendHeightWidthSettings"
        >
          Set Height and Width
        </button>
      </div>

      <!-- VERTICAL OFFSET -->
      <div class="flex gap-3 items-center">
        <p>Vertical Offset: </p>
        <input
          type="number"
          v-model="verticalOffset"
          class="border-gray-300 rounded p-1 border"
        >
        <button
          class="p-2 rounded-md button-selected"
          @click="sendVerticalOffset"
        >
          Set Vertical Offset
        </button>
      </div>

      <!-- SCROLL PROGRESS -->
      <div class="w-full bg-gray-200 rounded-full h-4 mt-3">
        <div
          class="h-4 rounded-full"
          :style="{ width: `${scrollProgressPercentage}`, background: 'red' }"
        ></div>
      </div>
      <p>{{ scrollProgressPercentage }}</p>
    </div>
  </div>
</template>
