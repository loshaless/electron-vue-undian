<script lang="ts" setup>
import {computed, onMounted, onUnmounted, reactive, ref} from "vue";
import {IpcChannels} from "../constants/enum/IpcChannels";
import SelectComponent from "../components/SelectComponent.vue";
import LoadingComponent from "../components/LoadingComponent.vue";
import {useCategory} from "../composables/useCategory";
import {PrizeDetail, PrizeRegionDetail} from "../constants/types/PrizeDetail";
import {Category} from "../constants/types/Category";
import ModalComponent from "../components/ModalComponent.vue";
import {formatNumber, replaceSpaceWithUnderscore} from "../utils/generalUtils";
import { WinnerView } from "../constants/types/WinnerView";
import { PageName } from "../constants/enum/PageName";

const isLoading = ref(false)

/*  PRIZE  */
function getPrizeList() {
  window.ipcRenderer.send(IpcChannels.GET_PRIZE)
}

const prizeList = ref<PrizeDetail[]>([])
window.ipcRenderer.on(IpcChannels.GET_PRIZE, (event, rows) => {
  prizeList.value = rows
  getCumulativePointsAndTotalCustomer()
})

onMounted(() => {
  getPrizeList()
})

/* GET CUMULATIVE POITNS AND TOTAL CUSTOMER */
function getCumulativePointsAndTotalCustomer() {
  window.ipcRenderer.send(IpcChannels.GET_CUMULATIVE_POINTS_AND_TOTAL_CUSTOMER)
}

interface ListCumulativePointsAndTotalCustomer {
  [key: string]: {
    cumulativePoints: number, totalCustomer: number
  }
}
const listCumulativePointsAndTotalCustomer = ref<ListCumulativePointsAndTotalCustomer>({})
window.ipcRenderer.on(IpcChannels.GET_CUMULATIVE_POINTS_AND_TOTAL_CUSTOMER, (event, cumulativePointsAndTotalCustomer) => {
  listCumulativePointsAndTotalCustomer.value = cumulativePointsAndTotalCustomer
})

/* SELECTED CATEGORY */
const {listOfCategory} = useCategory(prizeList);
const selectedCategory = ref(1);

const selectedCategoryData = computed(() => {
  const result = {
    categoryId: 0,
    categoryName: '',
    minBalance: 0,
    totalWinner: 0,
    prize: [] as {
      tableName: string,
      totalCustomer: number,
      cumulativePoints: number,
      regions: string,
      regionId: number,
      prizeId: number,
      prizeName: string,
      numOfItem: number,
    }[]
  }

  const category: Category | undefined = listOfCategory.find((category) => category.id == selectedCategory.value);
  result.categoryName = category?.name ?? ''
  result.categoryId = category?.id ?? 0
  result.minBalance = category?.minBalance ?? 0

  category?.prizes?.forEach((prizeId: number) => {
    const prizeDetail = prizeList.value.find((p: PrizeDetail) => p.prizeId === prizeId)
    prizeDetail?.regions.forEach((region: PrizeRegionDetail) => {
      result.totalWinner += +region.numOfItem
      const tableName = `customer_${replaceSpaceWithUnderscore(category.name)}_${replaceSpaceWithUnderscore(region.regionName)}`

      result.prize.push({
        tableName: tableName,
        totalCustomer: listCumulativePointsAndTotalCustomer.value[tableName]?.totalCustomer,
        cumulativePoints: listCumulativePointsAndTotalCustomer.value[tableName]?.cumulativePoints,
        regions: region.regionName,
        regionId: region.regionId,
        prizeId: prizeId,
        prizeName: prizeDetail?.prizeName,
        numOfItem: region.numOfItem
      });
    })
  })

  return result
})

/* PRIZE DETAIL MODAL STATE */
const prizeDetailModalState = reactive({
  isOpen: false
})

/* AUTOMATIC ROLLER */
const rollAnimationTime = ref(1)
const showWinnerTime = ref(1)

/* ROLLER QUEUE */
function generateRollerQueue() {
  const result: any[] = []

  selectedCategoryData.value.prize.forEach((prize) => {
    for (let i = 0; i < prize.numOfItem; i++) {
      result.push(
        [prize.tableName, 
          {
            prizeId: prize.prizeId,
            prizeName: prize.prizeName,
            rollId: 0,
            winnerName: '',
            categoryId: selectedCategoryData.value.categoryId,
            regionId: prize.regionId,
            region: prize.regions
          } as WinnerView
        ])
    }
  })
  return result
}

