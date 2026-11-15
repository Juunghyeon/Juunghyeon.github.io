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

![System overview: the Jetson Nano streams RGB-D over Wi-Fi to a desktop running ORB-SLAM3 and UV-disparity, which returns control topics to the robot over ROS](/assets/images/projects/ccp-quadruped/system-overview.png)
*Onboard, the Jetson Nano only relays RGB-D over Wi-Fi; all SLAM and disparity processing runs off-board on a desktop, which sends control topics back over ROS.*

## Method

- Estimated scene depth from a single RGB feed with monocular ORB-SLAM, extracting sparse 3D point clouds for obstacle localization
- Built U-disparity and V-disparity maps from the estimated depth to segment obstacles from the ground plane by disparity peaks
- Fed detections into the robot's navigation controller to trigger real-time avoidance maneuvers

![UV-disparity: a V-Disparity map and the resulting ground-vs-obstacle mask](/assets/images/projects/ccp-quadruped/uv-disparity.png)
*The V-disparity map's dominant line marks the ground plane; deviations from it flag obstacles (green/gray regions in the mask).*

![ORB-SLAM: tracked feature points on the RGB feed and the resulting 3D point-cloud map with camera trajectory](/assets/images/projects/ccp-quadruped/orb-slam.png)
*ORB feature points tracked across frames (left) build the 3D point cloud and camera trajectory (right) used for localization.*

## Results

Won the President's Award (1st Place) at Korea University's Creative Challenger Program, and later presented the work at the KSPE 2025 Spring Conference.

## Platform

![Hardware: RGB-D camera, onboard Jetson Nano, Li-Po power pack, and 12 servo motors driven over LAN TCP by an ESP32](/assets/images/projects/ccp-quadruped/hardware.png)

DOGZILLA quadruped · monocular RGB camera

## Skills

`C++` `Python` `ROS2` `ORB-SLAM` `OpenCV`
