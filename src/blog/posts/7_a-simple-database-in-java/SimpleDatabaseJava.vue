<script setup lang="ts">
import Definition from "@/components/Definition.vue";
import Code from "@/components/Code.vue";
</script>

<template>
  <article class="max-w-2xl mx-auto px-6 py-12 font-serif">
    <header class="mb-10">
      <h1 class="text-4xl font-bold text-fg leading-tight mb-4">
        Building a Crude UNDO Database in Java
      </h1>
      <p class="text-lg text-fg/70 leading-relaxed">
        I've been working on a new database for contiguous bytes, and I wanted
        to do some basic prototyping in Java for a front end I'm building. I
        built a really crude UNDO based database and wanted to share the basic
        idea. It's not crazy reliable but it works pretty well. Let me talk
        through how it works.
      </p>
    </header>

    <section class="mb-8">
      <h2 class="text-xl font-bold text-fg mt-10 mb-3">The Data Model</h2>
      <p class="text-fg/75 leading-relaxed mb-4">
        Our data is just a hash map of files inside of a folder:
      </p>
      <pre
        class="bg-surface border-l-4 border-secondary/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-fg/85 leading-relaxed">Database\
    File1
    File2
    File3</code></pre>
      <p class="text-fg/75 leading-relaxed mb-4">
        These files can contain any information in them. It's literally just a
        key value system for bytes with transactional semantics. The key is the
        file name and the value is the bytes in that file.
      </p>
      <Definition term="Transaction">
        A transaction is a sequence of operations that is treated as a single
        unit of work. The database guarantees that either all of the operations
        in a transaction take effect, or none of them do. This is the "all or
        nothing" property - formally called <em>atomicity</em> - and it's one of
        the four ACID properties that Jim Gray formalized in the late 1970s.
      </Definition>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-bold text-fg mt-10 mb-3">
        Handling Concurrency: Just Lock the Whole Thing
      </h2>
      <p class="text-fg/75 leading-relaxed mb-4">
        Let's eliminate concurrency problems by just locking the database for
        every transaction. I could lock every file individually and do two phase
        locking, but that's hard.
      </p>
      <Definition term="Locking">
        Locking is how a database serializes access to shared data. When a
        transaction acquires a lock on a resource, other transactions have to
        wait. The simplest strategy is a single coarse-grained lock on the whole
        database - nothing else can touch the data while a transaction is in
        progress. A more sophisticated approach is
        <em>two-phase locking (2PL)</em>, where each resource is locked
        individually and locks are acquired in a growing phase and released in a
        shrinking phase. 2PL gives you better concurrency but is significantly
        harder to implement correctly.
      </Definition>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-bold text-fg mt-10 mb-3">
        The DO UNDO REDO Protocol
      </h2>
      <p class="text-fg/75 leading-relaxed mb-4">
        The core idea behind most transactional systems is the
        <em>DO UNDO REDO</em> protocol. Before you modify anything, you save
        enough information to reverse the change (UNDO). After you commit, you
        save enough information to replay the change if needed (REDO). This
        database only implements UNDO - which is enough for our purposes.
      </p>
      <Definition term="DO UNDO REDO">
        <ul>
          <li>
            <strong>DO</strong>: perform the operation and record what you did
          </li>
          <li>
            <strong>UNDO</strong>: use the saved record to reverse an operation
            that shouldn't have happened (rollback or crash recovery)
          </li>
          <li>
            <strong>REDO</strong>: use the saved record to replay an operation
            that did happen but whose effects were lost (e.g. crash after commit
            but before the data was flushed to disk)
          </li>
        </ul>
        Full WAL-based databases like PostgreSQL implement all three. This
        implementation only needs UNDO because we're keeping the original files
        around until the commit is confirmed.
      </Definition>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-bold text-fg mt-10 mb-3">
        How a Transaction Works
      </h2>
      <p class="text-fg/75 leading-relaxed mb-4">
        A transaction modifies files by doing the following:
      </p>
      <ol
        class="list-decimal list-outside pl-5 space-y-2 text-fg/75 leading-relaxed mb-4"
      >
        <li>
          Make a backup file called <Code>File1.undo</Code> if there isn't
          already one, else goto step 3
        </li>
        <li>Make a CRC of this backup called <Code>File1.crc</Code></li>
        <li>Modify <Code>File1</Code> as much as you'd like</li>
        <li>Continue modifying other files</li>
      </ol>
      <Definition term="CRC (Cyclic Redundancy Check)">
        A CRC is a short checksum computed from a block of data. If the data
        changes - or if a write is interrupted partway through - the checksum
        won't match. We use it here to detect incomplete undo files: if the
        database crashes while writing an undo file, the CRC for that file won't
        be valid, and we know not to trust it during recovery.
      </Definition>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-bold text-fg mt-10 mb-3">Commit</h2>
      <ol
        class="list-decimal list-outside pl-5 space-y-2 text-fg/75 leading-relaxed mb-4"
      >
        <li>
          When you're done, write a single <Code>commit</Code> file that says
          the data is committed
        </li>
        <li>Delete all the <Code>.undo</Code> and <Code>.crc</Code> files</li>
        <li>Delete the <Code>commit</Code> file</li>
        <li>Unlock the database</li>
      </ol>
      <Definition term="Commit Record">
        The commit record is the single point of truth for whether a transaction
        succeeded. Writing it is an atomic operation at the filesystem level -
        either it exists or it doesn't. This is the mechanism that makes the
        whole system work: if the process crashes before the commit file is
        written, recovery knows to roll back. If it crashes after, recovery
        knows the transaction was good.
      </Definition>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-bold text-fg mt-10 mb-3">Rollback</h2>
      <ol
        class="list-decimal list-outside pl-5 space-y-2 text-fg/75 leading-relaxed"
      >
        <li>
          Swap all the <Code>.undo</Code> files for their base counterparts
        </li>
        <li>Delete all the <Code>.undo</Code> and <Code>.crc</Code> files</li>
        <li>Unlock the database</li>
      </ol>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-bold text-fg mt-10 mb-3">Why This Is Atomic</h2>
      <p class="text-fg/75 leading-relaxed">
        This is atomic because we keep track of all the original files (UNDO
        files) and we either finish writing the commit file or we don't. If we
        don't write that commit record, we must undo our changes by swapping the
        undo files with the original files. Also, because of the CRC writing, we
        ensure that a partial undo doesn't start.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-bold text-fg mt-10 mb-3">Recovery</h2>
      <p class="text-fg/75 leading-relaxed mb-4">Recovery is simple:</p>
      <ol
        class="list-decimal list-outside pl-5 space-y-2 text-fg/75 leading-relaxed mb-4"
      >
        <li>If there's a commit record, just cleanup - we're done</li>
        <li>
          Otherwise, go through all the <Code>.undo</Code> files and replace the
          original files with them, then delete the <Code>.undo</Code> and
          <Code>.crc</Code> files. There may be one file that has an incomplete
          CRC, meaning our database crashed while writing a CRC. If there's more
          than one - then our database is corrupt.
        </li>
      </ol>
      <Definition term="Recovery">
        Recovery is the process of restoring the database to a consistent state
        after a crash. The classic algorithm for this is ARIES (Algorithms for
        Recovery and Isolation Exploiting Semantics), developed at IBM in the
        early 1990s. ARIES uses a write-ahead log to replay committed
        transactions and undo uncommitted ones. This implementation is a
        stripped-down version of the same idea: scan for evidence of a committed
        transaction, and if it isn't there, undo everything.
      </Definition>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-bold text-fg mt-10 mb-3">Log Compaction</h2>
      <p class="text-fg/75 leading-relaxed mb-4">
        It's pretty simple. More generally, it's a hash map with an undo entry
        for every update. You save the change before you do it. Note, you only
        need one because updates are compacted.
      </p>
      <p class="text-fg/75 leading-relaxed mb-4">
        I originally (naively) made a log of all the files I changed. If I
        modified
        <Code>File1</Code> twice, I'd have <Code>File1.undo.1</Code> and
        <Code>File1.undo.2</Code>. But in write ahead logging, we don't
        technically need to keep all the records.
      </p>
      <Definition term="Log Compaction">
        Write-ahead logs grow unboundedly if you keep every record. Log
        compaction is the process of collapsing multiple log entries for the
        same resource into one. For UNDO logs specifically, only the
        <em>first</em> image matters - the state of the data before the
        transaction touched it. Every subsequent modification to the same
        resource during the same transaction can be discarded, because the
        original is already saved. That's the shortcut this database takes:
        <Code>File1.undo</Code> always holds the pre-transaction image, and
        <Code>File1</Code> is the current working state.
      </Definition>
      <p class="text-fg/75 leading-relaxed mt-4">
        Also, we don't really need sequentiality because all logs are disjoint -
        each file has its own undo record and they don't depend on each other.
      </p>
    </section>

    <footer class="mt-12 pt-6 border-t border-border">
      <p class="text-muted italic text-sm">
        Anyways, I thought it was a nice little database and wanted to share it.
      </p>
    </footer>
  </article>
</template>
