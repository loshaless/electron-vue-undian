<script lang="ts" setup>
import {IpcChannels} from "../constants/ipcChannels";
import {ref, onBeforeMount} from "vue";
import TooltipComponent from "../components/TooltipComponent.vue";
import LoadingComponent from "../components/LoadingComponent.vue";

/* CHECK PATH OF URL */
const pathUrl = ref("");

const isDialogOpen = ref(false);
window.ipcRenderer.on(IpcChannels.FILE_DIALOG_CLOSED, (event) => {
  isDialogOpen.value = false;
})
function openFileDialog() {
  if (isDialogOpen.value) return;
  isDialogOpen.value = true;
  window.ipcRenderer.send(IpcChannels.OPEN_FILE_DIALOG);
}

window.ipcRenderer.on(IpcChannels.SELECTED_FILE, (event, path) => {
  if (path) {
    pathUrl.value = path;
    isDialogOpen.value = false;
  }
});

/* CHECK IS DATA EXIST */
const isDataExist = ref(false);
window.ipcRenderer.on(IpcChannels.IS_CUSTOMER_DATA_EXIST, (event, isExist) => {
  isDataExist.value = isExist;
});

/* DELETE DATA */
function deleteData() {
  window.ipcRenderer.send(IpcChannels.DELETE_CUSTOMER_IN_DATABASE);
}

/* UPLOADING DATA */
const insertedData = ref(0);
const isLoading = ref(false);

function uploadDataToDatabase() {
  isLoading.value = true;
  insertedData.value = 0;
  window.ipcRenderer.send(IpcChannels.UPLOAD_CUSTOMER_DATA_TO_DATABASE, pathUrl.value);
}

window.ipcRenderer.on(IpcChannels.UPLOAD_CUSTOMER_DATA_TO_DATABASE, (event, inserted) => {
  insertedData.value = inserted;
});
window.ipcRenderer.on(IpcChannels.UPLOAD_COMPLETE, (event, isDone) => {
  isLoading.value = false;
  pathUrl.value = ''
})

onBeforeMount(() => {
  window.ipcRenderer.send(IpcChannels.IS_CUSTOMER_DATA_EXIST);
});
</script>

<template>
  <div class="flex h-screen justify-center items-center">
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
            class="text-white p-2 rounded-md w-full"
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

      <div v-if="insertedData > 0" class="text-green-600 font-bold">
        {{ insertedData }} records inserted successfully!
      </div>
    </div>

    <div v-if="isLoading" class="flex flex-col gap-1">
      <LoadingComponent/>
      <div v-if="insertedData > 0" class="text-green-500 mt-2">
        {{ insertedData }} records inserted successfully!
      </div>
    </div>
  </div>
</template>
