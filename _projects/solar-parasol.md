---
title: "Solar Tracking Parasol"
permalink: /projects/solar-parasol/
date: 2023-11-01
period: "Sep.2023 -- Nov.2023"
category: "Mechanism Design and Control"
award: "Bronze Award, Creative Comprehensive Design Competition — Sep.2023; Design Award, Capstone Design Fair, Korea University — Nov.2023"
role: "Team Leader"
group: "coursework"
skills: ["Arduino", "AutoCAD", "C++"]
summary: "A parasol that senses sun position and actuates its canopy to track the sun and maximize shade throughout the day."
icon: "sun"
hide_hero_teaser: true
links:
  - label: "Control logic"
    url: "#control-logic"
  - label: "Simulation"
    url: "#simulation"
  - label: "Prototype"
    url: "#prototype"
header:
  teaser: /assets/images/projects/solar-parasol/teaser.png
  image: # /assets/images/projects/solar-parasol/cover.jpg
---

<p class="pp-tldr">A parasol that <b>follows the sun on its own</b>: a light-sensor array finds where the sun is, and servos turn the canopy to keep the shade in place through the day.</p>

## Abstract

A parasol that automatically reorients its canopy to track the sun and maximize shade coverage, rather than staying fixed as the sun moves. Built on a tripod-mounted dual-panel frame with a light-sensor array for sun-position sensing and servo actuation for canopy orientation, controlled by an Arduino. Won the Bronze Award at the Creative Comprehensive Design Competition and the Design Award at Korea University's Capstone Design Fair.

## Method

- **Sensing.** A light-sensor array measures sun position directly instead of a fixed ephemeris model, so tracking adapts to real lighting conditions (cloud cover, obstructions).
- **Orientation.** The canopy orientation that maximizes shade is computed from the sensor readings.
- **Actuation.** Servo motors set the canopy angle under Arduino control, on a tripod base for standalone outdoor use.

### Control logic

<figure class="pp-fig">
<svg viewBox="0 0 620 570" role="img" aria-label="Closing-logic flowchart">
  <defs>
    <marker id="sp-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#5f6368"/>
    </marker>
  </defs>
  <style>
    .sp-node { fill:#fff; stroke:#c9c9c9; stroke-width:1.5; }
    .sp-node.start { fill:#1d1f22; stroke:#1d1f22; }
    .sp-node.act { fill:#e8f1f8; stroke:#0072b2; }
    .sp-node.dec { fill:#f6f6f4; }
    .sp-lbl { fill:#1d1f22; font-size:15px; font-weight:600; text-anchor:middle; font-family:Inter, system-ui, sans-serif; }
    .sp-lbl.inv { fill:#fff; }
    .sp-edge { fill:none; stroke:#5f6368; stroke-width:1.6; marker-end:url(#sp-arrow); }
    .sp-cond { fill:#5f6368; font-size:13px; font-style:italic; text-anchor:middle; font-family:Inter, system-ui, sans-serif; }
  </style>

  <rect class="sp-node start" x="90" y="15" width="140" height="46" rx="23"/>
  <text class="sp-lbl inv" x="160" y="43">Start</text>
  <path class="sp-edge" d="M160,61 L160,95"/>

  <polygon class="sp-node dec" points="160,95 225,140 160,185 95,140"/>
  <text class="sp-lbl" x="160" y="145">Close?</text>
  <text class="sp-cond" x="128" y="208">False</text>
  <path class="sp-edge" d="M160,185 L160,225"/>
  <text class="sp-cond" x="340" y="130">True</text>
  <path class="sp-edge" d="M225,140 L460,140 L460,385"/>

  <rect class="sp-node" x="90" y="225" width="140" height="46" rx="8"/>
  <text class="sp-lbl" x="160" y="253">Check CdS</text>
  <path class="sp-edge" d="M160,271 L160,305"/>

  <rect class="sp-node" x="90" y="305" width="140" height="46" rx="8"/>
  <text class="sp-lbl" x="160" y="333">Check quadrant</text>
  <path class="sp-edge" d="M160,351 L160,385"/>

  <polygon class="sp-node dec" points="160,385 240,430 160,475 80,430"/>
  <text class="sp-lbl" x="160" y="425">pressSensor</text>
  <text class="sp-lbl" x="160" y="443">pressed?</text>
  <text class="sp-cond" x="128" y="498">False</text>
  <path class="sp-edge" d="M160,475 L160,510"/>

  <rect class="sp-node act" x="90" y="510" width="140" height="46" rx="8"/>
  <text class="sp-lbl" x="160" y="538">Extend actuator</text>

  <polygon class="sp-node dec" points="460,385 550,430 460,475 370,430"/>
  <text class="sp-lbl" x="460" y="425">all pressSensors</text>
  <text class="sp-lbl" x="460" y="443">pressed?</text>
  <text class="sp-cond" x="490" y="498">True</text>
  <path class="sp-edge" d="M460,475 L460,510"/>

  <rect class="sp-node act" x="390" y="510" width="140" height="46" rx="8"/>
  <text class="sp-lbl" x="460" y="538">Extend actuator</text>
</svg>
<figcaption>Closing logic: the canopy only extends once every photoresistor quadrant agrees the parasol is correctly oriented.</figcaption>
</figure>

### Simulation

<figure class="pp-fig">
  <video controls preload="metadata" playsinline>
    <source src="{{ '/assets/videos/solar-parasol/sim.mp4' | relative_url }}" type="video/mp4">
  </video>
  <figcaption>Mechanism simulation: the four-panel canopy opening and closing before the physical build.</figcaption>
</figure>

## Results

Demonstrated continuous shade tracking through the day on the physical prototype, winning the Bronze Award at the Creative Comprehensive Design Competition and the Design Award at Korea University's Capstone Design Fair.

### Prototype

<figure class="pp-fig">
  <img src="{{ '/assets/images/projects/solar-parasol/teaser.png' | relative_url }}" alt="The finished solar-tracking parasol prototype">
  <figcaption>The finished prototype: tripod-mounted dual-panel frame with the light-sensor array and servo-actuated canopy.</figcaption>
</figure>
