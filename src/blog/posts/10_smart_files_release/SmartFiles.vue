<script setup lang="ts">
import Definition from "@/components/Definition.vue";
import Code from "@/components/Code.vue";
</script>

<template>
  <article class="max-w-2xl mx-auto px-6 py-12 font-serif">
    <header class="mb-10">
      <h1 class="text-4xl font-bold text-text leading-tight mb-4">
        Announcing Smart Files
      </h1>
      <p class="text-lg text-text/70 leading-relaxed">
        The concept of a file has had the same obtuse definition for the past 50
        years. Today I'm announcing the launch of Smart Files, a new API that
        gets past the hurdles of old school linear, non-transactional system
        files.
      </p>
      <p class="text-lg text-text/70 leading-relaxed indent-10">
        For about 50 years now, lots of programming has been built on top of the
        standard file. All programming languages use files. Files are arrays of bytes.
        They grow they shrink and they seek. That's really it, honestly. You can do
        lots of things to a file, but they are always limited by the harsh constructs of
        the read and write api. There's really no first class way to insert a big chunk
        of data into the middle of a file or remove a big chunk of data in the middle
        of the file.
      </p>
    </header>

    <!-- For the lazy ---------------------------------------------------------->
    <section class="mb-10">
      <h2 class="text-xl font-bold text-text mt-10 mb-1">For the lazy</h2>
      <p class="text-muted font-mono text-xs tracking-widest uppercase mb-5">
        Here's a quick preview of what smart files do
      </p>
      <p class="text-text/75 leading-relaxed mb-4">
        For comprehensive samples - see samples in the <a class="underline" href="">github repository</a>
      </p>
      <p class="text-text/75 leading-relaxed mb-4">
        Insert in the middle:
      </p>
      <pre
          class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-text/85 leading-relaxed">smfile_t *smf = smfile_open ("myfile");

// Insert "The fox jumps" starting at offset 0, with 13 bytes
smfile_insert (smf, "The fox jumps", 0, 13);

// Insert "quick " starting at index 4 (before "fox") with 6 bytes
smfile_insert (smf, "quick ", 4, 6);

// Read starting at 0 - and read everything
char buf[32];
sb_size n = smfile_read (smf, buf, 0, SMF_END);
buf[n] = '\0';
printf ("%s\n", buf);  // "The quick fox jumps"

smfile_close (smf);</code></pre>
      <p class="text-text/75 leading-relaxed mb-4">
        Remove from the middle:
      </p>
      <pre
          class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-text/85 leading-relaxed">// file contains "The quick fox jumps"
smfile_remove (smf, NULL, 4, 6);  // cut "quick " at offset 4

sb_size n = smfile_read (smf, buf, 0, SMF_END);
buf[n] = '\0';
printf ("%s\n", buf);  // The fox jumps</code></pre>
      <p class="text-text/75 leading-relaxed mb-4">
        Write in the middle:
      </p>
      <pre
          class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-text/85 leading-relaxed">// file contains "The fox jumps"
smfile_write (smf, "cat", 4, 3);  // overwrite "fox" with "cat"

sb_size n = smfile_read (smf, buf, 0, SMF_END);
buf[n] = '\0';
printf ("%s\n", buf);  // The cat jumps</code></pre>
      <p class="text-text/75 leading-relaxed">
        None of those corrupt the file if you crash mid-operation. Wrap multiple
        calls in <Code>smfile_begin</Code> / <Code>smfile_commit</Code> if you
        need them to land together.
      </p>
    </section>

    <!-- Four extensions ------------------------------------------------------>
    <section class="mb-10">
      <h2 class="text-xl font-bold text-text mt-10 mb-1">
        Four extensions on traditional files
      </h2>
      <p class="text-muted font-mono text-xs tracking-widest uppercase mb-5">
        What's actually new
      </p>
      <p class="text-text/75 leading-relaxed mb-4">
        Smart Files have four primary extensions on top of traditional files:
      </p>
      <ol class="list-decimal list-outside pl-5 space-y-2 text-text/75 leading-relaxed mb-4">
        <li>
          Inner mutations are first class operations - inserting and removing
          chunks of data in the middle of a file are native, O(log n) operations.
        </li>
        <li>
          Operations are atomic - modern file systems notoriously can partially
          write data. Smart Files are fully atomic, backed by a write-ahead log.
        </li>
        <li>
          Strided reads, writes, and removes - touch every nth element in a
          stream without reading the whole thing. Remove every 2nd byte from a
          stream of n bytes in a single call.
        </li>
        <li>
          Multiple labeled datasets per file - store n independent named
          variables inside a single file.
        </li>
      </ol>
    </section>

    <!-- The problem with ISO C files ----------------------------------------->
    <section class="mb-10">
      <h2 class="text-xl font-bold text-text mt-10 mb-1">
        The problem with ISO C files
      </h2>
      <p class="text-muted font-mono text-xs tracking-widest uppercase mb-5">
        Why this needed to exist
      </p>

      <h3 class="text-base font-bold text-text mb-2">Inner mutations</h3>
      <p class="text-text/75 leading-relaxed mb-4">
        There's no <Code>finsert</Code> in the standard library. To splice data
        into the middle of a file you read the tail into a buffer, write your
        new bytes, then write the tail back. That's the happy path. If the
        process dies between the second and third write, the file is corrupt.
        Both insert and remove are <Code>O(n)</Code> in the size of the tail -
        for a 1 GB file with an insert near the front you're rewriting close to
        a gigabyte of data.
      </p>
      <pre
          class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-text/85 leading-relaxed">tailsize = file.size - offset;
