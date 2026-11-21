---
title: "Ladder-Crossing Robot"
permalink: /projects/ladder-crossing/
date: 2023-09-01
period: "Mar.2023 -- Sep.2023"
category: "Mechanism Design and Control"
role: "Team Leader"
group: "coursework"
skills: ["Arduino", "Creo", "NX", "C++"]
summary: "A tendon-driven, 3D-printed robot that climbs a horizontal ladder by gripping rungs and shifting its center of mass."
icon: "gears"
header:
  teaser: /assets/images/projects/ladder-crossing/assembly-top.jpg
  image: # /assets/images/projects/ladder-crossing/cover.jpg
---

<p class="pp-tldr">A 3D-printed robot that crosses a horizontal ladder by <b>gripping one rung at a time and shifting its weight forward</b>, with arm joints pulled by fishing-line tendons instead of rigid linkages.</p>

## Abstract

Led a five-person team to design and build a robot that climbs a horizontal ladder by gripping successive rungs and shifting its center of mass forward, without falling. The arm joints are tendon-driven by fishing line rather than rigid linkages — simple to 3D-print, but prone to slack once a joint's return force is too slow. Iterated through three physical prototypes to resolve that and two other structural issues before arriving at the final design.

## Method

- **Arm joints.** Driven by fishing-line tendons through 3D-printed links; slack after fast release was fixed by retuning the motor-driven return speed.
- **Joint rigidity.** Early single-pin joints could not brace each other under load; each joint was widened to a two-pin, double-walled 3D-printed interface, reinforced with a backing plate and tape until the geometry itself was redesigned.
- **Link length vs. rung pitch.** A mismatch between link length and the gap between fishing-line anchor points forced a geometry revision, verified with a kinematic link simulation before the final print.
- **Drive.** Step motors for body/base locomotion and servo motors for arm actuation, coordinated by an Arduino.

<figure class="pp-fig">
  <img src="{{ '/assets/images/projects/ladder-crossing/mechanism-cad.png' | relative_url }}" alt="Rack-and-pinion gripper arm, modeled in NX">
  <figcaption>The gripper-arm mechanism on its drive rail, modeled in Siemens NX before the final 3D-printed revision.</figcaption>
</figure>

## Results

Validated through three prototype iterations — sketch-scale mockup, reinforced full-scale print, final geometry — with motor spacing further adjusted from in-class testing feedback to keep the body narrow without shortening the arm's effective reach.
