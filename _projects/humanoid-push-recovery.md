---
title: "Hold Before You Step: IMU-Resolved Disturbance Estimation for In-Place Push Recovery on Force-Sensorless Humanoids"
permalink: /projects/humanoid-push-recovery/
date: 2026-11-05
period: "2026"
category: "Humanoid Robotics · Disturbance Estimation"
status: "Preprint (arXiv)"
role: "First Author"
group: "research"
summary: "Measures how fast and accurate a sensorless humanoid's push estimate needs to be to safely hold in place instead of stepping — then uses that to cut base displacement by 96% on real pushes."
skills: ["Python", "MuJoCo", "Model Predictive Control", "State Estimation"]
icon: "walking"
header:
  teaser: /assets/images/projects/humanoid-push-recovery/teaser.png
  image: # /assets/images/projects/humanoid-push-recovery/cover.jpg
---

*Jeonghyeon Kim, Jaesang Kim, Shinsuk Park*

## Abstract

A stepping controller can take an unnecessary step on a push that a fixed-support hold could have recovered from. Without a force/torque sensor, a humanoid knows a push only through a delayed, noisy estimate, and estimation accuracy or response speed alone don't say whether a hold decision gets that information in time. This work measures that information requirement directly — by delaying and corrupting the true push-force signal fed to a fixed hold-first controller on a simulated Unitree G1 — then builds an estimator that resolves the pelvis IMU through the floating-base model using the 12 leg torques directly, avoiding the reconstructed-base-velocity step that creates the usual latency/noise trade-off in momentum observers.

## Method

- Measured how much delay and noise a push-force estimate can tolerate before a fixed hold-first controller fails to recover without stepping, by directly corrupting the true push-force signal on a simulated Unitree G1
- Resolved the pelvis IMU measurement through the floating-base model using the 12 leg torques, instead of first reconstructing a base velocity — removing the step that creates the latency/noise trade-off in standard floating-base momentum observers
- Used fast, lightly-filtered information to decide whether to hold, and more heavily filtered information to drive the actuation
- Validated on the real Unitree G1 using a load cell as ground truth

## Results

- The holdable force fell by about **4% per 10 ms** of delay — matching a pendulum model's predicted rate — and delaying the actuation commands hurt it as much as an equivalent information delay
- Slow force errors up to 30 N and white noise up to 15 N were tolerated; 20 N errors on the timescale of the push itself caused hold failures
- In closed loop, hold-entry latency predicted the normalized holdable force within 0.02 for three of four estimators tested; a tuned momentum-observer baseline reached only 0.85–0.88
- Met its pre-registered recovery criterion more often than a stepping baseline (65 vs. 62 of 80 runs) while taking 46% fewer steps
- On 30–50 N pushes both controllers recovered from, holding in place cut base displacement by **96%**, peak force by **44%**, and mechanical work by **69%**, relative to the stepping baseline
- On the real G1, the estimator detected pushes faster than a momentum-observer baseline, and added delay lowered the holdable force as the simulation study predicted

## Skills

`Python` `MuJoCo` `Model Predictive Control` `State Estimation`
