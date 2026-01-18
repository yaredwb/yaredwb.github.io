---
layout: default
title: Writing
permalink: /blog/
show_title: false
---

<section class="section">
  <div class="section-header">
    <h1 class="section-title">Writing &amp; Field Notes</h1>
    <p class="section-lead">Ideas-in-progress, project retrospectives, and frameworks that connect computational research with practice. Expect a mix of technical walkthroughs, commentary, and experiments.</p>
  </div>
  {% assign posts = site.posts | sort: 'date' | reverse %}
  {% if posts.size > 0 %}
  <ul class="post-list">
    {% for post in posts %}
    <li>
      <article class="post-card">
        <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: '%b %d, %Y' }}</time>
        <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
        {% if post.excerpt %}
        <p>{{ post.excerpt | strip_html | truncatewords: 42 }}</p>
        {% endif %}
        {% if post.categories %}
        <p class="post-card-meta">{{ post.categories | join: ', ' }}</p>
        {% endif %}
      </article>
    </li>
    {% endfor %}
  </ul>
  {% else %}
  <div class="empty-state">
    <h3>No posts yet</h3>
    <p>Fresh writing is in the works. Follow along on <a href="https://x.com/yaredwb">Twitter/X</a> to be notified when new pieces are published.</p>
  </div>
  {% endif %}
</section>

<section class="section section--alt">
  <div class="cta-panel">
    <h2>Stay in the loop.</h2>
    <p>Follow along on <a href="https://x.com/yaredwb">Twitter/X</a> for new articles, project breakdowns, and teaching updates.</p>
    <div class="hero-actions">
      <a class="button" href="https://x.com/yaredwb">Follow on X</a>
      <a class="button button--ghost" href="{{ '/' | relative_url }}">Explore research</a>
    </div>
  </div>
</section>
