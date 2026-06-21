<script setup lang="ts">
import Definition from "@/components/Definition.vue";
import Code from "@/components/Code.vue";
</script>

<template>
  <article
    class="w-full min-w-0 max-w-2xl mx-auto px-4 sm:px-6 py-12 font-serif"
  >
    <header class="mb-10">
      <h1 class="text-4xl font-bold text-fg leading-tight mb-4">
        Releasing c_specx
      </h1>
      <p class="text-lg text-fg/70 leading-relaxed">
        c_specx - <em>Common Systems Programming C Extensions</em> - is a
        framework for major C applications Here's a quick tour of what's in it.
        Over time, <code>c_specx</code> will grow to meet the needs of large
        scale applications (such as <code>Numstore</code>).
      </p>
    </header>

    <!-- Memory ---------------------------------------------------------------->
    <section class="mb-10">
      <h2 class="text-xl font-bold text-fg mt-10 mb-1">Memory</h2>
      <p class="text-muted font-mono text-xs tracking-widest uppercase mb-5">
        Here are a few tried and true memory allocators you can use
      </p>

      <h3 class="text-base font-bold text-fg mb-2">Chunk allocator</h3>
      <p class="text-fg/75 leading-relaxed mb-4">
        An arena allocator that grows by chaining heap-allocated chunks. The hot
        path is a bump pointer inside the current chunk - no per-object
        <Code>free</Code>. Call <Code>chunk_alloc_reset_all</Code> to reuse
        memory without freeing, or <Code>chunk_alloc_free_all</Code> to tear it
        down entirely. Use case is "I want to allocate a bunch of stuff together
        then call one free to free everything".
      </p>
      <pre
        class="bg-surface border-l-4 border-secondary/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-fg/85 leading-relaxed">struct chunk_alloc ca;
chunk_alloc_create_default (&ca);

error e = error_create();
char *buf = chunk_malloc (&ca, 64, sizeof *buf, &e);

chunk_alloc_reset_all (&ca); /* reuse without freeing */
chunk_alloc_free_all (&ca);  /* tear down */</code></pre>

      <h3 class="text-base font-bold text-fg mb-2">Malloc plan</h3>
      <p class="text-fg/75 leading-relaxed mb-4">
        A two-phase allocator for building a contiguous buffer when you don't
        know the total size up front. Say you have a complex data structure with
        a bunch of little pointers, instead of a bunch of little objects on the
        heap, you could allocate one big block and have pointers within that
        block. But you don't want to calculate the total size of that block so
        you "mock" allocate once at the start. Plan mode accumulates a size
        count; after one <Code>malloc_plan_alloc</Code> call, the same writes
        fill the buffer. One allocation, no guessing.
      </p>
      <pre
        class="bg-surface border-l-4 border-secondary/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-fg/85 leading-relaxed">struct malloc_plan p = malloc_plan_create ();

/* Pass 1 - planning: just accumulates sizes */
malloc_plan_memcpy (&p, header, header_len);
malloc_plan_memcpy (&p, body,   body_len);

error e = error_create();
malloc_plan_alloc (&p, &e); /* single malloc */

/* Pass 2 - allocing: fills the buffer */
malloc_plan_memcpy (&p, header, header_len);
malloc_plan_memcpy (&p, body,   body_len);</code></pre>

      <h3 class="text-base font-bold text-fg mb-2">Slab allocator</h3>
      <p class="text-fg/75 leading-relaxed mb-4">
        Fixed-size object pool for small items. Allocation is O(1) off the free
        list; deallocation returns the slot. A <Code>current</Code> pointer
        caches the last slab with free space to avoid scanning on the hot path.
        As a "block" gets full, it creates a new slab, so there is an infinite
        number of items to allocate. This is a super fast allocator for lots of
        little objects
      </p>
      <pre
        class="bg-surface border-l-4 border-secondary/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-fg/85 leading-relaxed">struct slab_alloc sa;
slab_alloc_init (&sa, sizeof (struct my_node), 64);

