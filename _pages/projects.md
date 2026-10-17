---
title: "Projects"
permalink: /projects/
layout: single
author_profile: true
---

<style>
@import url('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,400;0,700;1,400&display=swap');

.pub-list {
  font-family: 'Lato', Verdana, Helvetica, sans-serif;
  max-width: 720px;
  margin: 1.2em 0 2em;
}
.pub-list a {
  color: #1772d0;
  text-decoration: none;
}
.pub-list a:hover {
  color: #f09228;
}
.pub-row {
  display: flex;
  gap: 1.4em;
  align-items: flex-start;
  padding: 1.4em 0;
}
.pub-row__thumb {
  flex: 0 0 160px;
  width: 160px;
  height: 120px;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 2.2em;
}
.pub-row__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.pub-row__title {
  font-weight: 700;
  font-size: 1.05em;
  line-height: 1.35;
}
.pub-row__meta {
  font-size: 0.85em;
  opacity: 0.7;
  margin: 0.35em 0 0;
}
.pub-row__award {
  font-size: 0.85em;
  color: #9a6b12;
  margin: 0.3em 0 0;
}
.pub-row__summary {
  font-size: 0.92em;
  line-height: 1.5;
  margin: 0.5em 0 0;
}
.pub-row__role {
  font-size: 0.85em;
  font-style: italic;
  opacity: 0.7;
  margin: 0.4em 0 0;
}
</style>

{% assign sorted_projects = site.projects | sort: "date" | reverse %}
{% assign thumb_gradients = "135deg, #33475f, #1b2733|135deg, #3f6b58, #1e3327|135deg, #6b4f33, #33230f|135deg, #5b3f6b, #2a1a33" | split: "|" %}

<div class="pub-list" markdown="0">
{% for project in sorted_projects %}
  {% assign gradient_index = forloop.index0 | modulo: 4 %}
  {% assign gradient = thumb_gradients[gradient_index] %}
  <div class="pub-row">
    <a class="pub-row__thumb" href="{{ project.url | relative_url }}" style="background: linear-gradient({{ gradient }});">
      {% if project.header.teaser %}
        <img src="{{ project.header.teaser | relative_url }}" alt="">
      {% else %}
        <i class="fas fa-{{ project.icon | default: "diagram-project" }}" aria-hidden="true"></i>
      {% endif %}
    </a>
    <div class="pub-row__body">
      <a class="pub-row__title" href="{{ project.url | relative_url }}">{{ project.title }}</a>
      <p class="pub-row__meta">{{ project.period }}{% if project.category %} &middot; {{ project.category }}{% endif %}{% if project.status %} &middot; {{ project.status }}{% endif %}</p>
      {% if project.award %}<p class="pub-row__award"><i class="fas fa-award" aria-hidden="true"></i> {{ project.award }}</p>{% endif %}
      {% if project.summary %}<p class="pub-row__summary">{{ project.summary }}</p>{% endif %}
      {% if project.role %}<p class="pub-row__role">Role: {{ project.role }}{% if project.team %}, {{ project.team }}{% endif %}</p>{% endif %}
    </div>
  </div>
{% endfor %}
</div>
