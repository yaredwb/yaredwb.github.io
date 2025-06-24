---
layout: default
title: Blog
---

## Blog Posts

{% for post in site.posts %}
<article class="post-preview">
  <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
  <p class="post-meta">{{ post.date | date: "%B %d, %Y" }}{% if post.categories %} | Categories: {{ post.categories | join: ", " }}{% endif %}</p>
  <div class="post-excerpt">
    {{ post.content | strip_html | truncatewords: 30 }}
  </div>
  <a href="{{ post.url | relative_url }}" class="read-more">Read more →</a>
</article>
<hr>
{% endfor %}