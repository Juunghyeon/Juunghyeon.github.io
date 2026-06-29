---
title: "Quadruped Robot Obstacle Avoidance via ORB-SLAM and UV-Disparity"
permalink: /projects/ccp-quadruped/
date: 2025-01-01
period: "Mar.2024 -- Jan.2025"
category: "Computer Vision · Autonomous Navigation"
award: "President's Award, Creative Challenger Program (CCP), Korea University — Jan.2025"
role: "Team Leader"
team: "RoboStride"
skills: ["C++", "Python", "ROS2", "ORB-SLAM", "OpenCV"]
---

## Overview

Developed an obstacle detection and avoidance pipeline for the DOGZILLA quadruped robot using monocular ORB-SLAM for depth estimation and UV-disparity maps for obstacle segmentation. The system enabled real-time autonomous navigation in unstructured environments.

**Period:** Mar.2024 -- Jan.2025  
**Role:** Team Leader  
**Team:** RoboStride  
**Award:** President's Award, Creative Challenger Program (CCP), Korea University — Jan.2025

---

## Problem

Quadruped robots operating in real-world environments face unstructured terrain and unexpected obstacles. Deploying reliable obstacle avoidance without dedicated depth sensors (e.g., LiDAR, stereo cameras) is a key challenge for cost-effective and lightweight robot platforms.

---

## Approach

### Depth Estimation via ORB-SLAM
- Applied monocular ORB-SLAM to estimate scene depth from a single camera feed
- Extracted sparse 3D point clouds for obstacle localization

### Obstacle Segmentation via UV-Disparity
- Constructed U-disparity and V-disparity maps from the estimated depth
- Segmented obstacles based on disparity peaks, distinguishing ground plane from objects

### Avoidance Behavior
- Integrated detection output into the robot's navigation controller
- Triggered avoidance maneuvers in real time upon obstacle detection

---

## Robot Platform

**DOGZILLA** — quadruped robot platform  
Camera: monocular RGB camera

---

## Skills

`C++` `Python` `ROS2` `ORB-SLAM` `OpenCV`
