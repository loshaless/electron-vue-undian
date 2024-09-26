<script lang="ts" setup>
import {computed, onMounted, reactive, Ref, ref} from "vue";
import SwitchComponent from "../components/SwitchComponent.vue";
import {IpcChannels} from "../constants/enum/IpcChannels";
import SelectComponent from "../components/SelectComponent.vue";
import LoadingComponent from "../components/LoadingComponent.vue";
import {WinnerView} from "../constants/types/WinnerView";
import {useCategory} from "../composables/useCategory";
import {Prize} from "../constants/types/Prize";
import {Category} from "../constants/types/Category";
import {Quota} from "../constants/types/Quota";
import ModalComponent from "../components/ModalComponent.vue";
import {formatNumber} from "../utils/generalUtils";

const canControlRoller = ref(false)
const isLoading = ref(false)

/*  PRIZE  */
function getPrizeList() {
  window.ipcRenderer.send(IpcChannels.GET_PRIZE)
}

const prizeList = ref<Prize[]>([])
window.ipcRenderer.on(IpcChannels.GET_PRIZE, (event, rows) => {
  if (rows) {
    prizeList.value = rows.map((row: any) => {
      return {
        id: row.id,
        name: row.name,
        detail: JSON.parse(row.detail)
      }
    })
  }
})

onMounted(() => {
  getPrizeList()
})

/* SELECTED CATEGORY */
const {listOfCategory, getCategory} = useCategory(prizeList);
const selectedCategory = ref(1);

const selectedCategoryData = computed(() => {
  const result = {
    categoryName: '',
    minBalance: 0,
    totalWinner: 0,
    prize: [] as {
      prizeName: string,
      regions: string[],
      numOfItem: number
    }[]
  }

  const category: Category | undefined = listOfCategory.find((category) => category.id == selectedCategory.value);
  result.categoryName = category?.name ?? ''
  result.minBalance = category?.minBalance ?? 0

  category?.prize?.forEach((prizeId: number) => {
    const prizeDetail = prizeList.value.find((p: Prize) => p.id === prizeId)
    prizeDetail?.detail.forEach((quota: Quota) => {
      result.totalWinner += +quota.numOfItem

      return result.prize.push({
        prizeName: prizeDetail?.name,
        regions: quota.name,
        numOfItem: quota.numOfItem
      });
    })
  })

  return result
})

/* PRIZE DETAIL MODAL STATE */
const prizeDetailModalState = reactive({
  isOpen: false
})

/* START & STOP ROLLER */
const listOfWinner: Ref<WinnerView[]> = ref([])
const isRollerStart: Ref<Boolean> = ref(false)

/* AUTOMATIC ROLLER */
const rollAnimationTime = ref(1)
const showWinnerTime = ref(1)
const shouldContinueRolling = ref(true);
const isAutomaticRollerStart = ref(false)

async function startRollerWithoutStopper() {
  isAutomaticRollerStart.value = true

  while (listOfWinner.value.length && shouldContinueRolling.value) {
    moveRoller()
    await new Promise(resolve => setTimeout(resolve, rollAnimationTime.value * 1000))

    if (shouldContinueRolling.value) {
      stopRoller()
      await new Promise(resolve => setTimeout(resolve, showWinnerTime.value * 1000))
    }
  }
  isAutomaticRollerStart.value = false
}

/* MANUAL ROLLER */
function moveRoller() {
  isRollerStart.value = true
  window.ipcRenderer.send(IpcChannels.START_ROLLING)
}

function stopRoller() {
  isRollerStart.value = false
  const winner = listOfWinner.value.shift()
  window.ipcRenderer.send(IpcChannels.STOP_ROLLING, JSON.parse(JSON.stringify(winner)))
}
</script>

