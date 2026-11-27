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
.pub-section {
  --sec: #2f8f80;
}
.pub-list a {
  color: var(--sec);
  text-decoration: none;
}
.pub-list a:hover {
  text-decoration: underline;
}
.pub-row {
  display: flex;
  gap: 1.4em;
  align-items: flex-start;
  padding: 1.4em 0;
}
.pub-row + .pub-row {
  border-top: 1px solid #eceff3;
}
.pub-row__thumb {
  position: relative;
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
.pub-row__thumb::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  background: var(--sec);
}
.pub-list .pub-row__title {
  color: var(--sec);
  font-weight: 700;
  font-size: 1.05em;
  line-height: 1.35;
}
.pub-row__authors {
  font-size: 0.85em;
  margin: 0.3em 0 0;
}
.pub-row__meta {
  font-size: 0.85em;
  opacity: 0.7;
  margin: 0.35em 0 0;
}
.pub-row__award {
  font-size: 0.85em;
  color: #6b5a3a;
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
.pub-row__paper {
  font-size: 0.9em;
  font-weight: 700;
  margin: 0.45em 0 0;
}
.pub-section-title {
  font-family: 'Lato', Verdana, Helvetica, sans-serif;
  font-weight: 700;
  font-size: 1.2em;
  margin: 1.6em 0 0.3em;
  padding-left: 0.6em;
  border-left: 5px solid var(--sec);
  border-bottom: 0;
}
.pub-section-blurb {
  padding-left: calc(0.6em + 5px);
}
.pub-section-blurb {
  font-family: 'Lato', Verdana, Helvetica, sans-serif;
  font-size: 0.92em;
  opacity: 0.75;
  margin: 0 0 0.4em;
}
</style>


{%- comment -%} Sections, colours and blurbs live in _data/project_groups.yml. {%- endcomment -%}
{% for section in site.data.project_groups %}
{% assign group_projects = site.projects | where: "group", section.key | sort: "date" | reverse %}
{% if group_projects.size > 0 %}
<div class="pub-section" style="--sec: {{ section.color }};" markdown="0">
<h2 class="pub-section-title">{{ section.label }}</h2>
<p class="pub-section-blurb">{{ section.blurb }}</p>
<div class="pub-list">
{% for project in group_projects %}
  <div class="pub-row">
    <a class="pub-row__thumb" href="{{ project.url | relative_url }}" style="background: linear-gradient(135deg, {{ section.color }}, #1b2733);">
      {% if project.header.teaser %}
        <img src="{{ project.header.teaser | relative_url }}" alt="">
      {% else %}
        <i class="fas fa-{{ project.icon | default: "diagram-project" }}" aria-hidden="true"></i>
      {% endif %}
    </a>
    <div class="pub-row__body">
      <a class="pub-row__title" href="{{ project.url | relative_url }}">{{ project.title }}</a>
      {% if project.authors %}<p class="pub-row__authors">{{ project.authors | markdownify | remove: '<p>' | remove: '</p>' | strip }}</p>{% endif %}
      <p class="pub-row__meta">{{ project.period }}{% if project.category %} &middot; {{ project.category }}{% endif %}{% if project.status %} &middot; {{ project.status }}{% if project.venue %}, {{ project.venue }}{% endif %}{% endif %}</p>
      {% if project.award %}<p class="pub-row__award"><i class="fas fa-award" aria-hidden="true"></i> {{ project.award }}</p>{% endif %}
      {% assign sum = project.home_result | default: project.summary %}{% if sum %}<p class="pub-row__summary">{{ sum }}</p>{% endif %}
      {% if project.role and project.authors == nil %}<p class="pub-row__role">Role: {{ project.role }}{% if project.team %}, {{ project.team }}{% endif %}</p>{% endif %}
      {% if project.paper_pdf %}<p class="pub-row__paper"><a href="{{ project.paper_pdf | relative_url }}" aria-label="Preprint PDF for {{ project.title | escape }}">Preprint PDF</a></p>{% endif %}
    </div>
  </div>
{% endfor %}
</div>
</div>
{% endif %}
{% endfor %}
