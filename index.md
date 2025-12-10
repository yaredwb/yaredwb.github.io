---
layout: default
title: About
permalink: /
page_class: home
show_title: false
---

<div class="hero">
  <div class="hero-inner">
    <div class="hero-content">
      <div class="hero-logo">
        <h1 class="hero-title">Yared W. Bekele</h1>
        <p class="hero-tagline">Research Scientist &amp; Geotechnical Engineer</p>
      </div>
      <p class="hero-summary">
        I am a research scientist specializing in computational geomechanics, coupled hydro-thermo-mechanical modelling, and physics-informed machine learning for geotechnical applications. My work bridges rigorous numerical methods with practical engineering challenges in slope stability, underground construction, and climate adaptation of infrastructure.
      </p>
      <div class="hero-actions">
        <a class="button" href="{{ '/resume/' | relative_url }}">Curriculum Vitae</a>
        <a class="button button--ghost" href="https://scholar.google.com/citations?user=-QkPGDYAAAAJ&hl=en" target="_blank" rel="noopener">Google Scholar</a>
      </div>
    </div>
  </div>
</div>

<section class="section">
  <div class="section-header">
    <h2 class="section-title">Research Areas</h2>
    <p class="section-lead">My research focuses on advancing computational methods and AI-enabled tools for geotechnical engineering and porous media mechanics.</p>
  </div>
  <div class="card-grid">
    <article class="card">
      <h3>Computational Geomechanics</h3>
      <p>Finite element and isogeometric analysis of coupled hydro-mechanical and thermo-hydro-mechanical processes in soils and rocks, with applications to slope stability and geothermal systems.</p>
    </article>
    <article class="card">
      <h3>Physics-Informed Machine Learning</h3>
      <p>Development of physics-informed neural networks for consolidation, poroelasticity, and other geomechanical boundary value problems.</p>
    </article>
    <article class="card">
      <h3>Research Software Development</h3>
      <p>Building well-documented Python and C++ codebases with testing and automation that make research outputs reproducible and transferable.</p>
    </article>
    <article class="card">
      <h3>Teaching &amp; Supervision</h3>
      <p>Courses, seminars, and student supervision in numerical methods, scientific programming, and applied geomechanics.</p>
    </article>
  </div>
</section>

<section class="section section--alt">
  <div class="section-header section-header--split">
    <div>
      <h2 class="section-title">Recent Research</h2>
      <p class="section-lead">Selected work at the intersection of computational geomechanics, data-driven modelling, and physics-informed neural networks.</p>
    </div>
    <a class="pill-link" href="{{ '/research/' | relative_url }}">All research notes</a>
  </div>
  {% assign spotlight = site.research | sort: 'date' | reverse %}
  {% if spotlight.size > 0 %}
  <div class="spotlight-grid">
    {% for post in spotlight limit: 1 %}
    <article class="spotlight-card">
      <span class="spotlight-card__eyebrow">{{ post.date | date: '%b %Y' }}</span>
      <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
      {% if post.excerpt %}
      <p class="spotlight-card__summary">{{ post.excerpt | strip_html | truncatewords: 42 }}</p>
      {% endif %}
      {% if post.tags %}
      <p class="spotlight-card-meta">{{ post.tags | join: ', ' }}</p>
      {% endif %}
    </article>
    {% endfor %}
  </div>
  {% else %}
  <div class="empty-state">
    <h3>Research updates are on the way</h3>
    <p>In the meantime, explore my <a href="{{ '/resume/' | relative_url }}">CV</a> or <a href="{{ '/blog/' | relative_url }}">notes</a>.</p>
  </div>
  {% endif %}
</section>

<section class="section">
  <div class="section-header section-header--split">
    <div>
      <h2 class="section-title">Teaching &amp; Supervision</h2>
      <p class="section-lead">Course materials, computational notebooks, and resources for students and engineers in geotechnical and computational mechanics.</p>
    </div>
    <a class="pill-link" href="{{ '/teaching/' | relative_url }}">Teaching resources</a>
  </div>
  {% assign teaching_posts = site.teaching | sort: 'date' | reverse %}
  {% if teaching_posts.size > 0 %}
  <ul class="post-list">
    {% for post in teaching_posts limit: 1 %}
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
    <h3>Teaching materials coming soon</h3>
    <p>New lectures and tutorial notebooks are being prepared.</p>
  </div>
  {% endif %}
</section>

<section class="section section--alt">
  <div class="section-header section-header--split">
    <div>
      <h2 class="section-title">Notes &amp; Essays</h2>
      <p class="section-lead">Occasional reflections on computational methods, technology, and lessons from research and practice.</p>
    </div>
    <a class="pill-link" href="{{ '/blog/' | relative_url }}">All posts</a>
  </div>
  {% assign recent_posts = site.posts | sort: 'date' | reverse %}
  {% if recent_posts.size > 0 %}
  <ul class="post-list">
    {% for post in recent_posts limit: 1 %}
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
    <a class="pill-link" href="{{ '/archive/' | relative_url }}">Archive</a>
  </div>
  {% else %}
  <div class="empty-state">
    <h3>Writing will appear soon</h3>
    <p>Subscribe via RSS or follow along on <a href="https://x.com/yaredwb">Twitter/X</a>.</p>
  </div>
  {% endif %}
</section>

<section class="section">
  <div class="cta-panel">
    <h2>Contact</h2>
    <p>I welcome inquiries about research collaboration, student supervision, or consulting on computational geomechanics projects.</p>
    <div class="hero-actions">
      <a class="button" href="mailto:yaredworku@gmail.com">Email</a>
      <a class="button button--ghost" href="{{ '/resume/' | relative_url }}">View CV</a>
    </div>
  </div>
</section>
