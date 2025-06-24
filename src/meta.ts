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
        popular: true,
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
