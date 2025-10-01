---
layout: default
title: Writing
permalink: /blog/
---

<section class="section">
  <p class="section-lead">Long-form notes on and reflections on various topics.</p>
  {% assign posts = site.posts | sort: 'date' | reverse %}
  {% if posts.size > 0 %}
  <ul class="post-list">
    {% for post in posts %}
    <li>
      <article class="post-card">
        <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: '%b %d, %Y' }}</time>
        <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
        {% if post.excerpt %}
        <p>{{ post.excerpt | strip_html | truncatewords: 36 }}</p>
        {% endif %}
        {% if post.categories %}
        <p class="post-card-meta">
          <small>{{ post.categories | join: ', ' }}</small>
        </p>
        {% endif %}
      </article>
    </li>
    {% endfor %}
  </ul>
  {% else %}
  <div class="empty-state">
    <h3>No Posts Yet</h3>
    <p>New content is being prepared. Check back soon for insights on computational methods, research findings, and engineering innovations.</p>
  </div>
  {% endif %}
</section>

