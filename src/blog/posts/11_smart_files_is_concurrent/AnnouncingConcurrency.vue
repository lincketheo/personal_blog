<script setup lang="ts">
import Code from "@/components/Code.vue";
import Definition from "@/components/Definition.vue";
import GithubBanner from "@/components/GithubBanner.vue";
</script>

<template>
  <article class="max-w-2xl mx-auto px-6 py-12 font-serif">

    <!-- Header -->
    <header class="mb-10">
      <h1 class="text-4xl font-bold text-text leading-tight mb-4">
        A Lock Free - Wait Free - Steal - No Force Database Pager
      </h1>

      <GithubBanner name="Smart Files" owner="lincketheo" url="https://github.com/lincketheo/smartfiles" language="C" license="Apache 2.0" version="v0.0.3"/>

      <p class="text-lg text-text/70 leading-relaxed">
        A common pattern for building databases is to use a paging schema. Pages in databases are
        easy to reason about because they make the UNDO / REDO protocol really easy to implement and they
        drastically simplify your database conceptually. With pages, all you have to do to express a "change"
        to your database is a page before image, and after image and a page number. Because Smart Files is a
        steal no force database, it's helpful to ensure that our buffer pool evicts pages and allows for
        in memory buffer pool pages to not have an owner.
      </p>
      <Definition term="Steal">
        A steal policy means the buffer manager is allowed to evict dirty pages belonging to an uncommitted
        transaction out to disk. This is actually really important for most page oriented databases. If it were not
        a steal policy, the database may modify millions of pages, ensuring that millions of pages stay in memory.
        A steal policy ensures we limit our memory for long running transactions.
      </Definition>
      <Definition term="No Force">
        A no-force policy means the buffer manager is not required to flush all of a transaction's dirty pages
        to disk at commit time. Pages can remain in the buffer pool and be written lazily. This improves commit
        latency because a commit just ensures that the WAL is up to date and doesn't need to flush all it's
        committed pages, but it means committed data may not survive a crash unless a redo log exists. Smart Files handles
        this with the REDO phase of ARIES.
      </Definition>
    </header>

    <!-- Table of Contents -->
    <section class="mb-10">
      <p class="mt-5 mb-3 font-mono text-xs tracking-widest uppercase text-muted">
        Table of Contents
      </p>
      <ul class="space-y-1 text-text/70 leading-relaxed list-disc list-inside">
        <li><a href="#section-1" class="underline hover:text-text">1.0.0 - The Pager</a></li>
        <li><a href="#section-1-1" class="underline hover:text-text">1.1.0 - Page Frame Fields</a></li>
        <li><a href="#section-2" class="underline hover:text-text">2.0.0 - GET(page number)</a></li>
        <li><a href="#section-2-1" class="underline hover:text-text">2.1.0 - Page Already in Memory</a></li>
        <li><a href="#section-2-2" class="underline hover:text-text">2.2.0 - Locking</a></li>
        <li><a href="#section-2-3" class="underline hover:text-text">2.3.0 - Page Fault and the Reserve Algorithm</a></li>
        <li><a href="#section-2-3-1" class="underline hover:text-text">2.3.1 - Reserve Steps</a></li>
        <li><a href="#section-3" class="underline hover:text-text">3.0.0 - GET_WRITABLE(page number, transaction)</a></li>
        <li><a href="#section-3-1" class="underline hover:text-text">3.1.0 - Case 1: Page Already in Memory</a></li>
        <li><a href="#section-3-2" class="underline hover:text-text">3.2.0 - Case 2: Page Fault</a></li>
        <li><a href="#section-4" class="underline hover:text-text">4.0.0 - RELEASE(page_handle)</a></li>
        <li><a href="#section-4-1" class="underline hover:text-text">4.1.0 - S Mode</a></li>
        <li><a href="#section-4-2" class="underline hover:text-text">4.2.0 - X Mode</a></li>
        <li><a href="#section-4-3" class="underline hover:text-text">4.3.0 - Why This Ordering Matters</a></li>
        <li><a href="#section-5" class="underline hover:text-text">5.0.0 - Considerations</a></li>
      </ul>
    </section>

    <!-- 1.0.0 The Pager -->
    <section id="section-1" class="mb-10">
      <h2 class="text-xl font-bold text-text mt-10 mb-1">1.0.0 - The Pager</h2>
      <p class="text-muted font-mono text-xs tracking-widest uppercase mb-5">
        Structure and overview
      </p>
      <p class="text-text/75 leading-relaxed mb-4">
        The pager is a big array in memory of "Page Frames" and a hash table from page number to buffer pool index to
        index into it.
      </p>

      <!-- Image placeholder -->
      <img src="@/assets/11/1.png" class="border bg-white" alt="1"/>

      <p class="text-text/75 leading-relaxed mb-4">
        Don't worry about that top bar above the buffer pool - that's a hash map, but it's empty right now, so ignore
        it.
      </p>

      <!-- 1.1.0 Page Frame Fields -->
      <section id="section-1-1">
        <h3 id="section-1-1" class="text-base font-bold text-text mt-8 mb-2">1.1.0 - Page Frame Fields</h3>
        <p class="text-text/75 leading-relaxed mb-4">
          Each page frame contains the following fields:
        </p>
        <ol class="space-y-2 text-lg text-text/70 leading-relaxed list-decimal list-inside marker:text-muted marker:font-mono marker:text-sm">
          <li class="pl-3">
            <span class="text-text font-semibold">Pin.</span>
            The number of threads currently reading or writing to this page.
          </li>
          <li class="pl-3">
            <span class="text-text font-semibold">Access.</span>
            0 or 1. This is for eviction and efficient LRU-like caching. If the access bit is 0, we are safe to evict
            this page, otherwise, we set it to 0, then continue to find the next available open page frame.
          </li>
          <li class="pl-3">
            <span class="text-text font-semibold">Present.</span>
            Is there data in this page or not?
          </li>
          <li class="pl-3">
            <span class="text-text font-semibold">Sibling.</span>
            When we write a page, we copy on write, so that we have a before and an after image page. The sibling is the
            reader's pointer to its write copy.
          </li>
          <li class="pl-3">
            <span class="text-text font-semibold">Ctrl.</span>
            This is a control latch - anything internal to the page data like pin, access, present etc can only be
            modified under this latch.
          </li>
          <li class="pl-3">
            <span class="text-text font-semibold">Data.</span>
            This is a reader writer latch. It guards the contents of the page frame, not the meta information.
          </li>
          <li class="pl-3">
            <span class="text-text font-semibold">Page.</span>
            Page frames can contain page information of a page that is read in from disk.
          </li>
        </ol>
        <p class="text-text/75 leading-relaxed mt-4 mb-2">
          There are a few primary operations:
        </p>
        <ul class="list-disc list-inside text-text/70 space-y-1 pl-2">
          <li><Code>GET(page number)</Code></li>
          <li><Code>GET_WRITABLE(page number, transaction)</Code></li>
          <li><Code>RELEASE(page)</Code></li>
        </ul>
      </section>
    </section>

    <!-- 2.0.0 GET -->
    <section id="section-2" class="mb-10">
      <h2 class="text-xl font-bold text-text mt-10 mb-1">2.0.0 - GET(page number)</h2>
      <p class="text-muted font-mono text-xs tracking-widest uppercase mb-5">
        Reading a page from the buffer pool
      </p>

      <!-- 2.1.0 Page already in memory -->
      <section id="section-2-1">
        <h3 class="text-base font-bold text-text mt-8 mb-2">2.1.0 - Page Already in Memory</h3>
        <p class="text-text/75 leading-relaxed mb-4">
          GET is easy if we've already loaded a page into memory. The top hash table represents the fact that
          previously, we loaded page 25 into memory and it lives at hash index 1 and page frame index 0.
        </p>
        <p class="text-text/75 leading-relaxed mb-4">
          Here's a before image of the GET call:
        </p>

        <img src="@/assets/11/2.png" class="border bg-white" alt="2"/>

        <p class="text-text/75 leading-relaxed mb-4">
          Note that page 25 hashes to index 1 (25 % 4 == 1), but it contains page frame 0. So the index is in hash bucket 1
          and points to 0. I won't talk about hash collisions here. I use robin hood hashing.
        </p>
        <p class="text-text/75 leading-relaxed mb-4">
          To fetch page 25 in read mode, first, we check the hash table for page 25 (FOUND!). We see that page 25 is
          loaded in slot 0 (from the hash table). Then we increment pin and lock the data in S mode:
        </p>
        <pre class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"><code class="font-mono text-sm text-text/85 leading-relaxed">Lock(HashTable)
