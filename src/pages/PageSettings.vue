<script setup lang="ts">
import { ref } from 'vue';
import { PageName } from '../constants/enum/PageName';
import { IpcChannels } from '../constants/enum/IpcChannels';

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
  </div>
</template>