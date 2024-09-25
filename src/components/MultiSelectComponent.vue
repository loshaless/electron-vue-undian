<script lang="ts" setup>
import {ref, computed, watch} from 'vue';
import { nextTick } from 'vue';

const props = defineProps<{
  options: { id: any, name: string }[],
  placeholder?: string,
  selectedOptions?: any[],
  isViewMode?: boolean
}>();

const isViewMode = ref(!!props.isViewMode)
watch(() => props.isViewMode, (newVal) => {
  isViewMode.value = newVal
})

const selectedOptions = ref<number[]>(props.selectedOptions || []);
watch(() => props.selectedOptions || [], (newVal) => {
  selectedOptions.value = newVal
})

const searchQuery = ref('');
const isOpen = ref(false);
const dropdownPosition = ref('bottom');

const emit = defineEmits(['update:modelValue']);

function toggleOption(id: number) {
  if (selectedOptions.value.includes(id)) {
    selectedOptions.value = selectedOptions.value.filter(optionId => optionId !== id);
  } else {
    selectedOptions.value.push(id);
  }
  emit('update:modelValue', selectedOptions.value);
}

const filteredOptions = computed(() => {
  return props.options.filter(option => option.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

const selectedOptionNames = computed(() => {
  return selectedOptions.value.map(optionId => props.options.find(option => option.id === optionId)?.name).join(', ');
});

watch(isOpen, async (newVal) => {
  if (newVal) {
    await nextTick(); // Wait for the DOM to update
    const dropdown = document.querySelector('.dropdown-menu');

    if (dropdown) {
      const rect = dropdown.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;

      dropdownPosition.value = spaceBelow < 10 ? 'top' : 'bottom';
    }
  }
});
</script>

<template>
  <div class="w-full">
    <div v-if="!isViewMode" class="relative">
      <div
        class="border border-gray-500 rounded-md shadow-sm p-2 cursor-pointer bg-white"
        @click="isOpen = !isOpen"
      >
        <!-- SELECTED OPTIONS -->
        <div
          v-if="selectedOptions.length && isOpen"
          class="flex flex-wrap gap-2"
        >
          <div
            v-for="optionId in selectedOptions" :key="optionId"
            class="flex items-center bg-gray-200 rounded px-2 py-1 justify-center gap-2"
          >
            <span class="mr-1">
              {{ options.find(option => option.id === optionId)?.name }}
            </span>
            <button
              class="text-red-500 font-medium text-md self-center "
              @click.stop="toggleOption(optionId)"
            >
              <div class="text-white bg-blue-700 rounded-full px-2 hover:bg-red-700">
                X
              </div>
            </button>
          </div>
        </div>

        <!-- PLACEHOLDER WHEN SELECTED OPTIONS IS EMPTY -->
        <div
          v-else-if="!selectedOptions.length"
          class="text-gray-500"
        >
          {{ placeholder || 'Select options...' }}
        </div>

        <!-- PLACEHOLDER WHEN SELECTED OPTIONS IS NOT EMPTY -->
        <div
          v-else-if="!isOpen && selectedOptions.length"
          class="text-gray-500"
        >
          {{ selectedOptionNames }}
        </div>
      </div>
      <!-- DROPDOWN MENU AND SEARCH INPUT -->
      <div
        v-if="isOpen"
        :class="['absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto', dropdownPosition === 'top' ? 'bottom-full mb-1' : 'mt-1']"
        class="dropdown-menu"
      >
        <input
          v-model="searchQuery"
          class="w-full p-2 border-b border-gray-300"
          placeholder="Search..."
          type="text"
        />
        <div
          v-for="option in filteredOptions"
          :key="option.id"
          class="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
          @click="toggleOption(option.id);"
        >
          <input
            :id="`option-${option.id}`"
            :checked="selectedOptions.includes(option.id)"
            class="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
            type="checkbox"
            @change.stop
          />
          <p class="ml-2 block text-sm leading-5 text-gray-900">
            {{ option.name }}
          </p>
        </div>
      </div>
    </div>

    <!-- VIEW MODE -->
    <div class="text-center" v-else>
      {{ selectedOptionNames }}
    </div>
  </div>
</template>
