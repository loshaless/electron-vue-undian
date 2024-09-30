<script lang="ts" setup>
import {computed, onMounted, reactive, Ref, ref} from "vue";
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
      cumulativePoints: number,
      totalCustomer: number,
      tableName: string,
      prizeName: string,
      regions: string,
      numOfItem: number
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

      return result.prize.push({
        tableName: tableName,
        cumulativePoints: listCumulativePointsAndTotalCustomer.value[tableName]?.cumulativePoints,
        totalCustomer: listCumulativePointsAndTotalCustomer.value[tableName]?.totalCustomer,
        prizeName: prizeDetail?.prizeName,
        regions: region.regionName,
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
const isAutomaticRollerStart = ref(false)

/* ROLLER QUEUE */
function generateRollerQueue() {
  const result: any[] = []

  selectedCategoryData.value.prize.forEach((prize) => {
    for (let i = 0; i < prize.numOfItem; i++) {
      result.push(
        [prize.tableName, 
          {
            prizeName: prize.prizeName,
            category: selectedCategoryData.value.categoryId,
            rollId: 0,
            winnerName: ''
          } as WinnerView
        ])
    }
  })
  return result
}

async function startRollerWithoutStopper() {
  isAutomaticRollerStart.value = true

  const rollerQueue = generateRollerQueue()
  let index = 0
  while (index < rollerQueue.length) {
    moveRoller(rollerQueue[index][1], rollerQueue[index][0])
    await new Promise(resolve => setTimeout(resolve, rollAnimationTime.value * 1000))

    while(!winner.value) {
      await new Promise(resolve => setTimeout(resolve, showWinnerTime.value * 1000))
    }
    stopRoller()
    await new Promise(resolve => setTimeout(resolve, showWinnerTime.value * 1000))
    index++
  }
  isAutomaticRollerStart.value = false
}

function moveRoller(winnerView: WinnerView, database: string) {
  window.ipcRenderer.send(IpcChannels.START_ROLLING)
  window.ipcRenderer.send(IpcChannels.GET_A_WINNER, winnerView, database)
}

const winner = ref<WinnerView>()
window.ipcRenderer.on(IpcChannels.GET_A_WINNER, (event, winnerView) => {
  winner.value = winnerView
})

function stopRoller() {
  window.ipcRenderer.send(IpcChannels.STOP_ROLLING, JSON.parse(JSON.stringify(winner.value)))
  winner.value = undefined
}

/* CHANGE PAGE */
function changePage(pageName: PageName) {
  backgroundName.value = pageName
  window.ipcRenderer.send(IpcChannels.CHANGE_PAGE, pageName)
}

/* UPLOAD BACKGROUND */
const backgroundName = ref(PageName.HOME)
function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  
  if (input.files?.[0]) {
    const file = input.files[0]
    const reader = new FileReader();
    reader.onload = (e) => {
      window.ipcRenderer.send(IpcChannels.UPLOAD_IMAGE_TO_DB, reader.result, backgroundName.value)
    };
    reader.readAsDataURL(file);
  }
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
                v-if="showWinnerTime > 0 && rollAnimationTime > 0"
                class="bg-green-500 hover:bg-green-300 p-2 rounded-md text-white mt-3"
                @click="startRollerWithoutStopper()"
              >
                Start Roller Without Stopper
              </button>
            </div>
            <loading-component v-if="isAutomaticRollerStart" class="my-3"/>
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

    <!-- PAGE SETTING -->
    <div class="rounded-md mx-5 my-5 p-5 shadow-sm border border-gray-800 bg-purple-300">
      <h3 class="font-bold text-2xl mb-1">Page Setting</h3>
      <div class="flex gap-3 mt-3 items-center">
        <button
          :class="[
            {'cursor-not-allowed bg-gray-500 hover:bg-gray-500': backgroundName === PageName.HOME},
            {'bg-amber-500 hover:bg-amber-300': backgroundName !== PageName.HOME}
          ]"
          class="p-2 rounded-md text-black"
          @click="changePage(PageName.HOME)"  
        >
          Home Page
        </button>
        <button
          :class="[
            {'cursor-not-allowed bg-gray-500 hover:bg-gray-500': backgroundName === PageName.ROLLER},
            {'bg-amber-500 hover:bg-amber-300': backgroundName !== PageName.ROLLER}
          ]"
          class="p-2 rounded-md text-black"
          @click="changePage(PageName.ROLLER)"
        >
          Roller Page
        </button>
        <button
          :class="[
            {'cursor-not-allowed bg-gray-500 hover:bg-gray-500': backgroundName === PageName.WINNER},
            {'bg-amber-500 hover:bg-amber-300': backgroundName !== PageName.WINNER}
          ]"
          class="p-2 rounded-md text-black"
          @click="changePage(PageName.WINNER)"
        >
          Winner Page
        </button>
      </div>

      <!-- Background Upload -->
      <div class="mt-5">
        <label 
          for="file-upload" 
          class="bg-blue-500 hover:bg-blue-600 p-2 rounded-md text-white cursor-pointer"
        >
          Upload {{ backgroundName }} Background
        </label>
        <input 
          id="file-upload"
          type="file" 
          @change="handleFileUpload" 
          accept="image/*" 
          class="hidden"
        />
      </div>  
    </div>

    <!-- Loading when roller is start -->
    <loading-component v-if="isLoading" class="my-3"/>
  </div>
</template>
