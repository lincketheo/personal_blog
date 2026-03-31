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
      <div class="lg:col-span-3 space-y-8 p-10">
        <p class="indent-5">
          Hello, I'm a Software Engineer from the Virginia DC area.
          <br>
          <br>
          I started this blog because I want to highlight some of the traditional software engineering techniques that
          we use to build really reliable software.
          <br>
          <br>
          In the past, some of these algorithms and techniques were seen as really challenging to implement,
          particularly because the landscape of software engineering was such that you had to balance a hundred
          variables on top of the algorithm that you're choosing. Building a database in C is really hard, but that's
          not necessarily because the algorithms and the concepts behind databases are hard. It has to do with the
          complexity of the C programming language and manual memory management. But the principles behind database
          management systems are actually not that hard to wrap your head around. They're actually very simple.
          <br>
          <br>
          I think there's a stigma that there are some hard problems — like operating systems, databases, embedded
          software — and that these concepts are really hard to wrap your head around, and that we shouldn't even try to
          use principles from them in our code. But that's not necessarily true.
          <br>
          <br>
          One common example I want to give is the implementation of a transaction. The idea goes back to Jim Gray's
          work in the 1970s and 80s — the ACID properties (atomicity, consistency, isolation, durability) that every
          database textbook covers. In C, where we don't have access to higher level paradigms like automatic memory
          management, implementing a correct transaction used to be really challenging. You had to reason carefully
          about failure modes, about what happens if the process crashes halfway through a write. Techniques like
          write-ahead logging (WAL) and ARIES-style recovery were developed precisely to solve this — to give you a
          principled way to guarantee that either all of a transaction's effects are visible, or none of them are. The
          thing is, those techniques have been implemented. They exist. Modern databases give us those guarantees, and
          more importantly, the ideas behind them are ones we can use in our own software without building a full
          storage engine from scratch.
          <br>
          <br>
          Anyways, I started this blog because I want to talk about some of the concepts that we learn in computer
          science that might seem complicated or complex but are actually really easy, and are great ways of exercising
          your muscles as a software engineer. You may not implement any of these patterns directly, but understanding
          them changes how you think about reliability, correctness, and failure.
          <br>
          <br>
          I don't want this to be an academic blog. I want this to be an easy to grasp blog about concepts that are easy
          to understand — as a database developer, or as any type of developer, not just a database developer. I want
          you to feel like you can go out and build a basic transactional system on your own, using just software
          engineering principles.
          <br/>
          <br/>
          Who am I? Outside of work, I stay active — country‑swing dancing at Clarendon Ballroom in Arlington, hiking
          and camping off‑grid, and spending time lifting or riding my bike on the Washington & Old Dominion Trail or
          C&O.
          <br/>
          <br/>
          Please keep in mind that
          any
          opinions and/or thoughts represented on this website are purely my own and do not reflect the opinion of my
          employer.
        </p>
      </div>

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
          <hr class="border-on-surface/20 dark:border-on-surface-dark/20"/>
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
