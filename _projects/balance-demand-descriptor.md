---
title: "Balance Demand Descriptor: A Physics-Informed Representation of Whole-Body Dynamics for Humanoid Standing Manipulation"
permalink: /projects/balance-demand-descriptor/
date: 2025-03-01
period: "Mar.2025 -- Present"
category: "Humanoid Robotics · Whole-Body Control"
status: "Manuscript in preparation"
role: "First Author"
group: "research"
summary: "A physics-informed Balance Demand Descriptor, derived from centroidal dynamics, that lets a humanoid's control policy explicitly distinguish disturbances it can absorb in place from those requiring a corrective step."
skills: ["Python", "Reinforcement Learning", "Isaac Gym", "Centroidal Dynamics"]
icon: "balance-scale"
header:
  teaser: # /assets/images/projects/balance-demand-descriptor/teaser.jpg
  image: # /assets/images/projects/balance-demand-descriptor/cover.jpg
---

*Jeonghyeon Kim, Shinsuk Park (corresponding)*

## Abstract

A humanoid's whole-body dynamics changes continuously with upper-body motion, payload, and external interaction, but proprioception alone doesn't explicitly represent the resulting balance demand — most policies are left to infer it implicitly. This work derives a **Balance Demand Descriptor (BDD)** from centroidal dynamics that makes that demand explicit, and integrates it into a reinforcement-learning locomotion policy so the policy can distinguish disturbances it can absorb within its current stance from those that require a corrective step.

## Method

- Estimated the balance demand induced by upper-body motion, payload, and external interaction from centroidal momentum, formalized as the Balance Demand Descriptor (BDD)
- Integrated BDD into an RL locomotion policy's observation so it can explicitly distinguish demands manageable within the current stance from those requiring corrective stepping
- Designed reward shaping that induces an appropriate recovery strategy based on the direction and magnitude of a disturbance

## Status

Validating the physical plausibility of BDD and evaluating adaptation performance across locomotion and loco-manipulation scenarios; manuscript in preparation.

## Skills

`Python` `Reinforcement Learning` `Isaac Gym` `Centroidal Dynamics`
