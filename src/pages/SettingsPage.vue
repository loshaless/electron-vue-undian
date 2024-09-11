<script lang="ts" setup>
import {ref} from "vue";
import SwitchComponent from "../components/SwitchComponent.vue";

const minBalance = ref(0)
const numOfWinner = ref(0)
const useAnimation = ref(false)
</script>

<template>
  <div class="my-3 mt-5 flex justify-around">
    <div class="border p-3 shadow-sm border-gray-800 bg-blue-300">
      <h3 class="font-bold text-2xl">Winner Requirement</h3>
      <label>
        Minimum Balance =
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
      <h3 class="font-bold text-2xl">Lottery Requirement</h3>
      <label>
        Num Of Winner =
      </label>
      <input
        v-model="numOfWinner"
        class="mt-4 p-2 border border-gray-800 rounded"
        placeholder="input num of winner"
        type="number"
      />

      <!-- CAN HAS ANIMATION -->
      <div class="flex gap-3 mt-3">
        <switch-component
          v-model:value="useAnimation"
          @input="useAnimation = $event"
        />
        <p>Use Animation</p>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>