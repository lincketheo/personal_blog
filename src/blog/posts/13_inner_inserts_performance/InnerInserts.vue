<script setup lang="ts">
import Code from "@/components/Code.vue";
import Definition from "@/components/Definition.vue";
</script>

<template>
  <article class="max-w-4xl mx-auto px-6 py-12 font-serif">

    <!-- Header -->
    <header class="mb-10">
      <h1 class="text-4xl font-bold text-text leading-tight mb-4">
        SmartFiles Performance: Inner Inserts
      </h1>

      <p class="text-lg text-text/70 leading-relaxed">
        I'll be starting a performance series on Numstore (specifically the SmartFiles
        pattern) and why SmartFiles - although not written to optimize for performance
        - far surpasses regular vanilla reads and writes in some contexts for file I/O.
      </p>

      <p class="text-lg text-text/70 leading-relaxed mt-4">
        For this series, I want to stay truthful and humble about what Numstore can
        and can't do. To stay truthful, I'm breaking down performance into small,
        self-contained use cases. I'll explore each use case fully and deeply, and
        talk about where Numstore shines and where it shouldn't be used. I'll never
        intentionally hide a domain of performance in order to conceal the limitations
        of Numstore.
      </p>

      <p class="text-lg text-text/70 leading-relaxed mt-4">
        I did all these performance analyses on an 8-core Intel i9 Dell Inspiron 2019
        laptop. I slowed down my system by turning off any daemons and heavy running
        processes. I ran all tests 3 times overnight, wrapped by Python subprocess.
      </p>

      <div class="mt-6 space-y-4">
        <Definition term="SmartFiles">
          SmartFiles is Numstore's file abstraction that makes inner inserts and removals
          first-class operations - something the OS does not natively support - while
          providing ACID guarantees and write-ahead logging under the hood.
        </Definition>
        <Definition term="Inner Insert">
          An inner insert shifts existing bytes to the right and places new data at a
          given offset, growing the file. This is distinct from an inner write, which
          overwrites bytes in place without changing the file's length.
        </Definition>
        <Definition term="FALLOC_FL_INSERT_RANGE">
          A Linux <code class="font-mono text-sm">fallocate(2)</code> flag that instructs
          the kernel to insert a hole at a given offset, shifting subsequent data right.
          Requires XFS (Linux 4.1+) or ext4 (Linux 4.2+), and mandates that both the
          offset and insertion length be multiples of the filesystem block size.
        </Definition>
      </div>
    </header>

    <!-- Abstract -->
    <section class="mb-10">
      <h2 class="text-xl font-bold text-text mt-10 mb-4">Abstract</h2>

      There were three main take aways from this performance analysis of Numstore:

      <ol class="space-y-4 text-text/70 leading-relaxed list-decimal list-inside marker:text-muted marker:font-mono marker:text-sm">
        <li class="pl-3">
          Generally, with naive file I/O, the longer your file, the longer it will
          take to insert data into the middle of that file. This is not the case with
          SmartFiles. Inserting a fixed-size insert buffer of length <em>n</em> into the middle
          of a 100-byte file is comparable to inserting the same fixed-size insert buffer into a
          20 GiB file - where regular file I/O would have exploded. Therefore, for
          workloads characterized by high data volume and frequent interior inserts,
          SmartFiles offers a substantial advantage.
        </li>
        <li class="pl-3">
          Generally, as the length of the fixed-size insert buffer increases (as in case 1),
          SmartFiles doesn't offer any performance benefit over raw file I/O, and is
          around 3× slower due to durability overhead and logging. Workloads that
          predominantly write large, contiguous payloads to interior offsets should
          not expect a performance gain from SmartFiles.
        </li>
        <li class="pl-3">
          SmartFiles is functionally comparable to <Code>fallocate(2)</Code> with
          <Code>FALLOC_FL_INSERT_RANGE</Code>, but with fewer constraints. Benchmarks
          show SmartFiles to be more consistently performant at higher file sizes.
          <Code>FALLOC_FL_INSERT_RANGE</Code> imposes significant restrictions in
          practice: it requires an ext4 filesystem and mandates that both the insertion
          length and offset be integer multiples of the filesystem block size. SmartFiles
          carries no such constraints, making it more portable and easier to reason about
          in general-purpose contexts.
        </li>
      </ol>

        <div class="my-6">
          <img
            src="@/assets/perf/p6_bar_time_vs_file_size_log.png"
            alt="A plot of time vs insertion size"
            class="w-full border border-text/10 bg-text/[0.03] rounded"
            style="min-height: 240px; object-fit: cover;"
            @error="(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling!.style.display = 'flex'; }"
          />
          <div
            class="w-full border border-text/10 bg-text/[0.03] rounded items-center justify-center"
            style="min-height: 240px; display: none;"
          >
            <span class="font-mono text-xs text-text/30 tracking-widest uppercase">p2_time_vs_insert_size_linear.png</span>
          </div>
          <p class="mt-2 text-text/50 text-sm leading-relaxed">
            <span class="font-mono text-xs tracking-widest uppercase text-text/30 mr-2">Figure 0</span>
            Time vs. file size with a fixed offset and file size (both relatively small).
            As file size increases, SmartFiles takes relatively the same amount of time to 
            insert data into the interior of the file (logarithmically scaling to the file size).
          </p>
        </div>

    </section>

    <!-- Inner Inserts -->
    <section class="mb-10">
      <h2 class="text-xl font-bold text-text mt-10 mb-4">Inner Inserts</h2>

      <p class="text-text/75 leading-relaxed mb-4">
        For this first performance analysis, I'll talk about inner mutations -
        specifically inserting data into the middle of a file. Later I'll talk about
        inner removals, which completes the "inner mutation" operations analysis.
      </p>

      <!-- Definition -->
      <section>
        <h3 class="text-base font-bold text-text mt-8 mb-2">Definition: Inner Insert</h3>
        <p class="text-text/75 leading-relaxed mb-4">
          Say I have a file where each byte is just its location on disk. Byte 0 has
          value 0, byte 1 has value 1:
        </p>

        <pre class="font-mono text-sm text-text/80 bg-text/[0.03] border border-text/10 rounded px-4 py-3 mb-4 overflow-x-auto">[ 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 ]</pre>

        <p class="text-text/75 leading-relaxed mb-4">
          Normal files provide first-class support for <em>inner writes</em>. So let's
          say I want to write from index 1 to 3 with new data
          <Code>[ 9 | 10 | 11 ]</Code>. After a traditional "write" system call, that
          would look like this:
        </p>

        <pre class="font-mono text-sm text-text/80 bg-text/[0.03] border border-text/10 rounded px-4 py-3 mb-4 overflow-x-auto">[ 0 | 9 | 10 | 11 | 4 | 5 | 6 | 7 | 8 ]</pre>

        <p class="text-text/75 leading-relaxed mb-4">
          Notice how 1, 2, and 3 were overwritten by 9, 10, and 11. This is what I'll
          call an "inner write."
        </p>

        <p class="text-text/75 leading-relaxed mb-4">
          What if I want to insert data at index 1? This is actually a really common
          use case. So now I want to insert the same data
          (<Code>[ 9 | 10 | 11 ]</Code>) into position 1 of the file like this:
        </p>

        <pre class="font-mono text-sm text-text/80 bg-text/[0.03] border border-text/10 rounded px-4 py-3 mb-4 overflow-x-auto">[ 0 | 9 | 10 | 11 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 ]</pre>

        <p class="text-text/75 leading-relaxed mb-4">
          This is what I will call an "inner insert" (as opposed to an "inner write").
        </p>
      </section>

      <!-- Problem Space -->
      <section>
        <h3 class="text-base font-bold text-text mt-8 mb-2">The Problem Space</h3>
        <p class="text-text/75 leading-relaxed mb-4">
          For the sake of measuring performance, an inner insert has the following
          parameters:
        </p>
        <ul class="space-y-1 text-text/70 font-mono text-sm leading-relaxed list-none mb-4">
          <li><span class="text-text">fsize</span>  - Original File Size. The size of the file before we make an insert.</li>
          <li><span class="text-text">isize</span>  - Desired Data Insert Length. The size of the data we want to insert into the file.</li>
          <li><span class="text-text">offst</span>  - Desired Data Offset. The location in the original file we want to insert the data into.</li>
        </ul>
        <p class="text-text/75 leading-relaxed mb-2">One more term to help frame the problem:</p>
        <ul class="space-y-1 text-text/70 font-mono text-sm leading-relaxed list-none mb-4">
          <li><span class="text-text">tail</span>   - The remainder of the file from <Code>file[offst ... fsize]</Code>.</li>
        </ul>
      </section>

      <!-- Naive -->
      <section>
        <h3 class="text-base font-bold text-text mt-8 mb-2">Solving it Naively</h3>
        <p class="text-text/75 leading-relaxed mb-4">
          Let's try to solve this without SmartFiles. In general, the pattern looks like
          this:
        </p>
        <ol class="space-y-2 text-text/70 leading-relaxed list-decimal list-inside marker:text-muted marker:font-mono marker:text-sm mb-4">
          <li class="pl-3">Read the "tail" of the file into memory, effectively splitting the file into two segments - before and after our offset.</li>
          <li class="pl-3">Write our data to the end of this truncated file.</li>
          <li class="pl-3">Write the tail back to the end of the file.</li>
        </ol>
        <p class="text-text/75 leading-relaxed mb-2">Visualized:</p>

        <pre class="font-mono text-sm text-text/80 bg-text/[0.03] border border-text/10 rounded px-4 py-3 mb-4 overflow-x-auto">file = [ 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 ]

