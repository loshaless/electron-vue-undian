<script lang="ts" setup>
import {ref, onUnmounted, onMounted, reactive} from "vue";
import {IpcChannels} from "../constants/enum/IpcChannels";
import {WinnerView} from "../constants/types/WinnerView";
import { PageName } from "../constants/enum/PageName";

const winnerState = reactive({
  name: '',
  region: '',
  prizeName: '',
  branchName: ''
})
const numDigits = ref(3);
const digits = ref(Array(numDigits.value).fill(0));
let intervalId: any;

function startRolling() {
  stopRoller()
  intervalId = setInterval(() => {
    digits.value = digits.value.map(() => Math.floor(Math.random() * 10));
  }, 100);
}

window.ipcRenderer.on(IpcChannels.START_ROLLING, (event) => {
  winnerState.name = ''
  startRolling()
})

/* SHOW WINNER */
window.ipcRenderer.on(IpcChannels.STOP_ROLLING, (event, winnerData: WinnerView) => {
  stopRoller()
  winnerState.region = winnerData.region
  winnerState.prizeName = winnerData.prizeName
  winnerState.name = winnerData.winnerName
  winnerState.branchName = winnerData.branchName

  const rollIdString = winnerData.rollId.toString()
  const numOfZero = numDigits.value - rollIdString.length

  // IF ROLL_ID = 123 => it will generate new digit = 0000123
  const newDigits = Array(numOfZero).fill(0)
  for (let i = 0; i < rollIdString.length; i++) {
    newDigits.push(rollIdString[i])
  }

  digits.value = newDigits
})

function stopRoller() {
  winnerState.name = ''
  winnerState.prizeName = ''
  winnerState.region = ''
  winnerState.branchName = ''
  clearInterval(intervalId);
}

onUnmounted(() => {
  stopRoller();
});

/* GET TOTAL POINTS */
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

/* BACKGROUND IMAGE */
const backgroundImage = ref(``)

/* Category Name */
const categoryName = ref(`Grand Prize`)
window.ipcRenderer.on(IpcChannels.ROLLER_CATEGORY, (event, name: string) => {
  categoryName.value = name
})

window.ipcRenderer.on(IpcChannels.CHANGE_PRIZE_BACKGROUND, (event, pathName: string) => {
  backgroundImage.value = pathName
})
</script>

<template>
  <div
    v-if="backgroundImage"
    :style="{ backgroundImage: `url(${backgroundImage})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }"
    class="h-screen w-screen flex flex-col gap-5 items-center justify-center"
  >
    <p class="text-7xl text-red-500 font-bold mb-5">{{categoryName}}</p>

    <div class="text-8xl text-red-700 font-bold flex gap-2">
      <span v-for="(digit, index) in digits" :key="index">
        {{ digit }}
      </span>
    </div>
    <div
      v-if="winnerState.name"
      class="text-3xl text-green-700 text-center"
    >
      <p>Selamat kepada {{ winnerState.name }}</p>
      <p>{{ winnerState.branchName }}</p>
      <p>{{ winnerState.region }}</p>
    </div>
  </div>
</template>
