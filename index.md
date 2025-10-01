---
layout: default
title: About
permalink: /
page_class: home
show_title: false
---

<div class="hero">
  <p class="hero-eyebrow">Computational Geomechanics & Applied AI</p>
  <h1 class="hero-title">Hi, I am Yared W. Bekele.</h1>
  <p class="hero-summary">I am a research scientist working at the intersection of computational geomechanics, machine learning and applied generarive AI. I build and apply simulation software, collaborate with industry on complex soil and rock engineering problems and teach computational methods in geotechnical engineering.</p>
  <div class="hero-actions">
    <a class="button" href="{{ '/resume/' | relative_url }}">View Resume</a>
    <a class="button button--ghost" href="{{ '/research/' | relative_url }}">Explore Research</a>
  </div>
</div>

<section class="section">
  <h2 class="section-title">What I Focus On</h2>
  <p class="section-lead">My work blends rigorous mechanics with software craftsmanship, enabling confident exploration of complex geotechnical questions through innovative computational approaches.</p>
  <div class="card-grid">
    <article class="card">
      <h3>Computational Modelling</h3>
      <p>Applying advanced numerical methods in various application areas in computational science and engineering, mainly for coupled problems in geomechanics/poromechanics.</p>
    </article>
    <article class="card">
      <h3>Numerical Programming</h3>
      <p>Designing research codes, streamlining engineering workflows, and bringing modern programming practices into geotechnical projects with emphasis on scalability and maintainability.</p>
    </article>
    <article class="card">
      <h3>Applied Generative AI</h3>
      <p>Prototyping intelligent assistants and machine learning models that augment simulations and decision-making, from landslide risk assessment tools to automated data curation systems.</p>
    </article>
    <article class="card">
      <h3>Teaching & Mentorship</h3>
      <p>Guiding students and teams in computational mechanics courses, applied programming methodologies, and thesis projects grounded in real-world engineering problems.</p>
    </article>
  </div>
</section>

<section class="section">
  <h2 class="section-title">Recent Writing</h2>
  <p class="section-lead">Notes from research, teaching experiences, and experiments with emerging technologies in computational engineering.
  </p>
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
      </article>
    </li>
    {% endfor %}
  </ul>
  <p class="section-cta"><a class="text-link" href="{{ '/blog/' | relative_url }}">Browse All Posts</a></p>
  {% else %}
  <p>No posts yet. New writing will appear here soon.</p>
  {% endif %}
</section>

