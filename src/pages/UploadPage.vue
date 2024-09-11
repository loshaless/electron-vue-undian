<script lang="ts" setup>
import {IpcChannels} from "../constants/ipcChannels";
import {ref, onBeforeMount} from "vue";
import TooltipComponent from "../components/TooltipComponent.vue";

/* CHECK PATH OF URL */
const pathUrl = ref("");

function openFileDialog() {
  window.ipcRenderer.send(IpcChannels.OPEN_FILE_DIALOG);
}

window.ipcRenderer.on(IpcChannels.SELECTED_FILE, (event, path) => {
  if (path) {
    pathUrl.value = path;
  }
});

/* CHECK IS DATA EXIST */
const isDataExist = ref(false);
window.ipcRenderer.on(IpcChannels.IS_DATA_EXIST, (event, isExist) => {
  isDataExist.value = isExist;
});

/* DELETE DATA */
function deleteData() {
  window.ipcRenderer.send(IpcChannels.DELETE_DATA_IN_DATABASE);
}

/* UPLOADING DATA */
const insertedData = ref(0);
const isLoading = ref(false);

function uploadDataToDatabase() {
  isLoading.value = true;
  insertedData.value = 0;
  window.ipcRenderer.send(IpcChannels.UPLOAD_DATA_TO_DATABASE, pathUrl.value);
}

window.ipcRenderer.on(IpcChannels.UPLOAD_DATA_TO_DATABASE, (event, inserted) => {
  insertedData.value = inserted;
});
window.ipcRenderer.on(IpcChannels.UPLOAD_COMPLETE, (event, isDone) => {
  isLoading.value = false;
  pathUrl.value = ''
})

onBeforeMount(() => {
  window.ipcRenderer.send(IpcChannels.IS_DATA_EXIST);
});
</script>

<template>
  <div>
    <div v-if="!isLoading" class="flex flex-col gap-4">
      <button
        class="bg-blue-500 text-white p-2 rounded-md"
        @click="openFileDialog"
      >
        {{ (pathUrl && isDataExist) ? "Change File" : "Select New File" }}
      </button>

      <tooltip-component
        :canShow="pathUrl === ''"
        :tooltipTextStyle="{width: '150px', left: '125px'}"
        :tooltipTriangleStyle="{left: '75px'}"
      >
        <template v-slot:toggle>
          <button
            :class="{
                'bg-gray-500 cursor-not-allowed': !pathUrl,
                'bg-blue-500 cursor-pointer': !!pathUrl,
            }"
            :disabled="pathUrl === ''"
            class="text-white p-2 rounded-md"
            @click="uploadDataToDatabase"
          >
            Upload data to database
          </button>
        </template>
        <template v-slot:tooltipText>
          Please Upload the file first!
        </template>
      </tooltip-component>

      <button
        v-if="isDataExist"
        class="text-white bg-red-700 p-2 rounded-md"
        @click="deleteData"
      >
        Delete Data
      </button>
    </div>

    <div v-else class="flex justify-center items-center">
      <div class="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-6 w-6"></div>
      <span class="ml-2">Loading...</span>
    </div>

    <div v-if="insertedData > 0" class="text-green-500 mt-2">
      {{ insertedData }} records inserted successfully!
    </div>
  </div>
</template>

<style scoped>
.loader {
  border-top-color: #3498db;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
