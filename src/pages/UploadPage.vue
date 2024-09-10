<script setup lang="ts">
import { IpcChannels } from "../constants/ipcChannels";
import { ref } from "vue";
const pathUrl = ref("");

window.ipcRenderer.on(IpcChannels.SELECTED_FILE, (event, path) => {
  if (path) {
    pathUrl.value = path;
  }
});

function openFileDialog() {
  window.ipcRenderer.send(IpcChannels.OPEN_FILE_DIALOG);
}

function uploadDataToDatabase() {
  window.ipcRenderer.send(IpcChannels.UPLOAD_DATA_TO_DATABASE, pathUrl.value);
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <button
      class="bg-blue-500 text-white p-2 rounded-md"
      @click="openFileDialog"
    >
      {{ pathUrl ? "Change File ?" : "Select File" }}
    </button>

    <button
      :disabled="pathUrl === ''"
      :class="{
        'bg-gray-500 cursor-not-allowed': !pathUrl,
        'bg-blue-500 cursor-pointer': !!pathUrl,
      }"
      class="text-white p-2 rounded-md"
      @click="uploadDataToDatabase"
    >
      {{ pathUrl ? "Upload data to database" : "Please selec the file first" }}
    </button>
  </div>
</template>

<style scoped></style>
