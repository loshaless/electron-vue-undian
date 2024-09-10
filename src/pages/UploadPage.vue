<script setup lang="ts">
import { IpcChannels } from "../constants/ipcChannels";
import { ref, onBeforeMount } from "vue";
const pathUrl = ref("");
const isDataExist = ref(false);

window.ipcRenderer.on(IpcChannels.SELECTED_FILE, (event, path) => {
  if (path) {
    pathUrl.value = path;
  }
});
window.ipcRenderer.on(IpcChannels.IS_DATA_EXIST, (event, isExist) => {
  isDataExist.value = isExist;
});
window.ipcRenderer.on(
  IpcChannels.DELETE_DATA_IN_DATABASE,
  (event, isDeleted) => {
    isDataExist.value = !isDeleted;
  }
);

function openFileDialog() {
  window.ipcRenderer.send(IpcChannels.OPEN_FILE_DIALOG);
}
function uploadDataToDatabase() {
  window.ipcRenderer.send(IpcChannels.UPLOAD_DATA_TO_DATABASE, pathUrl.value);
}
function deleteData() {
  window.ipcRenderer.send(IpcChannels.DELETE_DATA_IN_DATABASE);
}

onBeforeMount(() => {
  window.ipcRenderer.send(IpcChannels.IS_DATA_EXIST);
});
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
      {{ pathUrl ? "Upload data to database" : "Please select the file first" }}
    </button>

    <h1>{{ isDataExist }}</h1>
    <button
      v-if="isDataExist"
      class="text-white bg-red-700 p-2 rounded-md"
      @click="deleteData"
    >
      Delete Data
    </button>
  </div>
</template>

<style scoped></style>
