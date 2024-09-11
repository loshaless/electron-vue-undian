<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const numDigits = ref(5); // Change this to set the number of digits
const digits = ref(Array(numDigits.value).fill(0));
let intervalId: any;

const startRolling = () => {
  intervalId = setInterval(() => {
    digits.value = digits.value.map(() => Math.floor(Math.random() * 10));
  }, 500);
};

onMounted(() => {
  startRolling();
});

onUnmounted(() => {
  clearInterval(intervalId);
});
</script>

<template>
  <div>
    <h1>this is roller page</h1>
    <div class="flex gap-2 text-3xl">
      <span v-for="(digit, index) in digits" :key="index">
        {{ digit }}
      </span>
    </div>
  </div>
</template>

<style scoped></style>
