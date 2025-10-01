---
layout: default
title: Research
permalink: /research/
---

<section class="section">
  <p class="section-lead">Research notes, project updates, and technical explorations in computational geomechanics, AI applications, and engineering innovation.</p>
  
  {% assign research_posts = site.research | sort: 'date' | reverse %}
  {% if research_posts.size > 0 %}
  <ul class="post-list">
    {% for post in research_posts %}
    <li>
      <article class="post-card">
        <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: '%b %d, %Y' }}</time>
        <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
        {% if post.excerpt %}
        <p>{{ post.excerpt | strip_html | truncatewords: 36 }}</p>
        {% endif %}
        {% if post.tags %}
        <p class="post-card-meta">
          <small>{{ post.tags | join: ', ' }}</small>
        </p>
        {% endif %}
      </article>
    </li>
    {% endfor %}
  </ul>
  {% else %}
  <div class="empty-state">
    <h3>No Research Posts Yet</h3>
    <p>New research content is being prepared. Check back soon for insights on computational methods, research findings, and engineering innovations.</p>
  </div>
  {% endif %}
</section>

---