error e = error_create();
struct my_node *n = slab_alloc_alloc (&sa, &e);
/* ... use n ... */
slab_alloc_free (&sa, n);
slab_alloc_destroy (&sa);</code></pre>
    </section>

    <!-- Data Structures ------------------------------------------------------->
    <section class="mb-10">
      <h2 class="text-xl font-bold text-fg mt-10 mb-1">Data Structures</h2>
      <p class="text-muted font-mono text-xs tracking-widest uppercase mb-5">
        Four containers
      </p>

      <h3 class="text-base font-bold text-fg mb-2">
        Circular buffer (<Code>cbuffer</Code>)
      </h3>
      <p class="text-fg/75 leading-relaxed mb-4">
        A ring buffer over a caller-supplied backing array - no heap allocation.
        Typed read/write/peek/pop in both single-element and bulk forms, direct
        file I/O helpers, and cbuffer-to-cbuffer move and copy. Most operations
        have an <Code>_expect</Code> macro variant that <Code>ASSERT</Code>s on
        failure.
      </p>
      <pre
        class="bg-surface border-l-4 border-secondary/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-fg/85 leading-relaxed">u8 buf[64];
struct cbuffer b = cbuffer_create (buf, sizeof buf);

cbuffer_pushb_back_expect (0xAB, &b);
cbuffer_pushb_back_expect (0xCD, &b);

u8 out;
cbuffer_pop_front_expect (&out, 1, &b); /* out == 0xAB */</code></pre>

      <h3 class="text-base font-bold text-fg mb-2">Block array</h3>
      <p class="text-fg/75 leading-relaxed mb-4">
        A doubly-linked list of fixed-capacity data blocks backed by a slab
        allocator. Supports insert, remove, read, and write by offset and
        stride. Useful when you need a growable byte sequence with O(1) block
        allocation and no copy-on-resize.
      </p>
      <pre
        class="bg-surface border-l-4 border-secondary/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-fg/85 leading-relaxed">error e = error_create();
struct block_array *arr = block_array_create (256, &e);

const u8 data[] = { 1, 2, 3, 4 };
block_array_insert (arr, 0, data, sizeof data, &e);

u8 out[4];
block_array_read (arr, stride_all, sizeof out, out);

block_array_free (arr);</code></pre>

      <h3 class="text-base font-bold text-fg mb-2">
        Double buffer (<Code>dbl_buffer</Code>)
      </h3>
      <p class="text-fg/75 leading-relaxed mb-4">
        A heap-backed array that doubles capacity on exhaustion. Element size is
        fixed at init time so it works for any type.
        <Code>dblb_append_alloc</Code> reserves space and returns a pointer so
        you can write directly without a copy.
      </p>
      <pre
        class="bg-surface border-l-4 border-secondary/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-fg/85 leading-relaxed">struct dbl_buffer db;
error e = error_create();
dblb_create (&db, sizeof (u32), 16, &e);

const u32 vals[] = { 1, 2, 3 };
dblb_append (&db, vals, 3, &e);

/* zero-copy reserve */
u32 *slot = dblb_append_alloc (&db, 1, &e);
*slot = 4;

dblb_free (&db);</code></pre>

      <h3 class="text-base font-bold text-fg mb-2">Robin Hood hash table</h3>
      <p class="text-fg/75 leading-relaxed mb-4">
        An open-addressing hash table using Robin Hood displacement - on insert,
        if the incoming entry has traveled further from its home slot than the
        incumbent, they swap. This keeps probe length variance low and
        worst-case lookup predictable. Instantiate it with three macros and an
        include - you get a fully typed API with no void pointers or casting.
        Backing storage is caller-supplied so there's no hidden allocation. This
        is useful if you're hashing really small objects and you have a fixed
        sized hash table. This is more common than you think. Large hash tables
        can be mimic-ed by creating an array of large objects and storing the
        index into the array in this robin hood hash table. That way you're not
        copying data a lot. You should be storing
        <em>objects that you are not afraid to copy in this hash table</em>
      </p>
      <pre
        class="bg-surface border-l-4 border-secondary/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-fg/85 leading-relaxed">#define VTYPE  int
#define KTYPE  u32
#define SUFFIX u32
#include "c_specx/ds/robin_hood_ht.h"
#undef VTYPE
#undef KTYPE
#undef SUFFIX

hash_table_u32 ht;
hentry_u32     data[64];
ht_init_u32 (&ht, data, 64);

const hdata_u32 entry = { .key = 42, .value = 99 };
ht_insert_u32 (&ht, entry);

hdata_u32 *found = ht_lookup_u32 (&ht, 42);
/* found->value == 99 */

