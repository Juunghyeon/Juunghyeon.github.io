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
header:
  teaser: /assets/images/projects/ccp-quadruped/teaser.jpg
  image: # /assets/images/projects/ccp-quadruped/cover.jpg
---

## Abstract

Built a monocular-camera obstacle-avoidance pipeline for the DOGZILLA quadruped, estimating scene depth with ORB-SLAM and segmenting obstacles from U/V-disparity maps — enabling real-time autonomous navigation in unstructured environments without a dedicated depth sensor (LiDAR or stereo). Led the four-person RoboStride team through Korea University's Creative Challenger Program.

<div style="display:flex; align-items:center; justify-content:center; gap:1em; flex-wrap:wrap; margin:1.6em 0; font-size:0.92em;">
  <div style="border:2px solid #333; border-radius:14px; padding:1em 1.3em; text-align:center; min-width:150px;">
    <strong>Jetson Nano</strong><br>
    <span style="font-size:0.82em; opacity:0.7;">onboard</span>
  </div>
  <div style="text-align:center; font-size:0.8em; line-height:1.7; color:#555; min-width:160px;">
    <div>RGB-D / Realsense-ros →</div>
    <div>← Control Topic / ROS</div>
  </div>
  <div style="border:2px solid #333; border-radius:14px; padding:1em 1.3em; text-align:center; min-width:180px;">
    <strong>Desktop</strong><br>
    <span style="font-size:0.82em; opacity:0.7;">off-board</span><br>
    <span style="display:inline-block; margin-top:0.6em; border:2px solid #777; border-radius:50%; padding:0.9em 1.1em; line-height:1.4;">ORB-SLAM3<br>UV_disparity</span><br>
    <span style="display:inline-block; margin:0.3em 0;">↓</span><br>
    <span style="border:2px solid #777; border-radius:30px; padding:0.35em 0.9em; display:inline-block;">Control Topics</span>
  </div>
</div>
*Onboard, the Jetson Nano only relays RGB-D over Wi-Fi; all SLAM and disparity processing runs off-board on a desktop, which sends control topics back over ROS.*

## Method

- Estimated scene depth from a single RGB feed with monocular ORB-SLAM, extracting sparse 3D point clouds for obstacle localization
- Built U-disparity and V-disparity maps from the estimated depth to segment obstacles from the ground plane by disparity peaks
- Fed detections into the robot's navigation controller to trigger real-time avoidance maneuvers

<div style="display:flex; gap:1.2em; justify-content:center; flex-wrap:wrap; align-items:flex-end; margin:1.6em 0;">
  <figure style="margin:0; text-align:center;">
    <img src="/assets/images/projects/ccp-quadruped/v-disparity.jpg" alt="V-disparity map" style="max-width:220px; border:1px solid #ccc; border-radius:4px;">
    <figcaption style="font-size:0.8em; opacity:0.7; margin-top:0.4em;">V-disparity map</figcaption>
  </figure>
  <figure style="margin:0; text-align:center;">
    <img src="/assets/images/projects/ccp-quadruped/ground-mask.png" alt="Ground mask from disparity and depth" style="max-width:360px; border:1px solid #ccc; border-radius:4px;">
    <figcaption style="font-size:0.8em; opacity:0.7; margin-top:0.4em;">Ground mask (disparity + depth)</figcaption>
  </figure>
</div>
*The V-disparity map's dominant line marks the ground plane; deviations from it flag obstacles (green/gray regions in the mask).*

<div style="display:flex; gap:1.2em; justify-content:center; flex-wrap:wrap; align-items:flex-start; margin:1.6em 0;">
  <figure style="margin:0; text-align:center;">
    <img src="/assets/images/projects/ccp-quadruped/tracking-rgb.png" alt="Tracked ORB feature points and the raw RGB frame" style="max-width:190px; border:1px solid #ccc; border-radius:4px;">
    <figcaption style="font-size:0.8em; opacity:0.7; margin-top:0.4em;">Feature tracking (top) / RGB frame (bottom)</figcaption>
  </figure>
  <figure style="margin:0; text-align:center;">
    <img src="/assets/images/projects/ccp-quadruped/point-cloud.png" alt="3D point cloud and camera trajectory" style="max-width:420px; border:1px solid #ccc; border-radius:4px;">
    <figcaption style="font-size:0.8em; opacity:0.7; margin-top:0.4em;">3D point cloud and camera trajectory</figcaption>
  </figure>
</div>
*ORB feature points tracked across frames (left) build the 3D point cloud and camera trajectory (right) used for localization.*

## Results

Won the President's Award (1st Place) at Korea University's Creative Challenger Program, and later presented the work at the KSPE 2025 Spring Conference.

## Platform

<div style="display:flex; align-items:center; gap:1.6em; flex-wrap:wrap; justify-content:center; margin:1.6em 0;">
  <img src="/assets/images/projects/ccp-quadruped/robot-cutout.png" alt="DOGZILLA quadruped" style="max-width:200px;">
  <div style="display:grid; grid-template-columns:repeat(2, minmax(110px,1fr)); gap:1.2em 1.6em; font-size:0.8em; text-align:center;">
    <figure style="margin:0;"><img src="/assets/images/projects/ccp-quadruped/camera.png" alt="Realsense D435" style="max-height:55px;"><figcaption>RGB-D Camera<br>Realsense D435</figcaption></figure>
    <figure style="margin:0;"><img src="/assets/images/projects/ccp-quadruped/jetson.png" alt="Jetson Nano" style="max-height:55px;"><figcaption>On-board PC<br>Jetson Nano, 4GB</figcaption></figure>
    <figure style="margin:0;"><img src="/assets/images/projects/ccp-quadruped/battery.png" alt="Li-Po battery pack" style="max-height:55px;"><figcaption>Li-Po Battery<br>8.4V, 18650mAh</figcaption></figure>
    <figure style="margin:0;"><img src="/assets/images/projects/ccp-quadruped/servo.png" alt="Servo motor" style="max-height:55px;"><figcaption>Servo Motor ×12<br>360°, 5.7kg·cm</figcaption></figure>
  </div>
</div>

DOGZILLA quadruped · monocular RGB camera

## Skills

`C++` `Python` `ROS2` `ORB-SLAM` `OpenCV`
