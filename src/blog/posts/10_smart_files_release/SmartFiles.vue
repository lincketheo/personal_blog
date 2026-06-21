<script setup lang="ts">
import Definition from "@/components/Definition.vue";
import Code from "@/components/Code.vue";
import GithubBanner from "@/components/GithubBanner.vue";
</script>

<template>
  <article class="max-w-2xl mx-auto px-6 py-12 font-serif">
    <header class="mb-10">
      <h1 class="text-4xl font-bold text-fg leading-tight mb-4">
        Announcing Smart Files
      </h1>
      <GithubBanner
        name="Smart Files"
        owner="lincketheo"
        url="https://github.com/lincketheo/smartfiles"
        language="C"
        license="Apache 2.0"
        version="v0.0.3"
      />

      <p class="text-lg text-fg/70 leading-relaxed">
        Files have had the same definition for 50 years: an array of bytes that
        grows, shrinks, and seeks. Smart Files extends that model with
        transactions, O(log n) inner mutations, strided access, and multiple
        named streams per file.
      </p>
      <br />
      <p class="text-lg text-fg/70 leading-relaxed indent-10">
        Text editors don't write directly to disk on every keystroke. They
        maintain a rope or gap buffer in memory, then flush periodically -
        because inserting a character into the middle of a flat file means
        rewriting everything that follows it. Collaborative editors add CRDTs on
        top of that to handle concurrent edits. All of this infrastructure
        exists to paper over two gaps in the standard file model:
      </p>
      <p
        class="mt-6 mb-3 font-mono text-xs tracking-widest uppercase text-muted"
      >
        The shortcomings of standard files
      </p>
      <ol
        class="space-y-3 text-lg text-fg/70 leading-relaxed list-decimal list-inside marker:text-muted marker:font-mono marker:text-sm"
      >
        <li class="pl-4">
          <span class="text-fg font-semibold">Not atomic.</span>
          <code>fwrite</code> does not guarantee bytes hit disk. The kernel
          flushes dirty pages on its own schedule, so a crash mid-write leaves
          your file in a state that never legally existed - with no path to
          recovery. Wrapping writes in a retry loop helps with short reads, but
          it doesn't help if the process dies halfway through that loop.
        </li>
        <li class="pl-4">
          <span class="text-fg font-semibold">No inner mutations.</span>
          There is no <code>finsert</code>. Splicing bytes into the middle of a
          file means reading the tail into a buffer, writing your new bytes,
          then writing the tail back. That's O(n) in the size of the tail, and
          if the process dies between the second and third write, the file is
          corrupt. Text editors use ropes and gap buffers in memory to hide this
          cost. Nothing equivalent exists for the on-disk representation.
        </li>
      </ol>
      <br />
      <p
        class="mt-6 mb-3 font-mono text-xs tracking-widest uppercase text-muted"
      >
        Smart Files fixes both, and adds two more things:
      </p>
      <ol
        class="space-y-3 text-lg text-fg/70 leading-relaxed list-decimal list-inside marker:text-muted marker:font-mono marker:text-sm"
      >
        <li class="pl-4">
          <span class="text-fg font-semibold">Transactions.</span>
          Every mutation goes through a write-ahead log. Each write either
          commits fully or rolls back - a crash mid-write leaves nothing
          corrupt. The recovery algorithm is
          <a href="https://cs.stanford.edu/people/chrismre/cs345/rl/aries.pdf"
            >ARIES</a
          >, which has the unusual property of being fault-tolerant even while
          it is itself recovering.
        </li>
        <li class="pl-4">
          <span class="text-fg font-semibold">Inner mutations.</span>
          Insert or remove bytes anywhere in the stream in O(log n) time. The
          index is a self-balancing rope - same concept as a B+Tree, but keyed
          on byte count rather than index values. Insert and remove are native
          operations, not workarounds.
        </li>
        <li class="pl-4">
          <span class="text-fg font-semibold">Stride access.</span>
          Read, write, and remove at regular intervals without manual offset
          arithmetic. If you're storing float arrays and want every 2nd element,
          one call handles it. No read-everything, discard-most-of-it loop.
        </li>
        <li class="pl-4">
          <span class="text-fg font-semibold">Multiple named streams.</span>
          A single Smart File can hold as many named byte streams as you want.
          Each stream is independent. Default behavior looks exactly like a
          plain file - the named streams are a power-user feature.
        </li>
      </ol>

      <p
        class="mt-6 mb-3 font-mono text-xs tracking-widest uppercase text-muted"
      >
        Where this matters
      </p>
      <ol
        class="space-y-3 text-lg text-fg/70 leading-relaxed list-decimal list-inside marker:text-muted marker:font-mono marker:text-sm"
      >
        <li class="pl-4">
          <span class="text-fg font-semibold"
            >Genomics and bioinformatics.</span
          >
          DNA sequence data is a large byte stream that gets edited at arbitrary
          positions - insertions, deletions, substitutions. FASTA/FASTQ and
          BAM/CRAM are flat formats with no transactional semantics. A crashed
          pipeline can silently corrupt an index with no recovery path.
        </li>
        <li class="pl-4">
          <span class="text-fg font-semibold"
            >Seismic and geophysical data.</span
          >
          Seismic surveys produce interleaved arrays of sensor readings sampled
          at high frequency. The industry standard is SEG-Y, a flat binary
          format from 1975. Reading a single channel means loading the whole
          file.
        </li>
        <li class="pl-4">
          <span class="text-fg font-semibold">Audio and video editing.</span>
          Non-linear editors maintain edit decision lists and proxy formats
          precisely to avoid rewriting raw media on every cut. That
          infrastructure exists because files don't support inner mutations.
        </li>
        <li class="pl-4">
          <span class="text-fg font-semibold"
            >Collaborative document editing.</span
          >
          Google Docs and VS Code implement operational transforms or CRDTs in
          memory to handle concurrent edits, then flush diffs to a database. The
          file on disk is always a snapshot. A text document is a byte stream -
          Smart Files make it a crash-safe one where every edit is an atomic
          inner mutation.
        </li>
        <li class="pl-4">
          <span class="text-fg font-semibold">Scientific computing.</span>
          Climate models and fluid simulations produce multi-dimensional arrays
          read in strides - every nth timestep, every other spatial slice. HDF5
          and NetCDF are the current standard but neither is transactional. A
          crashed simulation write can corrupt the output file with no recovery.
        </li>
        <li class="pl-4">
          <span class="text-fg font-semibold">Financial market data.</span>
          High-frequency trading systems record tick data as a continuous
          timestamped byte stream, then query it in strides. The industry uses
          custom binary formats and kdb+/q, both of which require significant
          supporting infrastructure.
        </li>
        <li class="pl-4">
          <span class="text-fg font-semibold">AI training pipelines.</span>
          Feature stores, embedding tables, and weight checkpoints are strided,
          byte-shaped, and large. PyTorch checkpoint serialization, Parquet,
          Redis, and vector databases each solve one piece of this. None of it
          is atomic at the file level.
        </li>
        <li class="pl-4">
          <span class="text-fg font-semibold">Medical imaging.</span>
          DICOM stores multi-dimensional image arrays with no transactional
          semantics. A failed write during acquisition or transfer can corrupt a
          scan.
        </li>
      </ol>
    </header>

    <!-- For the lazy ---------------------------------------------------------->
    <section class="mb-10">
      <h2 class="text-xl font-bold text-fg mt-10 mb-1">Example</h2>
      <p class="text-muted font-mono text-xs tracking-widest uppercase mb-5">
        A quick preview of what Smart Files do
      </p>
      <p class="text-fg/75 leading-relaxed mb-4">
        For more samples, see the
        <a
          class="underline"
          href="https://github.com/lincketheo/Smart-Files/tree/main/samples/smfile"
          >github repository</a
        >.
      </p>
      <p class="text-fg/75 leading-relaxed mb-4">Insert in the middle:</p>
      <pre
        class="bg-surface border-l-4 border-secondary/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-fg/85 leading-relaxed">// Open a smart file by pointing it to the disk ("myfile")
