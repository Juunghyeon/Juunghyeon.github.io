---
title: "Projects"
permalink: /projects/
layout: single
author_profile: true
---

{% assign sorted_projects = site.projects | sort: "date" | reverse %}

{% for project in sorted_projects %}
### [{{ project.title }}]({{ project.url }})

**Period:** {{ project.period }}  
**Category:** {{ project.category }}  
{% if project.role %}**Role:** {{ project.role }}  
{% endif %}{% if project.award %}**Award:** {{ project.award }}  
{% endif %}
**Skills:** {% for skill in project.skills %}`{{ skill }}`{% unless forloop.last %} {% endunless %}{% endfor %}

---
{% endfor %}
