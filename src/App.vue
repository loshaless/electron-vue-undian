<script lang="ts" setup>
import UploadPage from "./pages/UploadPage.vue";
import ReportPage from "./pages/ReportSettings.vue";
import {Ref, ref, onMounted} from "vue";
import RollerPage from "./pages/RollerSettings.vue";
import PrizePage from "./pages/PrizePage.vue";
import {IpcChannels} from "./constants/enum/IpcChannels";

const PAGE = {
  UPLOAD_PAGE: "UPLOAD_PAGE",
  PRIZE_PAGE: "PRIZE_PAGE",
  SETTINGS_PAGE: "SETTINGS_PAGE",
  REPORT_PAGE: "REPORT_PAGE",
}
const selectedPage = ref(PAGE.SETTINGS_PAGE)

const isCustomerDataExist: Ref<Boolean> = ref(false)
window.ipcRenderer.on(IpcChannels.IS_CUSTOMER_DATA_EXIST, (event, isDataExist) => {
  isCustomerDataExist.value = isDataExist;
})

onMounted(() => {
  window.ipcRenderer.send(IpcChannels.IS_CUSTOMER_DATA_EXIST)
})
</script>

<template>
  <div>
    <div class="container mx-auto flex justify-around items-center mt-3 gap-3.5">
      <p
        :class="{'!bg-green-500': selectedPage === PAGE.PRIZE_PAGE}"
        class="navbar"
        @click="selectedPage = PAGE.PRIZE_PAGE"
      >
        Prize Settings
      </p>
      <p
        :class="{'!bg-green-500': selectedPage === PAGE.UPLOAD_PAGE}"
        class="navbar"
        @click="selectedPage = PAGE.UPLOAD_PAGE"
      >
        Upload
      </p>
      <p
        v-if="isCustomerDataExist"
        :class="{'!bg-green-500': selectedPage === PAGE.SETTINGS_PAGE}"
        class="navbar"
        @click="selectedPage = PAGE.SETTINGS_PAGE"
      >
        Roller Settings
      </p>
      <p
        :class="{'!bg-green-500': selectedPage === PAGE.REPORT_PAGE}"
        class="navbar"
        @click="selectedPage = PAGE.REPORT_PAGE"
      >
        Report Settings
      </p>
    </div>
    <UploadPage
      v-if="selectedPage === PAGE.UPLOAD_PAGE"
    />
    <RollerPage
      v-if="selectedPage === PAGE.SETTINGS_PAGE && isCustomerDataExist"
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