1. Read in the tail:
     file = [ 0 ]
     tail = [ 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 ]

2. Write our data to the end of the truncated file:
     file = [ 0 | 9 | 10 | 11 ]
     tail = [ 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 ]

3. Write the tail back to the end of the file:
     file = [ 0 | 9 | 10 | 11 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 ]</pre>

        <p class="text-text/75 leading-relaxed mb-2">Unbuffered implementation:</p>
        <pre class="font-mono text-sm text-text/80 bg-text/[0.03] border border-text/10 rounded px-4 py-3 mb-4 overflow-x-auto">{
    pread (fd, tail, tail_size, ofst);
    pwrite (fd, tail, tail_size, ofst + insize);
    pwrite (fd, insert, insize, ofst);
    i_fsync (fd);
}</pre>

        <p class="text-text/75 leading-relaxed mb-4">
          Note that this method has unbounded memory overhead. The file can be any size,
          and no matter what, we need to "touch" all the data within the tail of the
          file in some way or another. To address this, let's try buffering.
        </p>

        <p class="text-text/75 leading-relaxed mb-4">
          Buffering is what <Code>FILE* fp = fopen(...)</Code> gives you over plain POSIX
          <Code>int fd = open(...)</Code>. Buffering limits memory overhead by maintaining
          a fixed-size buffer in memory. With a buffer of 4096 bytes, we never need to
          hold more than 4096 bytes in memory at once. However, we still "touch" all the
          bytes to the right of our insertion point. As the file grows without bound, we
          always need to touch the right half of our file in some way, unless we have an
          OS-level primitive for it. That's not ideal.
        </p>

        <p class="text-text/75 leading-relaxed mb-2">Buffered implementation:</p>
        <pre class="font-mono text-sm text-text/80 bg-text/[0.03] border border-text/10 rounded px-4 py-3 mb-4 overflow-x-auto">{
  {
    u64 remaining = fsize - ofst;
    u64 read_pos  = fsize;

    // Read in chunks
    while (remaining > 0)
    {
      const u64 chunk = remaining &lt; CHUNK_SIZE ? remaining : CHUNK_SIZE;
      read_pos -= chunk;

      i_pread_all_expect (&amp;fp, buffer, chunk, read_pos, &amp;e);
      i_pwrite_all (&amp;fp, buffer, chunk, read_pos + insize, &amp;e);

      remaining -= chunk;
    }
  }
  i_pwrite_all (&amp;fp, insert, insize, ofst, &amp;e);
  i_fsync (&amp;fp, &amp;e);
}</pre>
      </section>

      <!-- Fallocate -->
      <section>
        <h3 class="text-base font-bold text-text mt-8 mb-2">FALLOC_FL_INSERT_RANGE: Solving it Better on Linux</h3>
        <p class="text-text/75 leading-relaxed mb-4">
          If you're running Linux 4.1 or later with XFS, or Linux 4.2 or later with
          ext4, you can call <Code>fallocate(2)</Code> with
          <Code>FALLOC_FL_INSERT_RANGE</Code>. This is fairly restricted, though.
        </p>
        <p class="text-text/75 leading-relaxed mb-2">
          From the <a href="https://man7.org/linux/man-pages/man2/fallocate.2.html" class="underline hover:text-text" target="_blank" rel="noopener">man page</a>:
        </p>
        <blockquote class="border-l-2 border-text/20 pl-4 my-4 text-text/60 font-mono text-sm leading-relaxed">
          FALLOC_FL_INSERT_RANGE requires filesystem support. Filesystems that support
          this operation include XFS (since Linux 4.1) and ext4 (since Linux 4.2).
        </blockquote>
        <p class="text-text/75 leading-relaxed mb-4">
          On the system I tested (ext4), both the insertion length and offset must be
          a multiple of the filesystem block size. That's a significant constraint for
          a reusable program.
        </p>
        <p class="text-text/75 leading-relaxed mb-4">
          Note: <Code>FALLOC_FL_COLLAPSE_RANGE</Code> is the fallocate equivalent to
          Numstore's inner remove operation.
        </p>
      </section>
    </section>

    <!-- Performance -->
    <section class="mb-10">
      <h2 class="text-xl font-bold text-text mt-10 mb-4">Performance</h2>

      <!-- Preamble -->
      <section>
        <h3 class="text-base font-bold text-text mt-8 mb-2">Preamble: Why Numstore Is More Than Just Fast</h3>
        <p class="text-text/75 leading-relaxed mb-4">
          Before talking about performance, I want to note that raw speed isn't the
          whole picture - but Numstore still dwarfs a normal system-call-based inner
          insert in certain use cases.
        </p>
        <p class="text-text/75 leading-relaxed mb-2">The statement:</p>
        <blockquote class="border-l-2 border-text/20 pl-4 my-4 text-text/60 italic leading-relaxed">
          Numstore is a lot faster at inner mutations
        </blockquote>
        <p class="text-text/75 leading-relaxed mb-2">...fails to capture several things Numstore does on top of being fast. It's more like:</p>
        <blockquote class="border-l-2 border-text/20 pl-4 my-4 text-text/60 italic leading-relaxed space-y-2">
          <p>Numstore is a lot faster at inner mutations</p>
          <p>AND</p>
          <ol class="list-decimal list-inside space-y-2 not-italic text-text/60 font-mono text-sm">
            <li class="pl-2">
              Numstore is ACID - unlike plain files.
              <ul class="list-disc list-inside pl-4 mt-1 space-y-1">
                <li>You can never write 10 bytes if you requested to write 100 bytes.</li>
                <li>If you pull the plug while writing data, Numstore reboots and returns to a consistent state.</li>
              </ul>
            </li>
            <li class="pl-2">
              Numstore has no extra memory overhead.
              <ul class="list-disc list-inside pl-4 mt-1 space-y-1">
                <li>You never need to care about the tail of your file when doing an inner insert.</li>
              </ul>
            </li>
            <li class="pl-2">
              Numstore uses less code. Compare the naive implementations above to Numstore:
              <Code>smfile_insert (file, insert, ofst, insize);</Code>
              <ul class="list-disc list-inside pl-4 mt-1 space-y-1">
                <li>Inner inserts are first-class citizens in Numstore.</li>
              </ul>
            </li>
          </ol>
        </blockquote>
        <p class="text-text/75 leading-relaxed mb-4">
          Points 1–3 are really significant and I don't want to gloss over them, but
          this post is about performance, so let's talk speed.
        </p>
      </section>

      <!-- Data Capturing -->
      <section>
        <h3 class="text-base font-bold text-text mt-8 mb-2">Data Capturing</h3>
        <p class="text-text/75 leading-relaxed mb-4">
          For the following methods of interior insertion:
        </p>
        <ol class="space-y-1 text-text/70 leading-relaxed list-decimal list-inside marker:text-muted marker:font-mono marker:text-sm mb-4">
          <li class="pl-3">Unbuffered naive file I/O</li>
          <li class="pl-3">Buffered naive file I/O</li>
          <li class="pl-3"><Code>fallocate</Code> with <Code>FALLOC_FL_INSERT_RANGE</Code></li>
          <li class="pl-3">SmartFiles</li>
        </ol>
        <p class="text-text/75 leading-relaxed mb-2 font-semibold text-text">Parameters:</p>
        <ul class="space-y-1 text-text/70 font-mono text-sm leading-relaxed list-none mb-4">
          <li><span class="text-text">File Size (KiB)</span>   - Size of the original file before the insert.</li>
          <li><span class="text-text">Offset (KiB)</span>      - Where in the file we want to insert data.</li>
          <li><span class="text-text">Insert Size (KiB)</span> - Size of the buffer we want to insert.</li>
          <li><span class="text-text">Chunk Size (KiB)</span>  - For buffered I/O only; kept constant at system page size throughout these results.</li>
        </ul>
        <p class="text-text/75 leading-relaxed mb-2 font-semibold text-text">Results:</p>
        <ul class="space-y-1 text-text/70 font-mono text-sm leading-relaxed list-none mb-4">
          <li><span class="text-text">Time (ms)</span> - Wall-clock time to execute the operation.</li>
        </ul>
      </section>

      <!-- Round 1 -->
      <section>
        <h3 class="text-base font-bold text-text mt-8 mb-2">Round 1: Small File, Large Insert</h3>
        <p class="text-text/75 leading-relaxed mb-4">The first round keeps numbers fairly small:</p>

        <div class="my-4 border border-text/10 rounded overflow-hidden">
          <table class="w-full text-sm font-mono">
            <thead>
              <tr class="border-b border-text/10 bg-text/[0.03]">
                <th class="text-left px-4 py-2 text-muted font-normal tracking-widest uppercase text-xs">Parameter</th>
                <th class="text-left px-4 py-2 text-muted font-normal tracking-widest uppercase text-xs">Value</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-text/5">
              <tr><td class="px-4 py-2 text-text/60">File Size</td><td class="px-4 py-2 text-text">100 KiB</td></tr>
              <tr><td class="px-4 py-2 text-text/60">Offset</td><td class="px-4 py-2 text-text">4 KiB</td></tr>
              <tr><td class="px-4 py-2 text-text/60">Insert Size</td><td class="px-4 py-2 text-text">9768 KiB</td></tr>
            </tbody>
          </table>
          <table class="w-full text-sm font-mono border-t border-text/10">
            <thead>
              <tr class="border-b border-text/10 bg-text/[0.03]">
                <th class="text-left px-4 py-2 text-muted font-normal tracking-widest uppercase text-xs">Method</th>
                <th class="text-left px-4 py-2 text-muted font-normal tracking-widest uppercase text-xs">Time (ms)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-text/5">
              <tr><td class="px-4 py-2 text-text/60">Unbuffered</td><td class="px-4 py-2 text-text">34.102</td></tr>
              <tr><td class="px-4 py-2 text-text/60">Buffered</td><td class="px-4 py-2 text-text">21.034</td></tr>
              <tr><td class="px-4 py-2 text-text/60">Fallocate</td><td class="px-4 py-2 text-text">20.587</td></tr>
              <tr><td class="px-4 py-2 text-text/60">SmartFiles</td><td class="px-4 py-2 text-text">114.990</td></tr>
            </tbody>
          </table>
        </div>

        <p class="text-text/75 leading-relaxed mb-4">
          This result isn't very meaningful on its own. SmartFiles performs far worse
          than the other methods here. The file is relatively small (100 KiB) and the
          insertion size is very large (9768 KiB), so <em>the bottleneck is writing the
          insertion data</em>, not rebalancing the persisted data.
        </p>
        <p class="text-text/75 leading-relaxed mb-4">
          SmartFiles doesn't offer much for small files with large inserts, because it
          contains a lot of interior machinery for fault tolerance. Analytically, it
          writes 3× as much data - both an undo and a redo for the write-ahead log,
          plus the flushed page to disk on the eviction path.
        </p>

        <div class="my-6">
          <img
            src="@/assets/perf/p2_time_vs_insert_size_linear.png"
            alt="A plot of time vs insertion size"
            class="w-full border border-text/10 bg-text/[0.03] rounded"
            style="min-height: 240px; object-fit: cover;"
            @error="(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling!.style.display = 'flex'; }"
          />
          <div
            class="w-full border border-text/10 bg-text/[0.03] rounded items-center justify-center"
            style="min-height: 240px; display: none;"
          >
            <span class="font-mono text-xs text-text/30 tracking-widest uppercase">p2_time_vs_insert_size_linear.png</span>
          </div>
          <p class="mt-2 text-text/50 text-sm leading-relaxed">
            <span class="font-mono text-xs tracking-widest uppercase text-text/30 mr-2">Figure 1</span>
            Time vs. insertion size with a fixed offset and file size (both relatively small).
            As insertion size increases, SmartFiles balloons at a higher rate than naive file I/O -
            because SmartFiles has substantial interior machinery for writing a contiguous array
            of bytes, whereas a plain write is a single system call.
          </p>
        </div>

        <div class="my-6 border border-text/10 rounded bg-text/[0.03] px-5 py-4">
          <p class="font-mono text-xs tracking-widest uppercase text-muted mb-2">Take Away</p>
          <p class="text-text/75 leading-relaxed">
            Short writes into a small database aren't the workload SmartFiles is designed
            for. If your workload is 100-byte files with 10-byte inner insertions, don't
            use Numstore. Simple as that.
          </p>
        </div>
      </section>

      <!-- Round 2 -->
      <section>
        <h3 class="text-base font-bold text-text mt-8 mb-2">Round 2: Large File, Small Insert</h3>
        <p class="text-text/75 leading-relaxed mb-4">
          Now let's crank in the other direction - instead of increasing the insertion
          size, we increase the file size:
        </p>

        <div class="my-4 border border-text/10 rounded overflow-hidden">
          <table class="w-full text-sm font-mono">
            <thead>
              <tr class="border-b border-text/10 bg-text/[0.03]">
                <th class="text-left px-4 py-2 text-muted font-normal tracking-widest uppercase text-xs">Parameter</th>
                <th class="text-left px-4 py-2 text-muted font-normal tracking-widest uppercase text-xs">Value</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-text/5">
              <tr><td class="px-4 py-2 text-text/60">File Size</td><td class="px-4 py-2 text-text">16 GiB</td></tr>
              <tr><td class="px-4 py-2 text-text/60">Offset</td><td class="px-4 py-2 text-text">4 KiB</td></tr>
              <tr><td class="px-4 py-2 text-text/60">Insert Size</td><td class="px-4 py-2 text-text">4 KiB</td></tr>
            </tbody>
          </table>
          <table class="w-full text-sm font-mono border-t border-text/10">
            <thead>
              <tr class="border-b border-text/10 bg-text/[0.03]">
                <th class="text-left px-4 py-2 text-muted font-normal tracking-widest uppercase text-xs">Method</th>
                <th class="text-left px-4 py-2 text-muted font-normal tracking-widest uppercase text-xs">Time (ms)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-text/5">
              <tr><td class="px-4 py-2 text-text/60">Buffered</td><td class="px-4 py-2 text-text">293,000.00</td></tr>
              <tr><td class="px-4 py-2 text-text/60">Fallocate</td><td class="px-4 py-2 text-text">2,461.00</td></tr>
              <tr><td class="px-4 py-2 text-text/60">SmartFiles</td><td class="px-4 py-2 text-text">1.903</td></tr>
            </tbody>
          </table>
        </div>

        <p class="text-text/75 leading-relaxed mb-4">
          For an already-large dataset (16 GiB), inserting 4 KiB at offset 4 KiB is
          very low cost for SmartFiles. For naive file I/O, time balloons dramatically.
          Compared to fallocate, you might expect fallocate to be faster, but it tends
          to grow at larger file sizes as well. If anyone has ideas why that might be,
          I'm happy to adjust my code and regenerate the results.
        </p>
        <p class="text-text/75 leading-relaxed mb-4">
          In general, SmartFiles is very fast when inserting data into an already-large
          dataset.
        </p>

        <div class="my-6">
          <img
            src="@/assets/perf/p1_time_vs_file_size_linear.png"
            alt="A linear plot of file size vs time to insert"
            class="w-full border border-text/10 bg-text/[0.03] rounded"
            style="min-height: 240px; object-fit: cover;"
            @error="(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling!.style.display = 'flex'; }"
          />
          <div
            class="w-full border border-text/10 bg-text/[0.03] rounded items-center justify-center"
            style="min-height: 240px; display: none;"
          >
            <span class="font-mono text-xs text-text/30 tracking-widest uppercase">p1_time_vs_file_size_linear.png</span>
          </div>
          <p class="mt-2 text-text/50 text-sm leading-relaxed">
            <span class="font-mono text-xs tracking-widest uppercase text-text/30 mr-2">Figure 2</span>
            A linear plot of file size (x axis) vs. time to insert a fixed-size buffer at a fixed offset.
          </p>
        </div>

        <div class="my-6">
          <img
            src="@/assets/perf/p1_time_vs_file_size_log.png"
            alt="A logarithmic plot of file size vs time to insert"
            class="w-full border border-text/10 bg-text/[0.03] rounded"
            style="min-height: 240px; object-fit: cover;"
            @error="(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling!.style.display = 'flex'; }"
          />
          <div
            class="w-full border border-text/10 bg-text/[0.03] rounded items-center justify-center"
            style="min-height: 240px; display: none;"
          >
            <span class="font-mono text-xs text-text/30 tracking-widest uppercase">p1_time_vs_file_size_log.png</span>
          </div>
          <p class="mt-2 text-text/50 text-sm leading-relaxed">
            <span class="font-mono text-xs tracking-widest uppercase text-text/30 mr-2">Figure 3</span>
            A logarithmic plot of the same data. SmartFiles remains relatively constant as file
            size increases.
          </p>
        </div>

        <div class="my-6">
          <img
            src="@/assets/perf/p5_heatmap_file_x_insert_log.png"
            alt="A heat map of time vs file size vs insert size"
            class="w-full border border-text/10 bg-text/[0.03] rounded"
            style="min-height: 240px; object-fit: cover;"
            @error="(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling!.style.display = 'flex'; }"
          />
          <div
            class="w-full border border-text/10 bg-text/[0.03] rounded items-center justify-center"
            style="min-height: 240px; display: none;"
          >
            <span class="font-mono text-xs text-text/30 tracking-widest uppercase">p5_heatmap_file_x_insert_log.png</span>
          </div>
          <p class="mt-2 text-text/50 text-sm leading-relaxed">
            <span class="font-mono text-xs tracking-widest uppercase text-text/30 mr-2">Figure 4</span>
            A heat map where x and y represent file size and insertion size. Naive I/O grows as
            both x and y increase; SmartFiles only grows as y increases.
          </p>
        </div>

        <p class="text-text/75 leading-relaxed mb-4">
          As the y axis grows (larger insertion sizes), all three methods take longer -
          a longer insertion means a longer <Code>write</Code> system call, which is expected.
          The notable feature is that as the x axis grows (larger files), naive file I/O
          grows proportionally, but SmartFiles remains relatively stable.
        </p>

        <div class="my-6 border border-text/10 rounded bg-text/[0.03] px-5 py-4">
          <p class="font-mono text-xs tracking-widest uppercase text-muted mb-2">Take Away</p>
          <p class="text-text/75 leading-relaxed">
            For large databases (on the order of gigabytes), interior inserts do not scale
            in SmartFiles - they stay relatively level. This workload traditionally blows
            up naive file I/O, and appears to blow up fallocate as well.
          </p>
        </div>
      </section>
    </section>

    <!-- Flamegraphs -->
    <section class="mb-10">
      <h2 class="text-xl font-bold text-text mt-10 mb-4">Where Is All the Time Going?</h2>

      <p class="text-text/75 leading-relaxed mb-4">
        A flame graph is a useful tool for understanding which methods are consuming
        the most time within a routine. It doesn't give wall-clock measurements, but
        it breaks down the relative cost of each call.
      </p>

      <div class="my-6">
        <img
          src="@/assets/perf/buffered_flamegraph.png"
          alt="Flamegraph for the buffered file I/O implementation"
          class="w-full border border-text/10 bg-text/[0.03] rounded"
          style="min-height: 200px; object-fit: cover;"
          @error="(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling!.style.display = 'flex'; }"
        />
        <div
          class="w-full border border-text/10 bg-text/[0.03] rounded items-center justify-center"
          style="min-height: 200px; display: none;"
        >
          <span class="font-mono text-xs text-text/30 tracking-widest uppercase">buffered_flamegraph.png</span>
        </div>
        <p class="mt-2 text-text/50 text-sm leading-relaxed">
          <span class="font-mono text-xs tracking-widest uppercase text-text/30 mr-2">Figure 5</span>
          Flame graph for the buffered file I/O implementation - roughly equal time is spent
          between the <Code>fsync</Code>, <Code>pread</Code>, and <Code>pwrite</Code> calls.
        </p>
      </div>

      <div class="my-6">
        <img
          src="@/assets/perf/unbuffered_flamegraph.png"
          alt="Flamegraph for the unbuffered file I/O implementation"
          class="w-full border border-text/10 bg-text/[0.03] rounded"
          style="min-height: 200px; object-fit: cover;"
          @error="(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling!.style.display = 'flex'; }"
        />
        <div
          class="w-full border border-text/10 bg-text/[0.03] rounded items-center justify-center"
          style="min-height: 200px; display: none;"
        >
          <span class="font-mono text-xs text-text/30 tracking-widest uppercase">unbuffered_flamegraph.png</span>
        </div>
        <p class="mt-2 text-text/50 text-sm leading-relaxed">
          <span class="font-mono text-xs tracking-widest uppercase text-text/30 mr-2">Figure 6</span>
          Flame graph for the unbuffered file I/O implementation - the same story as Figure 5.
        </p>
      </div>

      <div class="my-6">
        <img
          src="@/assets/perf/smartfiles_flamegraph.png"
          alt="Flamegraph for the SmartFiles timed portion"
          class="w-full border border-text/10 bg-text/[0.03] rounded"
          style="min-height: 200px; object-fit: cover;"
          @error="(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling!.style.display = 'flex'; }"
        />
        <div
          class="w-full border border-text/10 bg-text/[0.03] rounded items-center justify-center"
          style="min-height: 200px; display: none;"
        >
          <span class="font-mono text-xs text-text/30 tracking-widest uppercase">smartfiles_flamegraph.png</span>
        </div>
        <p class="mt-2 text-text/50 text-sm leading-relaxed">
          <span class="font-mono text-xs tracking-widest uppercase text-text/30 mr-2">Figure 7</span>
          Flame graph for the SmartFiles timed portion. A large portion of time is spent inside
          <Code>pgr_new</Code> - we're constantly creating new pages and therefore reading the
          free-space map frequently (something I intend to optimize). Significant time is also
          spent in <Code>pgr_release_with_log</Code>, which writes data to the WAL and triggers
          a WAL flush.
        </p>
      </div>

      <p class="text-text/75 leading-relaxed mb-4">
        The buffered and unbuffered flame graphs make sense: we spend a lot of time
        reading and writing because we must read the tail of the dataset, then write our
        data plus that tail back. The <Code>fsync</Code> ensures data is durable on disk.
      </p>

      <p class="text-text/75 leading-relaxed mb-4">
        The SmartFiles flame graph has some interesting properties. Here are a few
        unintended bottlenecks I discovered and plan to fix:
      </p>

      <ol class="space-y-4 text-text/70 leading-relaxed list-decimal list-inside marker:text-muted marker:font-mono marker:text-sm mb-4">
        <li class="pl-3">
          A lot of time is spent calculating checksums in <Code>walos_write_all</Code>
          and <Code>pgr_flush_unsafe</Code>. When I tried a hardware-accelerated
          instruction, this time dropped noticeably. The next version of Numstore will
          optimize this path.
        </li>
        <li class="pl-3">
          A lot of time is spent reading the free-space map in <Code>pgr_get_writable</Code>.
          This is an artifact of the pager insert pattern. A basic LRU caching mechanism
          failed to trigger on long-running inserts. This is an inconsistency and will be
          fixed in the next release.
        </li>
      </ol>

      <p class="text-text/75 leading-relaxed mb-4">
        The main takeaway from the SmartFiles flame graph is that the dominant system
        call is writing to the WAL, not flushing pages to non-volatile storage.
        SmartFiles has a bottleneck tied to a single write call, rather than both a
        read and a write.
      </p>
    </section>

  </article>
</template>
