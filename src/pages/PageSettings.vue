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

const selectedCategoryId = ref<number>(1)
window.ipcRenderer.on(IpcChannels.GET_CATEGORY_JOIN_PRIZE, (event, category) => {
  categoryOptions.value = category
})

/* SCROLL SPEED */
const scrollTime = ref<number>(100)
function sendScrollTimeSettings() {
  window.ipcRenderer.send(IpcChannels.WINNER_PAGE_SET_SCROLL_TIME, scrollTime.value)
}

/* START SCROLL */
function startScroll() {
  window.ipcRenderer.send(IpcChannels.WINNER_PAGE_START_SCROLL, scrollTime.value)
}

/* STOP SCROLL */
function stopScroll() {
  window.ipcRenderer.send(IpcChannels.WINNER_PAGE_STOP_SCROLL)
}

/* SET CATEGORY  */
function setCategory() {
  window.ipcRenderer.send(IpcChannels.WINNER_PAGE_SET_CATEGORY, selectedCategoryId.value)
}

/* PROGRESS SCROLL */
const scrollProgressPercentage = ref<number>(0)
window.ipcRenderer.on(IpcChannels.WINNER_PAGE_GET_PROGRESS, (event, progress) => {
  scrollProgressPercentage.value = progress
})

/* HEIGHT AND WIDTH */
const height = ref(400)
const width = ref(400)

/* SEND HEIGHT AND WIDTH */
function sendHeightWidthSettings() {
  window.ipcRenderer.send(IpcChannels.WINNER_PAGE_SET_HEIGHT_WIDTH, height.value, width.value)
}
</script>

<template>
  <!-- PAGE SETTING -->
  <div class="rounded-md mx-5 my-5 p-5 shadow-sm border border-gray-800 bg-purple-300">
    <h3 class="font-bold text-2xl mb-1">Switch Page</h3>
      <div class="flex gap-3 mt-3 items-center">
        <button
          :class="[
            {'cursor-not-allowed bg-gray-500 hover:bg-gray-500': backgroundName === PageName.HOME},
            {'bg-amber-500 hover:bg-amber-300': backgroundName !== PageName.HOME}
          ]"
          class="p-2 rounded-md text-black"
          @click="changePage(PageName.HOME)"  
        >
          Home Page
        </button>
        <button
          :class="[
            {'cursor-not-allowed bg-gray-500 hover:bg-gray-500': backgroundName === PageName.ROLLER},
            {'bg-amber-500 hover:bg-amber-300': backgroundName !== PageName.ROLLER}
          ]"
          class="p-2 rounded-md text-black"
          @click="changePage(PageName.ROLLER)"
        >
          Roller Page
        </button>
        <button
          :class="[
            {'cursor-not-allowed bg-gray-500 hover:bg-gray-500': backgroundName === PageName.WINNER},
            {'bg-amber-500 hover:bg-amber-300': backgroundName !== PageName.WINNER}
          ]"
          class="p-2 rounded-md text-black"
          @click="changePage(PageName.WINNER)"
        >
          Winner Page
        </button>
      </div>

      <!-- Background Upload -->
    <div class="mt-5">
      <label 
        for="file-upload" 
        class="bg-blue-500 hover:bg-blue-600 p-2 rounded-md text-white cursor-pointer"
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
          :options="categoryOptions"
          v-model="selectedCategoryId"
        />
        <button
          class="w-48 bg-yellow-500 hover:bg-yellow-600 p-2 rounded-md text-white"
          @click="setCategory"
        >
          Set Category
        </button>
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
          class="bg-yellow-500 hover:bg-yellow-600 p-2 rounded-md text-white"
          @click="sendScrollTimeSettings"
        >
          Set Scroll Time
        </button>
      </div>

      <!-- SCROLL CONTROL -->
      <div class="flex gap-3 items-center">
        <button
          class="w-48 bg-blue-500 hover:bg-blue-600 p-2 rounded-md text-white"
          @click="startScroll"
        >
          Continue Scroll
        </button>
        <button
          class="w-48 bg-red-500 hover:bg-red-600 p-2 rounded-md text-white"
          @click="stopScroll"
        > 
          Stop Scroll
        </button>
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
          class="bg-yellow-500 hover:bg-yellow-600 p-2 rounded-md text-white"
          @click="sendHeightWidthSettings"
        >
          Set Height and Width
        </button>
      </div>

      <!-- SCROLL PROGRESS -->
      <p>Progress: {{ scrollProgressPercentage }}</p>
    </div>
  </div>
</template>