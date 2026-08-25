<template>
  <article class="max-w-2xl mx-auto px-6 py-12 font-serif">
    <header class="mb-10">
      <h1 class="text-4xl font-bold text-fg leading-tight mb-4">
        Measure Theory
      </h1>
    </header>

    <div class="prose prose-invert max-w-none">
      <h2>Introduction: Some Measure Theory</h2>
      <p>
        In this post, I will first lay the basic analysis groundwork needed to
        understand Borel Sigma Algebras (and of course, I will also explain
        sigma algebras). Then I will explain the basics of Measure Theory
        necessary for defining <code>L^p</code> and weak-<code>L^p</code>
        spaces in subsequent blog posts.
      </p>
      <p>
        Most of this post's reference material comes from my own notes on
        Analysis, but these notes came from
        <a
          href="https://www.amazon.com/Analysis-Third-Texts-Readings-Mathematics/dp/9380250649"
          >Terence Tao's</a
        >
        series on analysis. These are very readable introductions to analysis
        and I highly recommend them.
      </p>

      <h2>
        Metric Spaces and Topologies (A prerequisite to the Borel Sigma Algebra)
      </h2>
      <h3>Metric Space</h3>
      <p>
        Roughly speaking, a metric is a way to measure distance between two
        things and map that distance to the real line. It maps an ordered pair
        of a set <code>X</code> to the real numbers:
        <code>d : X × X → ℝ</code> given the following rules:
      </p>
      <p>For any two <code>x, y ∈ X</code>:</p>
      <ol>
        <li>Positive: <code>d(x, y) ≥ 0</code></li>
        <li>Positive Definiteness: <code>d(x, y) = 0 ↔ x = y</code></li>
        <li>Commutativity: <code>d(x, y) = d(y, x)</code></li>
        <li>Triangle Inequality: <code>d(x, y) ≤ d(x, z) + d(z, y)</code></li>
      </ol>
      <p>
        We call metrics with properties 1-3 <em>Semi Metrics</em>. A
        <em>Metric Space</em> is a set X equipped with a metric <code>d</code>,
        abbreviated <code>(X, d)</code>.
      </p>

      <h2>Topology</h2>
      <p>
        Roughly speaking, a <em>topology of a metric space</em> is a collection
        of "balls" that overlap one another. These "balls" are defined via a
        metric.
      </p>
      <p>
        For the metric space <code>(X, d)</code>, the "Ball centered at
        <code>x_0 ∈ X</code> with radius r" is abbreviated
        <code>B(x_0, r)</code> and is defined:
      </p>
      <p class="text-center">
        <code>B(x_0, r) := {y ∈ X : d(x_0, r) &lt; r}</code>
      </p>
      <p>Note the strict inequality. We call this an open set.</p>
      <p>For a subset <code>E ⊂ X</code>:</p>
      <ul>
        <li>
          The <em>Complement</em> of <code>E</code> is
          <p class="text-center"><code>E^c := X - E</code></p>
        </li>
        <li>
          The <em>Interior</em> of <code>E</code> is
          <p class="text-center">
            <code>Int(E) := {x ∈ X : ∃ r &gt; 0 : B(x, r) ⊂ E}</code>
          </p>
        </li>
      </ul>
      <p>
        Intuitively, an element of <code>X</code> is in the interor if we can
        make a substantially small "ball" around <code>x</code> that
        <em>fits</em> inside <code>E</code>. Although I haven't defined border
        yet, intuitively, think about a value on the border of <code>E</code>.
        No matter how small you make a "ball" surrounding <code>x</code>, you
        won't be able to fit the entire "Ball" inside <code>E</code>!
      </p>
      <ul>
        <li>
          The <em>Exterior</em> of <code>E</code> is
          <p class="text-center">
            <code>Ext(E) := {x ∈ X : ∃ r &gt; 0 st B(x, r) ⊂ E^c}</code>
          </p>
        </li>
      </ul>
      <p>
        Intuitively, a point is an exterior point to <code>E</code> if it's an
        interior point to <code>E^c</code>
      </p>
      <ul>
        <li>
          The <em>Boundary</em> of <code>E</code> is
          <p class="text-center">
            <code>∂E := X - (Int(E) ∪ Ext(E))</code>
          </p>
        </li>
      </ul>
      <p>
        The <em>Topological Space X = (X, F)</em> is a set <code>X</code> with a
        collection <code>F</code> of subsets of <code>X</code> called
        <em>open sets</em> that obey the following axioms:
      </p>
      <ol>
        <li><code>∅, X</code> are open</li>
        <li>The intersection of any finite number of open sets is open.</li>
        <li>The union of any arbitrary number of open sets is open.</li>
      </ol>
      <p>The collection <code>F</code> is called a <em>topology</em> on X.</p>

      <h2>Sigma Algebras (A prerequisite to Measure Spaces)</h2>
      <p>
        We know about power sets of some set <code>X</code> <code>P(X)</code>,
        and some of us know about <em>partitions</em> of a set <code>X</code> (a
        set of pair-wise disjoint subsets of <code>X</code> that collectively
        "cover" <code>X</code>)
      </p>
      <blockquote>
        <p>
          Note: n-wise disjoint means if you select any <code>n</code>
          elements from a set of sets, their intersection is empty.
        </p>
      </blockquote>
      <p class="text-center"><code>{0, 1, 2}, {3, 4, 5}</code></p>
      <blockquote>
        <p>is 2-wise disjoint (pair-wise).</p>
      </blockquote>
      <p class="text-center"><code>{0, 1, 2}, {2, 3, 4}, {4, 5, 0}</code></p>
      <blockquote>
        <p>is <em>not</em> 2-wise disjoint, but it is 3-wise disjoint.</p>
      </blockquote>
      <p>
        A sigma algebra (<code>σ-algebra</code>) (<code>ε</code>) of a set
        <code>X</code> is a set of subsets of <code>X</code> that:
      </p>
      <ul>
        <li>
          Is closed under complement:
          <p class="text-center">
            <code>(B ∈ ε) → (B^c ∈ ε)</code>
          </p>
        </li>
        <li>
          Is closed under countable unions:
          <p class="text-center">
            <code>(∀ j ∈ ℕ (B_j ∈ ε)) → ((∪ i=0..∞ B_i) ∈ ε)</code>
          </p>
        </li>
        <li>
          Is closed under countable intersections:
          <p class="text-center">
            <code>(∀ j ∈ ℕ (B_j ∈ ε)) → ((∩ i=0..∞ B_i) ∈ ε)</code>
          </p>
        </li>
        <li>
          Contains <code>∅</code> and <code>X</code>:
          <p class="text-center"><code>∅, X ∈ ε</code></p>
        </li>
      </ul>
      <p>Some examples of trivial sigma algebra's are:</p>
      <ol>
        <li>The power set of <code>X</code>, <code>P(X)</code></li>
        <li>
          The set:
          <p class="text-center"><code>{X, ∅}</code></p>
        </li>
      </ol>
      <p>
        Theorem A: The intersection of a (countably finite or infinite) set of
        <code>σ</code>-algebras is also a <code>σ</code>-algebra.
      </p>
      <p>
        A <code>σ</code>-algebra <em>generated</em> by a set <code>M</code> of
        arbitrary subsets of <code>X</code> is the smallest
        <code>σ</code>-algebra that contains <code>M</code> and is denoted in
        this post as <code>σ(M)</code>. In other words, the generated
        <code>σ</code>-algebra <code>σ(M)</code> is the intersection of all
        <code>σ</code>-algebra's that contain <code>M</code> as a subset.
      </p>
      <p class="text-center">
        <code>σ(M) = ∩ (over A such that M ⊂ A and A is a σ-algebra) A</code>
      </p>
      <p>
        This intersection is not the empty set because <code>M</code> is an
        element of the powerset <code>P(X)</code>, which is a
        <code>σ</code>-algebra who shares an intersection with all other
        <code>σ</code>-algebras.
      </p>
      <p>For example, consider the sets:</p>
      <p class="text-center">
        <code>X = {a, b, c, d} M = { {a}, {b} }</code>
      </p>
      <p>The <code>σ</code>-algebra generated by <code>M</code> is:</p>
      <p class="text-center">
        <code>{∅, X, {a}, {b}, {a, b}, {b, c, d}, {a, c, b}, {c, d}}</code>
      </p>
      <p>
        All this really means is some <code>σ</code>-algebra that contains
        <code>M</code>. I got to the above set of sets by first defining:
      </p>
      <p class="text-center"><code>σ(M) = {∅, X...}</code></p>
      <p>
        By definition of a <code>σ</code>-algebra, then adding <code>M</code>:
      </p>
      <p class="text-center"><code>σ(M) = {∅, X, {a}, {b}...}</code></p>
      <p>
        Then completing the <code>σ</code>-algebra by including complements and
        unions of sets.
      </p>

      <h2>The Borel Sigma Algebra</h2>
      <p>
        The open sets <code>F</code> of a topologic space
        <code>(X, F)</code> generate a <code>σ</code>-algebra called the
        <strong>Borel σ algebra</strong>.
      </p>

      <h2>Measure Space</h2>
      <p>
        A measure space is a collection of <code>(X, ε, μ)</code>. Where
        <code>X</code> is a set, <code>ε</code> is a <code>σ</code>-algebra of
        <code>X</code> and <code>μ</code> is a function
        <code>μ : ε → [0, ∞]</code> such that:
      </p>
      <ol>
        <li><code>μ(∅) = 0</code></li>
        <li>
          <code>μ(∪ n=1..∞ B_n) = Σ n=1..∞ μ(B_n)</code>
        </li>
      </ol>
      <p>For any pairwise disjoint elements <code>B_n ∈ ε</code></p>
      <ul>
        <li>
          <code>μ</code> is a (positive) <em>measure</em> on <code>X</code>
        </li>
        <li><code>B ∈ ε</code> is called a <em>measurable set</em></li>
      </ul>
      <p>
        A measure space with set <code>X</code> is called <code>σ</code>-<em
          >finite</em
        >
        if there is some sequence of measurable subsets
        <code>X_n ⊂ X</code> such that:
      </p>
      <p class="text-center"><code>X = ∪ n=1..∞ X_n</code></p>
      <p class="text-center"><code>μ(X_n) &lt; ∞</code></p>
      <p>
        A function <code>f: X → ℝ</code> is called <em>measurable</em> if it's
        preimage is measurable (that is <code>{x ∈ X : f(x) > λ}</code> is
        measurable for all <code>λ ∈ ℝ</code>)
      </p>
      <p>
        A function <code>f: X → ℂ</code> is called <em>measurable</em> if it's
        real and imaginary parts are measurable.
      </p>
    </div>
  </article>
</template>
