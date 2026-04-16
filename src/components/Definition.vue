<script setup lang="ts">
defineProps({
  term: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <aside
    class="my-5 border-l-4 border-red bg-surface rounded-r pl-5 pr-5 pt-4 pb-4"
  >
    <div
      class="font-mono text-xs font-semibold uppercase tracking-widest text-red mb-1.5"
    >
      {{ term }}
    </div>
    <div
      class="text-text/80 text-sm leading-relaxed [&_ul]:mt-2 [&_ul]:ml-5 [&_ul]:list-disc [&_li]:mb-1 [&_code]:font-mono [&_code]:text-[0.875em] [&_code]:bg-border [&_code]:text-amber [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded"
    >
      <slot />
    </div>
  </aside>
</template>
