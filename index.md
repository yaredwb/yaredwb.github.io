---
layout: default
permalink: /
page_class: home
description: Research scientist working on computational geomechanics and applied AI: numerical modelling, physics-informed machine learning, and software tools for ground engineering.
---

<section class="hero">
  <canvas class="hero-field" aria-hidden="true"></canvas>
  <p class="hero-eyebrow">Research Scientist &middot; SINTEF &middot; Trondheim</p>
  <h1 class="hero-title">Modelling the ground, with physics and AI.</h1>
  <p class="hero-summary">
    I build numerical models and AI-assisted tools for ground engineering: from coupled simulations of soil and rock to physics-informed machine learning and digital workflows for geohazard management.
  </p>
  <div class="hero-actions">
    <a class="button" href="{{ '/research/' | relative_url }}">Explore research</a>
    <a class="button button--ghost" href="{{ '/resume/' | relative_url }}">View CV</a>
  </div>
  <ul class="hero-social">
    <li>
      <a href="https://github.com/yaredwb" aria-label="GitHub">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .297a12 12 0 00-3.79 23.4c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.55-1.4-1.34-1.77-1.34-1.77-1.1-.75.09-.74.09-.74 1.21.09 1.85 1.24 1.85 1.24 1.08 1.84 2.84 1.31 3.53 1 .11-.78.42-1.31.76-1.61-2.67-.31-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.24-.12-.31-.54-1.56.12-3.25 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.69.24 2.94.12 3.25.77.85 1.24 1.92 1.24 3.24 0 4.63-2.8 5.64-5.48 5.95.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.82.58A12 12 0 0012 .297z"/></svg>
        GitHub
      </a>
    </li>
    <li>
      <a href="https://scholar.google.com/citations?user=-QkPGDYAAAAJ&hl=en" aria-label="Google Scholar">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.242 13.769L0 9.5 12 0l12 9.5-5.242 4.269C17.548 11.249 14.978 9.5 12 9.5c-2.977 0-5.548 1.748-6.758 4.269zM12 10a7 7 0 1 0 0 14 7 7 0 0 0 0-14z"/></svg>
        Scholar
      </a>
    </li>
    <li>
      <a href="https://www.linkedin.com/in/yaredworku/" aria-label="LinkedIn">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        LinkedIn
      </a>
    </li>
    <li>
      <a href="https://x.com/yaredwb" aria-label="Twitter/X">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        X
      </a>
    </li>
    <li>
      <a href="mailto:yaredworku@gmail.com" aria-label="Email">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>
        Email
      </a>
    </li>
  </ul>
</section>

<section class="home-section">
  <div class="section-head">
    <h2>Recent research</h2>
    <a class="more-link" href="{{ '/research/' | relative_url }}">All research</a>
  </div>
  {% assign research_posts = site.research | sort: 'date' | reverse %}
  <ol class="entry-list">
    {% for post in research_posts limit: 3 %}
    <li>
      <article class="entry">
        <time class="entry-date" datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: '%b %Y' }}</time>
        <div class="entry-body">
          <h3 class="entry-title"><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
          {% if post.excerpt %}
          <p>{{ post.excerpt | strip_html | truncatewords: 28 }}</p>
          {% endif %}
        </div>
      </article>
    </li>
    {% endfor %}
  </ol>
</section>

<section class="home-section">
  <div class="section-head">
    <h2>Recent writing</h2>
    <a class="more-link" href="{{ '/blog/' | relative_url }}">All writing</a>
  </div>
  {% assign recent_posts = site.posts | sort: 'date' | reverse %}
  <ol class="entry-list">
    {% for post in recent_posts limit: 3 %}
    <li>
      <article class="entry">
        <time class="entry-date" datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: '%b %Y' }}</time>
        <div class="entry-body">
          <h3 class="entry-title"><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
          {% if post.excerpt %}
          <p>{{ post.excerpt | strip_html | truncatewords: 28 }}</p>
          {% endif %}
        </div>
      </article>
    </li>
    {% endfor %}
  </ol>
</section>

<section class="home-section">
  <div class="section-head">
    <h2>Projects &amp; tools</h2>
    <a class="more-link" href="{{ '/resume/' | relative_url }}">Full CV</a>
  </div>
  <ul class="project-grid">
    <li>
      <a class="project-card" href="https://geosim.ai/">
        <h3>GeoSim.AI</h3>
        <p>AI assistants for numerical simulations in geomechanics, demonstrating productivity gains in slope stability assessments.</p>
      </a>
    </li>
    <li>
      <a class="project-card" href="https://3d-terrain-generator.streamlit.app/">
        <h3>3D Terrain Generator</h3>
        <p>Generates 3D terrain plots from XYZ point clouds or geographic bounds, including slope profiles for risk analysis.</p>
      </a>
    </li>
    <li>
      <a class="project-card" href="https://yaredwb.github.io/PINN-Consolidation1D-Paper/">
        <h3>Deep Learning for 1D Consolidation</h3>
        <p>Physics-informed neural networks for soil mechanics and poroelastic consolidation.</p>
      </a>
    </li>
    <li>
      <a class="project-card" href="https://yaredwb.github.io/PMT/">
        <h3>Porous Media Theory</h3>
        <p>Interactive reference for coupled problems in geoengineering, from landslide simulations to heat flow analyses.</p>
      </a>
    </li>
    <li>
      <a class="project-card" href="https://yaredwb.github.io/FDM2D/">
        <h3>FDM2D</h3>
        <p>Finite difference solver for steady-state groundwater flow in 2D, turning research models into accessible tools.</p>
      </a>
    </li>
    <li>
      <a class="project-card" href="https://disfrac.streamlit.app/">
        <h3>DISFRAC</h3>
        <p>Tool for estimating in-situ rock stresses from hydraulic fracturing test data.</p>
      </a>
    </li>
  </ul>
</section>

<section class="home-section">
  <div class="contact-panel">
    <h2>Get in touch</h2>
    <p>For research collaborations, consulting on geotechnical modelling, or questions about my work, write to <a href="mailto:yaredworku@gmail.com">yaredworku@gmail.com</a>.</p>
  </div>
</section>
