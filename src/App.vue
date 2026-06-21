<script setup lang="ts">
import { RouterView } from "vue-router";
import NavigationBar from "@/navigation/NavigationBar.vue";
</script>

<template>
  <div class="font-sans">
    <NavigationBar />
    <div class="flex flex-row justify-center bg-bg text-fg min-h-screen">
      <div class="w-full max-w-4xl px-4 sm:px-6">
        <RouterView />
      </div>
    </div>
  </div>
</template>
