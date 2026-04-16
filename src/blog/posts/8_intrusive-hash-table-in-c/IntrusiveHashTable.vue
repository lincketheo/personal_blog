<script setup lang="ts">
import Definition from '@/components/Definition.vue'
import Code from '@/components/Code.vue'
</script>

<template>
  <article class="max-w-2xl mx-auto px-6 py-12 font-serif">

    <header class="mb-10">
      <h1 class="text-4xl font-bold text-text leading-tight mb-4">
        Intrusive Hash Tables in C
      </h1>
      <p class="text-lg text-text/70 leading-relaxed">
        I wanted to write a blog post about implementing a lock table because I thought it would help
        me debug some of my problems — I'm currently tracking down some bugs in Numstore with my
        lock table, particularly upgrading locks — but I realized there's a lot of boilerplate I
        need to walk through first. If you're curious to see how this is used in Numstore, take a
        look <a class="text-red hover:text-red-hot underline" href="https://github.com/lincketheo/Numstore/blob/main/lib/core/hash_table.c">here</a>.
        Anyway, I always enjoy stepping back and re-examining data structures I wrote previously.
        Reloading old code into your head is almost always worth it.
      </p>
    </header>

    <Definition term="Hash table">
      A hash table maps keys to values using a hash function. The hash function converts a key
      into a bucket index. Ideally each key maps to a unique bucket, but in practice multiple keys
      can land in the same bucket — this is called a collision. There are two common strategies
      for handling collisions: open addressing (probe for an empty slot) and chaining (each bucket
      holds a linked list of entries). We're using chaining here.
    </Definition>

    <section class="mb-8">
      <h2 class="text-xl font-bold text-text mt-10 mb-3">Memory Management First</h2>
      <p class="text-text/75 leading-relaxed mb-4">
        I need a hash table in C. As a C developer, the first thing that usually comes to mind is:
        how am I going to manage memory? Someone coming from a higher-level language might say just
        scatter <Code>malloc</Code> / <Code>free</Code> everywhere, and honestly that's not a bad
        thing. It's sort of what other languages do, but it's a lot harder in C.
      </p>
      <Definition term="malloc / free">
        <Code>malloc</Code> and <Code>free</Code> are the standard C library functions for dynamic
        memory allocation. <Code>malloc(n)</Code> requests <em>n</em> bytes from the heap and
        returns a pointer to them; <Code>free(ptr)</Code> hands those bytes back. Every
        <Code>malloc</Code> must be paired with exactly one <Code>free</Code> — too few frees is a
        memory leak, too many is undefined behavior. In garbage-collected languages this bookkeeping
        is done for you; in C it's your problem.
      </Definition>
      <blockquote class="border-l-4 border-muted/30 pl-5 my-5 text-text/55 italic text-[0.95rem] leading-relaxed">
        Side note: I wonder if implementing a hash table in C using <Code>malloc</Code> /
        <Code>free</Code> is actually slower than Java. Java has a pretty over-engineered memory
        management pipeline for both large and small objects, so you could think of it as
        <Code>malloc</Code> / <Code>free</Code> with extra fluff on top. Not sure — just a thought.
      </blockquote>
      <p class="text-text/75 leading-relaxed mb-4">
        Anyway, when I build C APIs for internal use and want to control memory, I tend to operate
        under one assumption: why don't I let the consumer of this API manage their own memory? That
        pushes me away from signatures like this:
      </p>
      <pre class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"><code class="font-mono text-sm text-text/85 leading-relaxed">struct foo *open_foo();</code></pre>
      <p class="text-text/75 leading-relaxed mb-4">
        where it's implicit that <Code>open_foo</Code> is going to <Code>malloc</Code> somewhere —
        toward signatures like this:
      </p>
      <pre class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"><code class="font-mono text-sm text-text/85 leading-relaxed">int init_foo(struct foo *dest);</code></pre>
      <p class="text-text/75 leading-relaxed">
        Now the caller can decide whether <Code>foo</Code> lives on the heap or the stack. The
        downside is that it exposes the internals of <Code>foo</Code>. There are ugly workarounds.
        You can bury the internals, but at the end of the day C needs to know the size of an object
        before it can initialize it.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-bold text-text mt-10 mb-3">What I Want from a Hash Table</h2>
      <p class="text-text/75 leading-relaxed mb-3">Three things:</p>
      <ol class="list-decimal list-outside pl-5 space-y-3 text-text/75 leading-relaxed">
        <li>
          It should be <strong class="text-text">generic</strong> — reusable across different data
          types without rewriting the table.
        </li>
        <li>
          It should <strong class="text-text">limit <Code>malloc</Code> / <Code>free</Code></strong> —
          mostly for debuggability, not speed. I respect that modern allocators are fast and rarely
          the bottleneck. Still, a hash map that leans on <Code>malloc</Code> is going to be harder
          to reason about when something goes wrong.
        </li>
        <li>
          It should be <strong class="text-text">unbounded</strong> — able to grow to accommodate
          many entries. As a general rule, be careful with this assumption. A lot of the time your
          hash table is actually bounded.
        </li>
      </ol>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-bold text-text mt-10 mb-3">Hash Chaining, Briefly</h2>
      <p class="text-text/75 leading-relaxed mb-4">
        Before getting to intrusive structures, let's quickly cover how hash chaining works, because
        it's the mechanism we're building on.
      </p>
      <figure class="my-6">
        <img
            src="@/assets/HashTableNoIntrusive.png"
            alt="Hash table with separate chaining - each bucket is the head of a linked list"
            class="max-w-full border border-border rounded bg-surface/50 p-2 mx-auto"
        />
        <figcaption class="mt-2 text-sm text-muted italic text-center">
          Each bucket is the head of a linked list of entries that hash to the same slot.
        </figcaption>
      </figure>
      <Definition term="Hash collision">
        A collision occurs when two distinct keys hash to the same bucket. For example, if your hash
        function sums the ASCII values of a string's characters, "foo" and "oof" produce the same
        sum and collide. Collisions also happen when your hash function produces values larger than
        the table size — a hash of 20 in a table of 10 buckets wraps to bucket 0, potentially
        colliding with a hash of 10 that also wraps there.
      </Definition>
      <p class="text-text/75 leading-relaxed mb-4">In general, you can't assume hash indexes are unique.</p>
      <Definition term="O(n) vs. Θ(1)">
        Technically, a hash table with chaining has <em>O(n)</em> lookup — if every key hashes to
        the same bucket, you end up scanning a list of <em>n</em> items. But the average-case
        complexity is <em>Θ(1)</em>: with a reasonable hash function and load factor, lookups take
        constant time on average. The distinction between O (upper bound) and Θ (tight bound) matters
        here, and it's something that algorithms courses often gloss over.
      </Definition>
      <p class="text-text/75 leading-relaxed mb-4">
        Now, the standard picture of hash chaining assumes each node owns its payload inline:
      </p>
      <pre class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"><code class="font-mono text-sm text-text/85 leading-relaxed">struct data {
    struct data *next;
    int a[30];
};</code></pre>
      <p class="text-text/75 leading-relaxed mb-4">
        The problem is that the hash table is now <em>tied</em> to <Code>struct data</Code>. If you
        want to store something else, you need a new hash table. You could try to make the payload
        generic with a flexible array member:
      </p>
      <pre class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"><code class="font-mono text-sm text-text/85 leading-relaxed">struct data {
    struct data *next;
    uint8_t content[];
};</code></pre>
      <Definition term="Flexible array member">
        A flexible array member (the trailing <Code>content[]</Code> above) is a C99 feature that
        lets a struct end with an array of unspecified length. You allocate the struct with extra
        space — <Code>malloc(sizeof(struct data) + payload_size)</Code> — and the array covers the
        extra bytes. It avoids a separate allocation for the payload, but it forces you back into
        <Code>malloc</Code> territory and requires casting at the call site.
      </Definition>
      <p class="text-text/75 leading-relaxed">
        Variable-length arrays are fiddly, and your hash table is right back to being full of
        <Code>malloc</Code>s. Enter intrusive data structures.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-bold text-text mt-10 mb-3">Intrusive Data Structures</h2>
      <Definition term="Intrusive data structure">
        An intrusive data structure stores its bookkeeping nodes <em>inside</em> the caller's own
        structs rather than alongside them. Instead of the container allocating node objects that
        point to your data, you embed a small "hook" node directly into your struct. The container
        only ever manipulates these hooks — the rest of your data is none of its business. The main
        payoff is zero extra allocations: nodes are part of the objects you already have. Linux's
        kernel linked list (<Code>struct list_head</Code>) is the canonical example.
      </Definition>
      <p class="text-text/75 leading-relaxed mb-4">
        An intrusive hash table reduces itself to as few components as possible, then stores pointers
        to embedded nodes so clients can hook their own structs directly into the table. We start
        with an <Code>hnode</Code>:
      </p>
      <pre class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"><code class="font-mono text-sm text-text/85 leading-relaxed">struct hnode
{
    struct hnode *next;
    uint32_t      hcode;
};</code></pre>
      <p class="text-text/75 leading-relaxed mb-4">
        This is our hook. To make a struct hashable, embed one directly into your data structure:
      </p>
      <figure class="my-6">
        <img
            src="@/assets/HashTableWithIntrusive.png"
            alt="An intrusive linked list - the list node is embedded inside the data struct itself"
            class="max-w-full border border-border rounded bg-surface/50 p-2 mx-auto"
        />
        <figcaption class="mt-2 text-sm text-muted italic text-center">
          The list node lives inside your struct. No separate allocation — the hook is just a field.
        </figcaption>
      </figure>
      <pre class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"><code class="font-mono text-sm text-text/85 leading-relaxed">struct word_entry
{
    const char  *word;
    int          count;
    struct hnode node;  /* the hook */
};</code></pre>
      <p class="text-text/75 leading-relaxed mb-4">
        The hash table only ever touches <Code>hnode</Code> pointers. To get back to the containing
        struct from an <Code>hnode *</Code>, we use the <Code>container_of</Code> macro:
      </p>
      <pre class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"><code class="font-mono text-sm text-text/85 leading-relaxed">#define container_of(ptr, type, member) \
    ((type *)((char *)(ptr) - offsetof(type, member)))</code></pre>
      <Definition term="offsetof">
        <Code>offsetof(type, member)</Code> is a standard C macro (from <Code>&lt;stddef.h&gt;</Code>)
        that returns the byte offset of <Code>member</Code> within <Code>type</Code>. So
        <Code>offsetof(struct word_entry, node)</Code> tells you how many bytes from the start of a
        <Code>word_entry</Code> the embedded <Code>hnode</Code> lives. The compiler computes this at
        compile time — zero runtime cost.
      </Definition>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-bold text-text mt-10 mb-3">The Table</h2>
      <p class="text-text/75 leading-relaxed mb-4">
        The table itself is an array of bucket heads — each bucket is just a pointer to the first
        <Code>hnode</Code> in its chain. We use a flexible array member so the bucket array lives
        contiguously with the table header in a single allocation:
      </p>
      <pre class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"><code class="font-mono text-sm text-text/85 leading-relaxed">struct htable
{
    uint32_t      cap;
    uint32_t      size;
    struct hnode *table[];  /* one pointer per bucket */
};

