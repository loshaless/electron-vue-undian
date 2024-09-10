<script setup lang="ts">
  function readAndUploadToDB() {
  }

  function triggerIpc(){
    window.ipcRenderer.send('channel-name', 'Hello from renderer process');
  }
</script>

<template>
  <div>
    <button @click="triggerIpc()">
      test
    </button>
    <input type="file" @input="readAndUploadToDB()">
  </div>
</template>

<style scoped>
</style>
