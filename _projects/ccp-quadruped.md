---
title: "Quadruped Robot Obstacle Avoidance via ORB-SLAM and UV-Disparity"
permalink: /projects/ccp-quadruped/
date: 2025-01-01
period: "Mar.2024 -- Jan.2025"
category: "Computer Vision · Autonomous Navigation"
award: "President's Award (1st Place), Creative Challenger Program (CCP), Korea University — Jan.2025"
role: "Team Leader"
team: "RoboStride"
group: "coursework"
skills: ["C++", "Python", "ROS2", "ORB-SLAM", "OpenCV"]
summary: "Monocular ORB-SLAM depth estimation and UV-disparity segmentation for real-time obstacle avoidance on a quadruped, without a dedicated depth sensor."
icon: "robot"
hero_accent: "Obstacle Avoidance"
nav_title: "Quadruped Obstacle Avoidance"
links:
  - label: "Abstract"
    url: "#abstract"
  - label: "System"
    url: "#system"
  - label: "Method"
    url: "#method"
  - label: "Results"
    url: "#results"
  - label: "Poster"
    url: "#poster"
  - label: "Platform"
    url: "#platform"
header:
  teaser: /assets/images/projects/ccp-quadruped/teaser.jpg
  image: # /assets/images/projects/ccp-quadruped/cover.jpg
---

<p class="pp-tldr">Obstacle avoidance on a small quadruped <b>from a single camera</b>: ORB-SLAM recovers depth, and U/V-disparity maps separate obstacles from the ground, with no LiDAR or stereo rig on board.</p>

## Abstract

Built a monocular-camera obstacle-avoidance pipeline for the DOGZILLA quadruped, estimating scene depth with ORB-SLAM and segmenting obstacles from U/V-disparity maps — enabling real-time autonomous navigation in unstructured environments without a dedicated depth sensor (LiDAR or stereo). Led the four-person RoboStride team through Korea University's Creative Challenger Program.

## System

<div class="pp-flow">
  <div class="pp-node"><div class="t">Jetson Nano</div><div class="s">onboard</div><span class="chip">camera relay</span></div>
  <div class="pp-link"><span>RGB-D over Wi-Fi &rarr;</span><span>&larr; control topics (ROS)</span></div>
  <div class="pp-node hi"><div class="t">Desktop</div><div class="s">off-board</div><span class="chip">ORB-SLAM3</span><span class="chip">UV-disparity</span><span class="chip">control topics</span></div>
</div>
<p class="pp-cap">The Jetson Nano only relays camera frames; all SLAM and disparity processing runs off-board on a desktop, which sends control topics back over ROS.</p>

## Method

- **Depth from one camera.** Monocular ORB-SLAM estimates scene depth from a single RGB feed and extracts sparse 3D point clouds for obstacle localization.
- **Ground vs. obstacle.** U- and V-disparity maps built from the estimated depth separate obstacles from the ground plane by their disparity peaks.
- **Avoidance.** Detections feed the robot's navigation controller, which triggers avoidance maneuvers in real time.

<div class="pp-row">
  <figure class="pp-fig">
    <img src="{{ '/assets/images/projects/ccp-quadruped/camera.png' | relative_url }}" alt="V-disparity map">
    <figcaption>V-disparity map</figcaption>
  </figure>
  <figure class="pp-fig">
    <img src="{{ '/assets/images/projects/ccp-quadruped/ground-mask.png' | relative_url }}" alt="Ground mask from disparity and depth">
    <figcaption>Ground mask (disparity + depth)</figcaption>
  </figure>
</div>
<p class="pp-cap">The dominant line in the V-disparity map marks the ground plane; deviations from it flag obstacles (green/gray regions in the mask).</p>

<div class="pp-row r12">
  <figure class="pp-fig">
    <img src="{{ '/assets/images/projects/ccp-quadruped/tracking-rgb.png' | relative_url }}" alt="Tracked ORB feature points and the raw RGB frame">
    <figcaption>Feature tracking / RGB frame</figcaption>
  </figure>
  <figure class="pp-fig">
    <img src="{{ '/assets/images/projects/ccp-quadruped/point-cloud.png' | relative_url }}" alt="3D point cloud and camera trajectory">
    <figcaption>3D point cloud and camera trajectory</figcaption>
  </figure>
</div>
<p class="pp-cap">ORB feature points tracked across frames (left) build the 3D point cloud and camera trajectory (right) used for localization.</p>

## Results

Won the President's Award (1st Place) at Korea University's Creative Challenger Program, and later presented the work as a poster at the KSPE 2025 Spring Conference (see [Poster](#poster)).

## Poster

**Jeonghyeon Kim** and Shinsuk Park, "Obstacle Detection for a Quadruped Robot Using ORB-SLAM and UV-disparity," poster, *Korean Society for Precision Engineering (KSPE) 2025 Spring Conference*, Jeju, Republic of Korea, May 14–16, 2025.

<figure class="pp-fig" style="max-width:440px;margin-left:auto;margin-right:auto">
  <img src="{{ '/assets/images/projects/ccp-quadruped/kspe-poster.jpg' | relative_url }}" alt="Presenting the poster at the KSPE 2025 Spring Conference">
  <figcaption>Presenting the poster (25SPP03-011) at the KSPE 2025 Spring Conference.</figcaption>
</figure>

## Platform

<div class="pp-parts">
  <img src="{{ '/assets/images/projects/ccp-quadruped/robot-cutout.png' | relative_url }}" alt="DOGZILLA quadruped">
  <ul>
    <li><img src="{{ '/assets/images/projects/ccp-quadruped/v-disparity.jpg' | relative_url }}" alt=""><span><b>RGB-D camera</b>Realsense D435</span></li>
    <li><img src="{{ '/assets/images/projects/ccp-quadruped/jetson.png' | relative_url }}" alt=""><span><b>On-board PC</b>Jetson Nano, 4 GB</span></li>
    <li><img src="{{ '/assets/images/projects/ccp-quadruped/battery.png' | relative_url }}" alt=""><span><b>Li-Po battery</b>8.4 V, 18650 mAh</span></li>
    <li><img src="{{ '/assets/images/projects/ccp-quadruped/servo.png' | relative_url }}" alt=""><span><b>Servo motor ×12</b>360°, 5.7 kg·cm</span></li>
  </ul>
</div>
<p class="pp-cap">DOGZILLA quadruped with a monocular RGB camera.</p>
