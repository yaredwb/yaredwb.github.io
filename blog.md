---
layout: default
title: Blog
---

Below are posts imported from my previous WordPress site.

<ul>
{% for post in site.posts %}
  <li><a href="{{ post.url }}">{{ post.title }}</a> ({{ post.date | date: "%b %-d, %Y" }})</li>
{% endfor %}
</ul>
