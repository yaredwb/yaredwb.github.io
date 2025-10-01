---
layout: default
title: Research
permalink: /research/
---

<section class="section">
<div style="display: flex; justify-content: center;">
    <div style="max-width: 700px; width: 100%;">
        <p class="section-lead" style="text-align: center;">
            Research notes, project updates, and technical explorations in computational geomechanics, AI applications, and engineering innovation. New posts will appear at the top of the list.
        </p>
        {% assign research_posts = site.research | sort: 'date' | reverse %}
        {% if research_posts.size > 0 %}
        <ul class="post-list" style="padding-left: 0;">
            {% for post in research_posts %}
            <li style="list-style: none;">
                <article class="post-card" style="margin-bottom: 2em;">
                    <time datetime="{{ post.date | date_to_xmlschema }}" style="display: block; text-align: center;">{{ post.date | date: '%b %d, %Y' }}</time>
                    <h3 style="text-align: center;"><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
                    {% if post.excerpt %}
                    <p style="text-align: center;">{{ post.excerpt | strip_html | truncatewords: 36 }}</p>
                    {% endif %}
                    {% if post.tags %}
                    <p class="post-card-meta" style="text-align: center;">
                        <small>{{ post.tags | join: ', ' }}</small>
                    </p>
                    {% endif %}
                </article>
            </li>
            {% endfor %}
        </ul>
        {% else %}
        <div class="empty-state" style="text-align: center;">
            <h3>No Research Posts Yet</h3>
            <p>New research content is being prepared. Check back soon for insights on computational methods, research findings, and engineering innovations.</p>
        </div>
        {% endif %}
    </div>
</div>
</section>

---