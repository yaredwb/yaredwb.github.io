---
layout: default
title: About
permalink: /
page_class: home
show_title: false
---

<div class="hero">
  <h1 class="hero-title">Yared W. Bekele</h1>
  <p class="hero-tagline">Research Scientist · Computational Geomechanics · PhD</p>
  <p class="hero-summary">
    I develop numerical methods and machine learning approaches for geotechnical engineering problems. My research focuses on coupled processes in porous media, physics-informed neural networks, and tools that bridge rigorous mechanics with practical engineering applications.
  </p>
  <div class="hero-links">
    <a href="https://scholar.google.com/citations?user=-QkPGDYAAAAJ&hl=en">Google Scholar</a>
    <a href="https://github.com/yaredwb">GitHub</a>
    <a href="https://www.linkedin.com/in/yaredworku/">LinkedIn</a>
  </div>
</div>

<section class="section">
  <h2 class="section-title">Explore</h2>
  <div class="card-grid">
    <article class="card">
      <h3><a href="{{ '/research/' | relative_url }}">Research</a></h3>
      <p>Computational geomechanics, physics-informed neural networks, and coupled hydro-thermo-mechanical modelling.</p>
    </article>
    <article class="card">
      <h3><a href="{{ '/resume/' | relative_url }}">Publications</a></h3>
      <p>Journal articles, conference papers, and technical reports on numerical methods and machine learning for geoscience.</p>
    </article>
    <article class="card">
      <h3><a href="{{ '/teaching/' | relative_url }}">Teaching</a></h3>
      <p>Course materials and resources for numerical methods, scientific programming, and geotechnical engineering.</p>
    </article>
    <article class="card">
      <h3><a href="{{ '/blog/' | relative_url }}">Writing</a></h3>
      <p>Notes on computational methods, technology, and occasional reflections from research and practice.</p>
    </article>
  </div>
</section>

<section class="section">
  <h2 class="section-title">Selected Publications</h2>
  <ul class="pub-list">
    <li>
      <span class="pub-title">Physics-informed deep learning for one-dimensional consolidation.</span>
      <span class="pub-venue">Journal of Rock Mechanics and Geotechnical Engineering</span>, 
      <span class="pub-year">2021</span>
    </li>
    <li>
      <span class="pub-title">Mixed Method for Isogeometric Analysis of Coupled Flow and Deformation in Poroelastic Media.</span>
      <span class="pub-venue">Applied Sciences</span>, 
      <span class="pub-year">2022</span>
    </li>
    <li>
      <span class="pub-title">Isogeometric analysis of THM coupled processes in ground freezing.</span>
      <span class="pub-venue">Computers and Geotechnics</span>, 
      <span class="pub-year">2017</span>
    </li>
    <li>
      <span class="pub-title">Adaptive isogeometric finite element analysis of steady-state groundwater flow.</span>
      <span class="pub-venue">Int. J. for Numerical and Analytical Methods in Geomechanics</span>, 
      <span class="pub-year">2016</span>
    </li>
  </ul>
  <p style="margin-top: var(--space-md);"><a href="{{ '/resume/' | relative_url }}#selected-publications">View all publications →</a></p>
</section>

<section class="section">
  <h2 class="section-title">Recent Notes</h2>
  {% assign recent_posts = site.posts | sort: 'date' | reverse %}
  {% if recent_posts.size > 0 %}
  <ul class="post-list">
    {% for post in recent_posts limit: 3 %}
    <li>
      <article class="post-card">
        <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: '%b %d, %Y' }}</time>
        <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
      </article>
    </li>
    {% endfor %}
  </ul>
  {% else %}
  <p class="empty-state">New posts coming soon.</p>
  {% endif %}
</section>
