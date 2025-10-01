---
layout: default
title: Teaching
permalink: /teaching/
---

<section class="section">
<div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
    <p class="section-lead" style="text-align: center; max-width: 700px;">
        Lecture notes, code examples, and educational materials on computational methods, geomechanics, and numerical modeling. New teaching content will appear at the top of the list.
    </p>
    
    {% assign teaching_posts = site.teaching | sort: 'date' | reverse %}
    {% if teaching_posts.size > 0 %}
    <ul class="post-list" style="width: 100%; max-width: 700px;">
        {% for post in teaching_posts %}
        <li>
            <article class="post-card" style="text-align: center;">
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
    <div class="empty-state" style="text-align: center;">
        <h3>No Teaching Posts Yet</h3>
        <p>New teaching materials and lecture notes are being prepared. Check back soon for computational methods tutorials and course materials.</p>
    </div>
    {% endif %}
</div>
</section>