struct htable *
htable_create (uint32_t n)
{
    struct htable *t = malloc (sizeof (struct htable) + n * sizeof (struct hnode *));
    if (!t)
        return NULL;
    t->cap  = n;
    t->size = 0;
    memset (t->table, 0, n * sizeof (struct hnode *));
    return t;
}</code></pre>
      <p class="text-text/75 leading-relaxed mb-4">Insert prepends to the bucket's chain — O(1), no searching:</p>
      <pre class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"><code class="font-mono text-sm text-text/85 leading-relaxed">void
htable_insert (struct htable *t, struct hnode *node)
{
    uint32_t idx  = node->hcode % t->cap;
    node->next    = t->table[idx];
    t->table[idx] = node;
    t->size++;
}</code></pre>
      <p class="text-text/75 leading-relaxed mb-4">
        Lookup returns a <em>pointer to the pointer</em> that refers to the matching node. The
        double pointer is what lets us delete in O(1) — we already have the exact slot to rewrite,
        so no second traversal is needed:
      </p>
      <pre class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"><code class="font-mono text-sm text-text/85 leading-relaxed">struct hnode **
htable_lookup (struct htable *t, const struct hnode *key,
               bool (*eq) (const struct hnode *, const struct hnode *))
{
    uint32_t      idx = key->hcode % t->cap;
    struct hnode **cur = &t->table[idx];
    while (*cur)
    {
        if ((*cur)->hcode == key->hcode && eq (*cur, key))
            return cur;
        cur = &(*cur)->next;
    }
    return NULL;
}

