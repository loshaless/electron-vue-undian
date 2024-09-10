<script setup lang="ts">
import { IpcChannels } from "../constants/ipcChannels";

function readAndUploadToDB() {}

function triggerIpc() {
  window.ipcRenderer.send(
    IpcChannels.CHANNEL_NAME,
    "Hello from renderer process"
  );
}
</script>

<template>
  <div>
    <button @click="triggerIpc()">test</button>
    <input type="file" @input="readAndUploadToDB()" />
  </div>
</template>

<style scoped></style>
