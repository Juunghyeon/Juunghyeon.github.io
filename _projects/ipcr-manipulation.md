---
title: "Feasible Is Not Faithful: Intent-Preserving Constraint Realization for Contact Tasks on Unknown Surfaces"
permalink: /projects/ipcr-manipulation/
date: 2026-11-01
period: "Sep.2025 -- Present"
category: "Robot Learning · Contact-Rich Manipulation"
status: "Preprint (arXiv) · Manuscript in Preparation"
role: "First Author"
award: "Master's Research Encouragement Grant, National Research Foundation of Korea (2025)"
skills: ["Python", "NMPC", "Contact Mechanics", "ROS2", "Gazebo"]
summary: "A control framework where the task specifies what to preserve under unknown contact — on tilted boards, it kept a drawn figure within 0.5 mm versus 10–18 mm for the standard nearest-point rule."
icon: "hand-paper"
group: "research"
header:
  teaser: /assets/images/projects/ipcr-manipulation/teaser.png
  image: # /assets/images/projects/ipcr-manipulation/cover.jpg
---

*Jeonghyeon Kim, Shinsuk Park*

## Abstract

When the real contact surface differs from the one a Cartesian reference assumes, the standard fix — the nearest feasible point, with compliance along the surface normal — restores feasibility but silently drifts task coordinates the task meant to keep fixed: drawing a circle on an 18.8°-tilted board this way displaced the drawn figure by up to 32 mm. **Intent-preserving constraint realization (IPCR)** instead lets the task specify a yield subspace and the coordinates to preserve, and derives the unique realization — and a servo-compliance condition — that keeps those coordinates fixed regardless of the surface error. Implemented on a physical Dobot CR3A arm with only joint sensing (no force/torque sensor), IPCR kept a drawn circle's position within 0.38–0.52 mm across four board tilts, against 10.6–18.1 mm for the nearest-point rule, at matched contact coverage.

## Method

- Derived the target-level realization (Theorem 1), its drift relative to the standard nearest-point rule in closed form via principal angles (Theorem 2), and the execution-level servo-compliance condition under which residual surface-estimate error leaves preserved coordinates untouched (Theorem 3)
- Separated the *execution yield direction* from the *physical force direction*, so a compliant servo can absorb surface-estimate error without pulling the force-regulation direction off the task's intended coordinates
- Built a torque-level NMPC controller (20 Hz) on a Dobot CR3A that re-anchors its surface belief from joint-sensing contact residual only — no force/torque sensor, no separate probing phase
- Validated the leakage law (predicted vs. measured drift) across 72 registered runs on 3 walls, and pre-registered the drawing experiments' success criteria before running them

## Results

- On 10 unseen boards (227/230 valid runs), IPCR moved the drawn figure 0.47–0.89 mm against 10.2–32.3 mm for the nearest-point rule
- At matched contact coverage across four board tilts (8.5°–18.8°), IPCR held shift to 0.38–0.52 mm against 10.6–18.1 mm
- The leakage law's predicted-vs-measured drift fit at slope 0.93 (r = 0.93) across 72 registered runs
- A role-reversal check confirmed the right rule is whichever one matches the task's actual yield subspace, not IPCR by default — on board-tangent coordinates, the nearest-point rule was the one that stayed faithful
- Limitation, reported directly: force peaks above 30 N persisted on the physical arm, and shape error grew with friction on tilted boards

## Skills

`Python` `NMPC` `Contact Mechanics` `ROS2` `Gazebo`
