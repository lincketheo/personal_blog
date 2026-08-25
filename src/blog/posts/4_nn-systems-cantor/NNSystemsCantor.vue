<template>
  <article class="max-w-2xl mx-auto px-6 py-12 font-serif">
    <header class="mb-10">
      <h1 class="text-4xl font-bold text-fg leading-tight mb-4">
        Cantor, Natural Numbers and Formal Systems
      </h1>
    </header>

    <div class="prose prose-invert max-w-none">
      <h2>Introduction: An Assortment of Concepts</h2>
      <p>
        In this post, I will explore some properties of natural numbers and
        abstract systems in mathematics. Reference material belongs in
        <a
          href="https://www.amazon.com/Introduction-Metamathematics-Stephen-Cole-Kleene/dp/0923891579"
          >Introduction to Meta Mathematics by Kleene</a
        >
        chapter 1.
      </p>

      <h2>Cantor's Diagonalization Argument</h2>
      <blockquote>
        <p>
          God made the integers, all the rest is the work of man -Kronecker
          (1886)
        </p>
      </blockquote>
      <p>
        An <strong>Enumerable Set</strong> <code>S</code> (often called
        <strong>denumerable</strong> or <strong>countable</strong> but
        <em>enumerable</em> is the word I will use here to be consistent with
        Cantor's theory of sets) is one that can be placed in a 1-1
        correspondence with the natural numbers.
      </p>
      <p>
        Intuitively, you can write all the elements of <code>S</code> in a
        comma-separated list using some algorithmic strategy. You can lay each
        element out one after the other and cover all of the elements of the
        set. The set of integers can be written as:
      </p>
      <p>0, 1, -1, 2, -2, 3, -3...</p>
      <p>
        And we can confidently account for all of the integers in this seemingly
        obvious pattern. When proving a set is enumerable, a math student is
        often tasked with finding a function to conclude that there is an
        injection from a set to the natural numbers; but you may also define an
        algorithm or pattern for enumerating through each of the elements of the
        set.
      </p>
      <p>The set of rational numbers can be written as follows:</p>
      <p>
        <code>1/1</code>, <code>2/1</code>, <code>1/2</code>, <code>1/3</code>,
        <code>2/2</code>, <code>3/1</code>, <code>4/1</code>, <code>3/2</code>,
        <code>2/3</code>...
      </p>
      <p>
        See the pattern? It's tricky to see, but if we arrange the rational
        numbers in a square matrix with <code>1/1, 1/2, 1/3...</code> on the top
        row and <code>1/1, 2/1, 3/1...</code> on the left column, then we can
        snake through the diagonals of this matrix to "draw a straight line"
        through all the rational numbers.
      </p>
      <p>
        This same layout shows that ordered pairs, ordered triples... can simply
        be layed out in an n-dimensional matrix and enumerated using a similar
        strategy shown above, which leads to some interesting claims such as
        "the set of all polynomials with integral coefficients are enumerable":
      </p>
      <p class="text-center">
        <code>a_0 x^n + a_1 x^(n-1) + ... a_n = 0, a_0 != 0</code>
      </p>
      <p>can be uniquely identified as:</p>
      <p class="text-center"><code>(a_0, a_1, ... a_n)</code></p>
      <p>which is enumerable.</p>
      <p>What about the real numbers?</p>
      <p>
        Let's assume the real numbers in the range <code>(0, 1)</code> (it's
        easy to extend this proof to all real numbers) are enumerable and
        there's some algorithm for laying out all of them in a column:
      </p>
      <p class="text-center"><code>r_0</code></p>
      <p class="text-center"><code>r_1</code></p>
      <p class="text-center"><code>r_2</code></p>
      <p>...</p>
      <p>
        Now, for each <code>r_i</code> select the <code>i'th</code> decimal
        place (so if <code>r_1 = 0.123</code> select <code>2</code>) and add one
        to it and place it in the <code>i'th</code> decimal place of a new
        number <code>r'</code>. For example:
      </p>
      <p class="text-center"><code>r_0 = 0.100...</code></p>
      <p class="text-center"><code>r_1 = 0.020...</code></p>
      <p class="text-center"><code>r_2 = 0.003...</code></p>
      <p class="text-center"><code>r' = 0.234</code></p>
      <p>
        We can confidently say that <code>r'</code> is a real number, but does
        not belong to that enumeration! Meaning the real numbers are not
        enumerable (e.g., a contradiction).
      </p>
      <p>
        What did we just show? Earlier we showed that any finite collection of
        ordered natural numbers was enumerable. Just now, we showed that any
        <em>infinite</em> collection of ordered natural numbers (where
        <code>0.123...</code> can be uniquely identified by
        <code>(1, 2, 3, ...)</code>) is <em>not</em> enumerable.
      </p>
      <p>
        In other words, the (infinite) set of all infinitely enumerable sets is
        not enumerable.
      </p>
      <blockquote>
        <p>
          More formally: <code>ω_1 =</code> the set of all countable ordinal
          numbers
        </p>
      </blockquote>
      <p>
        Whatever form of real analysis you learned, it is easy to see a
        similarity in this conclusion. For example, consider the following
        construction of the reals (with lots of pre-definitions left out, e.g.
        what's a <code>LIM</code>? That's not important for my point):
      </p>
      <hr />
      <p>
        Definition 5.3.1 (Real numbers). A real number is defined to be an
        object of the form
      </p>
      <p class="text-center">
        <code>LIM_(n→∞) a_n</code>
      </p>
      <p>where</p>
      <p class="text-center"><code>(a_n)_(n=1)^∞</code></p>
      <p>is a Cauchy sequence of rational numbers. Two real numbers</p>
      <p class="text-center">
        <code>LIM_(n→∞) a_n and LIM_(n→∞) b_n</code>
      </p>
      <p>are said to be equal iff</p>
      <p class="text-center">
        <code>(a_n)_(n=1)^∞ and (b_n)_(n=1)^∞</code>
      </p>
      <p>
        are equivalent Cauchy sequences. The set of all real numbers is denoted
        <code>ℝ</code>.
      </p>
      <hr />
      <p>
        Every definition of the reals in some form of real-analysis will have
        some "second infinity." Whereas we only need one natural number to
        define the next (see the section on natural numbers), we need a sort of
        "second infinity" to define the real numbers.
      </p>

      <h2>Cantor's theory of (naive) sets</h2>
      <p>Cantor defines a "set" and "element":</p>
      <blockquote>
        <p>
          By a 'set' we understand any collection M of definite
          well-distinguished objects m of our perception or our thought (which
          are called the 'elements' of M) into a while
        </p>
      </blockquote>
      <p>Some facts about Cantor's sets include:</p>
      <ul>
        <li>Sets include the <em>empty</em> set.</li>
        <li>
          Sets have a notion of equality (<code>M = N</code>) if they contain
          the same elements.
        </li>
        <li>
          Sets have a notion of equivalency (<code>M ~ N</code>) if there is a
          1-1 correspondence between them.
        </li>
      </ul>
      <p>
        The <em>cardinal number</em> of a set <code>M</code> is a distinct
        object <code>|M|</code> that is associated in common with all sets
        (including <code>M</code>) that are equivalent to <code>M</code>:
      </p>
      <p class="text-center"><code>|N| = |M| iff N ~ M</code></p>
      <p>
        For now, I think this is all I want to cover on Cantor's theory of sets
        in this post (and set theory at all for that matter). Later on, I will
        describe some notable theorems in set theory (such as Cantor's theorem
        and how it leads to Cantor's paradox), and I will definitely describe
        Zarmelo Fraenkel set theory eventually, but for the sake of this initial
        post, I will stop here.
      </p>
      <p>
        For further reading, you can refer to any well-written book on Set
        Theory (<a
          href="https://www.google.com/books/edition/Set_Theory/WTAl997XDb4C?hl=en"
          >Set Theory by Thomas Jech</a
        >
        is a good one) to continue further in the study of the theory of sets.
      </p>

      <h2>Natural Numbers</h2>
      <p>
        We define the natural numbers by starting at a single object 0. A
        natural number can be obtained by taking the <em>successor</em>
        (<code>n'</code>) of any other natural number (<code>n</code>). To a
        computer, all the natural numbers is:
      </p>
      <p class="text-center"><code>0, 0', (0')', ((0')')' ...</code></p>
      <p>
        I use "..." to indicate the continuation of a seemingly obvious pattern.
        I use <code>()</code> to represent the natural number that is defined by
        some group of operations happening inside the <code>()</code>. From here
        on out, I will assume <code>(n')'</code> is the same as
        <code>n''</code>. A more formal description is through the following
        propositions (CR meaning "construction rule"):
      </p>
      <ul>
        <li>CR1: 0 is a natural number</li>
        <li>
          CR2: If <code>n</code> is a natural number, <code>n'</code> is also a
          natural number
        </li>
        <li>CR3: The only natural numbers are given by CR1 and CR2.</li>
      </ul>
      <p>
        1-3 are an <em>inductive definition</em>. 1-2 represent
        <em>direct clauses</em>, or instances of the thing we are trying to
        define. 3 represents the <em>extremal clause</em>. Distinctness is often
        useful if we wish for 1-3 to provide utility to areas of mathematics,
        and it can be defined using the axiom:
      </p>
      <ul>
        <li>
          CR4: For any natural numbers <code>m</code> and <code>n</code> and
          <code>m' = n'</code> only if <code>m = n</code>.
        </li>
        <li>CR5: For any natural number <code>n, n' != 0</code>.</li>
      </ul>
      <p>
        (Note that Peano ordered 3 as number 5 and pushed 4 and 5 back one
        spot).
      </p>

      <h2>System</h2>
      <p>
        A system <code>S</code> of objects is a set <code>D</code> of objects
        which have established relationships. The natural numbers are a system
        of type <code>(D, 0, ')</code> where <code>D</code> is a set,
        <code>0</code> is a member of the set and <code>'</code> is a 1-arity
        operator on members of <code>D</code>. If the objects in
        <code>D</code> are only known through relationships of the system, the
        system is called <em>abstract</em>.
      </p>
      <p>
        <em>Abstract</em> systems are defined using some sort of structure.
        Further specification of what the objects are is a
        <em>representation</em>. Some examples of <em>representations</em>
        of the axiomatic system presented in 1-5 are:
      </p>
      <p>
        The positive natural numbers (just substitute 1 with 0)<br />
        The even natural numbers (start with 2 and assume the operator
        <code>n'</code> is the familiar operation of <code>n + 2</code>.
      </p>
      <p>
        Two <em>representations</em> of the same <em>system</em> are called
        <em>simply isomorphic</em> (abbrv. <em>isomorphic</em>). That is:
      </p>
      <blockquote>
        <p>
          Two systems <code>(D_1, 0_1, '_1)</code> and
          <code>(D_2, 0_2, '_2)</code> of the type <code>(D, 0, ')</code> are
          simply isomorphic if there exists a 1-1 correspondence between
          <code>D_1</code> and <code>D_2</code> such that
          <code>0_1</code> corresponds to <code>0_2</code> and whenever
          <code>m_1 ↔ m_2</code>, then <code>m_1'_1 ↔ m_2'_2</code>
        </p>
      </blockquote>
      <p>
        There are two main traditional introductions to systems in mathematics:
      </p>
      <ul>
        <li>
          <em>Genetic or constructive</em> method is how we previously
          constructed the natural numbers.
        </li>
        <li>
          <em>Axiomatic or postulational</em> method lays out some propositions
          that are assumed to be true (<em>axioms</em> or <em>postulates</em>).
        </li>
      </ul>
      <p>
        We can also reword 1-5 in our construction of the natural numbers as
        <em>axioms</em>:
      </p>
      <p class="text-center"><code>P1: 0 ∈ D</code></p>
      <p class="text-center"><code>P2: (n ∈ D) → (n' ∈ D)</code></p>
      <p class="text-center">
        <code>P3: (m ∈ D ∧ n ∈ D) → (m' = n' → m = n)</code>
      </p>
      <p class="text-center"><code>P4: (n ∈ D) → (n' ≠ 0)</code></p>
      <p class="text-center">
        <code>P5: ((P ⊂ D) ∧ (0 ∈ P) ∧ (n ∈ P → n' ∈ P)) → (P = D)</code>
      </p>
      <p>
        Notably, some interesting things happen when we remove axioms. For
        example, if we remove axiom P4, then the new abstract system is the
        natural numbers and systems of residues mod <code>m</code> for each
        positive integer <code>m</code>:
      </p>
      <p>residues mod 3:</p>
      <p>0, 1, 2, 0, 1, 2, 0, 1, 2...</p>
      <p>
        Or if we replace P4 with P6:
        <code>n ∈ D → (n' ≠ n ∧ n'' = n)</code>, then we get residues mod 2:
      </p>
      <p>0, 1, 0, 1, 0, 1....</p>
      <p>Axioms may be satisfied by three cases:</p>
      <ul>
        <li>
          No system of objects exists that satisfy the axioms. Such a set of
          axioms are <em>vacuous</em>. Example:
          <ul>
            <li>P1-P6</li>
          </ul>
        </li>
      </ul>
      <p>
        We can show that there is no system that satisfies these axioms. Assume
        there was such a system. Then <code>0 ∈ D</code> (P1), so
        <code>0' ∈ D</code> (P2) so <code>0'' ∈ D</code> (P2). By P6 and the
        fact that <code>0' ∈ D</code>, <code>0'' = 0 ∧ 0'' ≠ 0'</code>. However,
        by P4, <code>0'' ≠ 0</code>, leading to a contradiction. Therefore, our
        original claim that there is such a system is false by contradiction.
      </p>
      <ul>
        <li>
          Non-isomorphic systems exist that satisfy the axioms. That is, the
          axioms can represent more than one abstract system. Such a set of
          axioms are <em>non-vacuous</em> and <em>ambiguous</em>. Example:
          <ul>
            <li>P1-P4</li>
            <li>P1-P3, P5</li>
          </ul>
        </li>
      </ul>
      <p>
        In the second example, without P4, consider the example
        <em>representation</em> of the abstract system:
      </p>
      <p class="text-center"><code>0</code></p>
      <p class="text-center"><code>0' = 1</code></p>
      <p class="text-center"><code>1' = 0</code></p>
      <p>(residues mod 2)</p>
      <p>Or, similarly, consider the example <em>representation</em>:</p>
      <p class="text-center"><code>0</code></p>
      <p class="text-center"><code>0' = 1</code></p>
      <p class="text-center"><code>1' = 2</code></p>
      <p class="text-center"><code>2' = 0</code></p>
      <p>(residues mod 3)</p>
      <p>
        These two representations are not isomorphic because there is not a 1-1
        correspondence between <code>D_1 = {0, 1}</code> and
        <code>D_2 = {0, 1, 2}</code>.
      </p>
      <ul>
        <li>
          Exactly one abstract system satisfies the axioms. Such a set of axioms
          are <em>non-vacuous</em> and <em>categorical</em> Examples:
          <ul>
            <li>P1-P5</li>
            <li>P1-P3, P5, P6</li>
          </ul>
        </li>
      </ul>
      <p>
        Sometimes, axioms cannot clearly be put into either category above. For
        example, until the discovery of non-Euclidean geometry (Lobatchevsky
        1829 and Bolyai 1833), Euclid's axioms (without the parallel postulate)
        were considered categorical. An excellent story version of this
        controversy is illustrated in the book Godel Escher Bach by Hofstader,
        which is an enjoyable read, indeed.
      </p>

      <h2>Non-enumerable sets (again)</h2>
      <p>
        Ask yourself if you can list some of the isomorphism representations
        (see definition later on) of natural numbers defined as a formal system.
        You might list the following:
      </p>
      <ol>
        <li>The set of natural numbers</li>
        <li>The set of odd integers</li>
        <li>The set of even integers</li>
        <li>The set of rational numbers</li>
        <li>The set of numbers with more than two significant figures</li>
        <li>The set of all primes</li>
        <li>The set of all powers of 7</li>
      </ol>
      <p>
        But what about the following set (S): The set of all numbers such that
        the natural number index in the above list of enumerable sets doesn't
        belong to the set that it specifies?
      </p>
      <ul>
        <li>(1) The set of natural numbers</li>
      </ul>
      <p>
        Does 1 belong to the set of natural numbers? Yes! So 1 is not an element
        of S.
      </p>
      <ul>
        <li>(2) The set of odd integers</li>
      </ul>
      <p>
        Does 2 belong to the set of even integers? No! So 2 is an element of S.
      </p>
      <ul>
        <li>(3) The set of even integers</li>
      </ul>
      <p>
        Does 3 belong to the set of even integers? No! So 3 is an element of S.
      </p>
      <p>And so on...</p>
      <p>So far, our set <code>S = {2, 3, 4, 5, 6 ...}</code>.</p>
      <p>
        Ok, easy, we can just call our new set Set 8. Fixed! But wait, 8 doesn't
        belong to Set 8, so we can do the same thing we just did and define Set
        9, that <em>does</em> contain the number 8. Fixed! Ah, yet again, 9 is
        not an element of Set 9.
      </p>
      <p>
        We can intuitively conclude from this small exercise that it's
        impossible to algorithmically describe all of the sets of enumerable
        sets because we could continue to generate S-type sets (where they
        describe the set of all numbered indexes before it that are not in their
        set that they describe). So we have no room to generate the
        <em>other</em> enumerable sets that could exist. In other words, the set
        of all sets is a tricky thing to define, and in fact, Cantor's paradox
        leads us to conclude that it <em>does not exist</em> (by contradiction).
      </p>
    </div>
  </article>
</template>
