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
    class="pt-4 pb-2 border-b-2 border-gray-200"
  >
    <nav class="container mx-auto flex justify-between items-center">
      <ul class="flex space-x-3 items-center">
        <img src="/Logo-CN-merah.png" alt="logo" class="h-10 mr-3" />
        <li>
          <a
            :class="{'button-selected': selectedPage === PAGE.PRIZE_PAGE, 'button-standby': selectedPage !== PAGE.PRIZE_PAGE}"
            @click="selectedPage = PAGE.PRIZE_PAGE"
            href="#"
            class="px-3 py-2 rounded-md text-sm font-medium"
          >
            Prize & Region Settings
          </a>
        </li>
        <li v-if="isPrizeDataExist">
          <a
            :class="{'button-selected': selectedPage === PAGE.UPLOAD_PAGE, 'button-standby': selectedPage !== PAGE.UPLOAD_PAGE}"
            @click="selectedPage = PAGE.UPLOAD_PAGE"
            href="#"
            class="px-3 py-2 rounded-md text-sm font-medium"
          >
            Upload
          </a>
        </li>
        <li>
          <a
            :class="{'button-selected': selectedPage === PAGE.PAGE_SETTINGS, 'button-standby': selectedPage !== PAGE.PAGE_SETTINGS}"
            @click="selectedPage = PAGE.PAGE_SETTINGS"
            href="#"
            class="px-3 py-2 rounded-md text-sm font-medium"
          >
            Page Settings
          </a>
        </li>
        <li v-if="isPrizeDataExist && isCustomerDataExist">
          <a
            :class="{'button-selected': selectedPage === PAGE.ROLLER_SETTINGS, 'button-standby': selectedPage !== PAGE.ROLLER_SETTINGS}"
            @click="selectedPage = PAGE.ROLLER_SETTINGS"
            href="#"
            class="px-3 py-2 rounded-md text-sm font-medium"
          >
            Roller Settings
          </a>
        </li>
        <li>
          <a
            :class="{'button-selected': selectedPage === PAGE.REPORT_PAGE, 'button-standby': selectedPage !== PAGE.REPORT_PAGE}"
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

