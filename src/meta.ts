import { type MetaInformation } from "./models";

export const meta: MetaInformation = {
  blog: {
    posts: [
      {
        title: "Performance analysis of inner file inserts",
        date: new Date("2026-06-15"),
        entry: () =>
          import("@/blog/posts/13_inner_inserts_performance/InnerInserts.vue"),
        route: "/blog/13_inner_inserts",
        description:
          "For this first performance analysis, I'll talk about inner mutations - specifically inserting data into the middle of a file. Later I'll talk about inner removals, which completes the 'inner mutation' operations analysis.",
        name: "inner_inserts",
        popular: true,
        tags: ["Databases", "C", "Algorithms", "Performance"],
      },
      {
        title: "How to Delete a WAL in a single file database",
        date: new Date("2026-05-08"),
        entry: () => import("@/blog/posts/12_wal_deleting/DeletingAWal.vue"),
        route: "/blog/12_wal_deleting",
        description:
          "In a WAL, you have a stream of log entries. Each one describes a change that was made to the database. The problem is that for a single file database, I don't want a historic WAL for every single...",
        name: "deleting_a_wal",
        popular: true,
        tags: ["Databases", "C", "Algorithms", "WAL"],
      },
      {
        title: "A Lock Free - Wait Free - Steal - No Force Database Pager",
        date: new Date("2026-05-05"),
        entry: () =>
          import("@/blog/posts/11_smart_files_is_concurrent/AnnouncingConcurrency.vue"),
        route: "/blog/11_smart_files_is_concurrent",
        description:
          "A common pattern for building databases is to use a paging schema. Pages in databases are easy to reason about because they make the UNDO / REDO protocol really easy to implement and they drastically simplify your...",
        name: "smart_files_is_concurrent",
        popular: true,
        tags: ["Databases", "C", "Algorithms"],
      },
      {
        title: "Releasing Smart Files",
        date: new Date("2026-04-20"),
        entry: () =>
          import("@/blog/posts/10_smart_files_release/SmartFiles.vue"),
        route: "/blog/10_smart_files_release",
        description:
          "The concept of a file has had the same definition for the past 50 years. Today I'm announcing the launch of Smart Files, a new API that gets past the hurdles of old school linear, non-transactional system files.\n",
        name: "smart_files_release",
        popular: true,
        tags: ["Databases", "C"],
      },
      {
        title: "Releasing CSpecx",
        date: new Date("2026-04-15"),
        entry: () => import("@/blog/posts/9_c_specx_release/CSpecx.vue"),
        route: "/blog/9_c_specx_release",
        description:
          "c_specx - Common Systems Programming C Extensions - is a framework for major C applications. Here's a quick tour of what's in it. Over time, c_specx will grow to meet the needs of large scale applications (such as Numstore).",
        name: "c_specx_release",
        popular: true,
        tags: ["Databases", "C"],
      },
      {
        title: "An intrusive hash table in C",
        date: new Date("2026-04-08"),
        entry: () =>
          import("@/blog/posts/8_intrusive-hash-table-in-c/IntrusiveHashTable.vue"),
        route: "/blog/8_intrusive-hash-table-in-c",
        description:
          "I wanted to write a blog post about implementing a lock table because I thought it would help me understand them better - I'm currently tracking down some bugs in",
        name: "8_intrusive-hash-table-in-c",
        popular: true,
        tags: ["Databases", "C"],
      },
      {
        title: "A Simple UNDO based Java Database in an hour",
        date: new Date("2026-03-30"),
        entry: () =>
          import("@/blog/posts/7_a-simple-database-in-java/SimpleDatabaseJava.vue"),
        route: "/blog/simple-java-database",
        description:
          "I was playing around with some ideas for a new database I'm working on and I put together a little play database in java for fun and I thought I'd share",
        name: "simple-java-database",
        popular: true,
        tags: ["Databases", "Java"],
      },
      {
        title: "On Pattern Recognition and Closed Systems",
        date: new Date("2023-05-22"),
        entry: () =>
          import("@/blog/posts/6_pattern-recognition/PatternRecognition.vue"),
        route: "/blog/6_pattern-recognition",
        description:
          "Owl: Whoo, well who-ello my friends, I'm delighted to have you stop by just in time for my extra delicious Banana flavored tea with spam, eggs and fried marmot!",
        name: "6_pattern-recognition",
        popular: false,
        tags: ["Machine Learning"],
      },
      {
        title: "Some Silly Paradoxes",
        date: new Date("2023-05-14"),
        entry: () => import("@/blog/posts/5_paradoxes/SillyParadoxes.vue"),
        route: "/blog/silly-5_paradoxes",
        description:
          "In this post, I will explore some interesting 5_paradoxes. I'll probably add to this post in the future, but for now, I just want this post to be about some silly little 5_paradoxes that have shown up in blog in the past.",
        name: "silly-5_paradoxes",
        popular: true,
        tags: ["Paradoxes"],
      },
      {
        title: "Cantor, Natural Numbers and Formal Systems",
        date: new Date("2023-05-07"),
        entry: () =>
          import("@/blog/posts/4_nn-systems-cantor/NNSystemsCantor.vue"),
        route: "/blog/4_nn-systems-cantor",
        description:
          "In this post, I will explore some properties of natural numbers and abstract systems in blogematics.",
        name: "4_nn-systems-cantor",
        popular: true,
        tags: ["Natural Numbers", "Formal Systems", "Set Theory"],
      },
      {
        title: "Building a Bootloader",
        date: new Date("2023-04-03"),
        entry: () =>
          import("@/blog/posts/2_building-a-bootloader/BuildingABootloader.vue"),
        route: "/blog/2_building-a-bootloader",
        description:
          "I'll build a bootloader from scratch for an Intel x86 32-bit processor in this post. You should have some assembly experience before embarking on your bootloader journey.",
        name: "2_building-a-bootloader",
        popular: true,
        tags: ["Operating Systems", "Bootloader"],
      },
      {
        title: "Kotlin and Error Handling",
        date: new Date("2023-02-08"),
        entry: () =>
          import("@/blog/posts/1_kotlin-error-handling/KotlinErrorHandling.vue"),
        route: "/blog/1_kotlin-error-handling",
        description:
          "Handling errors cleanly in Kotlin. Which layer do I handle my exceptions and how do I prevent try catch hell?",
        name: "1_kotlin-error-handling",
        popular: false,
        tags: ["Error Handling", "Kotlin"],
      },
      {
        title: "Measure Theory",
        date: new Date("2023-02-08"),
        entry: () => import("@/blog/posts/0_measure-theory/MeasureTheory.vue"),
        route: "/blog/0_measure-theory",
        description:
          "In this post, I will first lay the basic analysis groundwork needed to understand Borel Sigma Algebras (and of course, I will also explain sigma algebras). Then I will explain the basics of Measure Theory necessary for defining Lp and weak-Lp spaces in subsequent blog posts.",
        name: "0_measure-theory",
        popular: false,
        tags: ["Error Handling", "Kotlin"],
      },
    ],
  },
};
