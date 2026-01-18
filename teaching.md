---
layout: default
title: Teaching
permalink: /teaching/
show_title: false
---

<section class="section">
  <div class="section-header">
    <h1 class="section-title">Teaching &amp; Learning</h1>
    <p class="section-lead">Lecture notes, computational notebooks, and mentorship resources for engineers who want to wield numerical methods, coding practices, and AI responsibly in geotechnical settings.</p>
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
    <h3>Teaching resources are coming soon</h3>
    <p>Materials for upcoming workshops and course modules are in preparation. Reach out if you would like me to tailor content for your team or classroom.</p>
  </div>
  {% endif %}
</section>

<section class="section section--alt">
  <div class="cta-panel">
    <h2>Invite a workshop or guest lecture.</h2>
    <p>From hands-on Python for engineers to applied AI in design offices, I craft sessions that meet people where they are and deliver usable skills.</p>
    <div class="hero-actions">
      <a class="button" href="mailto:yaredworku@gmail.com">Discuss a workshop</a>
      <a class="button button--ghost" href="{{ '/resume/' | relative_url }}">View my credentials</a>
    </div>
  </div>
</section>
