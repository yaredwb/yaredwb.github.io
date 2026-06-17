---
layout: default
title: Research
permalink: /research/
show_title: false
---

<header class="page-intro">
  <p class="eyebrow">Research</p>
  <h1>Research notes</h1>
  <p class="lead">Computational geomechanics, numerical modelling, and AI-enabled engineering workflows: published work, prototypes, and in-progress thinking.</p>
</header>

{% assign research_posts = site.research | sort: 'date' | reverse %}
{% if research_posts.size > 0 %}
<ol class="entry-list">
  {% for post in research_posts %}
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
  <h3>No research posts yet</h3>
  <p>Case studies and technical notes are in preparation; check back soon.</p>
</div>
{% endif %}
