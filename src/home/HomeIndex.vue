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
        v-for="post in visiblePosts"
        :key="post.route"
        class="post-entry"
    >
      <time class="post-date">{{ formatDate(post.date) }}</time>
      <h2 class="post-title">
        <a :href="post.route">{{ post.title }}</a>
      </h2>
      <p class="post-excerpt">{{ post.description }}</p>
      <a :href="post.route" class="post-read-more">Continue reading →</a>
    </article>

    <div ref="sentinel" class="h-4" />

    <p v-if="!hasMore" class="text-center text-sm text-on-background/40 py-8">
      — end —
    </p>

  </main>
</template>

<style scoped>
.post-entry {
  padding: 2.5rem 0;
  border-top: 1px solid rgba(25, 27, 14, 0.15);
}

.post-entry:first-child {
  border-top: none;
  padding-top: 0;
}

.post-date {
  display: block;
  font-size: 0.8125rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(25, 27, 14, 0.45);
  margin-bottom: 0.5rem;
  font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace;
}

.post-title {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.25;
  margin-bottom: 0.75rem;
  font-family: 'Georgia', 'Times New Roman', serif;
}

.post-title a {
  color: #191B0E;
  text-decoration: none;
}

.post-title a:hover {
  color: #D52429;
}

.post-excerpt {
  font-size: 1rem;
  line-height: 1.7;
  color: rgba(25, 27, 14, 0.75);
  margin-bottom: 1rem;
}

.post-read-more {
  font-size: 0.875rem;
  color: #D52429;
  text-decoration: none;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.post-read-more:hover {
  text-decoration: underline;
}

@media (prefers-color-scheme: dark) {
  .post-date { color: rgba(254, 250, 229, 0.4); }
  .post-title a { color: #FEFAE5; }
  .post-title a:hover { color: #F1602C; }
  .post-excerpt { color: rgba(254, 250, 229, 0.7); }
  .post-entry { border-top-color: rgba(254, 250, 229, 0.12); }
}
</style>
