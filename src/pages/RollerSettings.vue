<script lang="ts" setup>
import {ref} from "vue";
import SwitchComponent from "../components/SwitchComponent.vue";
import {IpcChannels} from "../constants/ipcChannels";
import SelectComponent from "../components/SelectComponent.vue";

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

function startRoller() {
  window.ipcRenderer.send(IpcChannels.START_ROLLING);
}

function stopAndSetWinner() {
  window.ipcRenderer.send(IpcChannels.SET_A_WINNER)
}
</script>

<template>
  <div>
    <div class="my-3 mt-5 flex mx-5 gap-5">
      <div class="border rounded p-3 shadow-sm border-gray-800 bg-blue-300 flex-1">
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
      </div>
      <div class="border rounded p-3 shadow-sm border-gray-800 bg-amber-300 flex-1">
        <!-- Num of Winner -->
        <h3 class="font-bold text-2xl">Lottery Settings</h3>
        <div class="flex gap-3 mt-3 items-center">
          <span>Category: </span>
          <SelectComponent
            v-model="selectedCategory"
            :options="categoryOptions"
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
            @click="startRoller()"
          >
            Start Roller
          </button>
          <button
            class="bg-red-500 text-white p-2 rounded-md hover:bg-red-300"
            @click="stopAndSetWinner()"
          >
            Stop and Set Winner
          </button>
        </div>
        <div v-else class="mt-4">
          <button
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

<style scoped>

</style>