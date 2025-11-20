---
layout: default
title: Home
permalink: /
page_class: home
show_title: false
---

<div class="hero">
  <div class="hero-inner">
    <div class="hero-content">
      <div class="hero-logo">
        <h1 class="hero-title">Yared W. Bekele, PhD</h1>
        <p class="hero-tagline">Computational Geomechanics / Applied AI</p>
      </div>
      <p class="hero-summary">
        I am a research scientist specializing in <strong>computational geomechanics</strong> and <strong>applied artificial intelligence</strong>. My work focuses on developing rigorous numerical models and data-driven tools to solve complex problems in geotechnical engineering.
      </p>
      <div class="hero-actions">
        <a class="button" href="{{ '/research/' | relative_url }}">Research</a>
        <a class="button button--ghost" href="{{ '/resume/' | relative_url }}">CV</a>
      </div>
    </div>
  </div>
</div>

<section class="section">
  <div class="section-header">
    <h2 class="section-title">Research Interests</h2>
  </div>
  <div class="card-grid">
    <article class="card">
      <h3>Computational Geomechanics</h3>
      <p>Development of numerical methods for non-linear hydro-mechanical analysis of soil and rock structures.</p>
    </article>
    <article class="card">
      <h3>Applied AI in Engineering</h3>
      <p>Utilization of machine learning and generative AI to automate workflows and enhance decision-making in geotechnical design.</p>
    </article>
    <article class="card">
      <h3>Numerical Modelling</h3>
      <p>Advanced finite element analysis and constitutive modelling for complex material behaviors.</p>
    </article>
  </div>
</section>

<section class="section">
  <div class="section-header section-header--split">
    <h2 class="section-title">Selected Publications</h2>
    <a class="pill-link" href="{{ '/research/' | relative_url }}">View all</a>
  </div>
  {% assign spotlight = site.research | sort: 'date' | reverse %}
  {% if spotlight.size > 0 %}
  <div class="spotlight-grid">
    {% for post in spotlight limit: 3 %}
    <article class="spotlight-card">
      <span class="spotlight-card__eyebrow">{{ post.date | date: '%Y' }}</span>
      <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
      {% if post.excerpt %}
      <p class="spotlight-card__summary">{{ post.excerpt | strip_html | truncatewords: 30 }}</p>
      {% endif %}
    </article>
    {% endfor %}
  </div>
  {% else %}
  <p>No publications listed yet.</p>
  {% endif %}
</section>

<section class="section">
  <div class="section-header">
    <h2 class="section-title">Recent News</h2>
  </div>
  {% assign recent_posts = site.posts | sort: 'date' | reverse %}
  {% if recent_posts.size > 0 %}
  <ul class="post-list">
    {% for post in recent_posts limit: 3 %}
    <li>
      <article class="post-card">
        <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: '%b %d, %Y' }}</time>
        <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
      </article>
    </li>
    {% endfor %}
  </ul>
  {% endif %}
</section>