smfile_t *smf = smfile_open ("myfile");

// Insert "The fox jumps" starting at offset 0, with 13 bytes
smfile_insert (smf, "The fox jumps", 0, 13);

// Insert "quick " starting at index 4 (before "fox") with 6 bytes
smfile_insert (smf, "quick ", 4, 6);

// Read starting at 0 - and read everything (SMF_END)
char buf[32];
sb_size n = smfile_read (smf, buf, 0, SMF_END);
buf[n] = '\0';
printf ("%s\n", buf);  // "The quick fox jumps"

smfile_close (smf);</code></pre>
      <p class="text-fg/75 leading-relaxed mb-4">Remove from the middle:</p>
      <pre
        class="bg-surface border-l-4 border-secondary/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-fg/85 leading-relaxed">// file contains "The quick fox jumps"
smfile_remove (smf, NULL, 4, 6);  // cut "quick " at offset 4

sb_size n = smfile_read (smf, buf, 0, SMF_END);
buf[n] = '\0';
printf ("%s\n", buf);  // The fox jumps</code></pre>
      <p class="text-fg/75 leading-relaxed mb-4">Write in the middle:</p>
      <pre
        class="bg-surface border-l-4 border-secondary/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-fg/85 leading-relaxed">// file contains "The fox jumps"
