<template>
  <article class="post">
    <header class="post-header">
      <h1>Software Engineer Ethics</h1>
      <p class="post-intro">
        We're lost. Engineers are lost. We've ventured so far into the craft that we've started to
        lose the plot on what actually matters.
      </p>
    </header>

    <section>
      <h2>Code is not the most important thing</h2>
      <p>
        Code is not more important than familial connection and the story that you grew up with as a
        kid. Love your neighbor, love your friend. You may lose everything you have today and still
        be a good person. That's worth saying out loud because I don't think the software industry
        says it enough.
      </p>
      <p>
        There's a version of a software engineer that ships great products, is respected by their
        peers, and is also present at dinner. Those things are not in conflict. The industry has a
        habit of framing extreme dedication as the only path to excellence, and I think that does
        real damage — not just to individuals, but to the kind of people we end up building software
        for.
      </p>
    </section>

    <section>
      <h2>Programming is a job</h2>
      <p>It sometimes helps to think about it that way.</p>
      <p>
        If you hear about John Carmack and how he programs 6 days a week, 10 hours a day, you may
        think that's what you need to do to be a good engineer. But that narrative is backwards.
      </p>
      <p>
        John Carmack led a really impactful team of engineers on a game that changed the course of
        software engineering because he was passionate about his craft in the moment. He probably
        worked 16 hour days because he wanted to — because the problem in front of him was genuinely
        exciting and he couldn't stop. The story about him working 10 hour days as an adult software
        engineer came <em>after</em> the impact he had on the industry. It is not the direct cause
        of his influence and success. It's a description of a symptom, not a prescription for
        success.
      </p>
      <p>
        So if your reasoning is "I have to be like John Carmack and work 10 hour days 6 days a week
        or I won't be successful" — you're probably not going to be John Carmack. You're just going
        to be tired.
      </p>
      <p>
        The people who actually change the field aren't grinding through hours they resent. They're
        obsessing over a problem they can't let go of. That's a different thing entirely. You can't
        manufacture that with a schedule.
      </p>
    </section>

    <section>
      <h2>Find meaning, but don't confuse grinding with it</h2>
      <p>Find something that drives you. If you're forcing yourself to work for a long period of time with little return, that's probably not it.</p>
      <p>
        That being said — persistence does sometimes mean forcing yourself to work. There's a real
        tension here and I don't want to pretend there isn't. The difference is whether you're
        forcing yourself through a hard stretch of something you actually care about, or whether
        you're white-knuckling through a career you've convinced yourself you're supposed to want.
        Those feel similar in the moment and have very different outcomes over a decade.
      </p>
      <p>
        Passion isn't always a feeling. Sometimes it's a decision you make over and over again to
        stay with something hard because you believe it's worth finishing. That's different from
        punishing yourself with hours because some blog post told you that's how the greats did it.
        Know the difference.
      </p>
      <p>
        The engineers I respect most aren't the ones who logged the most hours. They're the ones who
        stayed curious, treated people well, and built things they actually gave a damn about.
        That's a sustainable career. The other thing is a slow burn.
      </p>
    </section>

    <section>
      <h2>Be honest about what you're building and who it's for</h2>
      <p>
        There's an ethical dimension to this job that doesn't get enough airtime. The software you
        write goes somewhere. It runs in production, it touches real people, it shapes how they
        spend their time and sometimes their money. That's not nothing.
      </p>
      <p>
        You don't have to be building weapons to ask yourself whether what you're working on is
        actually good. Most of the harmful things software has done to the world weren't built by
        bad people. They were built by capable engineers who never stopped to ask the question. Be
        the kind of engineer who asks the question.
      </p>
    </section>

    <footer class="post-footer">
      <p>Anyways. Write good code. Go home. Call your family.</p>
    </footer>
  </article>
</template>

<script setup>
</script>

<style scoped>
.post {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.1rem;
  line-height: 1.75;
  color: #1a1a1a;
}

.post-header {
  margin-bottom: 3rem;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 2rem;
}

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
  font-family: system-ui, sans-serif;
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

.post-footer {
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
  color: #555;
  font-style: italic;
}
</style>
