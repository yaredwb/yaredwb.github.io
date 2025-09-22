---
layout: default
title: Writing
permalink: /blog/
---

<section class="section">
  <p class="section-lead">Long form notes on computational geomechanics, applied AI experiments, and teaching reflections. New posts will appear at the top of the list.</p>
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
      </article>
    </li>
    {% endfor %}
  </ul>
  {% else %}
  <p>No posts are published yet. Stay tuned.</p>
  {% endif %}
</section>

