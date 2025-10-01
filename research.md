---
layout: default
title: Research
permalink: /research/
---

<section class="section">
  <p class="section-lead">Research notes, project updates, and technical explorations in computational geomechanics, AI applications, and engineering innovation. New posts will appear at the top of the list.</p>
  
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

## Quick Links

### Web Applications
- **3D Terrain Generator:** Interactive web tool for producing terrain visualisations and testing computational methods for surface modelling.
- **Geez Text Analyzer:** Natural language processing prototype that supports Geez script input for Ethiopian languages.
- **Consolidation 1D:** Streamlit app that demonstrates one dimensional consolidation behaviour for teaching and consulting engagements.
- **Deep learning for consolidation:** Physics informed neural network explorations hosted on GitHub Pages.

### Key Publications
- Mixed method for isogeometric analysis of coupled flow and deformation in poroelastic media (2022).
- Physics informed deep learning for one dimensional consolidation (2020).
- Energy Geostructures: shallow geothermal energy extraction and storage (2022).
- Isogeometric Analysis of Coupled Problems in Porous Media (PhD dissertation).

### Open Source Projects
- **IFEM:** C++ implementations of isogeometric finite element formulations for coupled porous media problems.
- **GeoSim.AI:** Generative AI assistants that augment geomechanics workflows such as landslide risk assessments.
- **Geez Analyzer:** Python utilities for text analysis in Ethiopian languages with focus on mechanics inspired tooling.

For more details visit my [GitHub profile](https://github.com/yaredwb).

