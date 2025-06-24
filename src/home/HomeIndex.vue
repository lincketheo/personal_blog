<script setup lang="ts">
import {meta} from "@/meta"

const all = meta.blog.posts.sort((a, b) => new Date(a.date) < new Date(b.date) ? 1 : -1)

const recent = all.slice(0, 4)
const popular = all.filter(it => it.popular)

</script>

<template>
  <main class="space-y-24">
    <!-- Intro & Avatar ------------------------------------------------------>
    <section class="grid lg:grid-cols-3 gap-16">
      <!-- Intro copy --------------------------------------------------------->
      <div class="lg:col-span-2 space-y-8 p-10">
        <p class="indent-5">
          Hello, I'm a Software Engineer from the Virginia DC area. I worked a little bit in digital signal processing and
          full‑stack development, and I enjoy building secure, reliable software. Technically, I subscribe to certain
          aspects of the Unix philosophy (keeping things simple, and building software tools that work in tandem with
          one another), but I concede that users are the most important thing. Unix isn't very user‑friendly. It's
          always a balance and trade‑off.
          <br /><br />
          Outside of work, I stay active — country‑swing dancing at Clarendon Ballroom in Arlington, hiking and camping
          off‑grid, and spending time lifting or riding my bike on the Washington & Old Dominion Trail or C&O.
          <br />
          This is a website for me to talk about software engineering, math, and philosophy. Please keep in mind that any
          opinions and/or thoughts represented on this website are purely my own and do not reflect the opinion of my
          employer.
        </p>
      </div>

      <!-- Avatar ------------------------------------------------------------->
      <aside class="flex items-center justify-center">
        <img
            src="@/assets/theo-avatar.webp"
            alt="Theo avatar"
            class="w-64 h-64 object-cover rounded-full shadow-lg"
        />
      </aside>

      <!-- North Stars (full width) ------------------------------------------->
      <div class="lg:col-span-3 space-y-4 px-10">
        <h2 class="text-3xl font-bold">My North Stars of Software</h2>
        <ol class="list-decimal list-inside space-y-4">
          <li>
            <b>Prioritize the User (or the use case):</b>
            Technology is very academic, but don't forget the reason we write software — to enhance user experience,
            utility, and satisfaction within the company's time, capital, and energy constraints.
          </li>
          <li>
            <b>Simplicity and Usability:</b>
            Engineers love to create unnecessary complexity. Automate or abstract only when it improves the product;
            complexity without purpose is counterproductive.
          </li>
          <li>
            <b>Ethical Data Fuels AI:</b>
            AI relies on quality, transparent data. Create tools that openly display data collection, avoiding hidden or
            implicit practices.
          </li>
          <li>
            <b>The Value of Skilled Engineers:</b>
            Frameworks like Agile provide structure, but skilled, principled engineers drive success. Elevate skills,
            minimize ego, and respect others' contributions.
          </li>
          <li>
            <b>Stay Relevant, But Selective:</b>
            Ruthlessly filter which solutions stay top of mind. Focus on the most valuable, current tools, and avoid
            outdated or redundant practices.
          </li>
          <li>
            <b>Stay inside the box 98% of the time to let the 2% shine:</b>
            Engineers are trained in school to solve "cool" problems, and while some continue doing so, most of us
            innovate incrementally. Focus on organization and clarity to allow for the freedom to work creatively in
            that crucial 2%. In short, 98% of your work as an engineer should stay "inside the box."
          </li>
        </ol>
      </div>
    </section>

    <!-- Build & Posts -------------------------------------------------------->
    <section class="space-y-12">
      <!-- How built (full width) -------------------------------------------->
      <div class="space-y-4 px-10">
        <h2 class="text-2xl font-bold">How's this website built?</h2>
        <p class="indent-5">
          I'm not primarily a front‑end developer, but I like to dabble. I put this together in Vue 3. It's served by a
          simple Nginx instance as static content — I like simplicity.
        </p>
      </div>

      <!-- Popular + Recent grid --------------------------------------------->
      <div class="grid lg:grid-cols-3 gap-16 px-10 lg:px-0">
        <!-- Popular --------------------------------------------------------->
        <div class="lg:col-span-2 space-y-4">
          <h2 class="text-xl font-semibold">Popular</h2>
          <div
              class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 rounded-lg bg-surface dark:bg-surface-dark text-on-surface dark:text-on-surface-dark"
          >
            <div v-for="post in popular" :key="post.route" class="space-y-1">
              <p class="font-bold">{{ post.title }}</p>
              <p>{{ post.description }}</p>
              <a :href="post.route" class="underline hover:text-primary">more…</a>
            </div>
          </div>
        </div>

        <!-- Recent ---------------------------------------------------------->
        <aside
            class="bg-surface dark:bg-surface-dark text-on-surface dark:text-on-surface-dark p-5 rounded-lg space-y-4"
        >
          <h2 class="text-xl font-semibold">Recent</h2>
          <hr class="border-on-surface/20 dark:border-on-surface-dark/20" />
          <div v-for="post in recent" :key="post.name" class="space-y-2">
            <a :href="post.route" class="font-bold underline hover:text-primary">{{ post.title }}</a>
            <p class="text-sm italic">{{ post.date.toLocaleDateString() }}</p>
            <p>{{ post.description }}</p>
            <a :href="post.route" class="underline hover:text-primary">more…</a>
          </div>
        </aside>
      </div>
    </section>
  </main>
</template>
