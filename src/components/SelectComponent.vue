<script lang="ts" setup>
import {ref} from 'vue';

const props = defineProps({
  options: {
    type: Array as () => Array<{ id: string | number, name: string }>,
    required: true
  },
  modelValue: {
    type: [String, Number],
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'update:selectedName']);

const selectedValue = ref(props.modelValue);

const updateValue = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  selectedValue.value = target.value;
  emit('update:modelValue', target.value);
  emit('update:selectedName', target.options[target.selectedIndex].text);
};
</script>

<template>
  <div class="w-full">
    <select
      v-model="selectedValue"
      class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      @change="updateValue"
    >
      <option v-for="option in props.options" :key="option.id" :value="option.id">
        {{ option.name }}
      </option>
    </select>
  </div>
</template>

<style scoped>
/* Add any additional styles if needed */
</style>