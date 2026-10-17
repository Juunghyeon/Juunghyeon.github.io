---
title: "Intent-Preserving Execution of Cartesian Trajectories Under Unknown Contact Constraints"
permalink: /projects/ipcr-manipulation/
date: 2026-10-15
period: "Sep.2025 -- Present"
category: "Robot Learning · Contact-Rich Manipulation"
status: "Working paper"
role: "First Author"
award: "Master's Research Encouragement Grant, National Research Foundation of Korea (2025)"
skills: ["Python", "Manipulator Control", "Contact Mechanics", "Optimization"]
icon: "hand-paper"
header:
  teaser: # /assets/images/projects/ipcr-manipulation/teaser.jpg
  image: # /assets/images/projects/ipcr-manipulation/cover.jpg
  # video:
  #   id: # YouTube video ID
  #   provider: youtube
---

## Overview

A manipulator commanded with a Cartesian reference generated from a nominal (but imperfect) surface model will have that reference become infeasible when the real contact geometry differs. The usual fixes — moving to the nearest feasible point, or absorbing the mismatch along the estimated surface normal — restore feasibility but can silently drift the coordinates the task actually meant to preserve (e.g. the progress along a wiping path). This work formulates **intent-preserving constraint realization (IPCR)**: a framework in which the task explicitly specifies both a *yield subspace* (where the reference is allowed to deviate) and the *coordinates that must be preserved* — and derives the unique, theoretically grounded realization and execution-level controller that satisfies both.

**Authors:** Jeonghyeon Kim, Shinsuk Park (corresponding)

---

## Problem

Recovering feasibility and preserving task intent are different requirements: the environment determines which points are feasible, but it does not determine which coordinates of the reference may change. Existing contact-task controllers — hybrid force/position control, the task-frame formalism, and their modern learned variants — improve how contact constraints are represented, estimated, or accommodated, but leave implicit which task coordinates survive both the *target-level* correction of an infeasible reference and the *execution-level* absorption of residual constraint mismatch by a non-ideal servo.

---

## Approach

- Formulated the target-level realization problem: given a yield subspace 𝒟 (from the task) and preserved coordinates y = Lx (with LD = 0), found the unique feasible point that keeps the preserved coordinates unchanged — proved it exists, is unique, and has maximal invariance under the prescribed yield subspace (Theorem 1), for both affine and nonlinear constraints (Theorem 3, via a Newton iteration that preserves Lx at every step)
- Derived the *exact drift* of the conventional nearest-feasible realization relative to IPCR in closed form, via the principal angles between the constraint normals and the yield direction (Theorem 2)
- Derived the execution-level preservation condition: the exact null-space requirement on the servo's absorption subspace, 𝒩<sub>e</sub> ⊆ ker L, under which residual constraint mismatch leaves the preserved coordinates untouched regardless of its magnitude (Theorem 4, Corollary 1)
- Built an IPCR-compatible contact controller for a single planar contact that separates the *execution yield direction* from the *physical force direction* — unlike conventional hybrid control, which assigns both roles to the same estimated surface normal
- Validated the theorems numerically (15,000 random cases) and ran pre-registered experiments with a simulated torque-controlled manipulator using proprioception only, including a stress test and a boundary test on curved constraints

---

## Results

On previously unseen contact constraints, the task-specificity endpoints were met: the same contact geometry produced different, correctly predicted realizations for different tasks. The executed leak matched the theoretical transfer G(Ñ) quantitatively as the absorption subspace was varied, vanishing exactly where the execution-level preservation condition holds — confirming the framework end-to-end, from closed-form realization down to the executed controller. A pre-registered replication on further unseen constraints reproduced the result; a stress test with an oracle-normal intervention isolated high-friction degradation as a contact-geometry estimation effect rather than a framework failure.

---

## Skills

`Python` `Manipulator Control` `Contact Mechanics` `Optimization`
