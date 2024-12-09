<script setup lang="ts">
import { onMounted, ref, nextTick, watch, computed } from 'vue';
import { IpcChannels } from '../constants/enum/IpcChannels';
import { PageName } from '../constants/enum/PageName';

/* GET WINNER BY CATEGORY */
window.ipcRenderer.on(IpcChannels.WINNER_PAGE_SET_CATEGORY, async (event, categoryId) => {
  getWinnerDetailByCategory(categoryId)
})

function getWinnerDetailByCategory(categoryId: number) {
  window.ipcRenderer.send(IpcChannels.WINNER_PAGE_GET_WINNER_DETAIL_BY_CATEGORY, [categoryId])
}

const winners = ref<any>([])
window.ipcRenderer.on(IpcChannels.WINNER_PAGE_GET_WINNER_DETAIL_BY_CATEGORY, async (event, listOfWinner) => {
  winners.value = listOfWinner
})

/* AUTOMATIC SCROLL */
let intervalId: NodeJS.Timeout | null = null;
function startAutoScroll(element: HTMLElement, scrollTop = undefined) {
  const scrollAmount = 1;
  if (scrollTop) {
    element.scrollTop = scrollTop
  }

  const updateScroll = () => {
    if (element.scrollTop + element.clientHeight < element.scrollHeight) {
      element.scrollTop += scrollAmount;
    } else {
      stopAutoScroll();
    }
    updateScrollProgress(element);
  };

  const setScrollInterval = () => {
    stopAutoScroll()
    intervalId = setInterval(updateScroll, scrollSpeed.value);

    /* to send scroll progress */
    createIntervalScrollProgress()
  };

  watch(scrollSpeed, setScrollInterval, { immediate: true });
}

/* STOP SCROLL */
let intervalIdScrollProgress: NodeJS.Timeout | null = null;
function stopAutoScroll() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    clearInterval(intervalIdScrollProgress as NodeJS.Timeout);
    intervalIdScrollProgress = null;
  }
}
window.ipcRenderer.on(IpcChannels.WINNER_PAGE_STOP_SCROLL, async (event) => {
  stopAutoScroll()
})

/* CONTINUE SCROLL */
function continueAutoScroll() {
  const winnerListDiv = document.getElementById('winner-list');
  if (winnerListDiv) {
    startAutoScroll(winnerListDiv);
  }
}
window.ipcRenderer.on(IpcChannels.WINNER_PAGE_START_SCROLL, async (event) => {
  continueAutoScroll()
})

/* RESTART SCROLL */
window.ipcRenderer.on(IpcChannels.WINNER_PAGE_RESTART_SCROLL, async (event, scrollTime) => {
  restartScroll()
})

function restartScroll() {
  stopAutoScroll()
  const winnerListDiv = document.getElementById('winner-list');
  if (winnerListDiv) {
    winnerListDiv.scrollTop = 0
  }
  sendScrollProgress('0%')
}

/* SCROLL PROGRESS */
const scrollProgress = ref<string>('0%')
function updateScrollProgress(element: HTMLElement) {
  const progress = (element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100;
  scrollProgress.value = progress.toFixed(2) + '%';
}

function createIntervalScrollProgress() {
  intervalIdScrollProgress = setInterval(() => {
    sendScrollProgress(scrollProgress.value)
  }, 500)
}

function sendScrollProgress(scrollProgress: string) {
  window.ipcRenderer.send(IpcChannels.WINNER_PAGE_GET_PROGRESS, scrollProgress)
}

/* SCROLL SPEED */
const scrollSpeed = ref(100)
window.ipcRenderer.on(IpcChannels.WINNER_PAGE_SET_SCROLL_TIME, async (event, scrollTime) => {
  scrollSpeed.value = scrollTime
})

/* HEIGHT AND WIDTH */
const height = ref(400)
const width = ref(800)

window.ipcRenderer.on(IpcChannels.WINNER_PAGE_SET_HEIGHT_WIDTH, async (event, h, w) => {
  height.value = h
  width.value = w
})

/* BACKGROUND IMAGE */
const backgroundImage = ref(``)
onMounted(() => {
  window.ipcRenderer.send(IpcChannels.GET_BACKGROUND_IMAGE, PageName.WINNER)
})

window.ipcRenderer.on(IpcChannels.GET_BACKGROUND_IMAGE, (event, image) => {
  backgroundImage.value = image
})

/* VERTICAL OFFSET */
const verticalOffset = ref(200);
window.ipcRenderer.on(IpcChannels.WINNER_PAGE_SET_VERTICAL_OFFSET, async (event, offset) => {
  verticalOffset.value = offset
})
</script>

<template>
  <div
    v-if="backgroundImage"
    class="h-screen w-screen"
    :style="{ backgroundImage: `url(${backgroundImage})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }"
  >
    <div
      class="flex flex-col items-center justify-center gap-3"
      :style="{
        position: 'relative',
        top: verticalOffset + 'px',
      }"
    >
      <!-- TITLE -->
      <p class="text-xl text-red-700 font-bold italic">
        Selamat kepada para Pemenang!
      </p>

      <!-- WINNER LIST -->
      <div class="flex items-center justify-center">
        <div
          id="winner-list"
          :style="{ height: height + 'px', width: width + 'px' }"
          class="overflow-y-hidden"
        >
          <table class="table-1 text-center">
            <thead class="sticky top-0">
            <tr>
              <th class="bg-[#ED1C24] text-white">Prize Name</th>
              <th class="bg-[#ED1C24] text-white">Customer Number</th>
              <th class="bg-[#ED1C24] text-white">Name</th>
              <th class="bg-[#ED1C24] text-white">Region</th>
            </tr>
            </thead>
            <tbody class="overflow-y-auto">
              <tr v-for="winner in winners" :key="winner.id">
                <td class="whitespace-nowrap">{{ winner.prize_name }}</td>
                <td>{{ winner.cif }}</td>
                <td>{{ winner.name }}</td>
                <td>{{ winner.region }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
