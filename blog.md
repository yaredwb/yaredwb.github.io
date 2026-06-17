---
layout: default
title: Writing
permalink: /blog/
show_title: false
---

<header class="page-intro">
  <p class="eyebrow">Writing</p>
  <h1>Writing &amp; field notes</h1>
  <p class="lead">Essays, retrospectives, and notes that connect computational research with practice: technical walkthroughs, commentary, and the occasional detour.</p>
</header>

{% assign posts = site.posts | sort: 'date' | reverse %}
{% if posts.size > 0 %}
<ol class="entry-list">
  {% for post in posts %}
  <li>
    <article class="entry">
      <time class="entry-date" datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: '%b %d, %Y' }}</time>
      <div class="entry-body">
        <h2 class="entry-title"><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
        {% if post.excerpt %}
        <p>{{ post.excerpt | strip_html | truncatewords: 36 }}</p>
        {% endif %}
        {% if post.categories and post.categories.size > 0 %}
        <p class="entry-tags">{{ post.categories | join: ' · ' }}</p>
        {% endif %}
      </div>
    </article>
  </li>
  {% endfor %}
</ol>
{% else %}
<div class="empty-state">
  <h3>No posts yet</h3>
  <p>Fresh writing is in the works; follow along on <a href="https://x.com/yaredwb">X</a>.</p>
</div>
{% endif %}