smfile_write (smf, "cat", 4, 3);  // overwrite "fox" with "cat"

sb_size n = smfile_read (smf, buf, 0, SMF_END);
buf[n] = '\0';
printf ("%s\n", buf);  // The cat jumps</code></pre>
      <p class="text-fg/75 leading-relaxed">
        None of those corrupt the file if you crash mid-operation. Wrap multiple
        calls in <Code>smfile_begin</Code> / <Code>smfile_commit</Code> if you
        need them to land together.
      </p>
    </section>

    <!-- Four extensions ------------------------------------------------------>
    <section class="mb-10">
      <h2 class="text-xl font-bold text-fg mt-10 mb-1">
        Four extensions on traditional files
      </h2>
      <p class="text-muted font-mono text-xs tracking-widest uppercase mb-5">
        What's actually new
      </p>
      <ol
        class="list-decimal list-outside pl-5 space-y-2 text-fg/75 leading-relaxed mb-4"
      >
        <li>
          Inner mutations are first-class operations. The index is a
          self-balancing rope on disk - same idea as a B+Tree, but keyed on byte
          count rather than index values. Insert and remove are O(log n)
          regardless of where in the stream the edit lands.
        </li>
        <li>
          Operations are atomic. Modern file systems can partially write data.
          Smart Files are backed by a write-ahead log using ARIES (Algorithm for
          Recovery and Isolation Exploiting Semantics), which keeps the database
          consistent even during recovery.
        </li>
        <li>
          Strided reads, writes, and removes let you touch every nth element
          without reading the whole stream. Useful for structured array data -
          reading a single field out of an array of packed structs, or
          downsampling a float array.
        </li>
        <li>
          Multiple labeled datasets per file. A single Smart File can hold n
          independent named byte streams via a top-level hash map. Default
          behavior looks like a plain file - the named streams are opt-in.
        </li>
      </ol>
    </section>

    <!-- The problem with ISO C files ----------------------------------------->
    <section class="mb-10">
      <h2 class="text-xl font-bold text-fg mt-10 mb-1">
        The problem with ISO C files
      </h2>
      <p class="text-muted font-mono text-xs tracking-widest uppercase mb-5">
        Why this needed to exist
      </p>

      <h3 class="text-base font-bold text-fg mb-2">Inner mutations</h3>
      <p class="text-fg/75 leading-relaxed mb-4">
        There's no <Code>finsert</Code> in the standard library. To splice data
        into the middle of a file you read the tail into a buffer, write your
        new bytes, then write the tail back. That's the happy path. If the
        process dies between the second and third write, the file is corrupt.
        Both insert and remove are <Code>O(n)</Code> in the size of the tail -
        for a 1 GB file with an insert near the front you're rewriting close to
        a gigabyte of data.
      </p>
      <pre
        class="bg-surface border-l-4 border-secondary/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-fg/85 leading-relaxed">tailsize = file.size - offset;