let rollerQueue = reactive<any[]>([])
const isRolling = ref(false);
async function startRollerWithoutStopper() {
  // CHANGE PAGE TO ROLLER PAGE
  window.ipcRenderer.send(IpcChannels.CHANGE_PAGE, PageName.ROLLER)
  isRolling.value = true;

  /* generate roller queue if not exist */
  if (rollerQueue.length === 0) {
    rollerQueue = generateRollerQueue()
  }

  while (rollerQueue.length > 0 && isRolling.value) {
    /* get winner */
    const [database, winnerView] = rollerQueue.shift()
    startRollingAndGetWinner(winnerView, database)
    await new Promise(resolve => setTimeout(resolve, rollAnimationTime.value * 1000))

    /* keep rolling when winner value not received */
    while(!winner.value && isRolling.value) {
      await new Promise(resolve => setTimeout(resolve, showWinnerTime.value * 1000))
    }

    /* Stop roller when user stop rolling manually and winner value reveived, 
    then show the winner */
    if (!isRolling.value) break;

    /* auto stop roller and show winner */
    stopRollerAndSendWinner()
    await new Promise(resolve => setTimeout(resolve, showWinnerTime.value * 1000))
  }
  isRolling.value = false
}

function startRollerManually() {
  // CHANGE PAGE TO ROLLER PAGE
  window.ipcRenderer.send(IpcChannels.CHANGE_PAGE, PageName.ROLLER)
  if (rollerQueue.length === 0) {
    rollerQueue = generateRollerQueue()
  }
  const [database, winnerView] = rollerQueue.shift()
  
  startRollingAndGetWinner(winnerView, database)
  isRolling.value = true;
}

function stopRolling() {
  isRolling.value = false;
  stopRollerAndSendWinner()
}

onUnmounted( async () => {
  if (isRolling.value) {
    if (winner.value) {
      await new Promise(resolve => setTimeout(resolve, rollAnimationTime.value * 1000))
    }
    stopRolling()
  }
})

function startRollingAndGetWinner(winnerView: WinnerView, database: string) {  
  window.ipcRenderer.send(IpcChannels.START_ROLLING)
  window.ipcRenderer.send(IpcChannels.GET_A_WINNER, winnerView, database)
}

const winner = ref<WinnerView>()
window.ipcRenderer.on(IpcChannels.GET_A_WINNER, (event, winnerView) => {
  winner.value = winnerView

  /* UPDATE NUM OF ITEM */
  getPrizeList()
})

function stopRollerAndSendWinner() {
  window.ipcRenderer.send(IpcChannels.STOP_ROLLING, JSON.parse(JSON.stringify(winner.value)))
  winner.value = undefined
}
</script>

<template>
  <div>
    <!-- Customer Data -->
    <div class="border rounded-md p-5 shadow-sm border-gray-800 bg-gray-200 mx-5 my-5">
      <h1 class="text-2xl font-bold mb-2">Customer Data</h1>
      <h3 class="text-lg">Total Customer: {{ formatNumber(listCumulativePointsAndTotalCustomer?.customer?.totalCustomer)}}</h3>
      <h3 class="text-lg">Total Roll Id: {{formatNumber(listCumulativePointsAndTotalCustomer?.customer?.cumulativePoints)}}</h3>
    </div>

    <!-- Roller Settings -->
    <div class="my-5 flex flex-col mx-5 gap-5">
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

        <!-- Loading when roller is start -->
        <loading-component v-if="isLoading" class="my-3"/>

        <!-- Roller Control -->
        <div v-else class="grid grid-cols-2 gap-3 mt-5">
          <div>
            <div
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
                v-if="showWinnerTime > 0 && rollAnimationTime > 0 && !isRolling"
                class="bg-green-500 hover:bg-green-300 p-2 rounded-md text-white mt-3"
                @click="startRollerWithoutStopper()"
              >
                Start Roller Without Stopper
              </button>

              <button
                v-if="!isRolling"
                class="bg-blue-500 hover:bg-blue-300 p-2 rounded-md text-white mt-3"
                @click="startRollerManually()"
              >
                Start Roller Manually
              </button>

              <button
                v-if="winner && isRolling"
                class="bg-red-500 hover:bg-red-300 p-2 rounded-md text-white mt-3"
                @click="stopRolling()"
              >
                Stop Roller
              </button>
            </div>
            <loading-component v-if="isRolling" class="my-3"/>
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
                  <th class="px-4 py-2 border border-gray-800">Total Roll Id</th>
                  <th class="px-4 py-2 border border-gray-800">Total Customer</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(category, index) in selectedCategoryData.prize" :key="index">
                  <td class="border px-4 py-2 border-gray-800">{{ category.prizeName }}</td>
                  <td class="border px-4 py-2 border-gray-800">{{ category.regions }}</td>
                  <td class="border px-4 py-2 border-gray-800">{{ category.numOfItem }}</td>
                  <td class="border px-4 py-2 border-gray-800">{{ formatNumber(category.cumulativePoints) }}</td>
                  <td class="border px-4 py-2 border-gray-800">{{ formatNumber(category.totalCustomer) }}</td>
                </tr>
              </tbody>
            </table>
          </modal-component>
        </div>
      </div>
    </div>

    <!-- Loading when roller is start -->
    <loading-component v-if="isLoading" class="my-3"/>
  </div>
</template>
