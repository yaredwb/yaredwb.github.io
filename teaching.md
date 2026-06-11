---
layout: default
title: Teaching
permalink: /teaching/
show_title: false
---

<header class="page-intro">
  <p class="eyebrow">Teaching</p>
  <h1>Teaching &amp; learning</h1>
  <p class="lead">Lecture notes, computational notebooks, and worked examples on numerical methods and scientific computing for geotechnical engineering.</p>
</header>

{% assign teaching_posts = site.teaching | sort: 'date' | reverse %}
{% if teaching_posts.size > 0 %}
<ol class="entry-list">
  {% for post in teaching_posts %}
  <li>
    <article class="entry">
      <time class="entry-date" datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: '%b %d, %Y' }}</time>
      <div class="entry-body">
        <h2 class="entry-title"><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
        {% if post.excerpt %}
        <p>{{ post.excerpt | strip_html | truncatewords: 36 }}</p>
        {% endif %}
        {% if post.tags and post.tags.size > 0 %}
        <p class="entry-tags">{{ post.tags | join: ' · ' }}</p>
        {% endif %}
      </div>
    </article>
  </li>
  {% endfor %}
</ol>
{% else %}
<div class="empty-state">
  <h3>Teaching resources are coming soon</h3>
  <p>Materials for upcoming workshops and course modules are in preparation.</p>
</div>
{% endif %}
