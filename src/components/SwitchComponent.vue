<template>
  <div
    :class="[
      'relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300',
      { 'bg-green-500': isChecked, 'bg-gray-300': !isChecked },
    ]"
    @click="toggle"
  >
    <span
      :class="[
        'inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300',
        { 'translate-x-6': isChecked, 'translate-x-1': !isChecked },
      ]"
    ></span>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";

const props = defineProps({
  value: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["input"]);
const isChecked = ref(props.value);

watch(
  () => props.value,
  (newValue) => {
    isChecked.value = newValue;
  }
);

function toggle() {
  isChecked.value = !isChecked.value;
  emit("input", isChecked.value);
}
</script>

<style scoped>
/* Add any additional styles if needed */
</style>
