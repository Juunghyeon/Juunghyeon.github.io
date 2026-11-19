"""HWA1 analysis (CRITERIA_HWA1.json): hold-layer ablation vs ours on the real G1, steps disabled, same env.
Per block (one sync recording = one ascending lateral series, ended by the series or a failure):
  pushes      HWL1 segmentation (hwl1_analyze.analyse_run); counted = quiet rule (amendment 2), plateau >= 20 N, lateral (amendment 3)
  held        HWL1 amendment-7 rule with the tilt-rise limit 12 deg (HWD1 amendment 2): no foot lift, tilt rise < 12 deg, knee >= 0.6 rad,
              no guard stop / DAMP / leaving RUN / end of stream within 3 s
  block score highest plateau among counted HELD pushes of the block (0 if none)
A1 (primary): block scores, ours > ablation, one-sided Mann-Whitney U (exact when possible), alpha 0.05.
A2 (secondary): counted pushes with plateau 40-80 N, held proportion ours > ablation, one-sided Fisher exact.
Reported: per block first failed plateau, counts, held / failed against impulse, hold-first ticks per block (arm check: the ablation must have 0).
usage: python hwa1_analyze.py <recording>[:ours|:abl] ... --out hwa1_results.json   (arm from ':arm' or the label hwa1_ours_* / hwa1_abl_*)"""
import os, sys, json, glob, re, pickle, argparse, time
_CACHE = {}
import numpy as np
from scipy.stats import mannwhitneyu, fisher_exact
H = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, H)
import hwl1_analyze as HL
HL.level_of = lambda run: 0
HL.TILT = float(np.radians(12.))
FMIN, LO, HI = 20., 40., 80.
CAP = 80.   # amendment 1(b): block score capped at the registered top of the series
CONFIG_BAD = ('g1lc_20261119_153424_hwa1_ours_s1_b1_L',)                                               # wrong config (both analyses)
FIRSTS = ('g1lc_20261119_154858_hwa1_ours_s1_b4_R', 'g1lc_20261119_161051_hwa1_ours_s2_b2_R', 'g1lc_20261119_161348_hwa1_ours_s2_b3_L', 'g1lc_20261119_162140_hwa1_ours_s2_b6_R')
REPEATS = ('g1lc_20261119_154939_hwa1_ours_s1_b4_R', 'g1lc_20261119_161132_hwa1_ours_s2_b2_R', 'g1lc_20261119_161452_hwa1_ours_s2_b3_L', 'g1lc_20261119_162218_hwa1_ours_s2_b6_R')
EMPTY = ('g1lc_20261119_154458_hwa1_abl_s1_b2_R', 'g1lc_20261119_160609_hwa1_abl_s2_b1_L')                # logger restarts without a push
EXCLUDE = CONFIG_BAD + FIRSTS + EMPTY                                                                    # amendment 2 primary (repeats are the blocks)