struct hnode *
htable_delete (struct htable *t, struct hnode **from)
{
    struct hnode *node = *from;
    *from      = node->next;
    node->next = NULL;
    t->size--;
    return node;
}</code></pre>
      <Definition term="Double pointer (pointer-to-pointer)">
        Returning <Code>struct hnode **</Code> instead of <Code>struct hnode *</Code> means the
        caller gets back the specific <Code>next</Code> field (or bucket head) that points to the
        found node. To delete, you write <Code>*slot = (*slot)->next</Code> — one pointer write, no
        re-traversal. If lookup returned a plain pointer, you'd need to walk the chain a second time
        to find the predecessor before you could unlink it.
      </Definition>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-bold text-text mt-10 mb-3">Putting It Together</h2>
      <p class="text-text/75 leading-relaxed mb-4">
        Here's the full example. The <Code>word_entry</Code> structs live on the stack —
        no <Code>malloc</Code> required for the data itself. Only the table needs a heap allocation,
        and that's a single one for the whole structure.
      </p>
      <pre class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"><code class="font-mono text-sm text-text/85 leading-relaxed">static void
hnode_init (struct hnode *n, uint32_t hcode)
{
    n->hcode = hcode;
    n->next  = NULL;
}

static uint32_t
hash_str (const char *s)
{
    uint32_t h = 5381;
    while (*s)
        h = h * 33 ^ (unsigned char)*s++;
    return h;
}

