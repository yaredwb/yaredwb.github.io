---
layout: default
title: Home
---

## Welcome

Welcome to my website. Look around to learn more about me and my professional and personal interests. You will find my resume, a portfolio of my professional and hobby research activities, teaching and supervision assignments I have undertaken and blog posts where I write about topics that are of interest to me.

A little bit personal info about me: I was born and raised in Addis Ababa, Ethiopia. After studying my BSc in Civil Engineering back home, I moved to Norway to pursue my graduate studies. I have been living, studying and working in Norway since then.

## Recent Posts

{% for post in site.posts limit:5 %}
<article class="post-preview">
  <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
  <p class="post-meta">{{ post.date | date: "%B %d, %Y" }}</p>
  <div class="post-excerpt">
    {{ post.content | strip_html | truncatewords: 50 }}
  </div>
  <a href="{{ post.url | relative_url }}" class="read-more">Read more →</a>
</article>
{% endfor %}

<p><a href="/blog.html">View all posts →</a></p>
