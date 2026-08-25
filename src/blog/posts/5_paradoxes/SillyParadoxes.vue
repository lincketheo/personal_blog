<template>
  <article class="max-w-2xl mx-auto px-6 py-12 font-serif">
    <header class="mb-10">
      <h1 class="text-4xl font-bold text-fg leading-tight mb-4">
        Some Silly Paradoxes
      </h1>
    </header>

    <div class="prose prose-invert max-w-none">
      <h2>Introduction: Paradoxes and Consistency</h2>
      <p>
        In this post, I will explore some interesting paradoxes. I'll probably
        add to this post in the future, but for now, I just want this post to be
        about some silly little paradoxes that have shown up in math in the
        past.
      </p>

      <h2>Cantor's Paradox</h2>
      <p>
        Theorem A: The cardinality of a subset (N) of a set (M) is less than or
        equal to the cardinality of M. E.g., if <code>N ⊂ M</code>, then
        <code>|N| ≤ |M|</code>.
      </p>
      <p>
        Cantor's Theorem: The cardinality of a set is strictly less than the
        cardinality of its power set. E.g., <code>|M| &lt; |P(M)|</code>.
      </p>
      <p>
        Cantor's theorem is easy to see from Theorem A. <code>M</code> is a
        subset of <code>P(M)</code> so <code>|M| ≤ |P(M)|</code>. The proof of
        <em>strict</em>-ness (e.g. non-equality) requires a couple more steps.
        You can start by imagining the set <code>N</code> of all the singleton
        sets of <code>M</code>, which shares the cardinality of <code>M</code>.
      </p>
      <p>
        Cantor's Paradox: Suppose <code>M</code> is the set of all sets. Then
        <code>P(M)</code>, being a set of all (sub) sets (of M), is an element
        of <code>M</code>. By cantor's theorem, <code>|M| &lt; |P(M)|</code>,
        and <strong>not</strong> <code>|P(M)| ≥ |M|</code>. However, because
        <code>M ⊂ P(M)</code> and by Theorem A, <code>|M| ≤ |P(M)|</code>. We've
        just proven that <code>M ≤ P(M)</code> and that this is not true. Hence,
        a contradiction.
      </p>

      <h2>Russell's Paradox</h2>
      <p>
        Suppose a barber in a village decides to cut the hair of all the people
        in the village who <em>do not cut their own hair</em>. Should the barber
        cut his hair?
      </p>
      <p>
        Suppose every city in Colorado must have a representative. Every city
        can have a different representative. Sometimes the representatives of a
        city do not live in that city. Suppose a law is passed that creates
        another city S for all the representatives that are not residents of
        their city to reside. Where should the representative of S reside?
      </p>
      <blockquote>
        <p>
          Library of Congress, a bibliography of all those bibliographies in the
          Library of Congress which do not list themselves.
        </p>
      </blockquote>
      <p>
        Consider the set of all sets that are not members of themselves (T):
      </p>
      <ul>
        <li><code>S = {a, b, c}</code> is a member of T</li>
        <li><code>S = {S, a, b}</code> is not a member of T</li>
      </ul>
      <p>Is T a member of itself?</p>
      <ul>
        <li>
          Suppose Yes: T is a member of itself. Then T is a set that is a member
          of itself, so by definition, it is not a member of T! This shows that
          T must <em>not</em> be a member of itself (reductio by absurdum).
        </li>
        <li>
          Suppose No: T is not a member of itself. Then T is not a member of
          itself, so by definition, it is a member of T! This shows that T
          <em>must</em> be a member of itself (reductio by absurdum).
        </li>
      </ul>

      <h2>The Epimendies Paradox</h2>
      <blockquote>
        <p>
          "Cretans are always liars..." - Epimenides of Crete (Epimendies was a
          Cretan)
        </p>
      </blockquote>
      <p>
        Certainly, if Epimenides' statement is true, then Cretans will always
        tell lies. However, Epimenides' himself was a Cretan, so he has just
        shown that he told a truth, invalidating his claim!
      </p>
      <p>
        So it must be that some Cretans in the past, present, or future tell the
        truth! However, what if the only thing all Cretans ever said were this
        sentence? Then all Cretans have ever done is lie!
      </p>
      <p>A more obvious form of the paradox is the sentence:</p>
      <p>"This sentence is not true"</p>
      <p>
        If the sentence is true, then the sentence is not true. So by absurdum,
        the sentence must not be true!
      </p>
      <p>
        If the sentence is not true, then it must be true. So by absurdum, the
        sentence must be true!
      </p>
    </div>
  </article>
</template>
