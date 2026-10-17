---
title: "Experimental Characterization of Proprioception-Based Six-Dimensional Interface Wrench Reconstruction in Humanoid Robots"
permalink: /projects/humanoid-interface-wrench/
date: 2026-10-17
period: "2026"
category: "Humanoid Robotics · Dynamics & Estimation"
status: "Working paper"
skills: ["MuJoCo", "Python", "Inverse Dynamics", "Sensor Fusion"]
icon: "walking"
header:
  teaser: # /assets/images/projects/humanoid-interface-wrench/teaser.jpg
  image: # /assets/images/projects/humanoid-interface-wrench/cover.jpg
---

## Abstract

A simulation study on whether the six-dimensional physical wrench transmitted through a humanoid's waist — gravitational, inertial, and interaction loads combined — can be reconstructed from proprioception alone (encoders, torso IMU, leg motor torques), without a dedicated six-axis force/torque sensor. Evaluated on a simulated Unitree G1 in MuJoCo, the main finding is that a correctly source-synchronized reconstruction nearly matches an exact-state reference, while naively mixing differently-staged cached signals produces errors several times larger — a measurement-timing problem, not an algorithm problem.

## Method

- Reconstructed the waist wrench via lower-body inverse dynamics: transported leg-torque-derived ground wrenches to a fixed waist point and subtracted the transported upper-body inertial and gravitational wrench
- Separated the *target time* an estimate represents from its *data-availability time*, comparing an exact-state reference path against a realistic sensor-input path under same-trajectory and delayed-replay conditions
- Cross-checked the result against an independent, algebraically-reduced 18×18 inverse-dynamics implementation
- Ran 30 simulation trials spanning payload changes, upper-body motion, applied forces/moments, and combined loads, under explicit contact-validity screening

## Results

- Source-synchronized (delayed) reconstruction nearly matched the exact-state reference — e.g. **3.718 N vs. 3.717 N** force RMSE on one test condition
- Naively using cached, differently-staged signals produced errors **roughly 4–8x larger**
- The reduced 18×18 implementation agreed with the sequential reconstruction to within machine precision — confirming numerical equivalence rather than independently validating accuracy
- Contribution is the measurement-stage characterization and evaluation protocol, not a new estimator; physical validation on a real G1 remains future work

## Skills

`MuJoCo` `Python` `Inverse Dynamics` `Sensor Fusion`
