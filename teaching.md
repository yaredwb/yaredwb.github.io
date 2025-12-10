---
layout: default
title: Teaching
permalink: /teaching/
show_title: false
---

<section class="section">
  <header class="page-header">
    <h1>Teaching</h1>
  </header>
  <p class="section-lead">Course materials, computational notebooks, and resources for numerical methods, scientific programming, and geotechnical engineering.</p>
  
  {% assign teaching_posts = site.teaching | sort: 'date' | reverse %}
  {% if teaching_posts.size > 0 %}
  <ul class="post-list">
    {% for post in teaching_posts %}
    <li>
      <article class="post-card">
        <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: '%b %d, %Y' }}</time>
        <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
        {% if post.excerpt %}
        <p>{{ post.excerpt | strip_html | truncatewords: 30 }}</p>
        {% endif %}
      </article>
    </li>
    {% endfor %}
  </ul>
  {% else %}
  <div class="empty-state">
    <p>Teaching materials are in preparation.</p>
  </div>
  {% endif %}
</section>
