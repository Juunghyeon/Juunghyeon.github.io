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
header:
  teaser: /assets/images/projects/quadruped-latent-motion/teaser.png
  image: # /assets/images/projects/quadruped-latent-motion/cover.jpg
  # video:
  #   id: # YouTube video ID
  #   provider: youtube
---

## Overview

Adapts Conditional Adversarial Latent Models (CALM) — originally proposed for animating virtual characters — to quadruped robot control. A latent-conditioned low-level controller is trained once from a reference motion dataset (walking, crouched walking, foot positioning) and shared across every downstream task; task-specific high-level policies then select latent codes to solve locomotion and object-interaction tasks (WALK, MOVE BOX, LIMBO, PUSH BUTTON, KICK) and the transitions between them.

**Authors:** Hyeyun Kim, Junyong Seo, **Jeonghyeon Kim**, Shinsuk Park
**Platform:** Unitree A1 (simulation + real-world deployment)
**Video:** [youtube.com/watch?v=EZbM594T3c4](https://www.youtube.com/watch?v=EZbM594T3c4)

---

## Problem

End-to-end policies that map observations directly to joint actions tend to produce overly aggressive corrective actions at transition boundaries, especially under the sensor noise and state-estimation error that's unavoidable on real hardware. Most hierarchical controllers sidestep this with hand-designed, human-interpretable command spaces (base velocities, footholds, end-effector trajectories), which inherently constrain the range of motions the low-level controller can generate.

---

## Approach

- Trained a CALM-style low-level controller π<sub>L</sub>(a | s, z) on a reference motion dataset, conditioned on a unit-norm latent code z learned by an encoder and regularized with an alignment&ndash;uniformity objective for local smoothness of the latent manifold
- Kept the low-level controller fully task-agnostic and shared across all five tasks; task-specific high-level policies π<sub>H</sub>(z | s, g) select latent codes from proprioceptive state and task-relevant goal information (target/box/limbo/goal positions)
- Used AprilTag fiducial markers (robot, target, box, tunnel entry/exit, button, goal) for real-world task-observation estimation
- Evaluated single tasks (WALK, MOVE BOX, LIMBO, PUSH BUTTON, KICK) and three transition scenarios (WALK→MOVE BOX, LIMBO→PUSH BUTTON, LIMBO→KICK) against AMP- and WTW-style baselines, in simulation and on real hardware with injected observation noise

---

## Results

Compared to baselines, the CALM-style hierarchical controller achieved consistently higher real-world success rates for both single tasks and task transitions, and exhibited smoother post-transition behavior — lower action smoothness, joint jerk, and gravity-vector-smoothness error — in nearly every transition case. The one exception was LIMBO→KICK, where the kicking motion's impulsive front-leg strike inherently increases jerk and body tilt; a locomotion-only baseline scored lower on these metrics there without actually completing the task.

---

## Skills

`Python` `PyTorch` `Reinforcement Learning (PPO)` `ROS2` `AprilTag`
