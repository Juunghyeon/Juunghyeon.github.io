---
title: "Real-Time Architecture for a Generative-AI-Based Mobile Manipulator"
permalink: /projects/mobile-manipulator-architecture/
date: 2025-03-01
period: "Mar.2025 -- Aug.2026"
category: "Systems Integration · Mobile Manipulation"
status: "Ongoing"
role: "System Architect"
group: "research"
summary: "A ROS2 architecture connecting simulation, an LLM, a UI, and a physical mobile manipulator, with edge-based data collection and automatic cloud sync that preserves the robot's real-time control cycle."
skills: ["ROS2", "Python", "C++", "LLM Integration", "Multithreading"]
icon: "network-wired"
header:
  teaser: # /assets/images/projects/mobile-manipulator-architecture/teaser.jpg
  image: # /assets/images/projects/mobile-manipulator-architecture/cover.jpg
---

## Abstract

Built the real-time integrated control platform connecting simulation, a large language model, a user interface, and a physical mobile manipulator for natural-language-commanded robot task planning. The central challenge wasn't the generative AI itself, but synchronizing modules that update at very different rates — motion control at 1 kHz, LiDAR at 12.5 Hz, RGB-D at 30 Hz — into one consistent shared state without flooding the system with redundant communication.

## Method

- Used the motion control cycle (1 kHz) as the reference timestamp and built a synchronization pipeline that aligns slower sensor streams (LiDAR, RGB-D) to it
- Used multi-buffering and a multithreaded structure so each sensor's acquisition, preprocessing, and storage run in parallel without blocking the control loop
- Designed a ROS2 communication architecture connecting the simulator, LLM, UI, and physical robot through this shared, synchronized state
- Implemented edge-based data collection with automatic cloud synchronization that preserves the robot's real-time control cycle

## Results

- Users could complete an executable task plan with two or fewer feedback rounds
- First-interaction plan completeness reached 50%+ across tested scenarios
- Simulation, UI, LLM, and the physical robot verified operating together within one integrated framework across multiple natural-language task scenarios

## Skills

`ROS2` `Python` `C++` `LLM Integration` `Multithreading`
