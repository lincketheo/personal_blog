<script setup lang="ts">
interface Props {
  name: string
  owner: string
  url: string
  language: string
  license: string
  version: string
}
defineProps<Props>()
</script>

<template>
  <a
  :href="url"
  target="_blank"
  rel="noopener noreferrer"
  class="flex flex-wrap items-center justify-between gap-3 border border-border rounded-lg px-5 py-4 no-underline bg-surface hover:border-border-strong transition-colors"
  >
  <div class="flex items-center gap-3 min-w-0">
    <font-awesome-icon :icon="['fab', 'github']" class="text-muted text-lg shrink-0" />
    <div class="min-w-0">
      <p class="m-0 font-mono text-xs text-muted truncate">{{ owner }} /</p>
      <p class="m-0 font-mono text-sm font-bold text-text truncate">{{ name }}</p>
    </div>
  </div>
  <div class="flex items-center gap-3 shrink-0 flex-wrap">
    <div class="text-right">
      <p class="m-0 font-mono text-[10px] uppercase tracking-widest text-muted">language</p>
      <p class="m-0 font-mono text-xs text-text">{{ language }}</p>
    </div>
    <div class="w-px h-8 bg-border hidden sm:block" />
    <div class="text-right">
      <p class="m-0 font-mono text-[10px] uppercase tracking-widest text-muted">license</p>
      <p class="m-0 font-mono text-xs text-text">{{ license }}</p>
    </div>
    <div class="w-px h-8 bg-border hidden sm:block" />
    <div class="text-right">
      <p class="m-0 font-mono text-[10px] uppercase tracking-widest text-muted">version</p>
      <p class="m-0 font-mono text-xs text-text">{{ version }}</p>
    </div>
  </div>
  </a>
</template>