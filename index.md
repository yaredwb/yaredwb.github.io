---
layout: default
title: About
permalink: /
page_class: home
show_title: false
---

<div class="hero">
  <p class="hero-eyebrow">Computational geomechanics and applied AI</p>
  <h1 class="hero-title">Hi, I am Yared W. Bekele.</h1>
  <p class="hero-summary">I am a research scientist based in Trondheim, working at the intersection of geomechanics, numerical modelling, and data driven tools. I build and apply simulation software, teach computational methods, and collaborate with industry on complex soil and rock engineering problems.</p>
  <div class="hero-actions">
    <a class="button" href="{{ '/resume/' | relative_url }}">View resume</a>
    <a class="button button--ghost" href="{{ '/research/' | relative_url }}">Explore research</a>
  </div>
</div>

<section class="section">
  <h2 class="section-title">What I focus on</h2>
  <p class="section-lead">My work blends rigorous mechanics with software craftsmanship so that difficult geotechnical questions can be explored with confidence.</p>
  <div class="card-grid">
    <article class="card">
      <h3>Numerical modelling</h3>
      <p>Developing finite element and finite difference models for coupled hydro mechanical processes, with a focus on porous media challenges.</p>
    </article>
    <article class="card">
      <h3>Software and automation</h3>
      <p>Designing research codes, streamlining engineering workflows, and bringing modern programming practices into geotechnical projects.</p>
    </article>
    <article class="card">
      <h3>Applied AI</h3>
      <p>Prototyping assistants and machine learning models that augment simulations and decision making, from landslide risk tools to data curation.</p>
    </article>
    <article class="card">
      <h3>Teaching and mentorship</h3>
      <p>Guiding students and teams in computational mechanics courses, applied programming, and thesis projects grounded in real world problems.</p>
    </article>
  </div>
</section>

<section class="section">
  <h2 class="section-title">Recent writing</h2>
  <p class="section-lead">Notes from research, teaching, and experiments with new technology.
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
  <p class="section-cta"><a class="text-link" href="{{ '/blog/' | relative_url }}">Browse all posts</a></p>
  {% else %}
  <p>No posts yet. New writing will appear here soon.</p>
  {% endif %}
</section>

<section class="section">
  <h2 class="section-title">Highlights</h2>
  <div class="card-grid">
    <article class="card">
      <h3>Selected publications</h3>
      <ul>
        <li>Mixed isogeometric analysis for poroelastic media (2022)</li>
        <li>Physics informed deep learning for consolidation (2020)</li>
        <li>Isogeometric analysis of coupled porous media processes (PhD)</li>
      </ul>
    </article>
    <article class="card">
      <h3>Projects and tools</h3>
      <ul>
        <li>Streamlit applications for consolidation studies and terrain analysis</li>
        <li>GeoSim.AI assistants for landslide hazard workflows</li>
        <li>Open source C++ implementations of porous media solvers</li>
      </ul>
    </article>
    <article class="card">
      <h3>Teaching and outreach</h3>
      <ul>
        <li>Advanced computational methods in geotechnical engineering</li>
        <li>Graduate seminars on constitutive modelling and simulation</li>
        <li>Supervision of MSc and PhD projects in soil mechanics</li>
      </ul>
    </article>
  </div>
</section>

