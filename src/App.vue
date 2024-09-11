<script lang="ts" setup>
import UploadPage from "./pages/UploadPage.vue";
import {ref} from "vue";
import SettingsPage from "./pages/SettingsPage.vue";

const selectedPage = ref("UPLOAD_PAGE")
const PAGE = {
  UPLOAD_PAGE: "UPLOAD_PAGE",
  SETTINGS_PAGE: "SETTINGS_PAGE",
}
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
        :class="{'!bg-green-500': selectedPage === PAGE.SETTINGS_PAGE}"
        class="navbar"
        @click="selectedPage = PAGE.SETTINGS_PAGE"
      >
        Settings
      </p>
    </div>
    <UploadPage
      v-if="selectedPage === PAGE.UPLOAD_PAGE"
      class="flex h-screen items-center justify-center"
    />
    <SettingsPage
      v-if="selectedPage === PAGE.SETTINGS_PAGE"
    />
  </div>
</template>

<style scoped>
.navbar {
  @apply flex-1 text-center cursor-pointer bg-gray-300 hover:bg-amber-300 p-3 rounded-2xl;
}
</style>
