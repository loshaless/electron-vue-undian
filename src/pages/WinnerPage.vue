<script setup lang="ts">
import { onMounted, ref, nextTick, watch, computed } from 'vue';
import { IpcChannels } from '../constants/enum/IpcChannels';
import { PageName } from '../constants/enum/PageName';

/* GET WINNER BY CATEGORY */
window.ipcRenderer.on(IpcChannels.WINNER_PAGE_SET_CATEGORY, async (event, categoryId) => {
  getWinnerByCategory(categoryId)
})

function getWinnerByCategory(categoryId: number) {
  window.ipcRenderer.send(IpcChannels.GET_WINNER_BY_CATEGORY, [categoryId])
}

const winners = ref<any>([])
window.ipcRenderer.on(IpcChannels.GET_WINNER_BY_CATEGORY, async (event, listOfWinner) => {
  winners.value = listOfWinner
})

/* AUTOMATIC SCROLL */
let intervalId: NodeJS.Timeout | null = null;
function startAutoScroll(element: HTMLElement, scrollTop = undefined) {
  const scrollAmount = (element.firstElementChild?.clientHeight || 0) / 20; // Adjust scroll amount for smoothness
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
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(updateScroll, scrollSpeed.value);
  };

  watch(scrollSpeed, setScrollInterval, { immediate: true });
}

/* STOP SCROLL */
function stopAutoScroll() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
window.ipcRenderer.on(IpcChannels.WINNER_PAGE_STOP_SCROLL, async (event, scrollTime) => {
  stopAutoScroll()
})

/* CONTINUE SCROLL */
function continueAutoScroll() {
  const winnerListDiv = document.getElementById('winner-list');
  if (winnerListDiv) {
    startAutoScroll(winnerListDiv);
  }
}
window.ipcRenderer.on(IpcChannels.WINNER_PAGE_START_SCROLL, async (event, scrollTime) => {
  continueAutoScroll()
})

/* SCROLL PROGRESS */
const scrollProgress = ref<string>('0%')
function updateScrollProgress(element: HTMLElement) {
  const progress = (element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100;
  scrollProgress.value = progress.toFixed(2) + '%';
  sendScrollProgress(scrollProgress.value)
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
const width = ref(400)

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
</script>

<template>
  <div 
    v-if="backgroundImage" 
    class="h-screen w-screen" 
    :style="{ backgroundImage: `url(${backgroundImage})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }"
  >
    <div class="flex items-center justify-center h-screen">
      <div 
        id="winner-list" 
      :style="{ height: height + 'px', width: width + 'px' }"
        class="text-center overflow-y-hidden"
      >
        <div v-for="winner in winners" :key="winner.id">
          <h3>{{ winner.customer_name }}</h3>
        </div>
      </div>
    </div>
  </div>
</template>