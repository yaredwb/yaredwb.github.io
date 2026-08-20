---
layout: default
title: Archive
permalink: /blog/
show_title: false
---

<header class="page-intro">
  <p class="eyebrow">Archive</p>
  <h1>Archive</h1>
  <p class="lead">Older essays and notes from 2014&ndash;2015, kept here for the record: books, travel, puzzles, and other detours. For current work, see <a href="{{ '/research/' | relative_url }}">Research</a> and <a href="{{ '/teaching/' | relative_url }}">Teaching</a>.</p>
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
  <h3>Nothing here yet</h3>
  <p>The archive is empty.</p>
</div>
{% endif %}
