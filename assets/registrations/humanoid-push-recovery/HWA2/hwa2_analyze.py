"""HWA2 analysis (CRITERIA_HWA2.json): SUSTAINED lateral pushes (~2 s), hold-layer ablation vs ours, steps disabled, same env as HWA1.
Per push (HWL1 segmentation, hwl1_analyze.analyse_run):
  counted  quiet rule (HWL1 amendment 2), plateau >= 30 N, lateral (HWL1 amendment 3), duration 1.5-2.5 s (load cell above 8 N)
  level    40 or 60 N by the block plan (push 1 of a block = 40 N, push 2 = 60 N; the plateau is reported, not re-binned)
  held     the HWA1 rule (hwa1_analyze / hwl1_analyze with the 12 deg tilt-rise limit): no foot lift, tilt rise < 12 deg, knee >= 0.6 rad,
           no guard stop / DAMP / leaving RUN / end of stream within 3 s after the load cell falls below 8 N
Primary (H1): held proportion over all counted pushes, ours > ablation, one-sided Fisher exact, alpha 0.05.
Reported: per level held counts per arm; plateau / duration / impulse of each push; peak tilt; hold-first ticks per block (arm check).
usage: python hwa2_analyze.py <recordings> --out hwa2_results.json   (label hwa2_ours_* / hwa2_abl_*)"""
import os, sys, json, re, argparse
import numpy as np
from scipy.stats import fisher_exact
H = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, H)
import hwa1_analyze as A1                       # sets hwl1_analyze.TILT = 12 deg and level_of; provides hold_ticks
HL = A1.HL
FMIN, DUR = 30., (1.5, 2.5)
EXCLUDE = ('g1lc_20261119_165237_hwa2_ours_b2_R', 'g1lc_20261119_170546_hwa2_ours_b8_R')   # amendment 1


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('runs', nargs='+'); ap.add_argument('--out', default='hwa2_results.json'); a = ap.parse_args()
    P, blocks = [], []
    for run in a.runs:
        run = run.rstrip('/'); lab = os.path.basename(run)
        if lab in EXCLUDE: print(f'{lab}: excluded'); continue
        arm = 'ours' if 'hwa2_ours' in lab else 'abl' if 'hwa2_abl' in lab else None
        if arm is None: raise SystemExit(f'{run}: label must contain hwa2_ours or hwa2_abl')
        allp = HL.analyse_run(run); k = 0
        for p in allp:
            if p['plateau'] < 20: continue
            k += 1
            ok = p['quiet'] and p['plateau'] >= FMIN and p['lateral'] and DUR[0] <= p['dur'] <= DUR[1]
            P.append(dict(run=lab, arm=arm, push=k, level=(40 if k == 1 else 60 if k == 2 else None), plateau=p['plateau'], dur=p['dur'], impulse=p['impulse'],
                          counted=bool(ok and k <= 2), held=bool(p['held']), modes=[m for m in ('lift', 'tilt', 'knee', 'damp', 'left_run', 'ended') if p.get(m)]))
        blocks.append(dict(run=lab, arm=arm, hold_ticks=A1.hold_ticks(run), pushes_ge20=k))
    C = [p for p in P if p['counted']]
    o = [p for p in C if p['arm'] == 'ours']; b = [p for p in C if p['arm'] == 'abl']
    res = dict(criteria='CRITERIA_HWA2.json', pushes=P, blocks=blocks)
    if o and b:
        tab = [[sum(p['held'] for p in o), sum(not p['held'] for p in o)], [sum(p['held'] for p in b), sum(not p['held'] for p in b)]]
        res['H1'] = dict(table_ours_abl_held_failed=tab, p=float(fisher_exact(tab, alternative='greater')[1]))
        res['H1']['met'] = bool(res['H1']['p'] < .05)
        res['by_level'] = {lv: {arm: [sum(p['held'] for p in C if p['arm'] == arm and p['level'] == lv), sum(1 for p in C if p['arm'] == arm and p['level'] == lv)] for arm in ('ours', 'abl')} for lv in (40, 60)}
    json.dump(res, open(a.out, 'w'), indent=1)
    print(json.dumps({k: v for k, v in res.items() if k not in ('pushes',)}, indent=1))


if __name__ == '__main__':
    main()
