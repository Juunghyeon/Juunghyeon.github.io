---
title: "Real-Time Perception for a CALM-Based Hierarchical Quadruped Controller"
permalink: /projects/quadruped-latent-motion/
date: 2026-01-01
period: "2025 -- 2026"
category: "Legged Robotics · Perception"
group: "research"
role: "Contributor — Perception System"
skills: ["Python", "OpenCV", "AprilTag", "ROS2"]
summary: "Built the real-time dual-camera ball- and fiducial-tracking pipeline that fed task-relevant observations to a lab project adapting CALM's latent motion representations to quadruped object-interaction tasks."
icon: "paw"
header:
  teaser: /assets/images/projects/quadruped-latent-motion/teaser.png
  image: # /assets/images/projects/quadruped-latent-motion/cover.jpg
---

## Abstract

Contributed the real-time perception system to a year-long lab project that adapted Conditional Adversarial Latent Models (CALM) — originally built for animating virtual characters — to quadruped control, so that high-level task policies (walk, move box, limbo, push button, kick) could act on live task-relevant observations rather than ground-truth simulation state. The wider project trained a single latent-conditioned low-level controller shared across tasks, with task-specific high-level policies picking latent codes; the project ultimately did not reach publication.

## Method

- Built a dual-camera perception system (fixed global view + onboard view) to track a ball and moving AprilTag fiducial markers in real time, for tasks where the target (box, limbo gap, button, ball) wasn't otherwise observable
- Calibrated both cameras and transformed detections into a common coordinate frame, so target position stayed consistent as the robot moved and partial occlusion occurred
- This real-world observation estimate stood in for the task-relevant goal positions that the high-level policies were trained on in simulation
- Helped run the physical hardware trials on the Unitree A1, deploying the trained policies and the perception pipeline together on the real robot

## Status

The broader CALM-adaptation project this fed into did not lead to a publication or further continuation under the first author.

## Skills

`Python` `OpenCV` `AprilTag` `ROS2`
