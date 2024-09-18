<script lang="ts" setup>
import {computed, onMounted, ref} from "vue";
import SwitchComponent from "../components/SwitchComponent.vue";
import {IpcChannels} from "../constants/ipcChannels";
import SelectComponent from "../components/SelectComponent.vue";
import MultiSelectComponent from "../components/MultiSelectComponent.vue";
import LoadingComponent from "../components/LoadingComponent.vue";
import { winnerRequirement } from "../constants/winnerRequirement";

const minBalance = ref(0)
const canControlRoller = ref(false)
const selectedCategory = ref(1);
const categoryOptions = ref([
  {
    value: 1,
    text: 'Grand Prize'
  },
  {
    value: 2,
    text: 'Premium Prize'
  },
  {
    value: 3,
    text: 'Lucky Prize'
  }
])

const isLoading = ref(false)

function moveRoller() {
  window.ipcRenderer.send(IpcChannels.START_ROLLING)
}

function startRoller() {
  const requirementList: winnerRequirement[] = []

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

  window.ipcRenderer.send(IpcChannels.PICK_WINNER, requirementList)
}

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
            :options="categoryOptions"
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

        <div class="flex gap-3 mt-3">
          <switch-component
            v-model:value="canControlRoller"
            @input="canControlRoller = $event"
          />
          <p>Can Control Roller ?</p>
        </div>
        <div v-if="canControlRoller" class="flex gap-3 mt-4">
          <button
            class="bg-green-500 hover:bg-green-300 p-2 rounded-md text-white"
            @click="moveRoller()"
          >
            Start Roller
          </button>
          <button
            class="bg-red-500 text-white p-2 rounded-md hover:bg-red-300"
          >
            Stop and Set Winner
          </button>
        </div>
        <div v-else class="mt-4 flex flex-col justify-end">
          <loading-component v-if="isLoading"/>
          <button
            v-else
            class="bg-green-500 hover:bg-green-300 p-2 rounded-md text-white"
            @click="startRoller()"
          >
            Start Roller Without Stopper
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
