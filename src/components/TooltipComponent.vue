<template>
  <div class="relative inline-block group">
    <slot name="toggle"></slot>
    <span
      v-if="canShow"
      :style="tooltipTextStyle"
      class="tooltip-text absolute z-10 hidden w-48 p-2 text-center text-white bg-gray-700 rounded-lg opacity-0 transition-opacity duration-300 group-hover:block group-hover:opacity-100"
      data-unq="tool-tip-text"
    >
      <slot name="tooltipText"></slot>
      <span
        :style="tooltipTriangleStyle"
        class="tooltip-triangle absolute left-1/2 -ml-1.5 border-4 border-transparent border-t-gray-700"
      />
    </span>
  </div>
</template>

<script setup>
const props = defineProps({
  tooltipTextStyle: {
    type: Object
  },
  tooltipTriangleStyle: {
    type: Object
  },
  canShow: {
    type: Boolean,
    default: true
  }
});
</script>

<style scoped>
.tooltip-text {
  bottom: 125%;
  left: 50%;
  margin-left: -6rem; /* -100px */
}

.tooltip-triangle {
  top: 100%;
}
</style>
