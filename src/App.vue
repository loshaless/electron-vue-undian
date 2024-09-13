<script lang="ts" setup>
import UploadPage from "./pages/UploadPage.vue";
import {ref} from "vue";
import RollerPage from "./pages/RollerSettings.vue";
import PrizePage from "./pages/PrizePage.vue";

const PAGE = {
  UPLOAD_PAGE: "UPLOAD_PAGE",
  PRIZE_PAGE: "PRIZE_PAGE",
  SETTINGS_PAGE: "SETTINGS_PAGE",
}
const selectedPage = ref(PAGE.SETTINGS_PAGE)
</script>

<template>
  <div class="h-screen overflow-y-hidden">
    <div class="container mx-auto flex justify-around items-center mt-3 gap-3.5">
      <p
        :class="{'!bg-green-500': selectedPage === PAGE.UPLOAD_PAGE}"
        class="navbar"
        @click="selectedPage = PAGE.UPLOAD_PAGE"
      >
        Upload
      </p>
      <p
        :class="{'!bg-green-500': selectedPage === PAGE.PRIZE_PAGE}"
        class="navbar"
        @click="selectedPage = PAGE.PRIZE_PAGE"
      >
        Prize Settings
      </p>
      <p
        :class="{'!bg-green-500': selectedPage === PAGE.SETTINGS_PAGE}"
        class="navbar"
        @click="selectedPage = PAGE.SETTINGS_PAGE"
      >
        Roller Settings
      </p>
    </div>
    <UploadPage
      v-if="selectedPage === PAGE.UPLOAD_PAGE"
    />
    <RollerPage
      v-if="selectedPage === PAGE.SETTINGS_PAGE"
    />
    <PrizePage
      v-if="selectedPage === PAGE.PRIZE_PAGE"
    />
  </div>
</template>

<style scoped>
.navbar {
  @apply flex-1 text-center cursor-pointer bg-gray-300 hover:bg-amber-300 p-3 rounded-2xl;
}
</style>