ht_delete_u32 (&ht, 42);</code></pre>
    </section>

    <!-- Stream ---------------------------------------------------------------->
    <section class="mb-10">
      <h2 class="text-xl font-bold text-fg mt-10 mb-2">Stream</h2>
      <p class="text-fg/75 leading-relaxed mb-4">
        A polymorphic byte I/O interface - a vtable of <Code>pull</Code>,
        <Code>push</Code>, and <Code>close</Code> function pointers plus an
        atomic <Code>done</Code> flag. Concrete implementations: a read-only
        buffer source (<Code>stream_ibuf</Code>), a write-only buffer sink
        (<Code>stream_obuf</Code>), a null sink (<Code>stream_sink</Code>), a
        per-element callback sink (<Code>stream_opsink</Code>), and a byte-limit
        wrapper (<Code>stream_limit</Code>).
      </p>
      <pre
        class="bg-surface border-l-4 border-secondary/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-fg/85 leading-relaxed">const u8 src_data[] = "hello";
u8 dst_data[8] = error_create();

struct stream src, dst;
struct stream_ibuf_ctx ictx;
struct stream_obuf_ctx octx;

stream_ibuf_init (&src, &ictx, src_data, sizeof src_data);
stream_obuf_init (&dst, &octx, dst_data, sizeof dst_data);

error e = error_create();
stream_read (&dst, 1, sizeof src_data, &src, &e);</code></pre>
    </section>

    <!-- Dev ------------------------------------------------------------------->
    <section class="mb-10">
      <h2 class="text-xl font-bold text-fg mt-10 mb-1">Dev Utilities</h2>
      <p class="text-muted font-mono text-xs tracking-widest uppercase mb-5">
        Assertions and testing
      </p>

      <h3 class="text-base font-bold text-fg mb-2">Struct assertions</h3>
      <p class="text-fg/75 leading-relaxed mb-4">
        <Code>DEFINE_DBG_ASSERT</Code> attaches an invariant checker to a struct
        type. In debug builds it expands to a real function call; in release it
        compiles away entirely.
      </p>
      <pre
        class="bg-surface border-l-4 border-secondary/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-fg/85 leading-relaxed">DEFINE_DBG_ASSERT (struct cbuffer, cbuffer, b, {
  ASSERT (b);
  ASSERT (b->cap > 0);
  ASSERT (cbuffer_len (b) <= b->cap);
})

void
cbuffer_push_back (const void *src, u32 size, struct cbuffer *b)
{
  DBG_ASSERT (cbuffer, b); /* free in release */
  /* ... */
}</code></pre>

      <h3 class="text-base font-bold text-fg mb-2">Testing framework</h3>
      <p class="text-fg/75 leading-relaxed mb-4">
        Tests live in the same translation unit as the code they test, guarded
        by
        <Code>#ifndef NTEST</Code>. <Code>TEST_SUITE</Code> declares a suite;
        <Code>REGISTER</Code> appends to it. The binary accepts
        <Code>--suite</Code> flags and substring filters so you can run exactly
        what you want.
      </p>
      <pre
        class="bg-surface border-l-4 border-secondary/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-fg/85 leading-relaxed">#ifndef NTEST
TEST (cbuffer_isempty)
{
  u8 buf[1];
  struct cbuffer b = cbuffer_create (buf, 1);
  test_assert (cbuffer_isempty (&b));

  const u8 v = 0xFF;
  cbuffer_push_back (&v, 1, &b);
  test_assert (!cbuffer_isempty (&b));
}
#endif

/* in main: */
TEST_SUITE (core, 128);
REGISTER  (core, cbuffer_isempty);</code></pre>
      <pre
        class="bg-surface border-l-4 border-secondary/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-fg/85 leading-relaxed">./c_specx_test                          # run everything
./c_specx_test --suite core             # one suite
./c_specx_test cbuffer_isempty randu32r # substring filter</code></pre>
    </section>

    <!-- Concurrency ----------------------------------------------------------->
    <section class="mb-10">
      <h2 class="text-xl font-bold text-fg mt-10 mb-1">Concurrency</h2>
      <p class="text-muted font-mono text-xs tracking-widest uppercase mb-5">
        Three primitives
      </p>

      <h3 class="text-base font-bold text-fg mb-2">Latch</h3>
      <p class="text-fg/75 leading-relaxed mb-4">
        A spinlock over an atomic int. Fast path is a single CAS with acquire
        ordering; on contention it spins with <Code>spin_pause</Code> before
        retrying. Used internally by most other data structures.
      </p>
      <pre
        class="bg-surface border-l-4 border-secondary/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-fg/85 leading-relaxed">latch l;
