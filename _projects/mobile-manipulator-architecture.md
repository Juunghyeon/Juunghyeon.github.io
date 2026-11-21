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
hero_accent: "Real-Time Architecture"
nav_title: "Mobile Manipulator Architecture"
links:
  - label: "Abstract"
    url: "#abstract"
  - label: "Architecture"
    url: "#architecture"
  - label: "Method"
    url: "#method"
  - label: "Results"
    url: "#results"
header:
  teaser: # /assets/images/projects/mobile-manipulator-architecture/teaser.jpg
  image: # /assets/images/projects/mobile-manipulator-architecture/cover.jpg
---

<p class="pp-tldr">The hard part of an LLM-commanded robot was not the language model. It was <b>keeping modules that run at 1 kHz, 30 Hz and 12.5 Hz in one consistent state</b> without stalling the control loop.</p>

<div class="pp-stats" style="--n:3">
  <div class="pp-stat hi"><div class="n">≤ 2<small> rounds</small></div><div class="d">of user feedback to reach an executable task plan</div></div>
  <div class="pp-stat hi"><div class="n">50<small> %+</small></div><div class="d">plan completeness on the first interaction, across tested scenarios</div></div>
  <div class="pp-stat"><div class="n">1<small> kHz</small></div><div class="d">motion-control cycle kept as the reference clock for every other stream</div></div>
</div>

## Abstract

Built the real-time integrated control platform connecting simulation, a large language model, a user interface, and a physical mobile manipulator for natural-language-commanded robot task planning. The central challenge wasn't the generative AI itself, but synchronizing modules that update at very different rates — motion control at 1 kHz, LiDAR at 12.5 Hz, RGB-D at 30 Hz — into one consistent shared state without flooding the system with redundant communication.

## Architecture

<div class="pp-flow">
  <div class="pp-node"><div class="t">Simulator</div></div>
  <div class="pp-node"><div class="t">LLM</div><div class="s">task planning</div></div>
  <div class="pp-node"><div class="t">User interface</div><div class="s">natural language</div></div>
</div>
<div class="pp-flow tight">
  <div class="pp-link"><span>&darr; &uarr; ROS2</span></div>
</div>
<div class="pp-flow tight">
  <div class="pp-node hi"><div class="t">Shared synchronized state</div><div class="s">timestamped to the 1 kHz control cycle</div><span class="chip">LiDAR 12.5 Hz</span><span class="chip">RGB-D 30 Hz</span><span class="chip">joints 1 kHz</span></div>
</div>
<div class="pp-flow tight">
  <div class="pp-link"><span>&darr; &uarr;</span></div>
</div>
<div class="pp-flow tight">
  <div class="pp-node"><div class="t">Mobile manipulator</div><div class="s">physical robot</div></div>
  <div class="pp-node"><div class="t">Edge logger</div><div class="s">auto cloud sync</div></div>
</div>
<p class="pp-cap">Every module reads and writes one shared state aligned to the control clock.</p>

## Method

- **One clock.** The motion-control cycle (1 kHz) is the reference timestamp; a synchronization pipeline aligns the slower sensor streams (LiDAR, RGB-D) to it.
- **No blocking.** Multi-buffering and a multithreaded structure let each sensor's acquisition, preprocessing and storage run in parallel without blocking the control loop.
- **One bus.** A ROS2 communication architecture connects the simulator, LLM, UI and physical robot through this shared, synchronized state.
- **Data collection.** Edge-based logging with automatic cloud synchronization that preserves the robot's real-time control cycle.

## Results

- Users completed an executable task plan with two or fewer feedback rounds.
- First-interaction plan completeness reached 50 %+ across tested scenarios.
- Simulation, UI, LLM and the physical robot were verified operating together in one integrated framework across multiple natural-language task scenarios.