tail     = malloc (tailsize);
fseek  (file, offset);
fread  (tail, 1, tailsize, file);
fwrite (newdata, 1, newlength, file);
fwrite (tail, 1, tailsize, file);  /* crash here = corrupt file */</code></pre>

      <h3 class="text-base font-bold text-text mb-2">Atomicity</h3>
      <p class="text-text/75 leading-relaxed mb-4">
        ISO C files are a thin wrapper over <Code>read(2)</Code> and
        <Code>write(2)</Code>. The kernel makes no atomicity promises. A write
        can be partially applied and a crash mid-write leaves you with bytes in
        a state that never legally existed. <Code>fsync</Code> helps with
        durability but does nothing for atomicity.
      </p>
      <Definition term="Atomicity">
        An operation is atomic if it either fully completes or has no effect at
        all - there is no in-between state. UNIX files are not atomic because
        <Code>write(2)</Code> can partially apply - the kernel flushes dirty pages
        independently, so a crash mid-write leaves the file in a state that never
        legally existed. Smart Files are backed by a write-ahead log that guarantees
        every operation is all-or-nothing.
      </Definition>
    </section>

    <!-- How Smart Files solves this ------------------------------------------>
    <section class="mb-10">
      <h2 class="text-xl font-bold text-text mt-10 mb-1">How Smart Files solves this</h2>
      <p class="text-muted font-mono text-xs tracking-widest uppercase mb-5">
        Under the hood
      </p>

      <h3 class="text-base font-bold text-text mb-2">A rope-backed storage engine</h3>
      <p class="text-text/75 leading-relaxed mb-4">
        Smart Files uses a rope algorithm optimized for disk writes to bring
        insert and remove from <Code>O(n)</Code> to <Code>O(log n)</Code>. The
        rope is tree-structured on disk so cost scales with tree depth, not file
        size. They also inherit the same properties of B+Tree's, namely (1) they store
        lots of data on each page and (2) they are self balanced ropes to avoid
        inconsistent seek times. If this doesn't make sense, it's ok - essentially
        they use the same algorithm as modern databases, just with different keys:
        the data size.
      </p>
      <pre
          class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-text/85 leading-relaxed">smfile_insert (smf, newdata, offset, length);</code></pre>
      <Definition term="Rope">
        A tree-based data structure for storing a sequence of bytes. Instead of
        one contiguous buffer, a rope splits the sequence across tree nodes.
        Insertions and deletions rearrange nodes rather than copying data, which
        is why they're O(log n) instead of O(n).
      </Definition>

      <h3 class="text-base font-bold text-text mb-2">Full transaction support</h3>
      <p class="text-text/75 leading-relaxed mb-4">
        Every individual operation is already atomic. Wrap a sequence in
        <Code>smfile_begin</Code> / <Code>smfile_commit</Code> when you need
        multiple operations to land together or not at all.
        <Code>smfile_rollback</Code> undoes everything since the last
        <Code>begin</Code>.
      </p>
      <pre
          class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-text/85 leading-relaxed">smfile_begin (smf);
smfile_insert (smf, header, 0,  sizeof (header));
smfile_insert (smf, body,   8,  sizeof (body));
smfile_insert (smf, footer, 72, sizeof (footer));
smfile_commit (smf);  /* all three land, or none of them do */</code></pre>

      <h3 class="text-base font-bold text-text mb-2">Strided operations</h3>
      <p class="text-text/75 leading-relaxed mb-4">
        Read, write, and remove all accept a <Code>stride</Code> parameter.
        Stride 1 is contiguous; stride <Code>n</Code> touches every nth element.
        No read-everything, discard-most-of-it loop.
      </p>
      <pre
          class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-text/85 leading-relaxed">/* stride=2: read elements 0, 2, 4, 6, ... */
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

      <h3 class="text-base font-bold text-text mb-2">Multiple variables per file</h3>
      <p class="text-text/75 leading-relaxed mb-4">
        A single Smart File can hold as many named variables as you want. Default
        behaviour looks exactly like a plain file. The <Code>p</Code>-prefixed
        functions (<Code>smfile_pinsert</Code>, <Code>smfile_pread</Code>, etc.)
        take a name argument.
      </p>
      <pre
          class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-text/85 leading-relaxed">smfile_pinsert (smf, "temperatures", temps,    0, sizeof (temps));
smfile_pinsert (smf, "humidity",     humidity, 0, sizeof (humidity));
/* two independent byte sequences, one file */</code></pre>
    </section>

    <footer class="mt-12 pt-6 border-t border-border">
      <p class="text-muted italic text-sm">
        Smart Files is in beta. I'd love contributors and users - it's fully open
        source. More samples ship with the library covering named variables,
        multithreaded access, and crash recovery.
      </p>
    </footer>
  </article>
</template>