---
title: "Dynamics Simulation Parameter Tuning for Sim-to-Real Trajectory Similarity of a Reinforcement Learning Policy for LiDAR-based Mapless Navigation"
permalink: /projects/mapless-navigation-sim2real/
date: 2026-11-01
period: "2026"
category: "Mobile Robotics · Sim-to-Real RL"
status: "Accepted, Journal of ICROS"
role: "Co-author"
group: "research"
summary: "Tunes a simulator's wheel-friction and suspension parameters to real robot response data, cutting the sim-to-real trajectory gap of a LiDAR mapless-navigation RL policy by double digits — cross-validated with two independent trajectory-estimation methods."
skills: ["Python", "Isaac Sim", "Isaac Lab", "PPO", "ROS2"]
icon: "route"
header:
  teaser: # /assets/images/projects/mapless-navigation-sim2real/teaser.jpg
  image: # /assets/images/projects/mapless-navigation-sim2real/cover.jpg
---

*Hyeon-Yeong Ju, **Jeonghyeon Kim**, Shinsuk Park (corresponding)*

## Abstract

Reinforcement learning policies for LiDAR-based mapless navigation are trained in simulation and deployed on real mobile robots, but mismatches between simulated and real dynamics degrade performance after deployment. This work tunes an Isaac Sim model's wheel-ground friction and suspension parameters directly to real wheel torque/angular-velocity response data, then trains identical PPO policies on the tuned and untuned simulators and compares their real-world trajectories against simulation — estimating the real trajectory two independent ways, by LiDAR scan-matching and by wheel odometry, so the two can cross-validate each other. Accepted to the Journal of Institute of Control, Robotics and Systems (ICROS).

## Method

- Collected real-robot wheel torque and angular-velocity response under six load conditions (no load, 20 kg symmetric, 25 kg eccentric front/back/left/right) via straight-line driving and in-place rotation
- Iteratively tuned Isaac Sim's wheel-ground friction and suspension stiffness/damping to match that response, accepting the fit once correlation ≥ 0.9 and steady-state MAE ≤ 0.1 were reached, averaged across all six conditions
- Trained identical PPO policies in Isaac Lab on the tuned and untuned simulators, then deployed both on the physical robot across two target configurations (5 trials each)
- Estimated the real robot's trajectory two independent ways — scan-to-map point-to-line ICP on 2D LiDAR scans, and wheel odometry — so neither estimate alone determines the result
- Compared sim-vs-real trajectories via DTW-aligned RMSE, normalized DTW, and heading RMSE, and tested significance with Welch's t-test and the Mann–Whitney U test (α = 0.05)

## Results

- By the LiDAR-based estimate, the tuned model reduced Aligned RMSE by **17.9%**, Normalized DTW by **17.5%**, and Heading RMSE by **24.3%**, on average across both targets
- The independent wheel-odometry estimate agreed in direction — 5.6%, 8.2%, and 25.1% reductions respectively — cross-validating the LiDAR-based result
- Improvements were statistically significant on all three metrics at one target, and on two of three (Aligned RMSE, Heading RMSE) at the other
- Accepted to the Journal of Institute of Control, Robotics and Systems (ICROS); an earlier draft was presented at the 41st ICROS conference, 2026

## Skills

`Python` `Isaac Sim` `Isaac Lab` `PPO` `ROS2`