static bool
word_eq (const struct hnode *a, const struct hnode *b)
{
    const struct word_entry *ea = container_of (a, struct word_entry, node);
    const struct word_entry *eb = container_of (b, struct word_entry, node);
    return strcmp (ea->word, eb->word) == 0;
}

int main (void)
{
    struct htable *t = htable_create (16);

    struct word_entry entries[] = {
        { .word = "foo", .count = 3 },
        { .word = "bar", .count = 1 },
        { .word = "baz", .count = 7 },
    };

    for (int i = 0; i < 3; i++)
    {
        hnode_init (&entries[i].node, hash_str (entries[i].word));
        htable_insert (t, &entries[i].node);
    }

    struct word_entry key = { .word = "baz" };
    hnode_init (&key.node, hash_str ("baz"));

    struct hnode **slot = htable_lookup (t, &key.node, word_eq);
    if (slot)
    {
        struct word_entry *found = container_of (*slot, struct word_entry, node);
        printf ("found: %s (count=%d)\n", found->word, found->count);
    }

    htable_free (t);
}</code></pre>
      <p class="text-text/75 leading-relaxed mt-4 mb-4">
        The hash table never needs to know the size or layout of your data. It only sees
        <Code>hnode</Code> pointers. Your struct owns its own storage — stack, static, or heap,
        your choice — and the table just threads hooks through it.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-bold text-text mt-10 mb-3">Pros and Cons</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
        <div class="border border-border rounded p-5">
          <h3 class="font-mono text-xs tracking-widest uppercase text-muted mb-4">Pros</h3>
          <ul class="space-y-3 text-text/75 text-sm leading-relaxed">
            <li>
              <strong class="text-text block mb-0.5">Zero allocations for the data.</strong>
              Entries live wherever the caller puts them — stack, static storage, or a slab.
              Only the table itself needs one <Code>malloc</Code>.
            </li>
            <li>
              <strong class="text-text block mb-0.5">Generic without casting problems.</strong>
              The table works on any struct that embeds an <Code>hnode</Code>.
              <Code>container_of</Code> gets you back to your type cleanly. No <Code>void *</Code> gymnastics.
            </li>
            <li>
              <strong class="text-text block mb-0.5">Easier to debug.</strong>
              Fewer allocations means fewer things that can leak, double-free, or corrupt the heap.
            </li>
          </ul>
        </div>
        <div class="border border-border rounded p-5">
          <h3 class="font-mono text-xs tracking-widest uppercase text-muted mb-4">Cons</h3>
          <ul class="space-y-3 text-text/75 text-sm leading-relaxed">
            <li>
              <strong class="text-text block mb-0.5">Exposes internals.</strong>
              Your struct has to know about <Code>hnode</Code>. The data and the container are no
              longer fully decoupled.
            </li>
            <li>
              <strong class="text-text block mb-0.5">One table per <Code>hnode</Code>.</strong>
              A struct can only be in one intrusive hash table at a time per embedded node. Two
              tables means two <Code>hnode</Code> fields.
            </li>
            <li>
              <strong class="text-text block mb-0.5">Lifetime is your problem.</strong>
              The table holds raw pointers into your data. Free an entry while it's still in the
              table and you have a dangling pointer with no warning.
            </li>
          </ul>
        </div>
      </div>
    </section>

  </article>
</template>