latch_init  (&l);
latch_lock  (&l);
/* critical section */
latch_unlock (&l);</code></pre>

      <h3 class="text-base font-bold text-fg mb-2">
        S/X latch (<Code>spx_latch</Code>)
      </h3>
      <p class="text-fg/75 leading-relaxed mb-4">
        Shared/exclusive spinlock packed into one atomic unsigned int. Low 16
        bits count active shared holders; bit 16 is the exclusive flag.
        <Code>spx_upgrade_s_x</Code> atomically upgrades a held S lock to X,
        releasing S if another X holder is in flight and re-acquiring from
        scratch.
      </p>
      <pre
        class="bg-surface border-l-4 border-secondary/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-fg/85 leading-relaxed">sx_latch l;
spx_latch_init (&l);

spx_lock_s (&l);       /* shared - multiple readers OK */
/* ... read ... */
spx_upgrade_s_x (&l);  /* promote to exclusive */
/* ... write ... */
spx_unlock_x (&l);</code></pre>

      <h3 class="text-base font-bold text-fg mb-2">
        Granularity lock (<Code>gr_lock</Code>)
      </h3>
      <p class="text-fg/75 leading-relaxed mb-4">
        A mutex-backed lock supporting all five SQL-style modes: IS, IX, S, SIX,
        and X. Waiters are allocated on the stack and linked into a queue - no
        heap allocation per lock operation. Incompatible requests block on a
        condition variable.
      </p>
      <pre
        class="bg-surface border-l-4 border-secondary/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-fg/85 leading-relaxed">struct gr_lock l;
error e = error_create();
gr_lock_init (&l, &e);

gr_lock   (&l, LM_S, &e); /* shared read */
/* ... */
gr_unlock (&l, LM_S);

gr_lock   (&l, LM_X, &e); /* exclusive write */
/* ... */
gr_unlock (&l, LM_X);

gr_lock_destroy (&l);</code></pre>
      <Definition term="Lock modes (IS, IX, S, SIX, X)">
        These are the five granularity lock modes from Gray's hierarchy. IS
        (intent shared) and IX (intent exclusive) signal intent to lock at a
        finer granularity below - they allow other intent locks to coexist. S
        (shared) allows concurrent reads. X (exclusive) requires sole access.
        SIX (shared + intent exclusive) holds a shared lock on the current node
        while signaling intent to exclusively lock something below it. The
        compatibility matrix is what the lock manager enforces.
      </Definition>
    </section>

    <header class="mb-10">
      <h1 class="text-4xl font-bold text-fg leading-tight mb-4">
        Coding Conventions
      </h1>
      <p class="text-lg text-fg/70 leading-relaxed">
        These are some of the programmatic conventions I follow consistently
        across c_specx and why I follow them.
      </p>
    </header>

    <!-- Tests ----------------------------------------------------------------->
    <section class="mb-10">
      <h2 class="text-xl font-bold text-fg mt-10 mb-3">
        Tests live next to the code
      </h2>
      <p class="text-fg/75 leading-relaxed mb-4">
        Tests go in the same translation unit as the code they test, guarded by
        <Code>#ifndef NTEST</Code>. The production build defines
        <Code>NTEST</Code> and the test binary doesn't. I like to do this
        because it ensures that you have a 1:1 relationship between tests and
        the functions they test. Of course, nothing is stopping you from putting
        tests in other files, but if tests can live along side code, it's much
        easier to track which functions are actually being tested.
      </p>
      <pre
        class="bg-surface border-l-4 border-secondary/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-fg/85 leading-relaxed">u32
randu32r (const u32 lower, const u32 upper)
{
  /* ... implementation ... */
}

