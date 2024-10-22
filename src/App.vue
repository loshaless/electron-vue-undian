<script lang="ts" setup>
import UploadPage from "./pages/UploadPage.vue";
import ReportPage from "./pages/ReportSettings.vue";
import {Ref, ref, onMounted} from "vue";
import RollerPage from "./pages/RollerSettings.vue";
import PrizePage from "./pages/PrizePage.vue";
import {IpcChannels} from "./constants/enum/IpcChannels";
import PageSettings from "./pages/PageSettings.vue";

const PAGE = {
  UPLOAD_PAGE: "UPLOAD_PAGE",
  PRIZE_PAGE: "PRIZE_PAGE",
  ROLLER_SETTINGS: "ROLLER_SETTINGS",
  PAGE_SETTINGS: "PAGE_SETTINGS",
  REPORT_PAGE: "REPORT_PAGE",
}
const selectedPage = ref(PAGE.PRIZE_PAGE)

const isCustomerDataExist: Ref<Boolean> = ref(false)
window.ipcRenderer.on(IpcChannels.IS_CUSTOMER_DATA_EXIST, (event, isDataExist) => {
  isCustomerDataExist.value = isDataExist;
})

const isPrizeDataExist: Ref<Boolean> = ref(false)
window.ipcRenderer.on(IpcChannels.IS_PRIZE_DATA_EXIST, (event, isDataExist) => {
  isPrizeDataExist.value = isDataExist;
})

onMounted(() => {
  window.ipcRenderer.send(IpcChannels.IS_CUSTOMER_DATA_EXIST)
  window.ipcRenderer.send(IpcChannels.IS_PRIZE_DATA_EXIST)
})

const canChangePage = ref(true)
window.ipcRenderer.on(IpcChannels.CHANGE_PAGE, (event, canChange) => {
  canChangePage.value = canChange
})
</script>

<template>
  <div 
    v-if="canChangePage"
    class="bg-gray-800 p-4"
  >
    <nav class="container mx-auto flex justify-between items-center">
      <ul class="flex space-x-3">
        <li>
          <a
            :class="{'bg-gray-600 text-white': selectedPage === PAGE.PRIZE_PAGE, 'text-gray-300': selectedPage !== PAGE.PRIZE_PAGE}"
            @click="selectedPage = PAGE.PRIZE_PAGE"
            href="#"
            class="px-3 py-2 rounded-md text-sm font-medium"
          >
            Prize & Region Settings
          </a>
        </li>
        <li v-if="isPrizeDataExist">
          <a
            :class="{'bg-gray-600 text-white': selectedPage === PAGE.UPLOAD_PAGE, 'text-gray-300': selectedPage !== PAGE.UPLOAD_PAGE}"
            @click="selectedPage = PAGE.UPLOAD_PAGE"
            href="#"
            class="px-3 py-2 rounded-md text-sm font-medium"
          >
            Upload
          </a>
        </li>
        <li>
          <a
            :class="{'bg-gray-600 text-white': selectedPage === PAGE.PAGE_SETTINGS, 'text-gray-300': selectedPage !== PAGE.PAGE_SETTINGS}"
            @click="selectedPage = PAGE.PAGE_SETTINGS"
            href="#"
            class="px-3 py-2 rounded-md text-sm font-medium"
          >
            Page Settings
          </a>
        </li>
        <li v-if="isPrizeDataExist && isCustomerDataExist">
          <a
            :class="{'bg-gray-600 text-white': selectedPage === PAGE.ROLLER_SETTINGS, 'text-gray-300': selectedPage !== PAGE.ROLLER_SETTINGS}"
            @click="selectedPage = PAGE.ROLLER_SETTINGS"
            href="#"
            class="px-3 py-2 rounded-md text-sm font-medium"
          >
            Roller Settings
          </a>
        </li>
        <li>
          <a
            :class="{'bg-gray-600 text-white': selectedPage === PAGE.REPORT_PAGE, 'text-gray-300': selectedPage !== PAGE.REPORT_PAGE}"
            @click="selectedPage = PAGE.REPORT_PAGE"
            href="#"
            class="px-3 py-2 rounded-md text-sm font-medium"
          >
            Report Settings
          </a>
        </li>
      </ul>
    </nav>
  </div>
  <div>
    <UploadPage
      v-if="selectedPage === PAGE.UPLOAD_PAGE"
    />
    <PageSettings
      v-if="selectedPage === PAGE.PAGE_SETTINGS"
    />
    <RollerPage
      v-if="selectedPage === PAGE.ROLLER_SETTINGS && isCustomerDataExist"
    />
    <PrizePage
      v-if="selectedPage === PAGE.PRIZE_PAGE"
    />
    <ReportPage
      v-if="selectedPage === PAGE.REPORT_PAGE"
    />
  </div>

</template>

<style scoped>
.navbar {
  @apply flex-1 text-center cursor-pointer bg-gray-300 hover:bg-amber-300 p-3 rounded-2xl;
}
</style>
