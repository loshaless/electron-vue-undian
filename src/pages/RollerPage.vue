<script lang="ts" setup>
import {ref, onUnmounted, onMounted} from "vue";
import {IpcChannels} from "../constants/IpcChannels";
import {WinnerView} from "../constants/WinnerView";

const winnerName = ref("");
const numDigits = ref(3);
const digits = ref(Array(numDigits.value).fill(0));
let intervalId: any;

function startRolling() {
  intervalId = setInterval(() => {
    digits.value = digits.value.map(() => Math.floor(Math.random() * 10));
  }, 100);
}

window.ipcRenderer.on(IpcChannels.START_ROLLING, (event) => {
  winnerName.value = ''
  startRolling()
})

/* SHOW WINNER */
window.ipcRenderer.on(IpcChannels.STOP_ROLLING, (event, winnerData: WinnerView) => {
  stopRoller()
  const rollIdString = winnerData.rollId.toString()
  const numOfZero = numDigits.value - rollIdString.length

  // IF ROLLID = 123 => it will genberate new digit = 0000123
  const newDigits = Array(numOfZero).fill(0)
  for (let i = 0; i < rollIdString.length; i++) {
    newDigits.push(rollIdString[i])
  }

  winnerName.value = winnerData.winnerName
  digits.value = newDigits
})

function stopRoller() {
  winnerName.value = ''
  clearInterval(intervalId);
}

onUnmounted(() => {
  stopRoller();
});

/* GET TOTQAL POINTS */
function getTotalPoints(){
  window.ipcRenderer.send(IpcChannels.GET_TOTAL_CUMULATIVE_POINTS)
}

window.ipcRenderer.on(IpcChannels.GET_TOTAL_CUMULATIVE_POINTS, (event, points: number) => {
  numDigits.value = String(points).length
  digits.value = Array(numDigits.value).fill(0)
})

onMounted(() => {
  getTotalPoints()
})
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
