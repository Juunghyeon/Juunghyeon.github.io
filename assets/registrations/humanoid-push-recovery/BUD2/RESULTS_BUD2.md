# BUD2 results (CRITERIA_BUD2.json, registered 2026-10-28; 216 runs, seeds 1220-1223)

Holdable 0.2 s pushes (y +-70, x +-50, xy +-50 N), 24 runs per arm. Zero-step holds / held / steps.

| information in the hold-first entry and decision | zero-step | held | steps |
|---|---|---|---|
| true force, 0 ms | 22 | 24 | 3 |
| true force, 10 ms | 20 | 24 | 4 |
| true force, 20 ms | 8 | 22 | 24 |
| true force, 30 ms | 8 | 18 | 30 |
| true force, 50 ms | 8 | 20 | 34 |
| true force, 100 ms | 3 | 21 | 37 |
| **IMU-SME** | **11** | **23** | **15** |
| tuned MOB, gain 30 | 8 | 18 | 34 |
| tuned MOB, gain 120 | 0 | 21 | 36 |

- B1 latency bound: PASS (cliff between 10 and 20 ms: 20 -> 8).
- B2 headroom: PASS (22 vs 11).
- B3 estimator order: PASS (11 vs 8 and 0).
- B4 effective delay: PASS (IMU-SME 11 >= true force at 30 ms 8).
- The faster but noisier observer (gain 120) holds nothing in place: speed bought by differentiation is lost to noise.

Correction (2026-10-28, from the code, before BUDF): the delayed oracle replaced the estimate in the hold-first **entry and the ankle-hold target** (est['fast']); the capture prediction that releases a step uses the spike-rejected copy of IMU-SME (est['fast_dec'] from dist.raw_med), which the oracle did not replace. The delay therefore acts on when and how the hold starts, not on the release prediction. The registration text ("entry and decision") overstated this.
