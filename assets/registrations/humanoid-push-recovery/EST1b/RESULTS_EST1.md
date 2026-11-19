# EST1 / EST1b results (CRITERIA_EST1.json sha 64a04444..., CRITERIA_EST1b.json sha bc72beb9...; seeds 1344-1347; 228 + 152 runs)

Boundary force (zero-step holds cross 50 %), capture-prediction release only, final controller information paths; entry = first control tick in the hold mode after push onset.

| direction | arm | boundary | ratio to oracle | entry median (IQR) | predicted exp(-omega dL) | verdict |
|---|---|---|---|---|---|---|
| fore-aft | oracle | 54.2 N | 1.000 | 0 ms (0-0) | 1.000 | - |
| fore-aft | ours (IMU-resolved) | 51.7 N | 0.954 | 15 ms (15-15) | 0.945 | PASS |
| fore-aft | tuned MOB | 46.2 N | 0.854 | 40 ms (35-45) | 0.859 | PASS |
| fore-aft | enhanced MOB (Sun 2026) | 45.8 N | 0.846 | 10 ms (10-40) | 0.963 | FAIL |
| fore-aft | centroidal + IMU (Fedsi 2026) | 51.2 N | 0.946 | 15 ms (15-15) | 0.945 | PASS |
| lateral | oracle | 74.2 N | 1.000 | 0 ms (0-0) | 1.000 | - |
| lateral | ours (IMU-resolved) | 71.7 N | 0.966 | 10 ms (10-10) | 0.963 | PASS |
| lateral | tuned MOB | 65.0 N | 0.876 | 30 ms (30-35) | 0.893 | PASS |
| lateral | enhanced MOB (Sun 2026) | 62.5 N | 0.843 | 30 ms (20-30) | 0.893 | PASS |
| lateral | centroidal + IMU (Fedsi 2026) | 71.2 N | 0.961 | 10 ms (10-10) | 0.963 | PASS |

- EST1 E1 (latency predicts the boundary, +-0.08): **PASS** 4/4, largest difference 0.017.
- EST1 E2 (ours > tuned MOB): **PASS** both directions (51.7 vs 46.3 N; 71.7 vs 65.0 N).
- EST1 E3 (reported): entry ours 15/10 ms, MOB 40/30 ms.
- EST1b E1b: **FAIL** (3 of 4): centroidal + IMU passes both directions (0.946 vs 0.945; 0.961 vs 0.963); enhanced MOB passes lateral (0.843 vs 0.893) and fails fore-aft (0.846 vs 0.963).
- Post-hoc diagnosis (not confirmatory): the enhanced MOB's lead term produces a wrong-sign transient of -21 to -32 N about 10 ms after every fore-aft push onset. Below 47.5 N it stays under the 25 N entry threshold and the hold is entered at 35-50 ms (all held up to 42.5 N); from 47.5 N it crosses the threshold, the hold is entered at 10 ms in the wrong direction and the robot steps or falls. The registered entry latency (first hold tick) therefore counts a wrong-direction entry; with the time of the correct-direction entry (35-50 ms) the prediction would be about 0.86. This is an instance of push-band error (NZ1), not of latency.
