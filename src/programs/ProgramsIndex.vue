<script setup lang="ts">
import { meta } from "@/meta";

interface Release {
  platform: "windows" | "macos" | "linux";
  label: string;
  url: string;
}

interface Program {
  name: string;
  description: string;
  version: string;
  repo: string;
  postRoute: string;
  releases: Release[];
}

const programs: Program[] = [
  {
    name: "Smart Files",
    description: "A new \"Smart\" file with first class transaction support and inner mutations",
    version: "0.0.3",
    repo: "https://github.com/lincketheo/smartfiles",
    postRoute: "/blog/10_smart_files_release",
    releases: [
      {
        platform: "linux",
        label: "Linux x86_64",
        url: "https://github.com/lincketheo/smartfiles/releases/download/v0.0.3/smartfiles-0.0.3-Linux.tar.gz",
      },
      {
        platform: "macos",
        label: "macOS arm64",
        url: "https://github.com/lincketheo/smartfiles/releases/download/v0.0.3/smartfiles-0.0.3-Darwin.tar.gz",
      },
      {
        platform: "windows",
        label: "Windows x64",
        url: "https://github.com/lincketheo/smartfiles/releases/download/v0.0.3/smartfiles-0.0.3-win64.zip",
      },
    ],
  },
  {
    name: "c_specx",
    description:
      "Common systems programming extensions and C utilities - custom allocators, data structures, streams, concurrency primitives, and a unit testing framework. My C standard library.",
    version: "0.0.1",
    repo: "https://github.com/lincketheo/c_specx",
    postRoute: "/blog/9_c_specx_release",
    releases: [
      {
        platform: "linux",
        label: "Linux x86_64",
        url: "https://github.com/lincketheo/c_specx/releases/download/v0.0.1/c_specx-0.0.1-Linux.tar.gz",
      },
      {
        platform: "macos",
        label: "macOS arm64",
        url: "https://github.com/lincketheo/c_specx/releases/download/v0.0.1/c_specx-0.0.1-Darwin.tar.gz",
      },
      {
        platform: "windows",
        label: "Windows x64",
        url: "https://github.com/lincketheo/c_specx/releases/download/v0.0.1/c_specx-0.0.1-win64.zip",
      },
    ],
  },
];

const platformIcon: Record<Release["platform"], string[]> = {
  windows: ["fab", "windows"],
  macos: ["fab", "apple"],
  linux: ["fab", "linux"],
};

function getPost(route: string) {
  return meta.blog.posts.find((p) => p.route === route) ?? null;
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
</script>

<template>
  <main class="max-w-2xl mx-auto px-6 py-12">
    <header class="mb-12 border-b border-border pb-8">
      <h1 class="text-4xl font-bold text-text font-serif mb-3">Programs</h1>
      <p class="text-text/60 text-base leading-relaxed">
        Open source software I've built. Source is on
        <a
          href="https://github.com/lincketheo"
          class="text-red hover:text-red-hot underline"
          >GitHub</a
        >. Report issues or follow development there.
      </p>
    </header>

    <div class="space-y-10">
      <article
        v-for="program in programs"
        :key="program.name"
        class="border border-border rounded"
      >
        <!-- Top: name, version, source link -->
        <div class="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <div>
            <h2 class="text-xl font-bold text-text font-serif">
              {{ program.name }}
            </h2>
            <span class="text-muted font-mono text-xs tracking-wide"
              >v{{ program.version }}</span
            >
          </div>
          <a
            :href="program.repo"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 text-muted hover:text-text transition-colors text-sm font-mono shrink-0 pt-1"
          >
            <font-awesome-icon :icon="['fab', 'github']" />
            <span>Source</span>
          </a>
        </div>

        <!-- Description -->
        <p class="text-text/70 text-sm leading-relaxed font-serif px-6 pb-5">
          {{ program.description }}
        </p>

        <!-- Attached blog post -->
        <div
          v-if="getPost(program.postRoute)"
          class="mx-6 mb-5 border border-border rounded p-4 bg-surface"
        >
          <p
            class="font-mono text-xs tracking-widest uppercase text-muted mb-2"
          >
            Blog Post
          </p>
          <a
            :href="getPost(program.postRoute)!.route"
            class="text-text font-serif font-bold hover:text-red-hot transition-colors block leading-snug mb-1"
          >
            {{ getPost(program.postRoute)!.title }}
          </a>
          <p class="text-xs font-mono text-muted mb-2">
            {{ formatDate(getPost(program.postRoute)!.date) }}
          </p>
          <p class="text-sm text-text/60 leading-relaxed font-serif">
            {{ getPost(program.postRoute)!.description }}
          </p>
        </div>

        <!-- Downloads -->
        <div class="px-6 pb-5">
          <p
            class="font-mono text-xs tracking-widest uppercase text-muted mb-3"
          >
            Download
          </p>
          <div class="flex flex-wrap gap-3">
            <a
              v-for="release in program.releases"
              :key="release.label"
              :href="release.url"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 px-4 py-2 border border-border rounded text-sm font-mono text-text/75 hover:border-red/50 hover:text-text transition-colors"
            >
              <font-awesome-icon
                :icon="platformIcon[release.platform]"
                class="text-muted"
              />
              {{ release.label }}
            </a>
          </div>
        </div>

        <!-- Footer: all releases link -->
        <div class="border-t border-border px-6 py-3">
          <a
            :href="`${program.repo}/releases`"
            target="_blank"
            rel="noopener noreferrer"
            class="text-xs font-mono text-muted hover:text-red transition-colors"
          >
            All releases and changelogs →
          </a>
        </div>
      </article>
    </div>
  </main>
</template>