def hold_ticks(run):
    """hold-first ticks in the deploy log that covers the recording (arm check only)."""
    s = json.load(open(os.path.join(run, 'session.json'))); t0, t1 = s['start_mono_ns'] / 1e9, s['stop_mono_ns'] / 1e9
    best = None
    for f in sorted(glob.glob(os.path.join(HL.LOGS, 'R2_' + time.strftime('%Y%m%d', time.localtime(s['start_wall_ns'] / 1e9)) + '_*.part.pkl'))):
        if f not in _CACHE:
            rows = []
            try:
                with open(f, 'rb') as fh:
                    while True:
                        try: x = pickle.load(fh); rows += x if isinstance(x, list) else [x]
                        except Exception: break
            except Exception: rows = []
            _CACHE[f] = [(r['mono'], ((r.get('hold') or {}).get('est_on') or 0)) for r in rows if r.get('mono') is not None]
        rows = [dict(mono=m_, hold=dict(est_on=e_)) for m_, e_ in _CACHE[f]]
        if rows and rows[0]['mono'] <= t1 and rows[-1]['mono'] >= t0: best = rows
    if best is None: return None
    return int(sum(1 for r in best if t0 <= r['mono'] <= t1 and ((r.get('hold') or {}).get('est_on') or 0)))


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('runs', nargs='+'); ap.add_argument('--out', default='hwa1_results.json')
    ap.add_argument('--first', action='store_true', help='amendment 2 first-attempt analysis'); a = ap.parse_args()
    excl = (CONFIG_BAD + REPEATS + EMPTY) if a.first else EXCLUDE
    B = []
    for spec in a.runs:
        run, _, arm = spec.partition(':'); run = run.rstrip('/'); lab = os.path.basename(run)
        if lab in excl: print(f'{lab}: excluded (amendments 1-2)'); continue
        arm = arm or ('ours' if 'hwa1_ours' in lab else 'abl' if 'hwa1_abl' in lab else None)
        if arm not in ('ours', 'abl'): raise SystemExit(f'{run}: arm unknown (label hwa1_ours_* / hwa1_abl_* or <run>:ours|abl)')
        P = [p for p in HL.analyse_run(run) if p['quiet'] and p['plateau'] >= FMIN and p['lateral']]
        held = [p['plateau'] for p in P if p['held']]; fail = [p['plateau'] for p in P if not p['held']]
        B.append(dict(run=lab, arm=arm, counted=len(P), score=float(min(max(held), CAP)) if held else 0., score_uncapped=float(max(held)) if held else 0., first_fail=float(fail[0]) if fail else None,
                      hold_ticks=hold_ticks(run), pushes=[dict(plateau=p['plateau'], dur=p['dur'], impulse=p['impulse'], held=bool(p['held']),
                      modes=[k for k in ('lift', 'tilt', 'knee', 'damp', 'left_run', 'ended') if p.get(k)]) for p in P]))
    M = {}
    for b in B:
        key = re.sub(r'^g1lc_\d{8}_\d{6}_', '', b['run'])
        if key in M:
            m = M[key]; m['pushes'] += b['pushes']; m['counted'] += b['counted']; m['run'] += '+' + b['run']
            h_ = [q['plateau'] for q in m['pushes'] if q['held']]; m['score'] = float(min(max(h_), CAP)) if h_ else 0.; m['score_uncapped'] = float(max(h_)) if h_ else 0.
            f_ = [q['plateau'] for q in m['pushes'] if not q['held']]; m['first_fail'] = float(f_[0]) if f_ else None
            m['hold_ticks'] = (m['hold_ticks'] or 0) + (b['hold_ticks'] or 0)
        else: M[key] = b
    B = list(M.values())
    so = [b['score'] for b in B if b['arm'] == 'ours']; sa = [b['score'] for b in B if b['arm'] == 'abl']
    res = dict(criteria='CRITERIA_HWA1.json', blocks=B)
    if so and sa:
        u = mannwhitneyu(so, sa, alternative='greater', method='auto')
        res['A1'] = dict(n_ours=len(so), n_abl=len(sa), median_ours=float(np.median(so)), median_abl=float(np.median(sa)), U=float(u.statistic), p=float(u.pvalue), met=bool(u.pvalue < .05))
    rng = lambda arm: [q for b in B if b['arm'] == arm for q in b['pushes'] if LO <= q['plateau'] <= HI]
    ro, ra = rng('ours'), rng('abl')
    if ro and ra:
        tab = [[sum(q['held'] for q in ro), sum(not q['held'] for q in ro)], [sum(q['held'] for q in ra), sum(not q['held'] for q in ra)]]
        res['A2'] = dict(table_ours_abl_held_failed=tab, p=float(fisher_exact(tab, alternative='greater')[1]))
    res['arm_check'] = {b['run']: b['hold_ticks'] for b in B}
    json.dump(res, open(a.out, 'w'), indent=1); print(json.dumps({k: v for k, v in res.items() if k != 'blocks'}, indent=1))
    for b in B: print(f"{b['run']}: {b['arm']} counted {b['counted']} score {b['score']:.1f} first_fail {b['first_fail']} hold_ticks {b['hold_ticks']}")


if __name__ == '__main__':
    main()