<template>
  <div>
    <div class="my-5 flex flex-col mx-5 gap-5">
      <!-- Roller Settings -->
      <div class="border rounded-md p-5 shadow-sm border-gray-800 bg-amber-300 flex-1">
        <!-- Num of Winner -->
        <h3 class="font-bold text-2xl">Lottery Settings</h3>
        <div class="flex gap-3 mt-3 items-center">
          <span>Category: </span>
          <SelectComponent
            v-model="selectedCategory"
            :options="listOfCategory"
          />
        </div>
        <div class="flex gap-3 my-3">
          <switch-component
            v-model:value="canControlRoller"
            @input="canControlRoller = $event"
          />
          <p>Can Control Roller ?</p>
        </div>

        <!-- Loading when roller is start -->
        <loading-component v-if="isLoading" class="my-3"/>

        <div v-else class="grid grid-cols-2 gap-3">
          <!-- Roller Control -->
          <div>
            <div v-if="canControlRoller" class="flex gap-3 mt-4">
              <button
                v-if="!isRollerStart"
                class="bg-green-500 hover:bg-green-300 p-2 rounded-md text-white"
                @click="moveRoller()"
              >
                Start Roller
              </button>
              <button
                v-else
                class="bg-red-500 text-white p-2 rounded-md hover:bg-red-300"
                @click="stopRoller(); shouldContinueRolling = false"
              >
                Stop and Set Winner
              </button>
            </div>
            <div
              v-else-if="!isAutomaticRollerStart"
              class="mt-4 flex flex-col justify-end flex-1"
            >
              <div class="flex gap-3 items-center mb-3">
                <label for="showWinnerTime">Roll Animation Time: </label>
                <input
                  id="showWinnerTime"
                  v-model="rollAnimationTime"
                  class="p-2 border border-gray-800 rounded"
                  min="1"
                  placeholder="input animation time in second"
                  type="number"
                />
              </div>
              <div class="flex gap-3 items-center mb-3">
                <label for="showWinnerTime">Time to show winner: </label>
                <input
                  id="showWinnerTime"
                  v-model="showWinnerTime"
                  class="p-2 border border-gray-800 rounded"
                  min="1"
                  placeholder="input show winner time in second"
                  type="number"
                />
              </div>

              <button
                v-if="showWinnerTime > 0 && rollAnimationTime > 0"
                class="bg-green-500 hover:bg-green-300 p-2 rounded-md text-white"
                @click="startRollerWithoutStopper()"
              >
                Start Roller Without Stopper
              </button>
            </div>
            <loading-component v-else-if="isAutomaticRollerStart" class="my-3"/>
          </div>

          <!-- PRIZE DATA DETAIL -->
          <div class="border rounded-md p-5 shadow-sm border-gray-800 bg-gray-200">
            <h3 class="font-bold text-2xl mb-1">Category {{ selectedCategoryData.categoryName }}</h3>
            <p class="text-lg">Total Winner : {{ selectedCategoryData.totalWinner }}</p>
            <p class="mb-1 text-lg mb-3">Min Balance : {{ formatNumber(selectedCategoryData.minBalance) }}</p>
            <div v-if="selectedCategoryData">
              <button
                class="bg-blue-500 hover:bg-blue-300 p-2 rounded-md text-white"
                @click="prizeDetailModalState.isOpen = true"
              >
                Open Prize Detail
              </button>
            </div>
          </div>
          <modal-component
            :is-open="prizeDetailModalState.isOpen"
            @update:isOpen="prizeDetailModalState.isOpen = $event"
          >
            <table class="table-auto w-full border-white text-center">
              <thead>
                <tr>
                  <th class="px-4 py-2 border border-gray-800">Prize Name</th>
                  <th class="px-4 py-2 border border-gray-800">Regions</th>
                  <th class="px-4 py-2 border border-gray-800">Num of Item</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(category, index) in selectedCategoryData.prize" :key="index">
                  <td class="border px-4 py-2 border-gray-800">{{ category.prizeName }}</td>
                  <td class="border px-4 py-2 border-gray-800">{{ category.regions.join(', ') }}</td>
                  <td class="border px-4 py-2 border-gray-800">{{ category.numOfItem }}</td>
                </tr>
              </tbody>
            </table>
          </modal-component>
        </div>
      </div>
    </div>
  </div>
</template>
