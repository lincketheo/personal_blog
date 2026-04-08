import { type MetaInformation } from "./models"

export const meta: MetaInformation = {
  blog: {
    route: "/blog",
    prefix: "blog",
    entry: () => import("@/blog/Blog.vue"),
    nav_title: "Blog",
    name: "blog",
    posts: [
      {
        title: "An intrusive hash table in C",
        date: new Date("2026-04-08"),
        entry: () => import("@/blog/posts/intrusive-hash-table-in-c/IntrusiveHashTable.vue"),
        route: "/blog/intrusive-hash-table-in-c",
        description: "I wanted to write a blog post about implementing a lock table because I thought it would help me understand them better - I'm currently tracking down some bugs in",
        name: "intrusive-hash-table-in-c",
        popular: true,
        tags: [
          "Databases",
          "C"
        ]
      },
      {
        title: "A Simple UNDO based Java Database in an hour",
        date: new Date("2026-03-30"),
        entry: () => import("@/blog/posts/a-simple-database-in-java/SimpleDatabaseJava.vue"),
        route: "/blog/simple-java-database",
        description: "I was playing around with some ideas for a new database I'm working on and I put together a little play database in java for fun and I thought I'd share",
        name: "simple-java-database",
        popular: true,
        tags: [
          "Databases",
          "Java"
        ]
      },
      {
        title: "On Pattern Recognition and Closed Systems",
        date: new Date("2023-05-22"),
        entry: () => import("@/blog/posts/pattern-recognition/PatternRecognition.vue"),
        route: "/blog/pattern-recognition",
        description: "Owl: Whoo, well who-ello my friends, I'm delighted to have you stop by just in time for my extra delicious Banana flavored tea with spam, eggs and fried marmot!",
        name: "pattern-recognition",
        popular: false,
        tags: [
          "Machine Learning"
        ]
      },
      {
        title: "Some Silly Paradoxes",
        date: new Date("2023-05-14"),
        entry: () => import("@/blog/posts/paradoxes/SillyParadoxes.vue"),
        route: "/blog/silly-paradoxes",
        description: "In this post, I will explore some interesting paradoxes. I'll probably add to this post in the future, but for now, I just want this post to be about some silly little paradoxes that have shown up in blog in the past.",
        name: "silly-paradoxes",
        popular: true,
        tags: [
          "Paradoxes"
        ]
      },
      {
        title: "Cantor, Natural Numbers and Formal Systems",
        date: new Date("2023-05-07"),
        entry: () => import("@/blog/posts/nn-systems-cantor/NNSystemsCantor.vue"),
        route: "/blog/nn-systems-cantor",
        description: "In this post, I will explore some properties of natural numbers and abstract systems in blogematics.",
        name: "nn-systems-cantor",
        popular: true,
        tags: [
          "Natural Numbers",
          "Formal Systems",
          "Set Theory"
        ]
      },
      {
        title: "Building a Bootloader",
        date: new Date("2023-04-03"),
        entry: () => import("@/blog/posts/building-a-bootloader/BuildingABootloader.vue"),
        route: "/blog/building-a-bootloader",
        description: "I'll build a bootloader from scratch for an Intel x86 32-bit processor in this post. You should have some assembly experience before embarking on your bootloader journey.",
        name: "building-a-bootloader",
        popular: true,
        tags: [
          "Operating Systems",
          "Bootloader"
        ]
      },
      {
        title: "Kotlin and Error Handling",
        date: new Date("2023-02-08"),
        entry: () => import("@/blog/posts/kotlin-error-handling/KotlinErrorHandling.vue"),
        route: "/blog/kotlin-error-handling",
        description: "Handling errors cleanly in Kotlin. Which layer do I handle my exceptions and how do I prevent try catch hell?",
        name: "kotlin-error-handling",
        popular: false,
        tags: [
          "Error Handling",
          "Kotlin"
        ]
      },
      {
        title: "Measure Theory",
        date: new Date("2023-02-08"),
        entry: () => import("@/blog/posts/measure-theory/MeasureTheory.vue"),
        route: "/blog/measure-theory",
        description: "In this post, I will first lay the basic analysis groundwork needed to understand Borel Sigma Algebras (and of course, I will also explain sigma algebras). Then I will explain the basics of Measure Theory necessary for defining Lp and weak-Lp spaces in subsequent blog posts.",
        name: "measure-theory",
        popular: false,
        tags: [
          "Error Handling",
          "Kotlin"
        ]
      }
    ]
  },
}
