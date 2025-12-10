---
layout: default
title: Research
permalink: /research/
show_title: false
---

<section class="section">
  <header class="page-header">
    <h1>Research</h1>
  </header>
  <p class="section-lead">My research focuses on computational geomechanics, physics-informed machine learning, and numerical methods for coupled problems in porous media.</p>
  
  {% assign research_posts = site.research | sort: 'date' | reverse %}
  {% if research_posts.size > 0 %}
  <ul class="post-list">
    {% for post in research_posts %}
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
    <p>Research notes coming soon. See my <a href="{{ '/resume/' | relative_url }}">publications</a> for published work.</p>
  </div>
  {% endif %}
</section>
