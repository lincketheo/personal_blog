<template>
  <aside class="definition">
    <div class="definition-term">{{ term }}</div>
    <div class="definition-body">
      <slot />
    </div>
  </aside>
</template>

<script setup lang="ts">
defineProps({
  term: {
    type: String,
    required: true,
  },
})
</script>

<style scoped>
.definition {
  margin: 1.25rem 0;
  border-left: 3px solid #2563eb;
  background: #f0f5ff;
  padding: 0.9rem 1.25rem;
  border-radius: 0 4px 4px 0;
  font-family: system-ui, sans-serif;
  font-size: 0.95rem;
  line-height: 1.6;
}

.definition-term {
  font-weight: 700;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #2563eb;
  margin-bottom: 0.4rem;
}

.definition-body {
  color: #1e293b;
}

.definition-body ul {
  margin: 0.5rem 0 0.5rem 1.25rem;
  padding: 0;
}

.definition-body li {
  margin-bottom: 0.3rem;
}

.definition-body code {
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 0.875em;
  background: #dbeafe;
  padding: 0.1em 0.3em;
  border-radius: 3px;
}
</style>
