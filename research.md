---
layout: default
title: Research
permalink: /research/
show_title: false
---

<section class="section">
  <div class="section-header">
    <h1 class="section-title">Research Notes</h1>
    <p class="section-lead">Exploring computational geomechanics, numerical modelling, and AI-enabled engineering workflows. These updates capture in-progress thinking, published work, and prototypes that move research ideas into the field.</p>
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
    <h3>No research posts yet</h3>
    <p>I am currently preparing case studies and technical notes&mdash;check back soon or reach out directly to discuss ongoing work.</p>
  </div>
  {% endif %}
</section>

<section class="section section--alt">
  <div class="cta-panel">
    <h2>Partner on applied research.</h2>
    <p>Interested in co-developing tools, validating a concept, or stress-testing a numerical model? I'd love to collaborate on projects that push geotechnical engineering forward.</p>
    <div class="hero-actions">
      <a class="button" href="mailto:yaredworku@gmail.com">Propose a collaboration</a>
      <a class="button button--ghost" href="{{ '/resume/' | relative_url }}">Review credentials</a>
    </div>
  </div>
</section>
