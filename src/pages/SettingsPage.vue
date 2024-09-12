<script lang="ts" setup>
import {ref} from "vue";
import SwitchComponent from "../components/SwitchComponent.vue";
import {IpcChannels} from "../constants/ipcChannels";

const minBalance = ref(0)
const numOfWinner = ref(0)
const canControlRoller = ref(false)

function startRoller() {
  window.ipcRenderer.send(IpcChannels.START_ROLLING);
}

function stopAndSetWinner() {
  window.ipcRenderer.send(IpcChannels.SET_A_WINNER)
}
</script>

<template>
  <div class="my-3 mt-5 flex justify-around">
    <div class="border p-3 shadow-sm border-gray-800 bg-blue-300">
      <h3 class="font-bold text-2xl">Winner Requirement</h3>
      <label>
        Min. Balance = Rp
      </label>
      <input
        v-model="minBalance"
        class="mt-4 p-2 border border-gray-800 rounded"
        placeholder="input balance"
        type="number"
      />
    </div>
    <div class="border p-3 shadow-sm border-gray-800 bg-amber-300">
      <!-- Num of Winner -->
      <h3 class="font-bold text-2xl">Lottery Settings</h3>
      <label>
        Num Of Winner =
      </label>
      <input
        v-model="numOfWinner"
        class="mt-4 p-2 border border-gray-800 rounded"
        placeholder="input num of winner"
        type="number"
      />

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
    </div>
  </div>
</template>

<style scoped>

</style>