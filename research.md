---
layout: default
title: Research
permalink: /research/
show_title: false
---

<section class="section">
  <div class="section-header">
    <h1 class="section-title">Research</h1>
    <p class="section-lead">Computational geomechanics, physics-informed machine learning, and numerical methods for coupled problems in porous media. These notes capture ongoing work, published findings, and tool development.</p>
  </div>
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
        <p class="post-card-meta">{{ post.tags | join: ', ' }}</p>
        {% endif %}
      </article>
    </li>
    {% endfor %}
  </ul>
  {% else %}
  <div class="empty-state">
    <h3>Research notes coming soon</h3>
    <p>Case studies and technical notes are in preparation. In the meantime, see my <a href="{{ '/resume/' | relative_url }}">publications list</a>.</p>
  </div>
  {% endif %}
</section>

<section class="section section--alt">
  <div class="cta-panel">
    <h2>Research Collaboration</h2>
    <p>I welcome opportunities for joint research, co-supervision of students, or collaboration on computational geomechanics projects.</p>
    <div class="hero-actions">
      <a class="button" href="mailto:yaredworku@gmail.com">Get in touch</a>
      <a class="button button--ghost" href="{{ '/resume/' | relative_url }}">View CV</a>
    </div>
  </div>
</section>