Lookup(25) -> 0
Lock(ctrl)
Unlock(HashTable)
pin++
Unlock(ctrl)
S(data)</code></pre>

        <p class="text-text/75 leading-relaxed mb-4">
          Here's the after image:
        </p>

        <img src="@/assets/11/3.png" class="border bg-white" alt="3"/>

        <p class="text-text/75 leading-relaxed mb-2">Notice:</p>
        <ul class="list-disc list-inside text-text/70 space-y-1 pl-2 mb-4">
          <li>Pin incremented</li>
          <li>S lock incremented</li>
          <li>Access bit is set to 1 because we just accessed this page</li>
        </ul>

        <p class="text-text/75 leading-relaxed mb-4">
          Let's try another example. Here's the before image:
        </p>

        <img src="@/assets/11/4.png" class="border bg-white" alt="4"/>

        <p class="text-text/75 leading-relaxed mb-4">
          We call GET(26), reach into page frame 2. Notice this time pin = 0. This is possible because smart files is a
          no force database. You don't need to evict pages from the buffer pool when you're done so they can be present,
          but not being used. Fair enough, let's put an S lock on page 26:
        </p>

        <img src="@/assets/11/5.png" class="border bg-white" alt="5"/>
      </section>

      <!-- 2.2.0 Locking -->
      <section id="section-2-2">
        <h3 class="text-base font-bold text-text mt-8 mb-2">2.2.0 - Locking</h3>
        <p class="text-text/75 leading-relaxed mb-4">
          The pattern of <Code>Lock(HashTable)</Code>, <Code>Lock(ctrl)</Code>, <Code>Unlock(HashTable)</Code> ensures
          that we don't evict page 0 between the time we look it up and the time we lock page 0's ctrl.
        </p>
        <p class="text-text/75 leading-relaxed mb-4">
          We unlock ctrl before we try to obtain an S lock so that we can let other callers call GET(25).
        </p>
      </section>

      <!-- 2.3.0 Page Fault -->
      <section id="section-2-3">
        <h3 class="text-base font-bold text-text mt-8 mb-2">2.3.0 - Page Fault and the Reserve Algorithm</h3>
        <p class="text-text/75 leading-relaxed mb-4">
          GET is harder when the page isn't loaded into memory yet. Let's call GET(24) in the previous example. We get a
          page fault because there's no 24 loaded into memory yet, so we need to read the page from disk first. To do
          that, we need to reserve a spot in the buffer pool first.
        </p>

        <!-- 2.3.1 Reserve Steps -->
        <section id="section-2-3-1">
          <h4 class="text-sm font-bold text-text mt-6 mb-2">2.3.1 - Reserve Steps</h4>
          <p class="text-text/75 leading-relaxed mb-4">
            The reserve algorithm looks something like this (everything following is inside a while loop):
          </p>

          <p class="text-text/75 leading-relaxed mb-2 font-semibold">Step 1 - Advance the clock</p>
          <pre class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"><code class="font-mono text-sm text-text/85 leading-relaxed">clock = atomic_fetch_add(&p->clock, 1) & (LENGTH - 1)</code></pre>
          <p class="text-text/75 leading-relaxed mb-4">
            First we atomically fetch and increment our clock variable. The pager clock is an atomic int that cycles
            through the buffer pool slots. Because it's a power of 2, we can mod it by the size by just "and"-ing it
            with LENGTH - 1.
          </p>
          <p class="text-text/75 leading-relaxed mb-4">
            In the graphic below, we increment the pager clock to 1, but we're looking at page 0 for our next steps.
          </p>

          <img src="@/assets/11/6.png" class="border bg-white" alt="6"/>

          <p class="text-text/75 leading-relaxed mb-2 font-semibold">Step 2 - Try to lock ctrl</p>
          <pre class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"><code class="font-mono text-sm text-text/85 leading-relaxed">if (TRYLOCK(pool[clock].ctrl) == FAILED) continue</code></pre>
          <p class="text-text/75 leading-relaxed mb-4">
            We try to lock the control latch. If it's already locked, we just move on and try the next page. It's not
            worth spinning on the ctrl lock. This is what makes the reserve process wait free - it doesn't spin on the
            control lock, rather just tries to lock it once, then moves on if it fails.
          </p>
          <p class="text-text/75 leading-relaxed mb-4">
            You might ask why not spin - it's probably the same amount of operations because we'll probably just spin on
            an atomic, rather than iterate through a while loop. The reason is because most likely we're not even going
            to reserve this page, even if we spin on it. Another thread might be updating it. The best case scenario is
            the other thread is setting pin = 0, but in that case, whatever thread is accessing it is still setting the
            access bit to 1 anyways, so later down the line we're going to check the access bit and move on.
          </p>
          <p class="text-text/75 leading-relaxed mb-4">
            It just makes more sense to skip this frame and move on.
          </p>

          <img src="@/assets/11/7.png" class="border bg-white" alt="7"/>

          <p class="text-text/75 leading-relaxed mb-4">
            From here on out, ctrl is locked by us, not by some other thread.
          </p>

          <p class="text-text/75 leading-relaxed mb-2 font-semibold">Step 3 - Check present</p>
          <pre class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"><code class="font-mono text-sm text-text/85 leading-relaxed">if (!pool[clock].present) goto FOUND</code></pre>
          <p class="text-text/75 leading-relaxed mb-4">
            If this page isn't present, it's easy - we found a page!
          </p>

          <img src="@/assets/11/8.png" class="border bg-white" alt="8"/>

          <p class="text-text/75 leading-relaxed mb-2 font-semibold">Step 4 - Check pin</p>
          <pre class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"><code class="font-mono text-sm text-text/85 leading-relaxed">if (pool[clock].pin > 0) {
    unlock(pool[clock].ctrl);
    continue;
}</code></pre>
          <p class="text-text/75 leading-relaxed mb-4">
            If the page frame is pinned, then it's being used - we need to move on.
          </p>

          <img src="@/assets/11/9.png" class="border bg-white" alt="9"/>

          <p class="text-text/75 leading-relaxed mb-2 font-semibold">Step 5 - Check access bit</p>
          <pre class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"><code class="font-mono text-sm text-text/85 leading-relaxed">if (pool[clock].access == 1) {
    pool[clock].access = 0;
    unlock(pool[clock].ctrl);
    continue;
}</code></pre>
          <p class="text-text/75 leading-relaxed mb-4">
            If the access bit is 1, set it to 0 and continue. This is like a poor man's LRU algorithm. Rather than
            implement heavy priority queueing mechanics, the access bit with a rotating pointer is much quicker and
            easier to implement and it actually works really well. It works like this: any time a page is accessed
            (read, written etc) its access bit is set to 1. That way, popular pages are kept in memory as much as
            possible. If the bit is 1, then it's set to 0, but if it's popular, by the time the clock makes a full
            circle, it'll either be 1 (meaning it was set to 1 again) or 0 meaning it's a stale page.
          </p>

          <img src="@/assets/11/10.png" class="border bg-white" alt="10"/>

          <p class="text-text/75 leading-relaxed mb-2 font-semibold">Step 6 - Evict or skip</p>
          <pre class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"><code class="font-mono text-sm text-text/85 leading-relaxed">if (iteration > 0) {
    evict(pool[clock]);
    goto FOUND;
} else {
    unlock(pool[clock].ctrl);
    continue;
}</code></pre>
          <p class="text-text/75 leading-relaxed mb-4">
            Finally, the page is present, but we can evict it to disk to make room in the buffer pool.
          </p>
          <ul class="list-disc list-inside text-text/70 space-y-1 pl-2 mb-4">
            <li>First we must ensure the write ahead log is flushed up to <Code>page_lsn</Code> before flushing to disk</li>
            <li>Then we flush the page to disk and indicate that the slot is open</li>
          </ul>
          <p class="text-text/75 leading-relaxed mb-4">
            I decided to only evict after scanning the buffer pool once. I still want to do some performance metrics to
            see if this does anything.
          </p>

          <img src="@/assets/11/11.png" class="border bg-white" alt="11"/>
        </section>
      </section>
    </section>

    <!-- 3.0.0 GET_WRITABLE -->
    <section id="section-3" class="mb-10">
      <h2 class="text-xl font-bold text-text mt-10 mb-1">3.0.0 - GET_WRITABLE(page number, transaction)</h2>
      <p class="text-muted font-mono text-xs tracking-widest uppercase mb-5">
        The write path - copy on write
      </p>
      <p class="text-text/75 leading-relaxed mb-4">
        GET_WRITABLE is the write path. The core idea is copy-on-write: rather than letting writers directly modify the
        read frame (which other readers might be holding), we reserve a private write frame, copy the page into it, and
        let the writer work on that copy. The original read frame stays consistent for anyone else until the transaction
        commits.
      </p>
      <p class="text-text/75 leading-relaxed mb-4">
        This means GET_WRITABLE always reserves <strong>two</strong> slots in the buffer pool: one read frame
        (<Code>pgr</Code>) and one write frame (<Code>pgw</Code>).
      </p>

      <!-- 3.1.0 Case 1 -->
      <section id="section-3-1">
        <h3 class="text-base font-bold text-text mt-8 mb-2">3.1.0 - Case 1: Page Already in Memory</h3>
        <p class="text-text/75 leading-relaxed mb-4">
          The locking protocol at the start mirrors GET almost exactly:
        </p>
        <pre class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"><code class="font-mono text-sm text-text/85 leading-relaxed">Lock(HashTable)
