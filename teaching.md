---
layout: default
title: Teaching
permalink: /teaching/
show_title: false
---

<section class="section">
  <div class="section-header">
    <h1 class="section-title">Teaching &amp; Supervision</h1>
    <p class="section-lead">Course materials, computational notebooks, and resources for students and engineers in numerical methods, scientific programming, and geotechnical engineering.</p>
  </div>
  {% assign teaching_posts = site.teaching | sort: 'date' | reverse %}
  {% if teaching_posts.size > 0 %}
  <ul class="post-list">
    {% for post in teaching_posts %}
    <li>
      <article class="post-card">
        <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: '%b %d, %Y' }}</time>
        <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
        {% if post.excerpt %}
        <p>{{ post.excerpt | strip_html | truncatewords: 36 }}</p>
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
    <p>Lecture notes and tutorial notebooks are in preparation.</p>
  </div>
  {% endif %}
</section>

<section class="section section--alt">
  <div class="cta-panel">
    <h2>Guest Lectures &amp; Seminars</h2>
    <p>I am available for guest lectures, seminars, or workshops on computational geomechanics, physics-informed machine learning, and scientific programming.</p>
    <div class="hero-actions">
      <a class="button" href="mailto:yaredworku@gmail.com">Contact</a>
      <a class="button button--ghost" href="{{ '/blog/' | relative_url }}">Notes &amp; Essays</a>
    </div>
  </div>
</section>
