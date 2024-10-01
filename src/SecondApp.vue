<script lang="ts" setup>
import RollerPage from "./pages/RollerPage.vue";
import HomePage from "./pages/HomePage.vue";
import WinnerPage from "./pages/WinnerPage.vue";
import { PageName } from "./constants/enum/PageName";
import { ref } from "vue";
import { IpcChannels } from "./constants/enum/IpcChannels";

const pageName = ref(PageName.WINNER)
window.ipcRenderer.on(IpcChannels.CHANGE_PAGE, (event, newPageName) => {
  pageName.value = newPageName
})

</script>

<template>
  <div>
    <home-page v-if="pageName === PageName.HOME">
    </home-page>
    <roller-page v-if="pageName === PageName.ROLLER">
    </roller-page>
    <winner-page v-if="pageName === PageName.WINNER">
    </winner-page>
  </div>
</template>


