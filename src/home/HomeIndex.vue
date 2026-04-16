<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { meta } from '@/meta'

const PAGE_SIZE = 8

const allPosts = meta.blog.posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
)

const page = ref(1)
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const visiblePosts = computed(() => allPosts.slice(0, page.value * PAGE_SIZE))
const hasMore = computed(() => visiblePosts.value.length < allPosts.length)

function loadMore() {
  if (hasMore.value) page.value++
}

onMounted(() => {
  observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '200px' }
  )
  if (sentinel.value) observer.observe(sentinel.value)
})

onUnmounted(() => observer?.disconnect())

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}
</script>

<template>
  <main class="max-w-2xl mx-auto px-6 py-12">

    <article
        v-for="(post, i) in visiblePosts"
        :key="post.route"
        :class="['py-10', i !== 0 && 'border-t border-border']"
    >
      <time class="block font-mono text-xs tracking-widest uppercase text-muted mb-2">
        {{ formatDate(post.date) }}
      </time>

      <h2 class="font-serif text-2xl font-bold leading-snug mb-3">
        <a :href="post.route" class="text-text no-underline hover:text-red-hot transition-colors duration-150">
          {{ post.title }}
        </a>
      </h2>

      <p class="text-base leading-relaxed text-text/70 mb-4">
        {{ post.description }}
      </p>

      <a :href="post.route" class="text-sm font-semibold text-red hover:text-red-hot hover:underline">
        Continue reading →
      </a>
    </article>

    <div ref="sentinel" class="h-4" />

    <p v-if="!hasMore" class="text-center font-mono text-xs text-muted/50 py-8">
      — end —
    </p>

  </main>
</template>
