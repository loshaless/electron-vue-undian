<script lang="ts" setup>

import { onMounted, ref } from "vue";
import { PageName } from "../constants/enum/PageName";
import { IpcChannels } from "../constants/enum/IpcChannels";

const backgroundImage = ref(``)
onMounted(() => {
  window.ipcRenderer.send(IpcChannels.GET_BACKGROUND_IMAGE, PageName.HOME)
})

window.ipcRenderer.on(IpcChannels.GET_BACKGROUND_IMAGE, (event, image) => {
  backgroundImage.value = image
})
</script>

<template>
  <div 
    v-if="backgroundImage" 
    class="h-screen w-screen" 
    :style="{ backgroundImage: `url(${backgroundImage})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }"
  >
  </div>
</template>
