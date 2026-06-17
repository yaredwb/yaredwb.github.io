---
layout: default
title: Teaching
permalink: /teaching/
show_title: false
---

<header class="page-intro">
  <p class="eyebrow">Teaching</p>
  <h1>Teaching &amp; supervision</h1>
  <p class="lead">Graduate courses in computational and theoretical geomechanics, postgraduate thesis supervision, and openly shared lecture notes on numerical methods for geotechnical engineering.</p>
</header>

<section class="teaching-section">
  <div class="section-head">
    <h2>Graduate courses</h2>
  </div>
  <p class="teaching-note">Designed and taught as visiting graduate faculty at <strong>Addis Ababa Science and Technology University (AASTU)</strong>, Department of Civil Engineering, between 2017 and 2023. Each was delivered as an intensive block course, condensed into a few concentrated weeks during visits to Addis Ababa, with full lecture notes, slides, runnable code, and exercises.</p>

  <div class="course-list">
    <article class="course">
      <header class="course__head">
        <h3 class="course__title">Advanced Computational Methods in Geotechnical Engineering</h3>
        <p class="course__meta">CENG6202 &middot; MSc &middot; 2017, 2019</p>
      </header>
      <p class="course__desc">Introduces advanced numerical methods with a focus on practical geotechnical applications: from the mathematical foundations, through the finite difference and finite element methods, to hands-on finite element modelling of real soil&ndash;structure problems and an outlook on hybrid methods. Assessment combined programming assignments with a written exam.</p>
      <div class="course__outline">
        <p class="course__outline-label">Syllabus</p>
        <ol class="course__topics">
          <li>Geotechnical analysis: analysis and design requirements, theoretical considerations, idealised computational domains, analysis methods</li>
          <li>Mathematical preliminaries: vectors, matrices, and linear systems of equations</li>
          <li>The finite difference method: steady-state groundwater flow and one-dimensional consolidation in 1D and 2D</li>
          <li>The finite element method: discretisation, shape functions, element formulation and assembly; constitutive models (linear elasticity, Mohr&ndash;Coulomb, Modified Cam-Clay); numerical simulations</li>
          <li>Introduction to hybrid methods: boundary element, discrete element, and coupled methods</li>
        </ol>
      </div>
    </article>

    <article class="course">
      <header class="course__head">
        <h3 class="course__title">Constitutive Modelling in Geomechanics</h3>
        <p class="course__meta">Graduate course &middot; 2023</p>
      </header>
      <p class="course__desc">A graduate course on the mechanical behaviour of soils and the theory behind the constitutive models used in geotechnical simulation: building from continuum-mechanics foundations through elasticity and elasto-plasticity to critical-state soil mechanics. Supported by tensor-analysis and stress-state exercises and a written assignment comparing soil models and their implementation in finite element software.</p>
      <div class="course__outline">
        <p class="course__outline-label">Syllabus</p>
        <ol class="course__topics">
          <li>Introduction: soil behaviour and boundary value problems; why constitutive models are needed; the oedometer and triaxial tests</li>
          <li>Continuum mechanics: tensors and indicial notation; stress and strain tensors, principal values, and deviatoric, octahedral and invariant measures</li>
          <li>Soil behaviour: the triaxial stress&ndash;strain space; yield, hardening, dilatancy, failure, and the critical state</li>
          <li>Elastic response: Hooke&rsquo;s law and the elastic constants; isotropy, anisotropy, cross-anisotropy, and hyperelasticity</li>
          <li>Plastic response I: failure criteria (Mohr&ndash;Coulomb, Drucker&ndash;Prager, Tresca, von Mises, Matsuoka&ndash;Nakai); plastic flow, consistency, normality and the associated flow rule</li>
          <li>Plastic response II: dilatancy and non-associated flow; strain hardening and softening; hardening rules and an outlook to cap, critical-state (Cam-Clay) and bounding-surface models</li>
        </ol>
      </div>
    </article>
  </div>
</section>

<section class="teaching-section">
  <div class="section-head">
    <h2>Lecture notes &amp; worked examples</h2>
  </div>
  <p class="teaching-note">Selected material from these courses, written up as standalone notes with runnable code.</p>
  {% assign teaching_posts = site.teaching | sort: 'date' | reverse %}
  {% if teaching_posts.size > 0 %}
  <ol class="entry-list">
    {% for post in teaching_posts %}
    <li>
      <article class="entry">
        <time class="entry-date" datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: '%b %d, %Y' }}</time>
        <div class="entry-body">
          <h3 class="entry-title"><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
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
    <h3>Lecture notes are in preparation</h3>
    <p>Worked examples from the courses above will appear here.</p>
  </div>
  {% endif %}
</section>