Lookup(pg) -> found at index i
Lock(pgr->ctrl)
Unlock(HashTable)
pgr->pin++
Unlock(pgr->ctrl)
X(pgr->data)           // exclusive lock, not shared</code></pre>
        <p class="text-text/75 leading-relaxed mb-4">
          The big difference is that we take an <strong>exclusive</strong> lock on the data latch rather than a shared
          one. This blocks out all other readers and writers for the duration of the write. That's intentional - nobody
          should be reading a page that's being actively modified.
        </p>
        <p class="text-text/75 leading-relaxed mb-4">
          Once we hold the X lock, we call <Code>pgr_reserve_and_ctrl_lock</Code> to grab a second page frame for the
          write copy. Then we set up <Code>pgw</Code> with <Code>pin = 1</Code>, copy the raw page bytes from
          <Code>pgr</Code> into <Code>pgw</Code>, and set <Code>pgr->wsibling = wclock</Code> so anyone who looks at
          the read frame can find the in-progress write copy.
        </p>
        <p class="text-text/75 leading-relaxed mb-4">
          The caller now has a private sandbox (<Code>pgw</Code>) to write into. The read frame is X-locked so no new
          readers can sneak in, but we've already incremented pin so the frame won't get evicted out from under us.
        </p>
      </section>

      <!-- 3.2.0 Case 2 -->
      <section id="section-3-2">
        <h3 class="text-base font-bold text-text mt-8 mb-2">3.2.0 - Case 2: Page Fault</h3>
        <p class="text-text/75 leading-relaxed mb-4">
          This is the more interesting case. We unlock the hash table early and reserve both frames before touching the
          hash table again:
        </p>
        <pre class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"><code class="font-mono text-sm text-text/85 leading-relaxed">Unlock(HashTable)
