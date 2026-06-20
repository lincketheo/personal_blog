<script setup lang="ts">
import Code from "@/components/Code.vue";
import Definition from "@/components/Definition.vue";
</script>

<template>
  <article class="max-w-4xl mx-auto px-6 py-12 font-serif">
    <!-- Header -->
    <header class="mb-10">
      <h1 class="text-4xl font-bold text-text leading-tight mb-4">
        Atomically Truncating the Write-Ahead Log
      </h1>

      <p class="text-lg text-text/70 leading-relaxed">
        In a WAL, you have a stream of log entries. Each one describes a change
        that was made to the database. The problem is that for a single file
        database, I don't want a historic WAL for every single change. That's a
        massive file. I want to truncate the WAL - or delete it. I also want it
        to "feel" like one file. The WAL is just a "backup" file that controls
        recovery; a user shouldn't even know that it exists. This post walks
        through what it takes to delete the WAL safely on top of an ARIES style
        recovery system.
      </p>
      <Definition term="WAL">
        A Write-Ahead Log is a sequence of log records describing every change
        made to the database. In an ARIES system, log records hold both undo and
        redo information and are referenced by Log Sequence Numbers (LSNs).
      </Definition>
      <Definition term="ARIES">
        ARIES is a recovery algorithm that uses page LSNs - pointers from each
        page to its most recent log record - to drive analysis, redo, and undo
        phases after a crash. Choosing ARIES means committing to keeping
        references to historical WAL entries, which is heavyweight for a
        single-file database but sets things up for archival logs and richer
        recovery later.
      </Definition>
      <Definition term="Checkpoint">
        A checkpoint is a point in the WAL after which every prior log record is
        guaranteed to be reflected on disk. Records before the checkpoint are no
        longer required for crash recovery, which is what makes truncation
        possible in the first place.
      </Definition>
    </header>

    <!-- Table of Contents -->
    <section class="mb-10">
      <p
        class="mt-5 mb-3 font-mono text-xs tracking-widest uppercase text-muted"
      >
        Table of Contents
      </p>
      <ul class="space-y-1 text-text/70 leading-relaxed list-disc list-inside">
        <li>
          <a href="#section-1" class="underline hover:text-text"
            >1.0.0 - The Problem</a
          >
        </li>
        <li>
          <a href="#section-1-1" class="underline hover:text-text"
            >1.1.0 - Design Rules</a
          >
        </li>
        <li>
          <a href="#section-1-2" class="underline hover:text-text"
            >1.2.0 - Why Not Use Something Like SQLite?</a
          >
        </li>
        <li>
          <a href="#section-2" class="underline hover:text-text"
            >2.0.0 - The Start LSN Solution</a
          >
        </li>
        <li>
          <a href="#section-2-1" class="underline hover:text-text"
            >2.1.0 - Where to Store the Start LSN</a
          >
        </li>
        <li>
          <a href="#section-3" class="underline hover:text-text"
            >3.0.0 - Atomicity Requirements</a
          >
        </li>
        <li>
          <a href="#section-3-1" class="underline hover:text-text"
            >3.1.0 - The Two LSN Slot Design</a
          >
        </li>
        <li>
          <a href="#section-4" class="underline hover:text-text"
            >4.0.0 - Mapping Out the States</a
          >
        </li>
        <li>
          <a href="#section-4-1" class="underline hover:text-text"
            >4.1.0 - The WAL-Deleting Blocking Checkpoint</a
          >
        </li>
        <li>
          <a href="#section-4-2" class="underline hover:text-text"
            >4.2.0 - Header LSN States</a
          >
        </li>
        <li>
          <a href="#section-4-3" class="underline hover:text-text"
            >4.3.0 - Crash Points</a
          >
        </li>
        <li>
          <a href="#section-5" class="underline hover:text-text"
            >5.0.0 - The Checkpoint Protocol</a
          >
        </li>
        <li>
          <a href="#section-6" class="underline hover:text-text"
            >6.0.0 - The Open Protocol</a
          >
        </li>
        <li>
          <a href="#section-7" class="underline hover:text-text"
            >7.0.0 - Considerations</a
          >
        </li>
      </ul>
    </section>

    <!-- 1.0.0 The Problem -->
    <section id="section-1" class="mb-10">
      <h2 class="text-xl font-bold text-text mt-10 mb-1">
        1.0.0 - The Problem
      </h2>
      <p class="text-muted font-mono text-xs tracking-widest uppercase mb-5">
        Why we can't just keep appending forever
      </p>
      <p class="text-text/75 leading-relaxed mb-4">
        In a WAL, you have a stream of log entries. Each one describes a change
        that was made to the database. My problem is - for my single file
        database, I don't want a historic WAL for every single change. That's a
        massive file. I want to truncate my WAL, or delete it.
      </p>
      <p class="text-text/75 leading-relaxed mb-4">
        I also want the database to "feel" like one file. The WAL is just a
        "backup" file that controls recovery; a user shouldn't even know that it
        exists.
      </p>

      <!-- 1.1.0 Design Rules -->
      <section id="section-1-1">
        <h3 class="text-base font-bold text-text mt-8 mb-2">
          1.1.0 - Design Rules
        </h3>
        <p class="text-text/75 leading-relaxed mb-4">
          With those goals in mind, here are the rules I've made:
        </p>
        <ol
          class="space-y-2 text-lg text-text/70 leading-relaxed list-decimal list-inside marker:text-muted marker:font-mono marker:text-sm"
        >
          <li class="pl-3">
            <span class="text-text font-semibold"
              >No WAL when closed cleanly.</span
            >
            When the database is closed cleanly there is no WAL on disk.
          </li>
          <li class="pl-3">
            <span class="text-text font-semibold">Hidden from the user.</span>
            On the normal green path, keep the WAL deleted whenever possible.
          </li>
          <li class="pl-3">
            <span class="text-text font-semibold">Bounded size.</span>
            The WAL cannot get too big.
          </li>
          <li class="pl-3">
            <span class="text-text font-semibold"
              >Checkpoint deletes the WAL.</span
            >
            Instead of keeping archival WALs around, my checkpoint is going to
            delete the WAL.
          </li>
          <li class="pl-3">
            <span class="text-text font-semibold">Future archival.</span>
            The design should leave room to add archival logs later.
          </li>
        </ol>
      </section>

      <!-- 1.2.0 Why not SQLite -->
      <section id="section-1-2">
        <h3 class="text-base font-bold text-text mt-8 mb-2">
          1.2.0 - Why Not Use Something Like SQLite?
        </h3>
        <p class="text-text/75 leading-relaxed mb-4">
          These rules push me away from doing something simple like SQLite where
          you just record an UNDO entry. That would be half as many log entries
          (because ARIES requires both UNDO and REDO). I thought about it - just
          a simple UNDO based system - but I really want to design a heavier
          weight database in the future. That's the whole reason I chose ARIES:
          it keeps track of the entire history of your database. It's
          heavyweight for a single file but that's the tradeoff I'm choosing.
        </p>
        <p class="text-text/75 leading-relaxed mb-4">
          Choosing ARIES means you need to use <Code>page_lsn</Code>'s - LSNs in
          the database that point to WAL entries. The dirty page table uses
          <Code>page_lsn</Code>'s to keep track of which pages are dirty and
          need to be flushed or evicted. The details don't matter for this post;
          the important thing is that you need to keep references to historical
          WAL entries. You can't just delete the WAL and be OK.
        </p>
        <p class="text-text/75 leading-relaxed mb-4">
          Rule 3 is the real nail in the coffin. You can't just delete the WAL -
          you need to translate LSNs from LSN to byte offset in the WAL. We
          might reference LSN <Code>10000000</Code> but our WAL is only 10 bytes
          long.
        </p>
      </section>
    </section>

    <!-- 2.0.0 The Start LSN Solution -->
    <section id="section-2" class="mb-10">
      <h2 class="text-xl font-bold text-text mt-10 mb-1">
        2.0.0 - The Start LSN Solution
      </h2>
      <p class="text-muted font-mono text-xs tracking-widest uppercase mb-5">
        Anchoring the WAL to a known offset
      </p>
      <p class="text-text/75 leading-relaxed mb-4">
        The WAL needs a "start LSN" - the starting LSN of the current WAL file.
        Then byte offset 10 in the WAL is really <Code>start_lsn + 10</Code>.
      </p>
      <p class="text-text/75 leading-relaxed mb-4">
        That solves the offset translation problem. But it raises a new one:
        where do we store that LSN?
      </p>

      <!-- 2.1.0 Where to store the start LSN -->
      <section id="section-2-1">
        <h3 class="text-base font-bold text-text mt-8 mb-2">
          2.1.0 - Where to Store the Start LSN
        </h3>
        <p class="text-text/75 leading-relaxed mb-4">
          The obvious option is <strong>the WAL itself</strong> - but that
          breaks rule 1. We can't just delete the WAL and be OK if the start LSN
          lives inside it. The only other option is
          <strong>the database</strong>. We must store the start LSN in the
          database file so that the database is self-contained and doesn't need
          a WAL file to exist to be valid.
        </p>
      </section>
    </section>

    <!-- 3.0.0 Atomicity Requirements -->
    <section id="section-3" class="mb-10">
      <h2 class="text-xl font-bold text-text mt-10 mb-1">
        3.0.0 - Atomicity Requirements
      </h2>
      <p class="text-muted font-mono text-xs tracking-widest uppercase mb-5">
        How we ensure everything is atomic
      </p>
      <p class="text-text/75 leading-relaxed mb-4">
        This is the hard part, and it's hard for such little tradeoff - but it
        has to be done. We need the deletion of the WAL and the flushing of the
        new start LSN to be atomic:
      </p>

      <img
        src="@/assets/12/0.png"
        class="border bg-white"
        alt="Atomic deletion of WAL and creation of next WAL"
      />

      <p class="text-text/75 leading-relaxed mb-4">
        In the diagram above I call the deletion of the first WAL and creation
        of the next WAL an atomic operation, but earlier I was just saying that
        deleting the WAL is atomic. A deleted WAL plus a database that says it
        starts at <Code>start_lsn_1</Code> is fine - we have enough information
        to open the next WAL. I just thought the diagram looked nicer this way.
      </p>
      <p class="text-text/75 leading-relaxed mb-4">
        This is tricky for a few reasons:
      </p>
      <ul class="list-disc list-inside text-text/70 space-y-1 pl-2 mb-4">
        <li>
          We're transferring all the reliability and fault tolerance mambo jumbo
          from the WAL to <em>something else</em>. Ordinarily our WAL is there
          to save our butts when the database crashes - but what do we do if
          we're trying to change the WAL itself?
        </li>
        <li>
          This operation involves a few <Code>fsync</Code>'s, particularly an
          <Code>fsync</Code> to the database.
        </li>
      </ul>

      <!-- 3.1.0 Two LSN slots -->
      <section id="section-3-1">
        <h3 class="text-base font-bold text-text mt-8 mb-2">
          3.1.0 - The Two LSN Slot Design
        </h3>
        <p class="text-text/75 leading-relaxed mb-4">
          My solution is to use two LSN "slots" inside the database header: a
          "main" LSN and a "swap" LSN. During normal processing, every time we
          delete and reopen a WAL, we record the new LSN in the swap slot.
          Usually - not always - the swap slot is just the smaller of the two
          numbers, because it holds the previous WAL's start LSN.
        </p>

        <img
          src="@/assets/12/1.png"
          class="border bg-white"
          alt="Main and swap LSN slots in the database header"
        />

        <p class="text-text/75 leading-relaxed mb-4">
          That's getting us closer - it smells like "rollback" to me - but it's
          not there yet. We still haven't laid out the crash paths. What if the
          database crashes while flushing the header? What if it crashes while
          opening the new WAL?
        </p>
      </section>
    </section>

    <!-- 4.0.0 Mapping Out the States -->
    <section id="section-4" class="mb-10">
      <h2 class="text-xl font-bold text-text mt-10 mb-1">
        4.0.0 - Mapping Out the States
      </h2>
      <p class="text-muted font-mono text-xs tracking-widest uppercase mb-5">
        Time sequence diagrams and crash points
      </p>
      <p class="text-text/75 leading-relaxed mb-4">
        In general, when I'm working on a hard atomicity problem, I like to draw
        a clean time sequence diagram. What are the things that take a long
        time? Flushing is non-atomic. Assuming a hard drive writes linearly
        increasing - is that always true? I know Richard Hipp assumes that in
        SQLite - a flush can write 5 bytes when you wanted to write 10. So
        that's a state.
      </p>
      <p class="text-text/75 leading-relaxed mb-4">
        Then there's the gap after we flush but before we delete the WAL -
        another state. I consider the deletion of the WAL atomic. It's not
        really atomic in the OS, but it appears atomic: a delete either happens
        or it doesn't, and the deleted file can't be in a halfway state. So
        that's not a state but an action. Then there's the state where the new
        WAL is being created. And of course our normal operation state. So far
        we have:
      </p>
      <ol
        class="space-y-2 text-lg text-text/70 leading-relaxed list-decimal list-inside marker:text-muted marker:font-mono marker:text-sm mb-4"
      >
        <li class="pl-3">Normal processing</li>
        <li class="pl-3">Writing the new WAL start LSN to the database</li>
        <li class="pl-3">Gap before the delete but after we wrote the LSN</li>
        <li class="pl-3">
          <span class="font-semibold text-text">DELETE</span> (atomic)
        </li>
        <li class="pl-3">Creating our new WAL</li>
        <li class="pl-3">Normal processing</li>
      </ol>
      <p class="text-text/75 leading-relaxed mb-4">
        During steps 1, 2, 3, 5, and 6 our program can crash. Let's diagram that
        out:
      </p>

      <img
        src="@/assets/12/2.png"
        class="border bg-white"
        alt="Timeline with crash points marked"
      />

      <!-- 4.1.0 The checkpoint -->
      <section id="section-4-1">
        <h3 class="text-base font-bold text-text mt-8 mb-2">
          4.1.0 - The WAL-Deleting Blocking Checkpoint
        </h3>
        <p class="text-text/75 leading-relaxed mb-4">
          I added a couple of steps between 1 and 2 because it helped me think
          about the checkpoint. The whole point of all this is to delete the WAL
          - which means we need to ensure pages are flushed to disk first.
          Therefore, let's call this process a checkpoint. For now it'll just
          block the entire database. Roughly, a checkpoint:
        </p>
        <ol
          class="space-y-2 text-lg text-text/70 leading-relaxed list-decimal list-inside marker:text-muted marker:font-mono marker:text-sm mb-4"
        >
          <li class="pl-3">Flushes all pages to disk.</li>
          <li class="pl-3">
            Marks a point in the WAL saying every record before this point is
            flushed to disk - meaning you can effectively delete everything
            before it.
          </li>
        </ol>
        <p class="text-text/75 leading-relaxed mb-4">
          That's where we got the idea of deleting the WAL. Let's break our
          steps up a little more:
        </p>

        <img
          src="@/assets/12/3.png"
          class="border bg-white"
          alt="Expanded checkpoint steps"
        />

        <p class="text-text/75 leading-relaxed mb-4">
          We'll call this a "WAL-Deleting Blocking Checkpoint."
        </p>
      </section>

      <!-- 4.2.0 Header LSN states -->
      <section id="section-4-2">
        <h3 class="text-base font-bold text-text mt-8 mb-2">
          4.2.0 - Header LSN States
        </h3>
        <p class="text-text/75 leading-relaxed mb-4">
          Next, let's think about the state of the header LSNs. Remember, we're
          treating the high one as the source of truth. When we delete a WAL and
          write to the header, we replace the low one with the new high one.
        </p>

        <img
          src="@/assets/12/4.png"
          class="border bg-white"
          alt="Header LSN states across the checkpoint"
        />

        <p class="text-text/75 leading-relaxed mb-4">
          The yellow box is the high LSN during normal execution, flushing, and
          in-memory writing. When we flush, the new low one is being flushed, so
          it could be partially incomplete. After flush, we have a weird state
          where our low LSN is the same as the WAL's <Code>start_lsn</Code>.
          After deleting the WAL, neither the low nor high LSN matches the WAL
          LSN - because the WAL isn't done opening yet - but when the new WAL is
          open, it has the same LSN as the high LSN.
        </p>
      </section>

      <!-- 4.3.0 Crash points -->
      <section id="section-4-3">
        <h3 class="text-base font-bold text-text mt-8 mb-2">
          4.3.0 - Crash Points
        </h3>
        <p class="text-text/75 leading-relaxed mb-4">
          Let's mark everywhere we can crash in this timeline:
        </p>

        <img
          src="@/assets/12/5.png"
          class="border bg-white"
          alt="Crash points marked across the timeline"
        />

        <p class="text-text/75 leading-relaxed mb-4">
          Step 6 is special - it's where the database closes. It's also possible
          to crash between deleting the WAL and starting to open the next one,
          but that case is just the same as a clean close. It's a special case,
          and the only case where a crash does nothing.
        </p>
      </section>
    </section>

    <!-- 5.0.0 Checkpoint Protocol -->
    <section id="section-5" class="mb-10">
      <h2 class="text-xl font-bold text-text mt-10 mb-1">
        5.0.0 - The Checkpoint Protocol
      </h2>
      <p class="text-muted font-mono text-xs tracking-widest uppercase mb-5">
        Cleanly Deleting a WAL
      </p>
      <p class="text-text/75 leading-relaxed mb-4">
        Our Checkpoint protocol is pretty simple. First, it gets the new start
        lsn, writes that to the slot that has the minimum value. Then it flushes
        the header, deletes the wal and opens a new wal.
      </p>

      <img
        src="@/assets/12/7.png"
        class="border bg-white"
        alt="Open protocol decision tree"
      />
    </section>

    <!-- 6.0.0 Open Protocol -->
    <section id="section-6" class="mb-10">
      <h2 class="text-xl font-bold text-text mt-10 mb-1">
        6.0.0 - The Open Protocol
      </h2>
      <p class="text-muted font-mono text-xs tracking-widest uppercase mb-5">
        Recovering from every crash point
      </p>
      <p class="text-text/75 leading-relaxed mb-4">
        Our open protocol must handle all of these cases:
      </p>

      <img
        src="@/assets/12/6.png"
        class="border bg-white"
        alt="Open protocol decision tree"
      />
    </section>

    <!-- 6.0.0 Considerations -->
    <section id="section-7" class="mb-10">
      <h2 class="text-xl font-bold text-text mt-10 mb-1">
        7.0.0 - Considerations
      </h2>
      <p class="text-muted font-mono text-xs tracking-widest uppercase mb-5">
        What I left out
      </p>
      <p class="text-text/75 leading-relaxed mb-4">
        A few things I glossed over:
      </p>
      <p class="text-text/75 leading-relaxed mb-4">
        During the checkpoint we're treating the database as if we lock it
        entirely. In practice, this isn't done on performant databases. Usually
        you don't want to lock the database to perform a checkpoint because
        there could be long-running transactions. That's where fuzzy checkpoints
        come into play - a topic for another post. Smart Files just locks the
        entire database because it's not a multi-user database (yet).
      </p>
    </section>
  </article>
</template>
