<script setup lang="ts">
import { computed, ref, nextTick, watch } from "vue";
import { marked } from "marked";

const props = defineProps<{ route: string; mathjaxmsg?: boolean }>();

const mkdata = ref("");

// Protect math blocks before marked processes them so LaTeX isn't mangled.
function protectMath(src: string): { protected: string; stash: string[] } {
  const stash: string[] = [];
  const out = src
    // display math first ($$...$$)
    .replace(/\$\$([\s\S]*?)\$\$/g, (_, inner) => {
      stash.push(`$$${inner}$$`);
      return `MATHSTASH${stash.length - 1}END`;
    })
    // inline math ($...$)
    .replace(/\$([^\n$]*?)\$/g, (_, inner) => {
      stash.push(`$${inner}$`);
      return `MATHSTASH${stash.length - 1}END`;
    });
  return { protected: out, stash };
}

function restoreMath(html: string, stash: string[]): string {
  return html.replace(/MATHSTASH(\d+)END/g, (_, i) => stash[Number(i)]);
}

const mkhtml = computed(() => {
  const { protected: safe, stash } = protectMath(mkdata.value);
  const html = marked(safe) as string;
  return restoreMath(html, stash);
});

async function retypeset() {
  await nextTick();
  const mj = (window as any).MathJax;
  if (mj?.typesetPromise) {
    await mj.typesetPromise();
  }
}

watch(mkhtml, retypeset);

fetch(props.route).then(async (it) => {
  mkdata.value = await it.text();
});
</script>

<template>
  <p v-if="mathjaxmsg" class="pb-10 italic">
    Some of the formula on this page are rendered using MathJax. If they don't
    render immediately, you can just hard reload (Ctrl+Shift+R).
  </p>
  <div class="flex-row justify-center">
    <article
      class="prose prose-invert max-w-none"
      v-html="mkhtml"
    ></article>
  </div>
</template>
