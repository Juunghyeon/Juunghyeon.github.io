"""Load cell vs replayed estimators on a synchronized recording (replay_sync.py output), 2026-11-13.

Per push (load cell 10 ms mean above --on N, re-contacts within 0.3 s merged):
  direction  u = mean change of the IMU-SME xy estimate during the push (the same u for every estimator); --dir mean: of the mean of all
             five estimators (estimator-neutral, the registered HWE1 rule)
  latency    time the estimate along u (pre-push median removed) stays above --th N for 2 ticks, minus the time the load cell
             (10 ms mean) reaches --th N  (the manuscript's detection latency; load cell = true push)
  delay50    time the estimate reaches 50 % of its own plateau minus the time the load cell reaches 50 % of its plateau (gain-free)
  RMS error  over the push until the first foot lift (stepping excluded), estimate along u vs load cell;  ratio = median estimate / median load cell over the push
  step       a foot below the contact threshold within the push or 0.5 s after it (FALCON stepped)
Quiet noise: xy RMS around the median, load cell < 1.5 N, >= 1 s after and >= 0.5 s before any push, both feet down.

  python compare_sync.py ../../sim2real/logs/sync/g1lc_<time>_<label> [--th 25 --th2 15]
"""
import os, json, argparse
import numpy as np

NAMES = ('IMUSME', 'MOB', 'EMO', 'CIMU', 'SME')


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('run')
    ap.add_argument('--th', type=float, default=25.); ap.add_argument('--th2', type=float, default=15.); ap.add_argument('--on', type=float, default=8.); ap.add_argument('--est', default='estimators.npz')
    ap.add_argument('--dir', choices=('imusme', 'mean'), default='imusme')
    a = ap.parse_args()
    fpath = os.path.join(a.run, 'force_rezero.npz') if os.path.exists(os.path.join(a.run, 'force_rezero.npz')) else os.path.join(a.run, 'force.npz')
    Fz = np.load(fpath); tF = Fz['t_mono']; F10 = np.convolve(Fz['force_N'], np.ones(75) / 75, 'same')
    X = np.load(os.path.join(a.run, a.est)); t = X['t_mono']; act = X['act'] > .5
    T0 = json.load(open(os.path.join(a.run, 'session.json')))['start_mono_ns'] / 1e9
    up = np.flatnonzero((F10[1:] > a.on) & (F10[:-1] <= a.on)); dn = np.flatnonzero((F10[1:] <= a.on) & (F10[:-1] > a.on))
    P = []
    for i in up:
        j = dn[dn > i]; j = j[0] if len(j) else len(F10) - 1
        if P and tF[i] - P[-1][1] < .3: P[-1] = (P[-1][0], tF[j]); continue
        P.append((tF[i], tF[j]))
    Fi = np.interp(t, tF, F10)

    def cross(tt, y, th, t0):
        h = np.flatnonzero((y[:-1] > th) & (y[1:] > th) & (tt[:-1] >= t0 - .05))
        return tt[h[0]] if len(h) else np.nan

    rows = []
    print(f'{os.path.basename(a.run)}: {len(P)} pushes, estimators at {1 / np.median(np.diff(t)):.0f} Hz, load cell {os.path.basename(fpath)}')
    print(' #    t   dur  Fplat dir   step | latency @%g N (ms): ' % a.th + ' '.join(f'{n:>7s}' for n in NAMES) + ' | RMS err (N): ' + ' '.join(f'{n:>6s}' for n in NAMES))
    for k, (t0, t1) in enumerate(P, 1):
        b = (t > t0 - .6) & (t < t0 - .05); w = (t >= t0 - .05) & (t <= t1 + .1)
        if b.sum() < 10 or w.sum() < 10:
            continue
        src = ('IMUSME',) if a.dir == 'imusme' else NAMES
        d0 = np.mean([X[nm][w, :2].mean(0) - np.median(X[nm][b, :2], 0) for nm in src], 0); u = d0 / max(np.linalg.norm(d0), 1e-9)
        step = bool((~act[(t >= t0) & (t <= t1 + .5)]).any())
        lift = t[(t >= t0) & ~act.all(1)]; t_end = min(t1 + .1, lift[0]) if len(lift) else t1 + .1   # accuracy only while both feet are down
        wa = (t >= t0 - .05) & (t <= t_end)
        fw = (tF >= t0) & (tF <= t1); Fpl = float(np.median(F10[fw]))
        tf1 = tF[fw][np.argmax(F10[fw] > a.th)] if (F10[fw] > a.th).any() else np.nan
        tf2 = tF[fw][np.argmax(F10[fw] > a.th2)] if (F10[fw] > a.th2).any() else np.nan
        rec = dict(n=k, t=t0 - T0, dur=t1 - t0, Fpl=Fpl, dir=float(np.degrees(np.arctan2(u[1], u[0]))), step=step)
        fa = (tF >= t0) & (tF <= t_end); Fpa = float(np.median(F10[fa])) if fa.sum() > 100 else np.nan   # gain-free delay: 50 % of each signal's own
        t50F = tF[fa][np.argmax(F10[fa] > .5 * Fpa)] if np.isfinite(Fpa) else np.nan                        # plateau (before the foot lift)
        rec['cens50'] = (t_end - t50F) * 1e3 if np.isfinite(t50F) else np.nan                             # lat50 undefined -> at least this (HWE1)
        for nm in NAMES:
            E = X[nm][:, :2] @ u - np.median(X[nm][b, :2] @ u)
            Epa = np.nanmedian(E[wa & (t > t0 + .1)]) if (wa & (t > t0 + .1)).any() else np.nan
            h50 = np.flatnonzero(wa[:-1] & (E[:-1] > .5 * Epa) & (E[1:] > .5 * Epa)) if np.isfinite(Epa) and Epa > 3 else []
            lat50 = (t[h50[0]] - t50F) * 1e3 if len(h50) and np.isfinite(t50F) else np.nan
            rec[nm] = dict(lat50=lat50, lat1=(cross(t[w], E[w], a.th, t0) - tf1) * 1e3, lat2=(cross(t[w], E[w], a.th2, t0) - tf2) * 1e3,
                           rms=float(np.sqrt(np.mean((E[wa] - Fi[wa]) ** 2))), ratio=float(np.median(E[wa & (t > t0 + .1)]) / max(Fpl, 1e-6)) if (wa & (t > t0 + .1)).any() else float('nan'))
        rows.append(rec)
        fmt = lambda v: f'{v:7.0f}' if np.isfinite(v) else '      -'
        print(f'{k:2d} {t0 - T0:5.1f} {t1 - t0:4.2f} {Fpl:5.1f} {rec["dir"]:+4.0f} {"STEP" if step else "  - "} | ' + ' ' * 21 +
              ' '.join(fmt(rec[n]['lat1']) for n in NAMES) + ' | ' + ' '.join(f'{rec[n]["rms"]:6.1f}' for n in NAMES))
    for lab, S in (('no step', [r for r in rows if not r['step']]), ('all', rows)):
        if not S:
            continue
        print(f'\n{lab} (n {len(S)}):')
        for nm in NAMES:
            l1 = [r[nm]['lat1'] for r in S if np.isfinite(r[nm]['lat1'])]; l2 = [r[nm]['lat2'] for r in S if np.isfinite(r[nm]['lat2'])]
            l5 = [r[nm]['lat50'] for r in S if np.isfinite(r[nm]['lat50'])]
            print(f'  {nm:7s} delay to 50 % of own plateau median {np.median(l5) if l5 else np.nan:5.0f} ms (n {len(l5)}) |'
                  f' latency @{a.th:g} N median {np.median(l1) if l1 else np.nan:6.0f} ms (n {len(l1)}) | @{a.th2:g} N {np.median(l2) if l2 else np.nan:6.0f} ms (n {len(l2)})'
                  f' | RMS err median {np.median([r[nm]["rms"] for r in S]):5.1f} N | est/F ratio median {np.nanmedian([r[nm]["ratio"] for r in S]):.2f}')
        for th, key in (('50 %', 'lat50'), (a.th, 'lat1'), (a.th2, 'lat2')):
            pair = [r['MOB'][key] - r['IMUSME'][key] for r in S if np.isfinite(r['MOB'][key]) and np.isfinite(r['IMUSME'][key])]
            if pair:
                print(f'  paired MOB - IMU-SME @{th}: median {np.median(pair):+.0f} ms, IMU-SME earlier in {sum(p > 0 for p in pair)}/{len(pair)}')
    inP = np.zeros(len(t), bool)
    for t0, t1 in P:
        inP |= (t > t0 - .5) & (t < t1 + 1.)
    q = ~inP & (Fi < 1.5) & act.all(1) & np.isfinite(X['IMUSME'][:, 0])                # windowed replay: only computed ticks
    quiet = {nm: float(np.sqrt(np.mean(np.sum((X[nm][q, :2] - np.median(X[nm][q, :2], 0)) ** 2, 1)))) for nm in NAMES} if q.sum() > 100 else None
    if q.sum() > 100:
        print(f'\nquiet noise (xy RMS about the median, n {q.sum()}): ' + ', '.join(f'{nm} {np.sqrt(np.mean(np.sum((X[nm][q, :2] - np.median(X[nm][q, :2], 0)) ** 2, 1))):.1f} N' for nm in NAMES))
    json.dump(dict(run=a.run, th=a.th, th2=a.th2, dir=a.dir, quiet=quiet, quiet_n=int(q.sum()), pushes=rows), open(os.path.join(a.run, 'compare_sync.json' if a.dir == 'imusme' else 'compare_sync_dirmean.json'), 'w'), indent=1, default=float)


if __name__ == '__main__':
    main()
