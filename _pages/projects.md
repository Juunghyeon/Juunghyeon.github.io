---
title: "Projects"
permalink: /projects/
layout: single
author_profile: true
---

<style>
.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5em;
  margin: 1.5em 0 2em;
}
.project-card {
  display: flex;
  flex-direction: column;
  border-radius: 6px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  background: #fff;
  border: 1px solid #e6e6e6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.project-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.14);
  text-decoration: none;
}
.project-card__thumb {
  aspect-ratio: 4 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 2.6em;
}
.project-card__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.project-card__body {
  padding: 1em 1.1em 1.2em;
}
.project-card__meta {
  font-size: 0.78em;
  opacity: 0.65;
  margin: 0 0 0.4em;
}
.project-card__title {
  font-size: 1.05em;
  line-height: 1.3;
  margin: 0 0 0.5em;
}
.project-card__award {
  font-size: 0.8em;
  color: #9a6b12;
  margin: 0 0 0.6em;
}
.project-card__skills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35em;
}
.project-card__skills span {
  font-size: 0.72em;
  background: rgba(0, 0, 0, 0.06);
  padding: 0.15em 0.55em;
  border-radius: 999px;
}
</style>

{% assign sorted_projects = site.projects | sort: "date" | reverse %}
{% assign thumb_gradients = "135deg, #33475f, #1b2733|135deg, #3f6b58, #1e3327|135deg, #6b4f33, #33230f|135deg, #5b3f6b, #2a1a33" | split: "|" %}

<div class="project-grid" markdown="0">
{% for project in sorted_projects %}
  {% assign gradient_index = forloop.index0 | modulo: 4 %}
  {% assign gradient = thumb_gradients[gradient_index] %}
  <a class="project-card" href="{{ project.url | relative_url }}">
    <div class="project-card__thumb" style="background: linear-gradient({{ gradient }});">
      {% if project.header.teaser %}
        <img src="{{ project.header.teaser | relative_url }}" alt="">
      {% else %}
        <i class="fas fa-{{ project.icon | default: "diagram-project" }}" aria-hidden="true"></i>
      {% endif %}
    </div>
    <div class="project-card__body">
      <p class="project-card__meta">{{ project.period }}{% if project.category %} &middot; {{ project.category }}{% endif %}</p>
      <h3 class="project-card__title">{{ project.title }}</h3>
      {% if project.award %}
        <p class="project-card__award"><i class="fas fa-award" aria-hidden="true"></i> {{ project.award | split: "," | first }}</p>
      {% elsif project.status %}
        <p class="project-card__award">{{ project.status }}</p>
      {% endif %}
      <div class="project-card__skills">
        {% for skill in project.skills %}<span>{{ skill }}</span>{% endfor %}
      </div>
    </div>
  </a>
{% endfor %}
</div>
