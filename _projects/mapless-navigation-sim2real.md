---
title: "Improvement of Sim-to-Real Accuracy through Dynamics Parameter Tuning in Reinforcement Learning-based Mapless Navigation"
permalink: /projects/mapless-navigation-sim2real/
date: 2026-11-01
period: "2026"
category: "Mobile Robotics · Sim-to-Real RL"
status: "Accepted"
venue: "Journal of ICROS"
role: "Co-author"
authors: "Hyeon-Yeong Ju, **Jeonghyeon Kim**, Shinsuk Park"
affiliation: "Department of Mechanical Engineering, Korea University"
group: "research"
summary: "Tunes a simulator's wheel-friction and suspension parameters to real robot response data, cutting the sim-to-real trajectory gap of a LiDAR mapless-navigation RL policy by double digits — cross-validated with two independent trajectory-estimation methods."
skills: ["Python", "Isaac Sim", "Isaac Lab", "PPO", "ROS2"]
icon: "route"
hide_hero_teaser: true
hero_accent: "Sim-to-Real Accuracy"
nav_title: "Sim-to-Real Dynamics Tuning"
nav_authors: "H. Ju, J. Kim, S. Park"
links:
  - label: "Abstract"
    url: "#abstract"
  - label: "Method"
    url: "#method"
  - label: "Results"
    url: "#results"
header:
  teaser: /assets/images/projects/mapless-navigation-sim2real/teaser.jpg
  image: # /assets/images/projects/mapless-navigation-sim2real/cover.jpg
---

<figure class="pp-fig frame">
  <img src="{{ '/assets/images/projects/mapless-navigation-sim2real/real-vs-sim.png' | relative_url }}" alt="The real mobile robot next to its Isaac Sim model, with the wheel and suspension highlighted">
  <figcaption>Wheel-ground friction and suspension of the Isaac Sim model are tuned until its wheel torque and angular-velocity response matches the real robot's (Fig. 1 of the paper).</figcaption>
</figure>

<p class="pp-tldr">A navigation policy trained in simulation drives differently on the real robot. <b>Tuning the simulator's wheel and suspension dynamics to real response data</b> brought the real trajectories measurably closer to the simulated ones, confirmed by two independent ways of measuring the real path.</p>

<div class="pp-stats">
  <div class="pp-stat hi"><div class="n">17.9<small> %</small></div><div class="d">lower DTW-aligned position RMSE (LiDAR estimate, both targets)</div></div>
  <div class="pp-stat hi"><div class="n">17.5<small> %</small></div><div class="d">lower normalized DTW, i.e. closer path shape</div></div>
  <div class="pp-stat hi"><div class="n">24.3<small> %</small></div><div class="d">lower heading RMSE</div></div>
  <div class="pp-stat"><div class="n">≥ 0.9<small> r</small></div><div class="d">correlation of tuned sim to real wheel response, steady-state MAE ≤ 0.1, six load cases</div></div>
</div>

## Abstract

Reinforcement learning policies for LiDAR-based mapless navigation are trained in simulation and deployed on real mobile robots, but mismatches between simulated and real dynamics degrade performance after deployment. This work tunes an Isaac Sim model's wheel-ground friction and suspension parameters directly to real wheel torque/angular-velocity response data, then trains identical PPO policies on the tuned and untuned simulators and compares their real-world trajectories against simulation — estimating the real trajectory two independent ways, by LiDAR scan-matching and by wheel odometry, so the two can cross-validate each other.

## Method

- **Real response data.** Wheel torque and angular velocity under six load conditions (no load, 20 kg symmetric, 25 kg eccentric front/back/left/right), from straight-line driving and in-place rotation.
- **Dynamics tuning.** Isaac Sim's wheel-ground friction and suspension stiffness/damping were tuned iteratively until correlation ≥ 0.9 and steady-state MAE ≤ 0.1, averaged across all six conditions.
- **Policies.** Identical PPO policies trained in Isaac Lab on the tuned and untuned simulators, then deployed on the physical robot for two target configurations, 5 trials each.
- **Two trajectory estimates.** Scan-to-map point-to-line ICP on 2D LiDAR scans, and wheel odometry, so neither estimate alone determines the result.
- **Metrics.** DTW-aligned position RMSE, normalized DTW and heading RMSE; significance by Welch's t-test and the Mann–Whitney U test (α = 0.05).

## Results

<div class="pp-row">
  <figure class="pp-fig frame">
    <img src="{{ '/assets/images/projects/mapless-navigation-sim2real/trajectory-base.png' | relative_url }}" alt="Real and simulated trajectories for the policy trained without dynamics tuning">
    <figcaption>Without dynamics tuning</figcaption>
  </figure>
  <figure class="pp-fig frame">
    <img src="{{ '/assets/images/projects/mapless-navigation-sim2real/trajectory-tuned.png' | relative_url }}" alt="Real and simulated trajectories for the policy trained with dynamics tuning">
    <figcaption>With dynamics tuning</figcaption>
  </figure>
</div>
<p class="pp-cap">Mean real trajectory from LiDAR (blue) and odometry (green, dashed) against the simulated trajectory (red) for one target (Fig. 6 of the paper). With tuning, the simulated path stays closer to the real one along its whole length.</p>

<div class="pp-scroll">
<table class="pp-table">
  <thead><tr><th>Both targets, mean of 5 runs each</th><th>Aligned RMSE (m)</th><th>Normalized DTW (m)</th><th>Heading RMSE (rad)</th></tr></thead>
  <tbody>
    <tr><td>Without tuning · LiDAR</td><td>0.0822</td><td>0.0650</td><td>0.2447</td></tr>
    <tr class="hi"><td><b>With tuning · LiDAR</b></td><td><b>0.0675</b></td><td><b>0.0536</b></td><td><b>0.1852</b></td></tr>
    <tr><td>Without tuning · odometry</td><td>0.0791</td><td>0.0620</td><td>0.2478</td></tr>
    <tr class="hi"><td><b>With tuning · odometry</b></td><td><b>0.0747</b></td><td><b>0.0569</b></td><td><b>0.1856</b></td></tr>
  </tbody>
</table>
</div>
<p class="pp-note">From Tables 3 and 4 of the paper. Lower is closer to simulation.</p>

- By the LiDAR estimate, tuning reduced aligned RMSE by **17.9 %**, normalized DTW by **17.5 %** and heading RMSE by **24.3 %**, averaged over both targets.
- The independent odometry estimate agreed in direction: **5.6 %**, **8.2 %** and **25.1 %** reductions.
- The improvements were significant on all three metrics at one target, and on two of three (aligned RMSE, heading RMSE) at the other.
- Accepted to the Journal of Institute of Control, Robotics and Systems (ICROS); an earlier draft was presented at the 41st ICROS conference, 2026.
