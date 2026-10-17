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
summary: "Monocular ORB-SLAM depth estimation and UV-disparity segmentation for real-time obstacle avoidance on a quadruped, without a dedicated depth sensor."
icon: "robot"
header:
  teaser: # /assets/images/projects/ccp-quadruped/teaser.jpg
  image: # /assets/images/projects/ccp-quadruped/cover.jpg
---

## Abstract

Built a monocular-camera obstacle-avoidance pipeline for the DOGZILLA quadruped, estimating scene depth with ORB-SLAM and segmenting obstacles from U/V-disparity maps — enabling real-time autonomous navigation in unstructured environments without a dedicated depth sensor (LiDAR or stereo). Led the four-person RoboStride team through Korea University's Creative Challenger Program; the project won the President's Award.

## Method

- Estimated scene depth from a single RGB feed with monocular ORB-SLAM, extracting sparse 3D point clouds for obstacle localization
- Built U-disparity and V-disparity maps from the estimated depth to segment obstacles from the ground plane by disparity peaks
- Fed detections into the robot's navigation controller to trigger real-time avoidance maneuvers

## Platform

DOGZILLA quadruped · monocular RGB camera

## Skills

`C++` `Python` `ROS2` `ORB-SLAM` `OpenCV`
