---
layout: null
---
window.LAB_PROJECTS = {
{% for project in site.projects %}
  {{ project.url | relative_url | jsonify }}: {
    title: {{ project.title | jsonify }},
    summary: {{ project.summary | jsonify }},
    category: {{ project.category | jsonify }},
    group: {{ project.group | jsonify }},
    url: {{ project.url | relative_url | jsonify }}
  }{% unless forloop.last %},{% endunless %}
{% endfor %}
};