rclock = reserve()           // read frame, ctrl locked
wclock = reserve()           // write frame, ctrl locked
Insert(pg -> rclock) into HashTable
Read page from disk into pgr
Copy pgr -> pgw
Unlock(pgr->ctrl)
Unlock(pgw->ctrl)
X(pgr->data)</code></pre>
        <p class="text-text/75 leading-relaxed mb-4">
          Notice the ordering carefully: we insert the read frame into the hash table <em>before</em> we read from
          disk. This means another thread calling GET(pg) concurrently will find the page in the hash table and try to
          lock <Code>pgr->ctrl</Code> - but we still hold it, so they'll block until we finish setting up. Once we
          release ctrl and they acquire it, the page is fully initialized.
        </p>
        <p class="text-text/75 leading-relaxed mb-4">
          We also reserve both frames before inserting into the hash table. If the second reserve fails, we just unlock
          the first frame's ctrl and bail - nothing was committed to the hash table, so the world is consistent.
        </p>
        <p class="text-text/75 leading-relaxed mb-4">
          One subtlety: <Code>pgw->wsibling = -1</Code>. The write frame is a scratch copy owned by this transaction.
          It doesn't need a sibling pointer because nobody else should ever be looking it up through the hash table -
          it's invisible to everyone but the transaction holding it.
        </p>
      </section>
    </section>

    <!-- 4.0.0 RELEASE -->
    <section id="section-4" class="mb-10">
      <h2 class="text-xl font-bold text-text mt-10 mb-1">4.0.0 - RELEASE(page_handle)</h2>
      <p class="text-muted font-mono text-xs tracking-widest uppercase mb-5">
        Where the magic happens
      </p>
      <p class="text-text/75 leading-relaxed mb-4">
        RELEASE is where the magic happens. It has two paths depending on the mode of the handle.
      </p>

      <!-- 4.1.0 S Mode -->
      <section id="section-4-1">
        <h3 class="text-base font-bold text-text mt-8 mb-2">4.1.0 - S Mode</h3>
        <pre class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"><code class="font-mono text-sm text-text/85 leading-relaxed">Lock(pgr->ctrl)
