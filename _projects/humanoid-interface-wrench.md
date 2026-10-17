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
  # video:
  #   id: # YouTube video ID
  #   provider: youtube
---

## Overview

A simulation study characterizing how well the six-dimensional physical wrench transmitted through a humanoid's waist — combining gravitational, inertial, and interaction loads — can be reconstructed from proprioception alone (encoders, torso IMU, and leg motor torques), without a dedicated six-axis force/torque sensor. Evaluated on a simulated Unitree G1 in MuJoCo.

---

## Problem

A dedicated six-axis force/torque transducer gives a direct measurement of the waist interface wrench but can require mechanical modification to install. Proprioceptive reconstruction is an appealing alternative, but cached sensor signals and differing acquisition stages between gyro, encoder, and torque samples can create large apparent disagreement between the physical model and the measured wrench — and it's easy to mistake measurement-stage timing artifacts for an estimation algorithm's inaccuracy.

---

## Approach

- Reconstructed the waist interface wrench via conventional lower-body inverse dynamics, transporting leg-torque-derived ground wrenches to a fixed waist reference point and subtracting the transported upper-body inertial and gravitational wrench
- Explicitly separated the *target time* an estimate represents from its *data-availability time*, and compared a privileged (exact-state) reference path against a realistic sensor-input path across same-trajectory and delayed-replay conditions
- Built an independent, algebraically-reduced 18×18 inverse-dynamics implementation (floating-base and leg equations solved jointly) as a numerical cross-check against the sequential reconstruction
- Ran 30 simulation trials spanning payload changes, upper-body motion, applied forces/moments, and combined loads, under explicit contact-validity screening (minimum vertical force, contact age, slip proxy, conditioning number)

---

## Results

On matched same-trajectory comparisons, a correctly source-synchronized but delayed sensor-input reconstruction nearly matched the privileged (exact-state) reference — 3.718 N vs. 3.717 N force RMSE on one test condition — while naively using cached, differently-staged signals produced errors roughly 4–8x larger. The reduced 18×18 inverse-dynamics implementation agreed with the sequential reconstruction to within machine precision, confirming the two are numerically equivalent rather than independently validating accuracy. The study's main contribution is this measurement-stage characterization and evaluation protocol, rather than a new estimation algorithm; physical validation on a real Unitree G1 remains future work.

---

## Skills

`MuJoCo` `Python` `Inverse Dynamics` `Sensor Fusion`
