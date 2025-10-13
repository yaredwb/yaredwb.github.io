---
layout: default
title: About
permalink: /
page_class: home
show_title: false
---

<div class="hero">
  <div class="hero-logo">
    <h1 class="hero-title">Yared W. Bekele</h1>
    <p class="hero-tagline">Computational Geomechanics / Applied AI</p>
  </div>
  <p class="hero-summary">
    I am a research scientist building computational pipelines that combine rigorous mechanics, domain expertise, and applied generative AI. I help engineering teams design resilient ground infrastructure, transform geotechnical data into insight, and automate decision-making for complex soil and rock systems.
  </p>
  <div class="hero-actions">
    <a class="button" href="{{ '/resume/' | relative_url }}">View Resume</a>
    <a class="button button--ghost" href="{{ '/research/' | relative_url }}">Explore Research</a>
  </div>
</div>

<section class="section">
  <div class="section-header">
    <h2 class="section-title">How I Create Impact</h2>
    <p class="section-lead">I bring modern numerical tools and AI assistants into geotechnical workflows&mdash;closing the loop between simulation, data, and field expertise.</p>
  </div>
  <div class="card-grid">
    <article class="card">
      <h3>High-Fidelity Simulation</h3>
      <p>Advanced finite element and multi-physics modelling for coupled hydro-mechanical processes, landslide scenarios, and infrastructure reliability studies.</p>
    </article>
    <article class="card">
      <h3>AI-Driven Engineering Tools</h3>
      <p>Designing intelligent copilots and data-centric automation that translate natural language instructions into reproducible geotechnical analyses.</p>
    </article>
    <article class="card">
      <h3>Production-Ready Research Code</h3>
      <p>Turning prototypes into maintainable software with modern Python/C++ practices, documentation, and reproducible pipelines tailored to engineering teams.</p>
    </article>
    <article class="card">
      <h3>Teaching & Mentorship</h3>
      <p>Guiding students, engineers, and researchers through computational mechanics, numerical modelling, and pragmatic software craftsmanship.</p>
    </article>
  </div>
</section>

<section class="section section--alt">
  <div class="section-header section-header--split">
    <div>
      <h2 class="section-title">Research Spotlight</h2>
      <p class="section-lead">Selected work at the intersection of computational geomechanics, data-driven modelling, and generative AI tooling.</p>
    </div>
    <a class="pill-link" href="{{ '/research/' | relative_url }}">See all research</a>
  </div>
  {% assign spotlight = site.research | sort: 'date' | reverse %}
  {% if spotlight.size > 0 %}
  <div class="spotlight-grid">
    {% for post in spotlight limit: 2 %}
    <article class="spotlight-card">
      <span class="spotlight-card__eyebrow">{{ post.date | date: '%b %Y' }}</span>
      <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
      {% if post.excerpt %}
      <p class="spotlight-card__summary">{{ post.excerpt | strip_html | truncatewords: 42 }}</p>
      {% endif %}
      {% if post.tags %}
      <div class="spotlight-card__tags">
        {% for tag in post.tags %}
        <span class="spotlight-card__tag">{{ tag }}</span>
        {% endfor %}
      </div>
      {% endif %}
    </article>
    {% endfor %}
  </div>
  {% else %}
  <div class="empty-state">
    <h3>Research updates are on the way</h3>
    <p>In the meantime, explore my <a href="{{ '/resume/' | relative_url }}">CV</a> or <a href="{{ '/blog/' | relative_url }}">recent writing</a>.</p>
  </div>
  {% endif %}
</section>

<section class="section">
  <div class="section-header section-header--split">
    <div>
      <h2 class="section-title">Teaching & Mentorship</h2>
      <p class="section-lead">Course material, hands-on demonstrations, and project guidance for computational mechanics and applied programming in geotechnical engineering.</p>
    </div>
    <a class="pill-link" href="{{ '/teaching/' | relative_url }}">Browse teaching resources</a>
  </div>
  {% assign teaching_posts = site.teaching | sort: 'date' | reverse %}
  {% if teaching_posts.size > 0 %}
  <ul class="post-list">
    {% for post in teaching_posts limit: 3 %}
    <li>
      <article class="post-card">
        <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: '%b %d, %Y' }}</time>
        <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
        {% if post.excerpt %}
        <p>{{ post.excerpt | strip_html | truncatewords: 32 }}</p>
        {% endif %}
        {% if post.tags %}
        <p class="post-card-meta">{{ post.tags | join: ', ' }}</p>
        {% endif %}
      </article>
    </li>
    {% endfor %}
  </ul>
  {% else %}
  <div class="empty-state">
    <h3>No teaching posts yet</h3>
    <p>New lectures and walkthroughs are being prepared&mdash;check back soon for fresh material.</p>
  </div>
  {% endif %}
</section>

<section class="section section--alt">
  <div class="section-header section-header--split">
    <div>
      <h2 class="section-title">Recent Writing</h2>
      <p class="section-lead">Notes from experiments, reflections on emerging technology, and lessons learned from the lab and field.</p>
    </div>
    <a class="pill-link" href="{{ '/blog/' | relative_url }}">Browse the archive</a>
  </div>
  {% assign recent_posts = site.posts | sort: 'date' | reverse %}
  {% if recent_posts.size > 0 %}
  <ul class="post-list">
    {% for post in recent_posts limit: 3 %}
    <li>
      <article class="post-card">
        <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: '%b %d, %Y' }}</time>
        <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
        {% if post.excerpt %}
        <p>{{ post.excerpt | strip_html | truncatewords: 32 }}</p>
        {% endif %}
        {% if post.categories %}
        <p class="post-card-meta">{{ post.categories | join: ', ' }}</p>
        {% endif %}
      </article>
    </li>
    {% endfor %}
  </ul>
  <div class="section-cta">
    <a class="pill-link" href="{{ '/archive/' | relative_url }}">View the full archive</a>
  </div>
  {% else %}
  <div class="empty-state">
    <h3>Writing will appear soon</h3>
    <p>I'm curating new essays and field notes&mdash;subscribe via RSS or follow along on <a href="https://x.com/yaredwb">Twitter/X</a>.</p>
  </div>
  {% endif %}
</section>

<section class="section">
  <div class="cta-panel">
    <h2>Let's build resilient, intelligent infrastructure.</h2>
    <p>Whether you need geotechnical simulation expertise, an AI-enabled engineering assistant, or a collaborator for computational research, I'm excited to help shape emerging ideas into working tools.</p>
    <div class="hero-actions">
      <a class="button" href="mailto:yaredworku@gmail.com">Start a conversation</a>
      <a class="button button--ghost" href="{{ '/resume/' | relative_url }}">View my CV</a>
    </div>
  </div>
</section>
