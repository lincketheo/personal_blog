<template>
  <article class="post">
    <header class="post-header">
      <h1>Building a Crude UNDO Database in Java</h1>
      <p class="post-intro">
        I've been working on a new database for contiguous bytes, and I wanted to do some basic
        prototyping in Java for a front end I'm building. I built a really crude UNDO based database
        and wanted to share the basic idea. It's not crazy reliable but it works pretty well. Let me
        talk through how it works.
      </p>
    </header>

    <section>
      <h2>The Data Model</h2>
      <p>Our data is just a hash map of files inside of a folder:</p>
      <pre><code>Database\
    File1
    File2
    File3</code></pre>
      <p>
        These files can contain any information in them. It's literally just a key value system for
        bytes with transactional semantics. The key is the file name and the value is the bytes in
        that file.
      </p>
      <Definition term="Transaction">
        A transaction is a sequence of operations that is treated as a single unit of work. The
        database guarantees that either all of the operations in a transaction take effect, or none
        of them do. This is the "all or nothing" property — formally called <em>atomicity</em> — and
        it's one of the four ACID properties that Jim Gray formalized in the late 1970s.
      </Definition>
    </section>

    <section>
      <h2>Handling Concurrency: Just Lock the Whole Thing</h2>
      <p>
        Let's eliminate concurrency problems by just locking the database for every transaction. I
        could lock every file individually and do two phase locking, but that's hard.
      </p>
      <Definition term="Locking">
        Locking is how a database serializes access to shared data. When a transaction acquires a
        lock on a resource, other transactions have to wait. The simplest strategy is a single
        coarse-grained lock on the whole database — nothing else can touch the data while a
        transaction is in progress. A more sophisticated approach is
        <em>two-phase locking (2PL)</em>, where each resource is locked individually and locks are
        acquired in a growing phase and released in a shrinking phase. 2PL gives you better
        concurrency but is significantly harder to implement correctly.
      </Definition>
    </section>

    <section>
      <h2>The DO UNDO REDO Protocol</h2>
      <p>
        The core idea behind most transactional systems is the <em>DO UNDO REDO</em> protocol.
        Before you modify anything, you save enough information to reverse the change (UNDO). After
        you commit, you save enough information to replay the change if needed (REDO). This database
        only implements UNDO — which is enough for our purposes.
      </p>
      <Definition term="DO UNDO REDO">
        <ul>
          <li><strong>DO</strong>: perform the operation and record what you did</li>
          <li>
            <strong>UNDO</strong>: use the saved record to reverse an operation that shouldn't have
            happened (rollback or crash recovery)
          </li>
          <li>
            <strong>REDO</strong>: use the saved record to replay an operation that did happen but
            whose effects were lost (e.g. crash after commit but before the data was flushed to
            disk)
          </li>
        </ul>
        Full WAL-based databases like PostgreSQL implement all three. This implementation only needs
        UNDO because we're keeping the original files around until the commit is confirmed.
      </Definition>
    </section>

    <section>
      <h2>How a Transaction Works</h2>
      <p>A transaction modifies files by doing the following:</p>
      <ol>
        <li>
          Make a backup file called <code>File1.undo</code> if there isn't already one, else goto
          step 3
        </li>
        <li>Make a CRC of this backup called <code>File1.crc</code></li>
        <li>Modify <code>File1</code> as much as you'd like</li>
        <li>Continue modifying other files</li>
      </ol>
      <Definition term="CRC (Cyclic Redundancy Check)">
        A CRC is a short checksum computed from a block of data. If the data changes — or if a write
        is interrupted partway through — the checksum won't match. We use it here to detect
        incomplete undo files: if the database crashes while writing an undo file, the CRC for that
        file won't be valid, and we know not to trust it during recovery.
      </Definition>
    </section>

    <section>
      <h2>Commit</h2>
      <ol>
        <li>When you're done, write a single <code>commit</code> file that says the data is committed</li>
        <li>Delete all the <code>.undo</code> and <code>.crc</code> files</li>
        <li>Delete the <code>commit</code> file</li>
        <li>Unlock the database</li>
      </ol>
      <Definition term="Commit Record">
        The commit record is the single point of truth for whether a transaction succeeded. Writing
        it is an atomic operation at the filesystem level — either it exists or it doesn't. This is
        the mechanism that makes the whole system work: if the process crashes before the commit file
        is written, recovery knows to roll back. If it crashes after, recovery knows the transaction
        was good.
      </Definition>
    </section>

    <section>
      <h2>Rollback</h2>
      <ol>
        <li>Swap all the <code>.undo</code> files for their base counterparts</li>
        <li>Delete all the <code>.undo</code> and <code>.crc</code> files</li>
        <li>Unlock the database</li>
      </ol>
    </section>

    <section>
      <h2>Why This Is Atomic</h2>
      <p>
        This is atomic because we keep track of all the original files (UNDO files) and we either
        finish writing the commit file or we don't. If we don't write that commit record, we must
        undo our changes by swapping the undo files with the original files. Also, because of the
        CRC writing, we ensure that a partial undo doesn't start.
      </p>
    </section>

    <section>
      <h2>Recovery</h2>
      <p>Recovery is simple:</p>
      <ol>
        <li>If there's a commit record, just cleanup — we're done</li>
        <li>
          Otherwise, go through all the <code>.undo</code> files and replace the original files with
          them, then delete the <code>.undo</code> and <code>.crc</code> files. There may be one
          file that has an incomplete CRC, meaning our database crashed while writing a CRC. If
          there's more than one — then our database is corrupt.
        </li>
      </ol>
      <Definition term="Recovery">
        Recovery is the process of restoring the database to a consistent state after a crash. The
        classic algorithm for this is ARIES (Algorithms for Recovery and Isolation Exploiting
        Semantics), developed at IBM in the early 1990s. ARIES uses a write-ahead log to replay
        committed transactions and undo uncommitted ones. This implementation is a stripped-down
        version of the same idea: scan for evidence of a committed transaction, and if it isn't
        there, undo everything.
      </Definition>
    </section>

    <section>
      <h2>Log Compaction</h2>
      <p>
        It's pretty simple. More generally, it's a hash map with an undo entry for every update. You
        save the change before you do it. Note, you only need one because updates are compacted.
      </p>
      <p>
        I originally (naively) made a log of all the files I changed. If I modified
        <code>File1</code> twice, I'd have <code>File1.undo.1</code> and
        <code>File1.undo.2</code>. But in write ahead logging, we don't technically need to keep all
        the records.
      </p>
      <Definition term="Log Compaction">
        Write-ahead logs grow unboundedly if you keep every record. Log compaction is the process of
        collapsing multiple log entries for the same resource into one. For UNDO logs specifically,
        only the <em>first</em> image matters — the state of the data before the transaction touched
        it. Every subsequent modification to the same resource during the same transaction can be
        discarded, because the original is already saved. That's the shortcut this database takes:
        <code>File1.undo</code> always holds the pre-transaction image, and <code>File1</code> is
        the current working state.
      </Definition>
      <p>
        Also, we don't really need sequentiality because all logs are disjoint — each file has its
        own undo record and they don't depend on each other.
      </p>
    </section>

    <footer class="post-footer">
      <p>Anyways, I thought it was a nice little database and wanted to share it.</p>
    </footer>
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

.post-footer {
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
  color: #555;
  font-style: italic;
}
</style>