tail     = malloc (tailsize);
fseek  (file, offset);
fread  (tail, 1, tailsize, file);
fwrite (newdata, 1, newlength, file);
fwrite (tail, 1, tailsize, file);  /* crash here = corrupt file */</code></pre>

      <h3 class="text-base font-bold text-fg mb-2">Atomicity</h3>
      <p class="text-fg/75 leading-relaxed mb-4">
        ISO C files are a thin wrapper over <Code>read(2)</Code> and
        <Code>write(2)</Code>. The kernel makes no atomicity promises. A write
        can be partially applied and a crash mid-write leaves you with bytes in
        a state that never legally existed. <Code>fsync</Code> helps with
        durability but does nothing for atomicity.
      </p>
      <Definition term="Atomicity">
        An operation is atomic if it either fully completes or has no effect at
        all - there is no in-between state. UNIX files are not atomic because
        <Code>write(2)</Code> can partially apply - the kernel flushes dirty
        pages independently, so a crash mid-write leaves the file in a state
        that never legally existed. Smart Files are backed by a write-ahead log
        that guarantees every operation is all-or-nothing.
      </Definition>
    </section>

    <!-- How Smart Files solves this ------------------------------------------>
    <section class="mb-10">
      <h2 class="text-xl font-bold text-fg mt-10 mb-1">
        How Smart Files solves this
      </h2>
      <p class="text-muted font-mono text-xs tracking-widest uppercase mb-5">
        Under the hood
      </p>

      <h3 class="text-base font-bold text-fg mb-2">
        A rope-backed storage engine
      </h3>
      <p class="text-fg/75 leading-relaxed mb-4">
        Smart Files uses a rope algorithm optimized for disk writes to bring
        insert and remove from <Code>O(n)</Code> to <Code>O(log n)</Code>. The
        rope is tree-structured on disk so cost scales with tree depth, not file
        size. It inherits B+Tree properties - many keys per page, self-balancing
        - but uses byte count as the key instead of an index value.
      </p>
      <pre
        class="bg-surface border-l-4 border-secondary/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-fg/85 leading-relaxed">smfile_insert (smf, newdata, offset, length);</code></pre>
      <Definition term="Rope">
        A tree-based data structure for storing a sequence of bytes. Instead of
        one contiguous buffer, a rope splits the sequence across tree nodes.
        Insertions and deletions rearrange nodes rather than copying data, which
        is why they're O(log n) instead of O(n).
      </Definition>

      <h3 class="text-base font-bold text-fg mb-2">
        Full transaction support
      </h3>
      <p class="text-fg/75 leading-relaxed mb-4">
        Every individual operation is already atomic. Wrap a sequence in
        <Code>smfile_begin</Code> / <Code>smfile_commit</Code> when you need
        multiple operations to land together or not at all.
        <Code>smfile_rollback</Code> undoes everything since the last
        <Code>begin</Code>.
      </p>
      <pre
        class="bg-surface border-l-4 border-secondary/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-fg/85 leading-relaxed">smfile_begin (smf);
smfile_insert (smf, header, 0,  sizeof (header));
smfile_insert (smf, body,   8,  sizeof (body));
smfile_insert (smf, footer, 72, sizeof (footer));
smfile_commit (smf);  /* all three land, or none of them do */</code></pre>

      <h3 class="text-base font-bold text-fg mb-2">Strided operations</h3>
      <p class="text-fg/75 leading-relaxed mb-4">
        Read, write, and remove all accept a <Code>stride</Code> parameter.
        Stride 1 is contiguous; stride <Code>n</Code> touches every nth element.
        No read-everything, discard-most-of-it loop.
      </p>
      <pre
        class="bg-surface border-l-4 border-secondary/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-fg/85 leading-relaxed">/* stride=2: read elements 0, 2, 4, 6, ... */
smfile_pread (smf, "floats", evens, sizeof (float), 0, 2, 8);

/* stride=2: overwrite elements 1, 3, 5, 7, ... */
smfile_pwrite (smf, "floats", neg, sizeof (float), sizeof (float), 2, 8);

/* stride=2: remove elements 0, 2, 4, 6, ... - gaps close in place */
smfile_premove (smf, "floats", removed, sizeof (float), 0, 2, 8);</code></pre>
      <Definition term="Stride">
        The step between elements in a strided operation. Stride 1 reads or
        writes consecutive elements. Stride 4 touches element 0, then 4, then 8
        - skipping 3 between each access. Useful for reading a single field out
        of an array of packed structs without pulling everything into memory.
      </Definition>

      <h3 class="text-base font-bold text-fg mb-2">
        Multiple variables per file
      </h3>
      <p class="text-fg/75 leading-relaxed mb-4">
        A single Smart File can hold as many named variables as you want.
        Default behaviour looks exactly like a plain file. The
        <Code>p</Code>-prefixed functions (<Code>smfile_pinsert</Code>,
        <Code>smfile_pread</Code>, etc.) take a name argument.
      </p>
      <pre
        class="bg-surface border-l-4 border-secondary/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-fg/85 leading-relaxed">smfile_pinsert (smf, "temperatures", temps,    0, sizeof (temps));
smfile_pinsert (smf, "humidity",     humidity, 0, sizeof (humidity));
/* two independent byte sequences, one file */</code></pre>
    </section>

    <footer class="mt-12 pt-6 border-t border-border">
      <p class="text-muted italic text-sm">
        Smart Files is in beta. It's fully open source and I'd love contributors
        and early users. More samples ship with the library covering named
        variables, multithreaded access, and crash recovery.
      </p>
    </footer>
  </article>
</template>
