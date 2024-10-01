<script setup lang="ts">
import { onMounted, ref, nextTick, watch, computed } from 'vue';
import { IpcChannels } from '../constants/enum/IpcChannels';

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
const scrollProgress = ref(0)
function updateScrollProgress(element: HTMLElement) {
  scrollProgress.value = (element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100;
}

/* SCROLL SPEED */
const scrollSpeed = ref(10)
window.ipcRenderer.on(IpcChannels.WINNER_PAGE_SET_SCROLL_TIME, async (event, scrollTime) => {
  scrollSpeed.value = scrollTime
})

const scrollProgressPercentage = computed(() => scrollProgress.value.toFixed(2) + '%');
</script>

<template>
  <div>
    <div id="winner-list" style="max-height: 400px; overflow-y: auto;">
      <div v-for="winner in winners" :key="winner.id">
        <h3>{{ winner.customer_name }}</h3>
      </div>
    </div>
    <p>Scroll Progress: {{ scrollProgressPercentage }}</p>
  </div>
</template>