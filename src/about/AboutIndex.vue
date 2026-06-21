<template>
  <main class="max-w-2xl mx-auto px-6 py-12 font-serif">
    <section class="space-y-4 mb-12 text-fg/75 leading-relaxed text-base">
      <p>
        Software engineer based in the Virginia / DC area. This blog covers
        practical software engineering - the algorithms, patterns, and systems
        thinking behind reliable software, written for working developers, not
        academics.
      </p>
      <p>
        A lot of concepts from operating systems, databases, and distributed
        systems get a reputation for being hard. Some of that reputation comes
        from the environments they were originally built in - C, manual memory
        management, bare metal. But the <em>ideas</em> themselves are usually
        straightforward. Write-ahead logging, transactions, consensus - these
        are patterns you can understand, reason about, and apply without
        building a storage engine from scratch.
      </p>
      <p>
        The goal here is to make those ideas accessible: concrete,
        implementable, and useful regardless of what kind of software you're
        building.
      </p>
    </section>

    <section class="mb-12">
      <h2
        class="font-mono text-xs tracking-widest uppercase text-muted border-b border-border pb-2 mb-6"
      >
        Engineering principles
      </h2>
      <ol
        class="list-decimal list-outside pl-5 space-y-4 text-base text-fg/75 leading-relaxed"
      >
        <li>
          <strong class="text-fg font-bold"
            >Prioritize the user and the use case.</strong
          >
          Technology serves a purpose. Don't lose sight of user experience,
          utility, and the real constraints of time, capital, and energy.
        </li>
        <li>
          <strong class="text-fg font-bold">Default to simplicity.</strong>
          Abstract and automate only when it improves the product. Complexity
          without purpose is a liability.
        </li>
        <li>
          <strong class="text-fg font-bold">Data ethics matter in AI.</strong>
          AI depends on data quality and transparency. Build tools that make
          data practices visible, not hidden.
        </li>
        <li>
          <strong class="text-fg font-bold"
            >Skilled engineers are the multiplier.</strong
          >
          Frameworks provide structure; engineers drive outcomes. Raise the
          technical floor, keep the ego low.
        </li>
        <li>
          <strong class="text-fg font-bold"
            >Be selective about what you keep current on.</strong
          >
          Not every new tool deserves attention. Focus on what's genuinely
          valuable and prune aggressively.
        </li>
        <li>
          <strong class="text-fg font-bold"
            >Stay in the box 98% of the time.</strong
          >
          Discipline and clarity in routine work creates space for real
          creativity where it actually matters.
        </li>
      </ol>
    </section>

    <section>
      <h2
        class="font-mono text-xs tracking-widest uppercase text-muted border-b border-border pb-2 mb-6"
      >
        About this site
      </h2>
      <p class="text-base text-fg/75 leading-relaxed mb-3">
        Built with Vue 3, served as static content via Nginx.
      </p>
      <p class="text-sm text-muted/70 italic">
        Opinions here are my own and do not reflect the views of my employer.
      </p>
    </section>
  </main>
</template>
