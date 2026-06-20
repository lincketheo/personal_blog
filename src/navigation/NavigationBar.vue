<script setup lang="ts">
import { useRouter } from "vue-router";
import { computed, ref } from "vue";

const links = [
  { title: "Home", link: "/", name: "home" },
  { title: "About", link: "/about", name: "about" },
  { title: "Programs", link: "/programs", name: "programs" },
];

const router = useRouter();
const currentLink = computed(() => router.currentRoute.value.name);

const open = ref(false);

function toggle() {
  open.value = !open.value;
}

function close() {
  open.value = false;
}
</script>

<template>
  <nav class="bg-surface px-4 sm:px-8 py-5">
    <div class="max-w-2xl mx-auto flex items-center justify-between">
      <!-- Left: social icons + site name -->
      <div class="flex items-center gap-6">
        <a
          href="https://github.com/lincketheo"
          class="text-muted hover:text-text transition-colors"
        >
          <font-awesome-icon class="text-xl" :icon="['fab', 'github']" />
        </a>
        <a
          href="https://www.linkedin.com/in/theo-lincke/"
          class="text-muted hover:text-text transition-colors"
        >
          <font-awesome-icon class="text-xl" :icon="['fab', 'linkedin']" />
        </a>
        <a
          href="/"
          class="font-mono text-sm font-bold tracking-tight text-text hover:text-red transition-colors"
        >
          theolincke.com
        </a>
      </div>

      <!-- Desktop nav links -->
      <ul class="hidden sm:flex gap-8">
        <li v-for="link in links" :key="link.name">
          <a
            :href="link.link"
            :aria-current="currentLink === link.name ? 'page' : undefined"
            :class="
              currentLink === link.name
                ? 'text-red font-semibold'
                : 'text-muted hover:text-text transition-colors'
            "
            class="text-sm font-mono tracking-wide"
          >
            {{ link.title }}
          </a>
        </li>
      </ul>

      <!-- Mobile hamburger button -->

      <button
        class="sm:hidden text-text hover:text-red transition-colors p-1"
        :aria-expanded="open"
        aria-label="Toggle navigation"
        @click="toggle"
      >
        <font-awesome-icon
          :icon="open ? ['fas', 'xmark'] : ['fas', 'bars']"
          class="text-xl"
        />
      </button>
    </div>

    <!-- Mobile dropdown -->
    <div
      v-if="open"
      class="sm:hidden max-w-2xl mx-auto pt-4 pb-1 border-t border-border mt-4"
    >
      <ul class="flex flex-col gap-4">
        <li v-for="link in links" :key="link.name">
          <a
            :href="link.link"
            :aria-current="currentLink === link.name ? 'page' : undefined"
            :class="
              currentLink === link.name
                ? 'text-red font-semibold'
                : 'text-muted hover:text-text transition-colors'
            "
            class="text-sm font-mono tracking-wide"
            @click="close"
          >
            {{ link.title }}
          </a>
        </li>
      </ul>
    </div>
  </nav>
</template>
