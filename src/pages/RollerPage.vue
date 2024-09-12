<script lang="ts" setup>
import {ref, onUnmounted} from "vue";
import {IpcChannels} from "../constants/ipcChannels";

const winnerName = ref("");
const numDigits = ref(10);
const digits = ref(Array(numDigits.value).fill(0));
let intervalId: any;

function startRolling() {
  intervalId = setInterval(() => {
    digits.value = digits.value.map(() => Math.floor(Math.random() * 10));
  }, 100);
}

window.ipcRenderer.on(IpcChannels.START_ROLLING, (event) => {
  startRolling()
})
window.ipcRenderer.on(IpcChannels.SET_A_WINNER, (event, {name, winnerDigits}) => {
  stopRoller();
  digits.value = winnerDigits
  numDigits.value = winnerDigits.length
  winnerName.value = name
})

function stopRoller() {
  winnerName.value = ''
  clearInterval(intervalId);
}

onUnmounted(() => {
  stopRoller();
});
</script>

<template>
  <div class="h-screen flex flex-col gap-5 items-center justify-center">
    <div class="text-8xl text-red-700 font-bold flex gap-3">
      <span v-for="(digit, index) in digits" :key="index">
        {{ digit }}
      </span>
    </div>
    <p v-if="winnerName" class="text-3xl text-green-700">
      Selamat kepada {{ winnerName }}
    </p>
  </div>
</template>

<style scoped></style>
