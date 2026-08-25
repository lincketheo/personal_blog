<template>
  <article class="max-w-2xl mx-auto px-6 py-12 font-serif">
    <header class="mb-10">
      <h1 class="text-4xl font-bold text-fg leading-tight mb-4">
        Building a Bootloader
      </h1>
    </header>

    <div class="prose prose-invert max-w-none">
      <h2>Introduction</h2>
      <p>
        I&#39;ll build a bootloader from scratch for an Intel x86 32-bit
        processor in this post. You should have some assembly experience before
        embarking on your bootloader journey.
      </p>
      <h3>Notes</h3>
      <ul>
        <li>
          <p>
            Throughout this tutorial, I&#39;ll point you in the right direction
            for the two intel manuals I&#39;ve been learning from ([^fn1] and
            [^fn2]) using the following syntax (section a.b.c [^fn1]). These are
            not comprehensive sections, but they are an excellent place to start
            looking. As always, the source of truth for this information is not
            some internet blog written by an amateur software engineer; it&#39;s
            the intel manuals. However, it is understandable not to want to read
            each one of their ~500-page manuals thoroughly. Start getting
            comfortable using them as a last resort if anything on the internet
            needs to be fully spelled out (I promise my tutorial will have
            flaws).
          </p>
        </li>
        <li>
          <p>
            When I say &quot;Byte 0, 1, 2...&quot; I am assuming bytes start at
            zero. So &quot;Byte 0&quot; is equivalent to &quot;The first byte
            .&quot;Another example, &quot;Byte 511,&quot; is the 512th byte.
          </p>
        </li>
      </ul>
      <h3>What are the responsibilities of the bootloader?</h3>
      <p>
        All the bootloader does is begin executing after being loaded by BIOS,
        so you can do whatever you want in a bootloader. Technically,
        there&#39;s no such thing as a defined set of tasks that a bootloader
        must complete. So once BIOS has handed control off to the bootloader,
        you have free reign to do whatever you want as an OS developer. However,
        conceptually, the bootloader traditionally does three main things:
      </p>
      <ol>
        <li>
          <p>
            It loads whatever code runs <em>after</em> the bootloader (usually
            the operating system kernel) into memory. We&#39;ll do this by
            loading the first Sector of our booting disk into memory (because
            our kernel is so tiny in this tutorial) using the
            <em>real mode</em> interrupt
            <a
              href="https://en.wikipedia.org/wiki/INT_13H#INT_13h_AH=02h:_Read_Sectors_From_Drive"
              >0x13, ah=0x02</a
            >.
          </p>
        </li>
        <li>
          <p>
            General system initialization (initializing the GDT (section
            3.4.5[^fn2]), stack, segmentation (section 3.3[^fn2]), etc.) that
            you don&#39;t want to do in the kernel. This tutorial initializes
            the GDT by defining a global <strong>code</strong> and
            <strong>data</strong> section. We&#39;ll also set up the stack and
            assume the flat memory model without paging (section 3.2.2[^fn2]).
            It&#39;s my goal to implement paging soon, and I&#39;ll update this
            tutorial once I&#39;ve set up paging.
          </p>
        </li>
        <li>
          <p>
            Switching from
            <a href="https://en.wikipedia.org/wiki/Real_mode"
              >16 bit real mode</a
            >
            to
            <a href="https://en.wikipedia.org/wiki/Protected_mode"
              >32 bit protected mode</a
            >
            (section 9.9.1[^fn2]). This step is powerful because it disables all
            bios interrupts and lets us use all 32 bits and segmentation set up
            from our GDT. Without protected mode, we can only access 16 bits of
            address space, or <code>64 KiB</code> (pretty bad).
          </p>
        </li>
        <li>
          <p>
            Jumping to the location of the desired code (usually the kernel). In
            this tutorial, we&#39;ll write a <em>very</em> simple kernel and
            store it directly after the bootloader in both memory and disk.
          </p>
        </li>
      </ol>
      <h2>Writing Our Bootloader</h2>
      <h3>Step 0: Getting BIOS to Recognize our Bootloader</h3>
      <p>
        Our storage device (flash drive, floppy disk, etc.) stores the
        bootloader on Sector 1 (512 bytes). BIOS recognizes bootloaders by the
        magic bytes <code>0xaa55</code> in bytes 510 and 511. Let&#39;s write an
        assembly program with <code>0xaa55</code> in bytes 510 and 511.
      </p>
      <p>First, let&#39;s define the word <code>0xaa55</code>:</p>
      <pre><code>dw 0xaa55
      </code></pre>
      <p>
        We need to place this word on byte 510. We can do that by writing 510
        bytes, then executing our command:
      </p>
      <pre><code>times 510 db 0
      dw 0xaa55
      </code></pre>
      <p>
        But now what happens? When we boot, there&#39;s no actual code to run!
        So let&#39;s add an infinite loop. In assembly, an infinite loop looks
        like this:
      </p>
      <pre><code>lbl:
        jmp lbl
      </code></pre>
      <p>Which can be shortened to:</p>
      <pre><code>jmp $
      </code></pre>
      <p>(i.e., jump to my current memory address). All together:</p>
      <pre><code>jmp $
      times 510 db 0
      dw 0xaa55
      </code></pre>
      <p>
        Now wait a second; we&#39;ve just written an instruction, followed by
        writing 510 bytes. In Von Neumann&#39;s Architecture, data and code are
        technically the same thing. So our instructions take up space in our
        program. The above code looks like this in memory
        <code>feeb000000...aa55</code> (where there are 1020 0&#39;s after
        <code>feeb</code>. That makes 514 bytes! (510 bytes of 0&#39;s + 2 bytes
        of <code>feeb</code> + 2 bytes of <code>aa55</code> = 514) See for
        yourself: compile this program:
      </p>
      <pre><code class="language-bash">$ nasm boot.asm
      $ stat boot
        File: boot
        Size: 514       	Blocks: 8          IO Block: 4096   regular file
      ...
      </code></pre>
      <p>
        To fix this, we&#39;ll write <code>510 - number of written bytes</code>:
      </p>
      <pre><code>jmp $
      times 510 ($-$$) db 0
      dw 0xaa55
      </code></pre>
      <p>Compile this file using nasm:</p>
      <pre><code class="language-bash">$ nasm boot.asm
      </code></pre>
      <p>And run it using qemu:</p>
      <pre><code class="language-bash">$ qemu-system-i386 boot
      </code></pre>
      <p>
        Nothing should happen, but importantly, you won&#39;t crash Qemu. Try
        changing <code>510</code> to <code>511</code> and see what happens.
      </p>
      <p>
        One last thing. To do anything meaningful, we need to reference the
        address starting at 0x7c00 because that&#39;s where BIOS loads our
        program into memory. To do this, you can add the following to your
        bootloader:
      </p>
      <pre><code>[org 0x7c00]
      jmp $
      times 510 ($-$$) db 0
      dw 0xaa55
      </code></pre>
      <h3>Step 1: Loading our &quot;Kernel&quot; Code from Disk</h3>
      <p>
        Remember that only 512 bytes of our bootloader are loaded. Let&#39;s
        write a simple &quot;kernel&quot; after our program that prints the
        character &#39;Q&#39; in real mode and jumps to 0x7e00 (0x7c00 + 512
        bytes) - i.e., the code after our bootloader:
      </p>
      <pre><code>jmp 0x7e00
      times 510 - ($-$$) db 0
      dw 0xaa55

      mov al, &#39;Q&#39;
      call printCharacter
      jmp $

      printCharacter:
          mov ah, 0x0e ; (teletype output)
          int 0x10
          ret
      </code></pre>
      <p>
        If we compile and run this, nothing happens. That&#39;s because all the
        code after <code>dw 0xaa55</code> is on disk, not in memory. We need to
        load our disk into memory using int 0x13 to fix this. We want to read
        cylinder (ch) 0, head (DH) 0, and Sector (cl) 2.
        <em>Sector starts at 1</em>, and our bootloader was on sector 1, so our
        &quot;kernel&quot; is on sector 2:
      </p>
      <pre><code>mov cl, 2
      mov dh, 0
      mov ch, 0
      </code></pre>
      <p>
        To simplify things, we can load 0 into es (the base of our segment) and
        0x7e00 into bx:
      </p>
      <pre><code>mov ax, 0
      mov es, ax
      mov bx, 0x7e00
      </code></pre>
      <p>We&#39;ll set <code>ah</code> to 2 to indicate a read of the disk:</p>
      <pre><code>mov ah, 0x02
      </code></pre>
      <p>And indicate that we want to read one drive (al):</p>
      <pre><code>mov al, 1
      </code></pre>
      <p>
        (Note: be careful about loading ah and al; they&#39;re part of the same
        16-bit register ax).
      </p>
      <p>
        Lastly, we need to know the drive number. I always imagine that the
        Bootloader had to call int 0x13 at least once to load our bootloader, so
        it already did the work of loading the drive number into dl. We
        don&#39;t actually have a deterministic way of finding out dl. So
        instead, I like to store dl in memory immediately at the start of
        booting, then reference that section later in my code:
      </p>
      <pre><code>[org 0x7c00]
      mov [DRIVE_NUMBER], dl

      ... other code
      mov dl, [DRIVE_NUMBER]
      ... other code

      DRIVE_NUMBER:
         db 0
      </code></pre>
      <p>And finally, we call interrupt 0x13:</p>
      <pre><code>int 0x14
      </code></pre>
      <p>Putting it all together:</p>
      <pre><code>[org 0x7c00]
      mov [DRIVE_NUMBER], dl 

      call loadSector
      jmp 0x7e00

      loadSector:
          ; load 1st sector into address 0x7e00
          mov ax, 0
          mov es, ax              
          mov bx, 0x7e00 
          mov ah, 0x02

          ; Cylinder (0), head (0), Sector (2)
          mov cl, 2
          mov dh, 0
          mov ch, 0

          ; Read one Sector
          mov al, 1
          mov dl, [DRIVE_NUMBER]

          int 0x13
          ret


      DRIVE_NUMBER:
          db 0

      times 510 - ($-$$) db 0
      dw 0xaa55

      mov al, &#39;Q&#39;
      call printCharacter 
      jmp $

      printCharacter:
          mov ah, 0x0e ; Teletype output: http://www.ctyme.com/intr/rb-0106.htm
          int 0x10     ; call interrupt
          ret
      </code></pre>
      <p>
        Try rerunning it, and you&#39;ll see, as expected, our &quot;kernel
        code&quot; print a Q to the screen, then infinitely loop.
      </p>
      <h3>Step 2: Set up the GDT</h3>
      <p>
        In this section, we&#39;ll define our get in a separate file called
        <code>gdt.asm</code>. Let&#39;s label our gdt and two sections:
      </p>
      <pre><code>_gdt_start:
         _gdt_null:
            times 8 db 0
         _gdt_code_descriptor
             ; TODO
         _gdt_data_descriptor
             ; TODO
      gdt_end:
      </code></pre>
      <p>
        Next, let&#39;s define what our <code>gdt</code> register
        (<code>gdtr</code>) should look like:
      </p>
      <pre><code>gdtr:
          dw _gdt_end - _gdt_start - 1
          dd _gdt_start
      </code></pre>
      <p>And define the prefix to segmented (long) jumps:</p>
      <pre><code>code_seg equ _gdt_code_descriptor - _gdt_start
      data_seg equ _gdt_data_descriptor - _gdt_start
      </code></pre>
      <p>
        From (section 3.4.5[^fn2]), we know bits 0-15 consist of the first 16
        bits of the segment limit. We want all 4 gigabytes, so our segment limit
        should be (11111... x20) = 0xfffff (5 f&#39;s). However, the processor
        puts this value and the later 1/2 byte value of the limit together with
        this one, so this first 16 bits is only 2 bytes (0xffff) to be combined
        with (0xf) later on in the gdt:
      </p>
      <pre><code>_gdt_code_descriptor:
          dw 0xffff
      </code></pre>
      <p>
        The following bits (16-31) are the first (of three) parts of the base
        address, which we will call 0:
      </p>
      <pre><code>DW 0x0000
      </code></pre>
      <p>At byte offset 4, bits 0-7, the second half of the base is defined:</p>
      <pre><code>db 0x00
      </code></pre>
      <p>
        Bits 15-12 (decreasing) of byte offset 4 are tricky. They consist of (s,
        dpl, and p):
      </p>
      <ul>
        <li>
          p = 1: indicates that this is a valid segment (if 0, an exception will
          be thrown)
        </li>
        <li>dpl = 00: permission level 0 (most privileged)</li>
        <li>s = 1: Code segment</li>
      </ul>
      <p>Bits 11-8 are the type bits:</p>
      <ul>
        <li>e = 1: Indicates that this is an executable segment</li>
        <li>dc = 0: Grows upwards</li>
        <li>rw = 1: Readable</li>
        <li>
          a = 0: Access bit - keep it 0; the system will set this bit to 1 when
          this segment is being accessed.
        </li>
      </ul>
      <pre><code>db 0b10011010
      </code></pre>
      <p>Next, bits 23-20 define (avl, l, d/b and g):</p>
      <ul>
        <li>g = 1: This segment uses 4 KByte increments</li>
        <li>d/b = 1: 32 Bit protected code segment (instead of 16)</li>
        <li>
          l = 0: Long mode flag - I was told that this should be 1 if d/b is not
          0
        </li>
        <li>avl = 0: Just used by the processor</li>
      </ul>
      <p>Bits 19-16 represent the second part of the segment limit (0xf)</p>
      <pre><code>db 0b11001111
      </code></pre>
      <p>Finally, the third half of the base offset:</p>
      <pre><code>db 0x00
      </code></pre>
      <p>
        Using the flat memory model, we&#39;ll let both the code and data
        segment take up the same memory space. The data segment has a similar
        derivation to the code descriptor, with minor differences.
      </p>
      <p>Putting everything together:</p>
      <pre><code>; GDT describes segments (currently code and data) and their permissions (you can&#39;t execute the
      ; data segment silly)

      ; References:
      ; Chapter 3.4.5 (https://www.intel.com/content/www/us/en/content-details/774490/intel-64-and-ia-32-architectures-software-developer-s-manual-volume-3a-system-programming-guide-part-1.html?wapkw=segment%20descriptor)
      ; And [OSDev wiki](https://wiki.osdev.org/Global_Descriptor_Table)
      _gdt_start:
          _gdt_null:
              times 8 db 0 

          ; Segment descriptor - has a complex structure. 
          ; See [Segment Descriptor](https://wiki.osdev.org/Global_Descriptor_Table)
          _gdt_code_descriptor:
              dw 0xffff
              DW 0x0000
              db 0x00
              db 0b10011010
              db 0b11001111
              db 0x00

          _gdt_data_descriptor:
              dw 0xffff
              DW 0x0000
              db 0x00
              db 0b10010010
              db 0b11001111
              db 0x00

      _gdt_end:


      gdtr:
          dw _gdt_end - _gdt_start - 1
          dd _gdt_start


      code_seg equ _gdt_code_descriptor - _gdt_start
      data_seg equ _gdt_data_descriptor - _gdt_start
      </code></pre>
      <p>We&#39;ll load the gdt in the next section</p>
      <h3>Step 3: Entering Protected Mode</h3>
      <p>In protected mode, we&#39;ll do a couple of things.</p>
      <ol>
        <li>Clear the screen. Here&#39;s a utility function to do that:</li>
      </ol>
      <pre><code>_clear_screen:
          mov ah, 0x00
          mov al, 0x03
          int 0x10
          ret
      </code></pre>
      <ol start="2">
        <li>disable interrupts</li>
      </ol>
      <pre><code>cli
      </code></pre>
      <ol start="3">
        <li>Load the gdtr that we defined previously</li>
      </ol>
      <pre><code>%include &quot;gdt.asm&quot;

      lgdt [gdtr]
      </code></pre>
      <ol start="4">
        <li>Enter protected mode by or-ing cr0 with 0x01:</li>
      </ol>
      <pre><code>mov eax, cr0
      or eax, 0x1
      mov cr0, eax
      </code></pre>
      <p>
        We are now in 32-bit protected mode. Let&#39;s set up the stack by
        executing a <strong>far jump</strong> using the gdt we defined (to the
        code segment):
      </p>
      <pre><code>jmp code_seg:_setup

      [bits 32]
      _setup:
        ...
      </code></pre>
      <p>
        To set up the stack, we&#39;ll set all the stack registers to the data
        segment (0):
      </p>
      <pre><code>mov ax, data_seg
      mov ds, ax
      mov ss, ax
      mov es, ax
      mov fs, ax
      mov gs, ax
      </code></pre>
      <p>And set the stack starting at address 0x90000:</p>
      <pre><code>; set up the stack base and pointer
      mov ebp, 0x90000
      mov esp, ebp
      </code></pre>
      <p>Finally, we can jump to our kernel!</p>
      <pre><code>jmp 0x7e00
      </code></pre>
      <h3>Step 4: Wrapping it All Together</h3>
      <p>
        In protected mode, we can call int 0x10 to print a character. We need to
        set the vga to our character explicitly. Putting everything together:
      </p>
      <p><code>boot.asm</code>:</p>
      <pre><code>[org 0x7c00]
      mov [DRIVE_NUMBER], dl 

      call loadSectors
      jmp protected_mode_setup

      loadSectors:
          ; load sector into address 0x7e00
          mov ax, 0
          mov es, ax              
          mov bx, 0x7e00 
          mov ah, 0x02

          ; Cylinder (0), head (0), Sector (2)
          mov cl, 2
          mov dh, 0
          mov ch, 0

          ; Read one Sector
          mov al, 1
          mov dl, [DRIVE_NUMBER]

          int 0x13
          ret

      %include&quot;protected_mode.asm&quot;

      DRIVE_NUMBER:
          db 0

      times 510 - ($-$$) db 0
      dw 0xaa55

      mov al, &#39;Q&#39;
      mov ah, 0x0f
      mov [0xb8000], ax
      jmp $
      </code></pre>
      <p><code>protected_mode.asm</code>:</p>
      <pre><code>_clear_screen:
          mov ah, 0x00
          mov al, 0x03
          int 0x10
          ret

      %include &quot;gdt.asm&quot;

      protected_mode_setup:
          call _clear_screen
          cli                     ; 1. disable interrupts

          lgdt [gdtr]             ; 2. load GDT descriptor

          ; Set protection enable bit in cr0 (control register 0)
          ; (you can&#39;t just move 1 into cr0, so use a general purpose extended (32-bit) register)
          ; TODO For paging, set bit 31 I think 
          mov eax, cr0
          or eax, 0x1            
          mov cr0, eax
          ; We are now in 32-bit protected mode

          ; Far Jump to the code segment. 
          ; I got confused on this line of code from the OSDevWiki
          ; A far jump takes the form:
          ; jmp &lt;gdt descriptor&gt;:offset
          ; Where the get descriptor is the offset from the get root. For example
          ; the first gdt descriptor would be 0x8 (because null entry)
          ;
          ; I couldn&#39;t find the official docs for this, though (TODO)
          jmp code_seg:_protected_mode

      [bits 32]
      _protected_mode:
          ; Set up the stack and data segments
          mov ax, data_seg
          mov ds, ax
          mov ss, ax
          mov es, ax
          mov fs, ax
          mov gs, ax

          ; Set up the stack base and pointer
          mov ebp, 0x90000
          mov esp, ebp

          ; Transfer control to the kernel :)
          jmp 0x7e00 
      </code></pre>
      <p><code>gdt.asm</code>:</p>
      <pre><code>; GDT describes segments (currently code and data) and their permissions (you can&#39;t execute the
      ; data segment silly)

      ; References:
      ; Chapter 3.4.5 (https://www.intel.com/content/www/us/en/content-details/774490/intel-64-and-ia-32-architectures-software-developer-s-manual-volume-3a-system-programming-guide-part-1.html?wapkw=segment%20descriptor)
      ; And [OSDev wiki](https://wiki.osdev.org/Global_Descriptor_Table)
      _gdt_start:
          _gdt_null:
              times 8 db 0 

          ; Segment descriptor - has a complex structure. 
          ; See [Segment Descriptor](https://wiki.osdev.org/Global_Descriptor_Table)
          _gdt_code_descriptor:
              ; byte offset 0

              ; bits 0-15: First 16 bits of segment limit
              ; We want all 4 gigabytes, so our segment limit should
              ; be (111111... x20) = 0xfffff (5 f&#39;s)
              ; However, the processor puts this value and the later 1/2 byte value of the limit
              ; together with this one, so this one is only 2 bytes (0xffff) to be combined with
              ; (0xf) later on in the gdt
              dw 0xffff

              ; bits 16-31 The first (of three) part of the base address (to be concatenated with
              ; the later fields
              DW 0x0000

              ; byte offset 4
              ; bits 0-7: The second half of the base
              db 0x00

              ; bits 15-12 (s, dpl, p)
              ; p = 1 -&gt; indicates that this is a valid segment (if 0, an exception will be thrown)
              ; dpl = 00 -&gt; Permission level 0 (most privileged) Might change this, not sure
              ; s = 1 -&gt; Code or data segment (as opposed to a system segment)

              ; bits 11-8 (Type): 
              ; e = 1 -&gt; Indicates this is an executable segment
              ; dc = 0 -&gt; Indicates that this segment grows upwards
              ; rw = 1 -&gt; Readable
              ; a = 0 -&gt; Access bit: Keep this 0; system sets it to 1 when being accessed
              db 0b10011010

              ; bits 23-20 (avl, l, d/b, g)
              ; g = 1 -&gt; indicates that segment uses 4 KByte increments (ranges from 4KB to 4 GB) 
              ; d/b = 1 -&gt; Indicates 32-bit protected code segment (as opposed to 16)
              ; l = 0 -&gt; Long mode flag; I was told this should be 1 if d/b is not 0
              ; avl = 0 (just used by the processor - no reason it&#39;s 0)

              ; bits 19-16 Segment limit pt 2 = 0xf (1111)
              db 0b11001111

              ; bits : Third half of the base offset
              db 0x00

          _gdt_data_descriptor:
              dw 0xffff
              DW 0x0000
              db 0x00
              db 0b10010010
              db 0b11001111
              db 0x00

      _gdt_end:


      gdtr:
          dw _gdt_end - _gdt_start - 1
          dd _gdt_start


      code_seg equ _gdt_code_descriptor - _gdt_start
      data_seg equ _gdt_data_descriptor - _gdt_start
      </code></pre>
      <h2>Appendix</h2>
      <h3>CPU architecture jargon words</h3>
      <p>
        <a
          href="https://www.intel.com/content/www/us/en/architecture-and-technology/64-ia-32-architectures-software-developer-vol-1-manual.html"
          >Here&#39;s an excellent summary of intel cpu architecture</a
        >
        (<strong>chapter 2.1</strong>). Although, often in the intel software
        development manuals, you can&#39;t just search for jargon terms, so the
        list below is a bit of a cross-reference for each jargon-y word and a
        word you can search for in the intel manual:
      </p>
      <p>
        <a
          href="https://myonlineusb.wordpress.com/2011/06/08/what-is-the-difference-between-i386-i486-i586-i686-i786/"
          >Here&#39;s another nice explanation of i related jargon</a
        >
      </p>
      <p>
        TLDR, intel&#39;s names make no sense :). These words are frequently
        misused / loaded, and it&#39;s just best to understand the history.
      </p>
      <ul>
        <li>
          <code>x86</code>: (2.1.1) Refers to processors in the 8086 family.
          (80186 80286 80386 80486...). Usually, it means compatibility with the
          80386 32-bit instruction set because 16-bit only is so old (TODO -
          this isn&#39;t perfectly accurate)
        </li>
        <li>
          <code>i686</code>: (2.1.6) Intel686. P6 Family Microarchitecture on
          the Pentium Pro. One of the 6th generation of
          <code>x86</code> processors.
        </li>
        <li>
          <code>i386</code>: (2.1.3) Intel386. AKA 80386. First 32-bit (TODO -
          fact check)
        </li>
        <li>
          <code>x86_64</code> The 64-bit instruction set (sometimes called
          amd64) brother of <code>x86</code>
          <ul>
            <li>
              backward compatible with <code>x86</code> (i.e.,
              <code>x86</code> instructions can run on
              <code>x86_64</code> processors)
            </li>
          </ul>
        </li>
      </ul>
      <p>
        <a
          href="https://www.aliencoders.org/content/basic-information-about-i386-i686-and-x8664-architectures/"
          >32-bit and 64-bit:</a
        >
      </p>
      <pre><code>- A 32-bit OS will run on a 32-bit or 64-bit processor without any problem.

      - A 32-bit application will run on a 32-bit or 64-bit OS without any problem.

      - But a 64-bit application will only run on a 64-bit OS, and a 64-bit OS will only run on a 64-bit processor
      </code></pre>
      <h3>The mega mebi tera tebi... confusion</h3>
      <p>
        Clearing things up because I haven&#39;t seen it stated in the official
        Intel manuals
      </p>
      <ul>
        <li>An <strong>official</strong> mega byte (MB) is 1000^2 bytes.</li>
        <li>An <strong>official</strong> mebibyte (MiB) is 1024^2 bytes</li>
      </ul>
      <p>
        Intel says <code>MB</code> in their reference manuals because MiB
        wasn&#39;t introduced until later, and they didn&#39;t want to change
        all their manuals/references. For all intents and purposes, in the intel
        manuals, MB means 1024^2^, which conforms with intuition (e.g., 4 GBytes
        is $4\times2^{30}$ bytes, or $2^2 \times 2^{30}=2^{32}$ bytes, which
        fits on a 32-bit number).
      </p>
      <h2>References</h2>
      <p>
        [^fn1]:
        <a
          href="https://www.intel.com/content/www/us/en/architecture-and-technology/64-ia-32-architectures-software-developer-vol-1-manual.html"
          >Intel Software Development Manual Volume 1A (Basic Architecture)</a
        >
        - Not going to help you write code, but useful in learning about the
        basics of computer stuff
      </p>
      <p>
        [^fn2]:
        <a
          href="https://www.intel.com/content/dam/www/public/us/en/documents/manuals/64-ia-32-architectures-software-developer-vol-3a-part-1-manual.pdf"
          >Intel Software Development Manual Volume 3A (System Programming Guide
          Part 1)</a
        >
        - Good reference for GDT, protected mode, paging, etc. (The above also
        talks about paging and segmentation)
      </p>
    </div>
  </article>
</template>
