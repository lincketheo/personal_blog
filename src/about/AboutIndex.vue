<template>
  <main class="max-w-2xl mx-auto px-6 py-12">

    <section class="prose-section">
      <p>
        Software engineer based in the Virginia / DC area. This blog covers practical software engineering —
        the algorithms, patterns, and systems thinking behind reliable software, written for working developers,
        not academics.
      </p>
      <p>
        A lot of concepts from operating systems, databases, and distributed systems get a reputation for being
        hard. Some of that reputation comes from the environments they were originally built in — C, manual memory
        management, bare metal. But the <em>ideas</em> themselves are usually straightforward. Write-ahead logging,
        transactions, consensus — these are patterns you can understand, reason about, and apply without building
        a storage engine from scratch.
      </p>
      <p>
        The goal here is to make those ideas accessible: concrete, implementable, and useful regardless of what
        kind of software you're building.
      </p>
    </section>

    <section class="principles-section">
      <h2>Engineering principles</h2>
      <ol>
        <li>
          <strong>Prioritize the user and the use case.</strong>
          Technology serves a purpose. Don't lose sight of user experience, utility, and the real constraints
          of time, capital, and energy.
        </li>
        <li>
          <strong>Default to simplicity.</strong>
          Abstract and automate only when it improves the product. Complexity without purpose is a liability.
        </li>
        <li>
          <strong>Data ethics matter in AI.</strong>
          AI depends on data quality and transparency. Build tools that make data practices visible, not hidden.
        </li>
        <li>
          <strong>Skilled engineers are the multiplier.</strong>
          Frameworks provide structure; engineers drive outcomes. Raise the technical floor, keep the ego low.
        </li>
        <li>
          <strong>Be selective about what you keep current on.</strong>
          Not every new tool deserves attention. Focus on what's genuinely valuable and prune aggressively.
        </li>
        <li>
          <strong>Stay in the box 98% of the time.</strong>
          Most engineering work is incremental. Discipline and clarity in the routine work creates space for
          real creativity in the problems that actually call for it.
        </li>
      </ol>
    </section>

    <section class="prose-section">
      <h2>About this site</h2>
      <p>
        Built with Vue 3, served as static content via Nginx.
      </p>
      <p class="disclaimer">
        Opinions here are my own and do not reflect the views of my employer.
      </p>
    </section>

  </main>
</template>

<style scoped>
main {
  font-family: Georgia, 'Times New Roman', serif;
}

.prose-section,
.principles-section {
  margin-bottom: 3rem;
}

.prose-section p,
.principles-section p {
  font-size: 1rem;
  line-height: 1.75;
  color: rgba(25, 27, 14, 0.85);
  margin-bottom: 1.25rem;
}

h2 {
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace;
  color: #191B0E;
  border-bottom: 1px solid rgba(25, 27, 14, 0.15);
  padding-bottom: 0.5rem;
  margin-bottom: 1.25rem;
}

ol {
  list-style: decimal;
  padding-left: 1.5rem;
  counter-reset: none;
}

ol li {
  font-size: 1rem;
  line-height: 1.7;
  color: rgba(25, 27, 14, 0.85);
  margin-bottom: 1rem;
  padding-left: 0.25rem;
}

ol li strong {
  color: #191B0E;
  font-weight: 700;
}

.disclaimer {
  font-size: 0.875rem;
  color: rgba(25, 27, 14, 0.45);
  font-style: italic;
}

@media (prefers-color-scheme: dark) {
  h2 { color: #FEFAE5; border-bottom-color: rgba(254, 250, 229, 0.12); }
  .prose-section p,
  .principles-section p,
  ol li { color: rgba(254, 250, 229, 0.8); }
  ol li strong { color: #FEFAE5; }
  .disclaimer { color: rgba(254, 250, 229, 0.4); }
}
</style>