#ifndef NTEST
TEST (randu32r)
{
  /* lower == upper edge case */
  test_assert_type_equal (randu32r (5, 5), 5u, u32, "u");

  /* both endpoints reachable */
  bool saw_lo = false, saw_hi = false;
  for (int i = 0; i < 1000; ++i)
    {
      const u32 v = randu32r (10, 11);
      test_assert (v == 10u || v == 11u);
      if (v == 10u) saw_lo = true;
      if (v == 11u) saw_hi = true;
    }
  test_assert (saw_lo && saw_hi);
}
#endif</code></pre>
      <p class="text-fg/75 leading-relaxed">
        The test is a specification. When you read <Code>randu32r</Code> you
        immediately see what it's supposed to do at the edges. The
        implementation and its contract stay together.
      </p>
    </section>

    <!-- Asserts --------------------------------------------------------------->
    <section class="mb-10">
      <h2 class="text-xl font-bold text-fg mt-10 mb-3">
        Assertions are documentation
      </h2>
      <p class="text-fg/75 leading-relaxed mb-4">
        <Code>ASSERT</Code> is not error handling - it's a statement of
        invariants that must be true. If an <Code>ASSERT</Code> fires, the
        program is already in an undefined state and should crash loudly. In
        release builds (<Code>NDEBUG</Code> defined) they compile away entirely,
        so there's no production cost.
      </p>
      <pre
        class="bg-surface border-l-4 border-secondary/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-fg/85 leading-relaxed">u32
randu32r (const u32 lower, const u32 upper)
{
  ASSERT (upper >= lower); /* precondition - caller's fault if violated */
  /* ... */
}</code></pre>
      <p class="text-fg/75 leading-relaxed mb-4">
        For structs, <Code>DEFINE_DBG_ASSERT</Code> attaches a named invariant
        checker that can be called at the top of any function touching that
        struct. It compiles away in release.
      </p>
      <pre
        class="bg-surface border-l-4 border-secondary/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-fg/85 leading-relaxed">DEFINE_DBG_ASSERT (struct cbuffer, cbuffer, b, {
  ASSERT (b);
  ASSERT (b->data);
  ASSERT (b->cap > 0);
  ASSERT (cbuffer_len (b) <= b->cap);
})

void
cbuffer_push_back (const void *src, u32 size, struct cbuffer *b)
{
  DBG_ASSERT (cbuffer, b); /* free invariant check in debug, zero cost in release */
  /* ... */
}</code></pre>
      <p class="text-fg/75 leading-relaxed">
        <Code>ASSERT</Code> is for things that should never happen. Recoverable
        errors - bad input, allocation failure, I/O problems - go through the
        <Code>error *e</Code> mechanism instead.
      </p>
    </section>

    <!-- Interface Layer ------------------------------------------------------->
    <section class="mb-10">
      <h2 class="text-xl font-bold text-fg mt-10 mb-3">
        Platform differences belong in one place
      </h2>
      <p class="text-fg/75 leading-relaxed mb-4">
        Platform-specific code lives in dedicated directories -
        <Code>intf/os_posix/</Code> and <Code>intf/os_windows/</Code> - behind a
        common interface. The rest of the codebase calls
        <Code>i_log_info</Code>, <Code>i_mutex_lock</Code>,
        <Code>i_file_read</Code> and never sees a <Code>#ifdef _WIN32</Code>.
        The build system links the right directory; nothing else needs to know.
      </p>
      <pre
        class="bg-surface border-l-4 border-secondary/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-fg/85 leading-relaxed">/* intf/os.h - what the rest of the codebase sees */
void i_log_info  (const char *fmt, ...);
void i_log_error (const char *fmt, ...);
void i_log_flush (void);

/* intf/os_posix/logging.c  - POSIX impl  */
/* intf/os_windows/logging.c - Windows impl */</code></pre>
      <p class="text-fg/75 leading-relaxed">
        Scattered <Code>#ifdef</Code>s are a maintenance problem - every new
        platform means auditing the entire codebase. An interface layer means
        adding a platform is adding a directory.
      </p>
    </section>

    <footer class="mt-12 pt-6 border-t border-border">
      <p class="text-muted italic text-sm">
        Source is on
        <a
          href="https://github.com/lincketheo/c_specx"
          class="text-secondary hover:text-secondary-hot underline"
          >GitHub</a
        >. More posts on specific pieces - the Robin Hood table, the stream
        interface, and the lock manager - coming as I use them in real projects.
      </p>
    </footer>
  </article>
</template>
