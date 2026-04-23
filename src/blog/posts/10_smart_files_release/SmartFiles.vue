<script setup lang="ts">
import Definition from "@/components/Definition.vue";
import Code from "@/components/Code.vue";
import GithubBanner from "@/components/GithubBanner.vue";
</script>

<template>
  <article class="max-w-2xl mx-auto px-6 py-12 font-serif">
    <header class="mb-10">
      <h1 class="text-4xl font-bold text-text leading-tight mb-4">
        Announcing Smart Files
      </h1>
      <GithubBanner name="Smart Files" owner="lincketheo" url="https://github.com/lincketheo/smartfiles" language="C" license="Apache 2.0" version="v0.0.3"/>

      <p class="text-lg text-text/70 leading-relaxed">
        The concept of a file has had the same definition for the past 50
        years. Today I'm announcing the launch of Smart Files, a new API that
        gets past the hurdles of old school linear, non-transactional system
        files.
      </p>
      <br>
      <p class="text-lg text-text/70 leading-relaxed indent-10">
        Lots of programming has been built on top of the standard file.
        I personally use files all the time. Files are just collections of
        bytes that you can append, overwrite data, and read to. But there are
        a lot of problems with the fact that you cant insert data into the middle
        of a file without re writing the tail. I think in general, there are a lot
        of obtuse wrap arounds in modern programming to work around this limiting fact.
        That's why we build in memory ropes or gap buffers in text editors,
        and CRDT's for shared editing. You fundamentally can't write data into the middle
        of a file efficiently. In my opinion, the standard file has two fundamental problems:
      </p>
      <p class="mt-6 mb-3 font-mono text-xs tracking-widest uppercase text-muted">
        The short comings of standard files
      </p>
      <ol class="space-y-3 text-lg text-text/70 leading-relaxed list-decimal list-inside marker:text-muted marker:font-mono marker:text-sm">
        <li class="pl-4">
          <span class="text-text font-semibold">Not atomic.</span>
          A call to <code>fwrite</code> does not guarantee that any bytes actually
          landed on disk. A crash mid-write leaves your file in an unknown state
          with no way to recover. In programming, this is called atomicity. Does your operation
          succeed fully or fail and do nothing at all. You can try to write 100 bytes to a file
          but the operating system only writes 10 due to an interrupt, a failed write, or because
          your operating system felt like it. I can't count the number of times I've had to put an
          fread / fwrite inside a for loop to ensure that I wrote all my bytes. But what if my program
          crashes while I'm in that for loop!

        </li>
        <li class="pl-4">
          <span class="text-text font-semibold">No first-class inner mutations.</span>
          There is no standard way to insert or remove a chunk of bytes in the middle
          of a file without rewriting everything after it. I feel like there are a lot of
          programming problems that could easily be solved if I could just insert data in the
          middle of a file without overridding data. For the less computer science savy, think
          about how when you press your insert key on your keyboard. All files are constantly in
          this insert mode. Files don't allow you to put a letter in between two other letters
          without overwriting the second one. Text editors usually use gap buffers, or ropes in memory
          to over come this fact (or else they would be re writing the entire file on every keystroke),
          but nothing is really there for on disk representation. Those are both in memory.
        </li>
      </ol>
      <br>
      <p class="mt-6 mb-3 font-mono text-xs tracking-widest uppercase text-muted">
        Smart Files fixes both, and adds two more things:
      </p>
      <ol class="space-y-3 text-lg text-text/70 leading-relaxed list-decimal list-inside marker:text-muted marker:font-mono marker:text-sm">
        <li class="pl-4">
          <span class="text-text font-semibold">Transactions.</span>
          Smart files log modifications in a write ahead log so that every mutation commits fully or rolls back - a crash mid-write leaves nothing corrupt.
          No matter what, if you request to write 10 bytes, you will write 10 bytes (or you'll write 0 bytes in the event of a crash).
          I use <a href="https://cs.stanford.edu/people/chrismre/cs345/rl/aries.pdf">ARIES (Algorithm for Recovery and Isolation Exploiting Semantics)</a>
          which is a pretty neat algorithm that has the unique property that it is fault tolerant even when it is in the process of recovering. (Other recovery
          mechanisms at the time couldn't get that right).
        </li>
        <li class="pl-4">
          <span class="text-text font-semibold">Inner mutations.</span>
          Insert or remove bytes anywhere in the stream in O(log N) time
          I think this is the main calling point to Smart Files. I spent a while devising the algorithm I used for Smart Files - which is just a
          B+Tree that tracks byte counts instead of index values. It's a Rope, but with self balancing properties
          and a really cool rebalancing algorithm (I'll probably write about most of these algorithms later).
          For the non technical, that just means that Smart Files are algorithmically faster than
          files for inner inserts / removes. In computer science, when you unlock a faster algorithm (going from
          O(n) to O(log n), you cement further speed improvements down the line in the future.
          I didn't really try to make it fast, I focused mostly on consistency. But speed is definitely going to
          be a priority in the near future. I know I can speed it up by a factor of 10-100x. I just haven't really started
          because I want the database to be correct and bug free first.
        </li>
        <li class="pl-4">
          <span class="text-text font-semibold">Stride access.</span>
          Read, write, and remove at regular "strided" intervals without manual offset arithmetic. I think
          another common drawback of files is that I can't down sample data. This operation is really useful when you're
          storing numerical data. Think about how numpy arrays can access every 2nd element of an array. If you're
          storing numerical data like floats in a file, you can access file[0:2:10] really easily in Smart Files.
        </li>
        <li class="pl-4">
          <span class="text-text font-semibold">Multiple named arrays.</span>
          Store more than one named byte stream per file. This was a neat feature I developed but put into my "power user api". I'm not sure if it will be useful or not.
          Essentially there's just one upfront hash table to all the data sets in the file.
        </li>
      </ol>

      <p class="mt-6 mb-3 font-mono text-xs tracking-widest uppercase text-muted">
        How can Smart Files be applied today in industry?
      </p>
      <ol class="space-y-3 text-lg text-text/70 leading-relaxed list-decimal list-inside marker:text-muted marker:font-mono marker:text-sm">
        <li class="pl-4">
          <span class="text-text font-semibold">Genomics and bioinformatics.</span>
          DNA sequence data is a massive byte stream that gets constantly edited - insertions, deletions, and substitutions at arbitrary positions. Today the industry uses FASTA/FASTQ flat files, BAM/CRAM formats, and tools like samtools to manage this. None of them are atomic or transactional so a crashed pipeline can silently corrupt an index with no way to recover. Smart Files are transactional and reliable.
        </li>
        <li class="pl-4">
          <span class="text-text font-semibold">Seismic and geophysical data.</span>
          Seismic surveys produce enormous interleaved arrays of sensor readings - one channel per sensor, generally sampled at a high frequency. The industry standard is SEG-Y, a flat binary format from 1975 that has no mutation primitives and no transactional guarantees. Reading a single channel means loading the whole file.
        </li>
        <li class="pl-4">
          <span class="text-text font-semibold">Audio and video editing.</span>
          Non-linear editors like DaVinci Resolve and Avid internally maintain edit decision lists and proxy formats to avoid rewriting raw media on every cut. This is an enormous amount of infrastructure to work around the fact that files don't support inner mutations.
        </li>
        <li class="pl-4">
          <span class="text-text font-semibold">Collaborative document editing.</span>
          Google Docs, Notion, and VS Code all implement operational transforms or CRDTs in memory to handle concurrent edits, then periodically flush diffs to a database. Other editors use ropes or gap buffers in memory to make inner mutations easy. The file on disk is always a snapshot, never the live structure. A text document is a byte stream - Smart Files make it a transactional, crash-safe one where every keystroke is an atomic inner mutation.
        </li>
        <li class="pl-4">
          <span class="text-text font-semibold">Scientific computing and simulation.</span>
          Climate models, fluid simulations, and particle physics experiments produce multi-dimensional arrays that are read in strides - every nth timestep, every other spatial slice. HDF5 and NetCDF are the current standard but neither is a database. A crashed simulation write can corrupt the output file with no recovery path.
        </li>
        <li class="pl-4">
          <span class="text-text font-semibold">Financial market data.</span>
          High-frequency trading systems record tick data as a continuous timestamped byte stream, then query it in strides - every nth tick, every other instrument. The industry uses custom binary formats and kdb+/q for this, both of which require significant infrastructure.
        </li>
        <li class="pl-4">
          <span class="text-text font-semibold">AI training pipelines.</span>
          Feature stores, embedding tables, and weight checkpoints are strided, byte-shaped, and enormous. The current stack is a patchwork - PyTorch uses custom checkpoint serialization, feature stores use Parquet or Redis, embeddings live in specialized vector databases. None of it is atomic at the file level.
        </li>
        <li class="pl-4">
          <span class="text-text font-semibold">Medical imaging.</span>
          DICOM is the standard format for MRI, CT, and ultrasound data - a decades-old format that stores multi-dimensional image arrays with no transactional semantics. A failed mid-write during acquisition or transfer can corrupt a scan.
        </li>
      </ol>


    </header>

    <!-- For the lazy ---------------------------------------------------------->
    <section class="mb-10">
      <h2 class="text-xl font-bold text-text mt-10 mb-1">Example</h2>
      <p class="text-muted font-mono text-xs tracking-widest uppercase mb-5">
        Here's a quick preview of what smart files do
      </p>
      <p class="text-text/75 leading-relaxed mb-4">
        For comprehensive samples - see samples in the <a class="underline" href="https://github.com/lincketheo/Smart-Files/tree/main/samples/smfile">github repository</a>
      </p>
      <p class="text-text/75 leading-relaxed mb-4">
        Insert in the middle:
      </p>
      <pre
          class="bg-surface border-l-4 border-red/40 px-5 py-4 overflow-x-auto rounded-r my-5"
      ><code class="font-mono text-sm text-text/85 leading-relaxed">// Open a smart file by pointing it to the disk ("myfile")
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
          Inner mutations are first class operations. I've written a novel algorithm that uses
          Ropes to track file locations on disk. The index is a self balanced Rope with data nodes and
          inner nodes storing more than 1 node each - the same concept as a B+Tree, but with byte count
          instead of indexes. Inserting and removing chunks of data in the middle of a file are native, O(log n) operations.
        </li>
        <li>
          Operations are atomic - modern file systems notoriously can partially
          write data. Smart Files are fully atomic, backed by a write-ahead log. I use ARIES (Algorithm for
          Recovery and Isolation Exploitation Semantics) to ensure that even if a transaction is rolling back
          or committing or recovering, the database is consistent.
        </li>
        <li>
          Strided reads, writes, and removes - touch every nth element in a
          stream without reading the whole thing. Remove every 2nd byte from a
          stream of n bytes in a single call. This is useful if you're storing structured
          array data like a float array and you want to down sample for instance.
        </li>
        <li>
          Multiple labeled datasets per file - store n independent named
          variables inside a single file. This project originally was a fully fledged database,
          where it could store any number of "variables", but I pivoted to smart files. The
          hash map of file -> data set remains though.
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