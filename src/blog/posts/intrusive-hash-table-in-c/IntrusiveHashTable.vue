<template>
  <article class="post">
    <header class="post-header">
      <h1>Intrusive Hash Tables in C</h1>
      <p class="post-intro">
        I wanted to write a blog post about implementing a lock table because I thought it would help
        me debug some of my problems - I'm currently tracking down some bugs in
        numstore with my lock table - particularly upgrading locks - but I realized there's a lot of boilerplate I need to walk through
        first. If you're curious to see how this is used in Numstore, take a look <a href="https://github.com/lincketheo/Numstore/blob/main/lib/core/hash_table.c">here</a>. Anyways, I always enjoy stepping back and re-examining data structures I wrote previously.
        Reloading old code into your head is almost always worth it. So let's talk about hash tables
        first, and more specifically, intrusive data structures. Stay tuned for the lock table post -
        that (might be) next depending on what I want to write.
      </p>
    </header>

      <Definition term="Hash table">
        A hash table maps keys to values using a hash function. The hash function converts a key
        into a bucket index. Ideally each key maps to a unique bucket, but in practice multiple keys
        can land in the same bucket - this is called a collision. There are two common strategies
        for handling collisions: open addressing (probe for an empty slot) and chaining (each bucket
        holds a linked list of entries). We're using chaining here.
      </Definition>

    <section>
      <h2>Memory Management First</h2>
      <p>
        I need a hash table in C. As a C developer, the first thing that usually comes to mind is:
        how am I going to manage memory? Someone coming from a higher-level language might say just
        scatter <code>malloc</code> / <code>free</code> everywhere, and honestly that's not a bad thing. It's sort of what other languages do but it's a lot harder in C.
      </p>
      <Definition term="malloc / free">
        <code>malloc</code> and <code>free</code> are the standard C library functions for dynamic
        memory allocation. <code>malloc(n)</code> requests <em>n</em> bytes from the heap and
        returns a pointer to them; <code>free(ptr)</code> hands those bytes back. Every
        <code>malloc</code> must be paired with exactly one <code>free</code> - too few frees is a
        memory leak, too many is undefined behavior. In garbage-collected languages this bookkeeping
        is done for you; in C it's your problem.
      </Definition>
      <blockquote>
        Side note: I wonder if implementing a hash table in C using <code>malloc</code> /
        <code>free</code> is actually slower than Java. Java has a pretty over-engineered memory
        management pipeline for both large and small objects, so you could think of it as
        <code>malloc</code> / <code>free</code> with extra fluff on top. Not sure - just a thought.
      </blockquote>
      <p>
        Anyway, when I build C APIs for internal use and want to control memory, I tend to operate under one
        assumption: why don't I let the consumer of this API manage their own memory? That pushes me
        away from signatures like this:
      </p>
      <pre><code>struct foo *open_foo();</code></pre>
      <p>
        where it's implicit that <code>open_foo</code> is going to <code>malloc</code> somewhere -
        toward signatures like this:
      </p>
      <pre><code>int init_foo(struct foo *dest);</code></pre>
      <p>
        Now the caller can decide whether <code>foo</code> lives on the heap or the stack. The
        downside is that it exposes the internals of <code>foo</code>. There are ugly workarounds.
        You can bury the internals, but at the end of the day C needs to know the size of an object
        before it can initialize it. 
      </p>
    </section>

    <section>
      <h2>What I Want from a Hash Table</h2>
      <p>Three things:</p>
      <ol>
        <li>
          It should be <strong>generic</strong> - reusable across different data types without
          rewriting the table.
        </li>
        <li>
          It should <strong>limit <code>malloc</code> / <code>free</code></strong> - mostly for
          debuggability, not speed. I respect that modern allocators are fast and rarely the
          bottleneck. Still, a hash map that leans on <code>malloc</code> is going to be harder to
          reason about when something goes wrong.
        </li>
        <li>
          It should be <strong>unbounded</strong> - able to grow to accommodate many entries. (As a
          general rule, be careful with this assumption. A lot of the time your hash table is
          actually bounded. I might make another post about the robin hood hashing algorithm I used for bounded hash tables.)
        </li>
      </ol>
    </section>

    <section>
      <h2>Hash Chaining, Briefly</h2>
      <p>
        Before getting to intrusive structures, let's quickly cover how hash chaining works, because
        it's the mechanism we're building on. Hash chaining looks like this:
      </p>
      <figure>
        <img
          src="@/assets/HashTableNoIntrusive.png"
          alt="Hash table with separate chaining - each bucket is the head of a linked list"
        />
        <figcaption>Each bucket is the head of a linked list of entries that hash to the same slot.</figcaption>
      </figure>
      <Definition term="Hash collision">
        A collision occurs when two distinct keys hash to the same bucket. For example, if your hash
        function sums the ASCII values of a string's characters, "foo" and "oof" produce the same
        sum and collide. Collisions also happen when your hash function produces values larger than
        the table size - a hash of 20 in a table of 10 buckets wraps to bucket 0, potentially
        colliding with a hash of 10 that also wraps there.
      </Definition>
      <p>
        In general, you can't assume hash indexes are unique.
      </p>
      <Definition term="O(n) vs. Θ(1)">
        Technically, a hash table with chaining has <em>O(n)</em> lookup - if every key
        hashes to the same bucket, you end up scanning a list of <em>n</em> items. But the
        average-case complexity is <em>Θ(1)</em>: with a reasonable hash function and load factor,
        lookups take constant time on average. The distinction between O (upper bound) and Θ (tight
        bound) matters here, and it's something that algorithms courses often gloss over. A hash
        table is practically fast even though it's not theoretically fast in the worst case.
      </Definition>
      <p>
        Now, the standard picture of hash chaining assumes each node owns its payload inline:
      </p>
      <pre><code>struct data {
    struct data *next;
    int a[30];
};</code></pre>
      <p>
        The problem is that the hash table data structure is now <em>tied</em> to
        <code>struct data</code>. If you want to store something else, you need a new hash table.
        You could try to make the payload generic with a flexible array member:
      </p>
      <pre><code>struct data {
    struct data *next;
    uint8_t content[];
};</code></pre>
      <Definition term="Flexible array member">
        A flexible array member (the trailing <code>content[]</code> above) is a C99 feature that
        lets a struct end with an array of unspecified length. You allocate the struct with extra
        space - <code>malloc(sizeof(struct data) + payload_size)</code> - and the array covers the
        extra bytes. It avoids a separate allocation for the payload, but it forces you back into
        <code>malloc</code> territory and requires a lot of casting at the call site.
      </Definition>
      <p>
        Variable-length arrays are fiddly, and your hash table is right back
        to being full of <code>malloc</code>s. Enter intrusive data structures.
      </p>
    </section>

    <section>
      <h2>Intrusive Data Structures</h2>
      <Definition term="Intrusive data structure">
        An intrusive data structure stores its bookkeeping nodes <em>inside</em> the caller's own
        structs rather than alongside them. Instead of the container allocating node objects that
        point to your data, you embed a small "hook" node directly into your struct. The container
        only ever manipulates these hooks - the rest of your data is none of its business. The main
        payoff is zero extra allocations: nodes are part of the objects you already have.
        Linux's kernel linked list (<code>struct list_head</code>) is the canonical example.
      </Definition>
      <p>
        An intrusive hash table reduces itself to as few components as possible, then stores pointers
        to embedded nodes so clients can hook their own structs directly into the table. We start
        with an <code>hnode</code>:
      </p>
      <pre><code>struct hnode
{
    struct hnode *next;
    uint32_t      hcode;
};</code></pre>
      <p>
        This is our hook. To make a struct hashable, we embed one of these directly into our data structure:
      </p>
      <figure>
        <img
          src="@/assets/HashTableWithIntrusive.png"
          alt="An intrusive linked list - the list node is embedded inside the data struct itself"
        />
        <figcaption>
          The list node lives inside your struct. No separate allocation - the hook is just a field.
        </figcaption>
      </figure>
      <pre><code>struct word_entry
{
    const char  *word;
    int          count;
    struct hnode node;  // the hook
};</code></pre>
      <p>
        The hash table only ever touches <code>hnode</code> pointers. To get back to the containing
        struct from an <code>hnode *</code>, we use the <code>container_of</code> macro:
      </p>
      <pre><code>#define container_of(ptr, type, member) \
    ((type *)((char *)(ptr) - offsetof(type, member)))</code></pre>
      <Definition term="offsetof">
        <code>offsetof(type, member)</code> is a standard C macro (from <code>&lt;stddef.h&gt;</code>)
        that returns the byte offset of <code>member</code> within <code>type</code>. So
        <code>offsetof(struct word_entry, node)</code> tells you how many bytes from the start of a
        <code>word_entry</code> the embedded <code>hnode</code> lives. The compiler computes this at
        compile time, so it costs nothing at runtime.
      </Definition>
    </section>

    <section>
      <h2>The Table</h2>
      <p>
        The table itself is an array of bucket heads - each bucket is just a pointer to the first
        <code>hnode</code> in its chain. We use a flexible array member so the bucket array lives
        contiguously with the table header in a single allocation:
      </p>
      <pre><code>struct htable
{
    uint32_t      cap;
    uint32_t      size;
    struct hnode *table[]; // one pointer per bucket
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
      <p>
        Insert prepends to the bucket's chain - O(1), no searching:
      </p>
      <pre><code>void
htable_insert (struct htable *t, struct hnode *node)
{
    uint32_t idx  = node->hcode % t->cap;
    node->next    = t->table[idx];
    t->table[idx] = node;
    t->size++;
}</code></pre>
      <p>
        Lookup returns a <em>pointer to the pointer</em> that refers to the matching node. The
        double pointer is what lets us delete in O(1) - we already have the exact slot to rewrite,
        so no second traversal is needed:
      </p>
      <pre><code>struct hnode **
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
        Returning <code>struct hnode **</code> instead of <code>struct hnode *</code> means the
        caller gets back the specific <code>next</code> field (or bucket head) that points to the
        found node. To delete, you just write <code>*slot = (*slot)->next</code> - one pointer
        write, no re-traversal. If lookup returned a plain pointer, you'd need to walk the chain a
        second time to find the predecessor before you could unlink it.
      </Definition>
    </section>

    <section>
      <h2>Putting It Together</h2>
      <p>
        Here's the full example. The <code>word_entry</code> structs live on the stack -
        no <code>malloc</code> required for the data itself. Only the table needs a heap allocation,
        and that's a single one for the whole structure.
      </p>

       <pre><code>static void
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
 
    // Stack-allocated entries - no malloc for the data itself
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
 
    // Lookup "baz"
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



      <p>
        The hash table never needs to know the size or layout of your data. It only sees
        <code>hnode</code> pointers. Your struct owns its own storage - stack, static, or
        heap, your choice - and the table just threads hooks through it. No extra allocations.
      </p>
      <p>
        Anyway, that's the foundation. Intrusive data structures are nice. Here's a pros and cons list:
      </p>

      <h2>Pros and Cons</h2>
      <div class="pros-cons">
        <div class="pros">
          <h3>Pros</h3>
          <ul>
            <li>
              <strong>Zero allocations for the data.</strong> Entries live wherever the caller
              puts them - stack, static storage, or a slab. Only the table itself needs one
              <code>malloc</code>.
            </li>
            <li>
              <strong>Generic without casting problems.</strong> The table works on any struct
              that embeds an <code>hnode</code>. <code>container_of</code> gets you back to your
              type cleanly. There's no <code>void*</code> stuff going on
            </li>
            <li>
              <strong>Easier to debug.</strong> Fewer allocations means fewer things that can
              leak, double-free, or corrupt the heap.
            </li>
          </ul>
        </div>
        <div class="cons">
          <h3>Cons</h3>
          <ul>
            <li>
              <strong>Exposes internals.</strong> Your struct has to know about
              <code>hnode</code>. The data and the container are no longer fully decoupled.
            </li>
            <li>
              <strong>One table per <code>hnode</code>.</strong> A struct can only be in one
              intrusive hash table at a time per embedded node. If you need it in two tables,
              you need two <code>hnode</code> fields.
            </li>
            <li>
              <strong>Lifetime is your problem.</strong> The table holds raw pointers into your
              data. Free an entry while it's still in the table and you have a dangling pointer
              with no warning.
            </li>
          </ul>
        </div>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import Definition from '@/components/Definition.vue'
</script>

<style scoped>
h1 {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 1rem;
}

h2 {
  font-size: 1.35rem;
  font-weight: 700;
  margin-top: 2.5rem;
  margin-bottom: 0.75rem;
}

.post-intro {
  color: #444;
  font-size: 1.15rem;
}

section {
  margin-bottom: 2rem;
}

p {
  margin-bottom: 1rem;
}

ol, ul {
  margin: 0.75rem 0 1rem 1.5rem;
}

li {
  margin-bottom: 0.4rem;
}

blockquote {
  border-left: 3px solid #ccc;
  margin: 1.25rem 0;
  padding: 0.5rem 1.25rem;
  color: #555;
  font-style: italic;
}

figure {
  margin: 1.5rem 0;
  text-align: center;
}

figure img {
  max-width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 0.5rem;
  background: #fff;
}

figcaption {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #666;
  font-style: italic;
}

code {
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 0.9em;
  background: #f4f4f4;
  padding: 0.1em 0.35em;
  border-radius: 3px;
}

pre {
  background: #f4f4f4;
  border-left: 3px solid #ccc;
  padding: 1rem 1.25rem;
  overflow-x: auto;
  margin: 1rem 0;
  border-radius: 3px;
}

pre code {
  background: none;
  padding: 0;
  font-size: 0.9rem;
}
</style>
