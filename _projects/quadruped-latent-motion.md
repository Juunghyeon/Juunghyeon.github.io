---
title: "Transition-Stable Hierarchical Quadruped Control via Learned Latent Motion Representations"
permalink: /projects/quadruped-latent-motion/
date: 2026-01-01
period: "2025 -- 2026"
category: "Legged Robotics · Reinforcement Learning"
status: "Working paper"
role: "Co-author"
skills: ["Python", "PyTorch", "Reinforcement Learning", "AprilTag", "ROS2"]
icon: "paw"
links:
  - label: "Video"
    url: "https://www.youtube.com/watch?v=EZbM594T3c4"
header:
  teaser: /assets/images/projects/quadruped-latent-motion/teaser.png
  image: # /assets/images/projects/quadruped-latent-motion/cover.jpg
---

*Hyeyun Kim, Junyong Seo, **Jeonghyeon Kim**, Shinsuk Park*

## Abstract

Adapts Conditional Adversarial Latent Models (CALM) — originally built for animating virtual characters — to quadruped control. A single latent-conditioned low-level controller is trained once from a reference motion dataset and shared across every task; task-specific high-level policies then pick latent codes to drive locomotion and object-interaction tasks (walk, move box, limbo, push button, kick) and the transitions between them. On a Unitree A1, the approach held up better under real-world sensing noise than end-to-end and hand-designed-command-space baselines, with smoother, more stable behavior right after each transition.

## Method

- Low-level controller trained on a reference motion dataset (walking, crouched walking, foot positioning), conditioned on a unit-norm latent code regularized for a smooth, continuous latent manifold
- Low-level controller kept fully task-agnostic and shared across all five tasks; high-level policies select latent codes from proprioceptive state and task-relevant goals (target, box, limbo gap, button, ball position)
- AprilTag fiducial markers used for real-world task-observation estimation
- Evaluated against AMP- and WTW-style baselines, in simulation and on hardware with injected observation noise, across five single tasks and three transitions (walk→move box, limbo→push button, limbo→kick)

## Results

- Higher real-world success rate than both baselines, on single tasks and on transitions
- Lower action smoothness, joint jerk, and gravity-vector-smoothness error right after a transition in nearly every case
- One exception: limbo→kick, where the kick's impulsive leg strike inherently raises jerk and tilt — a locomotion-only baseline scored better on these metrics there *without* completing the task

## Skills

`Python` `PyTorch` `Reinforcement Learning (PPO)` `ROS2` `AprilTag`
