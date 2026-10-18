---
title: "Dynamics Simulation Parameter Tuning for Sim-to-Real Trajectory Similarity of a Reinforcement Learning Policy for LiDAR-based Mapless Navigation"
permalink: /projects/mapless-navigation-sim2real/
date: 2026-09-18
period: "2026"
category: "Mobile Robotics · Sim-to-Real RL"
status: "Presented at ICROS 2026"
role: "Co-author"
group: "research"
summary: "Tunes a simulator's wheel-friction and suspension parameters to real robot response data, cutting the sim-to-real trajectory gap of a LiDAR mapless-navigation RL policy by double digits."
skills: ["Python", "Isaac Sim", "Isaac Lab", "PPO", "ROS2"]
icon: "route"
header:
  teaser: # /assets/images/projects/mapless-navigation-sim2real/teaser.jpg
  image: # /assets/images/projects/mapless-navigation-sim2real/cover.jpg
---

*Hyeon-Yeong Ju, **Jeonghyeon Kim**, Shinsuk Park (corresponding)*

## Abstract

Reinforcement learning policies for LiDAR-based mapless navigation are trained in simulation and deployed on real mobile robots, but mismatches between simulated and real dynamics degrade performance after deployment. This work tunes an Isaac Sim model's wheel-ground friction and suspension parameters directly to real wheel torque/angular-velocity response data collected under six load conditions, then trains identical PPO policies on the tuned and untuned simulators and compares their real-world trajectories against simulation. The tuned model's real-vs-sim trajectories were consistently closer across all three similarity measures tested.

## Method

- Collected real-robot wheel torque and angular-velocity response under six load conditions (no load, 20 kg symmetric, 25 kg eccentric front/back/left/right) via straight-line driving and in-place rotation
- Iteratively tuned Isaac Sim's wheel-ground friction and caster/drive suspension stiffness/damping to match that response, accepting the fit once correlation ≥ 0.9 and steady-state MAE ≤ 0.1 were reached, averaged across all six conditions
- Trained identical PPO policies in Isaac Lab on the tuned and untuned simulators — 27-dim state (goal distance/heading, past actions, 20-channel LiDAR) → 2-dim linear/angular velocity action
- Deployed both policies on the physical robot across two target configurations (5 trials each) and compared sim-vs-real trajectories via DTW-aligned RMSE, normalized DTW, and heading RMSE

## Results

- Aligned RMSE improved **5.56%** (0.0791 → 0.0747 m)
- Normalized DTW improved **8.23%** (0.0620 → 0.0569)
- Heading RMSE improved **25.06%** (0.2478 → 0.1857 rad) — the largest gain, suggesting dynamics tuning helps orientation consistency most
- Draft presented at the 41st ICROS (Institute of Control, Robotics and Systems) conference, 2026

## Skills

`Python` `Isaac Sim` `Isaac Lab` `PPO` `ROS2`