pgr->pin--
Unlock(pgr->ctrl)
Unlock_S(pgr->data)</code></pre>
        <p class="text-text/75 leading-relaxed mb-4">
          Simple. Decrement pin under ctrl, drop the S lock. If pin hits zero, the clock-based eviction algorithm can
          now consider this frame.
        </p>
      </section>

      <!-- 4.2.0 X Mode -->
      <section id="section-4-2">
        <h3 class="text-base font-bold text-text mt-8 mb-2">4.2.0 - X Mode</h3>
        <p class="text-text/75 leading-relaxed mb-4">
          This is the commit path for a write. A few things happen in strict order.
        </p>

        <p class="text-text/75 leading-relaxed mb-2 font-semibold">Step 1 - WAL append</p>
        <p class="text-text/75 leading-relaxed mb-4">
          Before we touch the read frame at all, we write a log record containing the transaction ID, the previous LSN
          to chain the transaction's log records together, the undo image (<Code>pgr->page.raw</Code>, the before
          image), and the redo image (<Code>pgw->page.raw</Code>, the after image). This is why the two-frame design is
          so clean - we always have the before and after image sitting right next to each other. No reconstruction
          needed. If <Code>tx == NULL</Code> we skip WAL entirely, which is used internally during ARIES recovery when
          we're replaying log records and don't want to generate new ones.
        </p>

        <p class="text-text/75 leading-relaxed mb-2 font-semibold">Step 2 - Dirty Page Table</p>
        <p class="text-text/75 leading-relaxed mb-4">
          If this is the first time this page has been modified in this recovery epoch, we add it to the DPT with
          <Code>RecLSN</Code> set to the current LSN. The <Code>RecLSN</Code> tells the recovery algorithm the earliest
          log record it needs to replay for this page.
        </p>

        <p class="text-text/75 leading-relaxed mb-2 font-semibold">Step 3 - Commit the write</p>
        <pre class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"><code class="font-mono text-sm text-text/85 leading-relaxed">memcpy(pgr->page.raw, pgw->page.raw, PAGE_SIZE)</code></pre>
        <p class="text-text/75 leading-relaxed mb-4">
          The after image is now the read frame. This is the actual commit point.
        </p>

        <p class="text-text/75 leading-relaxed mb-2 font-semibold">Step 4 - Free the write frame</p>
        <pre class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"><code class="font-mono text-sm text-text/85 leading-relaxed">Lock(pgw->ctrl)
