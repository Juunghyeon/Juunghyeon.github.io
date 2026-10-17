---
title: "Ladder-Crossing Robot"
permalink: /projects/ladder-crossing/
date: 2023-09-01
period: "Mar.2023 -- Sep.2023"
category: "Mechanism Design and Control"
role: "Team Leader"
skills: ["Arduino", "Creo", "NX", "C++"]
summary: "A tendon-driven, 3D-printed robot that climbs a horizontal ladder by gripping rungs and shifting its center of mass."
icon: "gears"
header:
  teaser: /assets/images/projects/ladder-crossing/teaser.jpg
  image: # /assets/images/projects/ladder-crossing/cover.jpg
---

## Abstract

Led a five-person team to design and build a robot that climbs a horizontal ladder by gripping successive rungs and shifting its center of mass forward, without falling. The arm joints are tendon-driven by fishing line rather than rigid linkages — simple to 3D-print, but prone to slack once a joint's return force is too slow. Iterated through three physical prototypes to resolve that and two other structural issues before arriving at the final design.

## Method

- **Arm joints:** driven by fishing-line tendons through 3D-printed links; slack after fast release fixed by retuning motor-driven return speed
- **Joint rigidity:** early single-pin joints couldn't brace each other under load; widened each joint to a two-pin, double-walled 3D-printed interface, reinforced with a backing plate and tape until the geometry itself was redesigned
- **Link length vs. rung pitch:** a mismatch between link length and the gap between fishing-line anchor points forced a geometry revision, verified with a kinematic link simulation before the final 3D print
- **Drive:** step motors for body/base locomotion, servo motors for arm actuation, coordinated via Arduino

## Results

Validated through three prototype iterations (sketch-scale mockup → reinforced full-scale print → final geometry), with motor spacing further adjusted from feedback during in-class testing to keep the body narrow without shortening the arm's effective reach.

## Skills

`Arduino` `Creo` `NX` `C++`
