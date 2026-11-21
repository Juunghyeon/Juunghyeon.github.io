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
hide_hero_teaser: true
links:
  - label: "Video"
    url: "#video"
  - label: "Method"
    url: "#method"
header:
  teaser: /assets/images/projects/quadruped-latent-motion/teaser.png
  image: # /assets/images/projects/quadruped-latent-motion/cover.jpg
---

<figure class="pp-fig pp-wide" id="video">
  <video controls preload="metadata" playsinline>
    <source src="{{ '/assets/videos/quadruped-latent-motion/highlights.mp4' | relative_url }}" type="video/mp4">
  </video>
  <figcaption class="center">Highlight reel from development and hardware testing on the Unitree A1.</figcaption>
</figure>

<p class="pp-tldr">High-level policies trained on ground-truth simulation state need the same observations on the real robot. <b>A dual-camera tracking pipeline</b> supplied them: ball and fiducial positions in one common frame, in real time.</p>

## Abstract

Contributed the real-time perception system to a year-long lab project that adapted Conditional Adversarial Latent Models (CALM) — originally built for animating virtual characters — to quadruped control, so that high-level task policies (walk, move box, limbo, push button, kick) could act on live task-relevant observations rather than ground-truth simulation state. The wider project trained a single latent-conditioned low-level controller shared across tasks, with task-specific high-level policies picking latent codes; the project ultimately did not reach publication.

## Method

- **Two views.** A fixed global camera and an onboard camera track a ball and moving AprilTag fiducial markers in real time, for tasks where the target (box, limbo gap, button, ball) is not otherwise observable.
- **One frame.** Both cameras are calibrated and their detections transformed into a common coordinate frame, so target positions stay consistent as the robot moves and under partial occlusion.
- **Sim-to-real observations.** This real-world estimate stands in for the task-relevant goal positions the high-level policies were trained on in simulation.
- **Hardware trials.** Helped run the physical trials on the Unitree A1, deploying the trained policies and the perception pipeline together on the real robot.

<figure class="pp-fig">
  <video controls preload="metadata" playsinline>
    <source src="{{ '/assets/videos/quadruped-latent-motion/test-clip.mp4' | relative_url }}" type="video/mp4">
  </video>
  <figcaption>Raw clip from a lab test session.</figcaption>
</figure>

## Status

<div class="pp-limits" markdown="1">
The broader CALM-adaptation project this fed into did not lead to a publication or further continuation under the first author.
</div>
