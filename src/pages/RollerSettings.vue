<script lang="ts" setup>
import {computed, onMounted, Ref, ref} from "vue";
import SwitchComponent from "../components/SwitchComponent.vue";
import {IpcChannels} from "../constants/IpcChannels";
import SelectComponent from "../components/SelectComponent.vue";
import MultiSelectComponent from "../components/MultiSelectComponent.vue";
import LoadingComponent from "../components/LoadingComponent.vue";
import {WinnerRequirement} from "../constants/WinnerRequirement";
import {WinnerView} from "../constants/WinnerView";
import {prizeCategory} from "../constants/prizeCategory";

const minBalance = ref(0)
const canControlRoller = ref(false)
const selectedCategory = ref(1);

const isLoading = ref(false)

/* INITIATE ROLLER */
function findWinner() {
  isLoading.value = true
  const requirementList: WinnerRequirement[] = []

  selectedPrizeName.value.forEach((prize: Prize) => {
    prize.detail.forEach(detail => {
      requirementList.push({
        minBalance: minBalance.value,
        region: detail.text,
        numOfWinner: detail.numOfItem,
        prizeName: prize.name,
        category: selectedCategory.value
      })
    })
  })

  window.ipcRenderer.send(IpcChannels.INITIATE_WINNER, requirementList)
}

window.ipcRenderer.on(IpcChannels.INITIATE_WINNER, (event, winners: WinnerView[]) => {
  isLoading.value = false
  listOfWinner.value = winners
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

  while(listOfWinner.value.length && shouldContinueRolling.value) {
    moveRoller()
    await new Promise(resolve => setTimeout(resolve, rollAnimationTime.value*1000))

    if (shouldContinueRolling.value) {
      stopRoller()
      await new Promise(resolve => setTimeout(resolve, showWinnerTime.value*1000))
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

/*  PRIZE  */
function getPrizeList() {
  window.ipcRenderer.send(IpcChannels.GET_PRIZE)
}

interface Prize {
  id: number,
  name: string,
  detail: {
    numOfItem: number,
    text: string
  }[]
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

const selectedPrizeId = ref<number[]>([])
const selectedPrizeName = computed(() => {
  return prizeList.value.filter((prize: Prize) => selectedPrizeId.value.includes(prize.id))
})

onMounted(() => {
  getPrizeList()
})
</script>

<template>
  <div>
    <div class="my-5 flex mx-5 gap-5">
      <div class="border rounded-md p-5 shadow-sm border-gray-800 bg-blue-300 flex-1">
        <h3 class="font-bold text-2xl">Winner Requirement</h3>
        <!-- Min Balance -->
        <label>
          Min. Balance: Rp
        </label>
        <input
          v-model="minBalance"
          class="mt-4 p-2 border border-gray-800 rounded"
          placeholder="input balance"
          type="number"
        />

        <!-- Table to display prizes -->
        <div
          v-if="selectedPrizeName.length"
          class="overflow-auto max-h-96 mt-5"
        >
          <table class="table-auto w-full">
            <thead>
            <tr>
              <th class="px-4 py-2 border border-gray-800">Nama Barang</th>
              <th class="px-4 py-2 border border-gray-800">Quota</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="prize in selectedPrizeName" :key="prize.id" class="text-center">
              <td class="border px-4 py-2 border-gray-800">{{ prize.name }}</td>
              <td class="border px-4 py-2 border-gray-800">
                <ul>
                  <li v-for="(quota, index) in prize.detail" :key="index">
                    {{ quota.text }}: {{ quota.numOfItem }}
                  </li>
                </ul>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="border rounded-md p-5 shadow-sm border-gray-800 bg-amber-300 flex-1">
        <!-- Num of Winner -->
        <h3 class="font-bold text-2xl">Lottery Settings</h3>
        <div class="flex gap-3 mt-3 items-center">
          <span>Category: </span>
          <SelectComponent
            v-model="selectedCategory"
            :options="prizeCategory"
          />
        </div>

        <div class="flex gap-3 mt-3 items-center">
          <span>Selected Prize: </span>
          <multi-select-component
            :options="prizeList"
            placeholder="Select Prize"
            @update:modelValue="selectedPrizeId = $event"
          />
        </div>

        <div class="flex gap-3 my-3">
          <switch-component
            v-model:value="canControlRoller"
            @input="canControlRoller = $event"
          />
          <p>Can Control Roller ?</p>
        </div>
        <loading-component v-if="isLoading" class="my-3"/>
        <div v-else>
          <button
            v-if="!listOfWinner.length && selectedPrizeName.length"
            class="bg-green-500 hover:bg-green-300 py-2 px-5 rounded-md text-white"
            @click="findWinner()"
          >
            Initiate Roller
          </button>
          <div v-else-if="listOfWinner.length">
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
              class="mt-4 flex flex-col justify-end"
            >
              <div class="flex gap-3 items-center mb-3">
                <label for="showWinnerTime">Roll Animation Time: </label>
                <input
                  id="showWinnerTime"
                  v-model="rollAnimationTime"
                  class="p-2 border border-gray-800 rounded"
                  placeholder="input animation time in second"
                  min="1"
                  type="number"
                />
              </div>
              <div class="flex gap-3 items-center mb-3">
                <label for="showWinnerTime">Time to show winner: </label>
                <input
                  id="showWinnerTime"
                  v-model="showWinnerTime"
                  class="p-2 border border-gray-800 rounded"
                  placeholder="input show winner time in second"
                  min="1"
                  type="number"
                />
              </div>
              
              <button
                v-if="showWinnerTime > 0 && rollAnimationTime > 0"
                @click="startRollerWithoutStopper()"
                class="bg-green-500 hover:bg-green-300 p-2 rounded-md text-white"
              >
                Start Roller Without Stopper
              </button>
            </div>
            <loading-component v-else-if="isAutomaticRollerStart" class="my-3"/>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
