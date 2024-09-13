<template>
  <div v-if="isOpen" class="fixed inset-0 flex items-center justify-center z-50">
    <div
      class="fixed inset-0 bg-black opacity-50"
    >
    </div>
    <div class="bg-white rounded-lg shadow-lg pb-6 pl-6 pt-10 pr-10 z-10 relative">
      <div v-if="!isLoading">
        <button
          class="absolute top-2 right-2 hover:bg-red-700 bg-gray-500 rounded-full text-white p-1 hover:scale-125"
          @click="closeModal"
        >
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
          </svg>
        </button>
        <slot></slot>
      </div>
      <div v-else class="m-10">
        <loading-component></loading-component>
      </div>
    </div>
  </div>
</template>

<script>
import LoadingComponent from "./LoadingComponent.vue";

export default {
  components: {LoadingComponent},
  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    isLoading: {
      type: Boolean,
      default: false
    },
  },
  methods: {
    closeModal() {
      this.$emit('update:isOpen', false);
    }
  }
}
</script>