pgw->flags = 0         // clears PW_PRESENT - slot is now invisible
pgw->pin   = 0
Unlock(pgw->ctrl)</code></pre>
        <p class="text-text/75 leading-relaxed mb-4">
          Setting <Code>flags = 0</Code> clears <Code>PW_PRESENT</Code>, making this slot available to the clock
          algorithm again.
        </p>

        <p class="text-text/75 leading-relaxed mb-2 font-semibold">Step 5 - Update the read frame</p>
        <pre class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"><code class="font-mono text-sm text-text/85 leading-relaxed">Lock(pgr->ctrl)
pgr->pin--
pgr->wsibling = -1     // no write copy exists anymore
Unlock(pgr->ctrl)
Unlock_X(pgr->data)</code></pre>
        <p class="text-text/75 leading-relaxed mb-4">
          We clear the sibling pointer, decrement pin, and drop the X lock. At this point, new readers can enter.
        </p>
      </section>

      <!-- 4.3.0 Why this ordering matters -->
      <section id="section-4-3">
        <h3 class="text-base font-bold text-text mt-8 mb-2">4.3.0 - Why This Ordering Matters</h3>
        <p class="text-text/75 leading-relaxed mb-4">
          The WAL append happens strictly before the <Code>memcpy</Code> into the read frame. This is the Write Ahead
          Logging invariant: the log record describing a change must be durable before the change is visible. If the
          system crashes between the memcpy and the log flush, recovery won't know about the change - but since we
          haven't flushed the dirty page to disk yet either (no-force policy), that's fine. The page on disk is still
          the old version.
        </p>
        <p class="text-text/75 leading-relaxed mb-4">
          The DPT insert also happens before the memcpy. <Code>RecLSN</Code> must point to the log record that
          describes this update, so we record it before making the change observable.
        </p>
        <p class="text-text/75 leading-relaxed mb-4">
          The write frame is freed before we release the X lock on the data latch. This means between the memcpy and
          <Code>Unlock_X</Code>, the read frame briefly has <Code>wsibling = -1</Code> with the new data already in it.
          Any thread that was blocked on the X lock will see a fully committed, consistent page when it finally acquires
          its S lock.
        </p>
      </section>
    </section>

  </article>
</template>