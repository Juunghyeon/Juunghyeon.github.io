"""HWL1 pre-registered report (CRITERIA_HWL1 amendment 6, robot PC 2026-11-18): every output is fixed here BEFORE the data it is run on.

  env -u PYTHONPATH python -B hwl1_report.py <recording dirs ...> [--out DIR] [--boot 2000] [--seed 0]

Data sets (decided by recording start time, never by outcome):
  PRIMARY   recordings started after AMEND5_WALL (amendment-5 shape window) - all decisions use only this set
  EARLY     round-3 recordings before AMEND5_WALL (registered shape window) - reported separately, never pooled into decisions
  POOLED    EARLY + PRIMARY counted pushes (amendment 5: 'reported separately as well as pooled') - reported only
Per push the rules of hwl1_analyze.py (hashed): counted = quiet & shape & lateral; held / failed; plateau, duration, rise, impulse,
LIPM DCM shift, side, rebound, hold-entry latency.

PRIMARY analysis (unchanged registered decisions, amendment 5 model):
  P1  common-slope logistic held ~ plateau + level intercepts + log(duration / 0.5 s); F50(L) at 0.5 s, r20 = F50(20)/F50(0),
      r40 = F50(40)/F50(0), parametric bootstrap CI; L1-a: r40 upper 95 % < 1; L1-b: |r20 - 0.927| <= 0.08 and |r40 - 0.859| <= 0.08.
      If a level has no failure or no hold (separation), its F50 is reported as a bound ('> max held' / '< min failed') and the
      decisions that need it are 'not estimable' (no decision is made from a separated fit); the same if a covariate coefficient
      exceeds 50 in magnitude (quasi-separation).
SECONDARY (reported, no decision thresholds):
  S1  manipulation check: hold-entry latency after the load cell's 25 N crossing per level (median, IQR, n); expected +20 / +40 ms.
  S2  per level: counted, held, failed, plateau range of each, failure modes (lift / tilt / knee / damp / left_run / ended).
  S3  boundary in impulse (N s): the P1 model with impulse instead of plateau and without the duration term; impulse ratios.
  S4  boundary in the LIPM DCM shift delta (m, CoP fixed at the start): the same model on delta; ratios vs exp(-omega L).
  S5  side: P1 with an added common left/right intercept; F50 per side and level.
  S6  order: P1 with the block index within the level and the push index within the block as covariates (sensitivity of r20, r40).
  S7  registered-shape subset: P1 restricted to pushes that also meet the registered window (0.35-0.65 s, rise < 0.15 s).
  S8  release rebound: CoM travel back toward the pusher after the release, per level (median, IQR) and vs plateau (Spearman).
  S9  figure hwl1_fig.pdf/png: (a) P(held) vs plateau per level with the P1 curves at 0.5 s; (b) F50 ratio vs added delay with
      bootstrap CI and exp(-omega L), omega = 3.8 1/s.
  S10 LaTeX macros hwl1_numbers.tex for the manuscript (hwLoneZero, hwLoneTwenty, hwLoneForty, hwLoneRtwenty, hwLoneRforty,
      hwLoneSummary, hwHoldOurs, hwHoldN, hwEntryLat) - written to the output folder, the manuscript file is not touched.
"""
import os, sys, json, argparse, re
import numpy as np
from scipy.optimize import minimize
from scipy.stats import spearmanr

H = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, H)
import hwl1_analyze as A

LEVELS = (0, 20, 40)


def logit_fit(X, cov, y):
    """logit P(held) = X a - b cov[:,0] - c . cov[:,1:]; returns params (a, b, c), success flag."""
    nl = X.shape[1]; k = cov.shape[1]
    def nll(th):
        z = X @ th[:nl] - cov @ th[nl:nl + k]; return np.sum(np.logaddexp(0, z) - y * z)
    s0 = np.std(cov[:, 0]) / 2 or 1.; th0 = np.r_[[np.median(cov[:, 0]) / s0] * nl, 1 / s0, [0.] * (k - 1)]
    r = minimize(nll, th0, method='BFGS')
    return r.x, bool(r.success or np.isfinite(r.fun))


def boundary(P, key='plateau', dur_cov=True, extra=None, boot=2000, seed=0, scale=1.):
    """Common-slope model on `key`; F50 per level (at log(D/0.5) = 0 when dur_cov); separation -> bounds."""
    lv = np.array([p['L'] for p in P]); levels = [l for l in LEVELS if (lv == l).any()]
    y = np.array([p['held'] for p in P], float); x = np.array([p[key] for p in P], float) * scale
    out = dict(n=len(P), levels=levels, F50={}, ci95={}, bound={}, ratios={}, estimable=False)
    for l in levels:
        yl = y[lv == l]; xl = x[lv == l]
        if yl.all(): out['bound'][l] = ('>', float(xl.max() / scale))
        elif not yl.any(): out['bound'][l] = ('<', float(xl.min() / scale))
    if 0 not in levels or len(levels) < 2 or out['bound'].get(0) or len(set(y)) < 2: return out
    X = np.stack([lv == l for l in levels], 1).astype(float)
    cols = [x]
    if dur_cov: cols.append(np.log(np.array([p['dur'] for p in P]) / A.D_REF))
    for e in (extra or []): cols.append(np.array([p[e] for p in P], float))
    C = np.stack(cols, 1)
    th, ok = logit_fit(X, C, y); nl = len(levels); b = th[nl]
    if not ok or b <= 0: return out
    if np.any(np.abs(th[nl + 1:]) > 50): out['reason'] = 'quasi-separation on a covariate (|coef| > 50)'; return out
    F50 = {l: float(th[i] / b) for i, l in enumerate(levels)}
    pr = 1 / (1 + np.exp(-(X @ th[:nl] - C @ th[nl:]))); rng = np.random.default_rng(seed); B = {l: [] for l in levels}
    for _ in range(boot):
        yb = (rng.random(len(y)) < pr).astype(float)
        if len(set(yb)) < 2: continue
        tb, okb = logit_fit(X, C, yb)
        if okb and tb[nl] > 0:
            for i, l in enumerate(levels): B[l].append(tb[i] / tb[nl])
    for l in levels:
        if l in out['bound']: continue
        out['F50'][l] = F50[l] / scale; v = np.array(B[l]) / scale
        out['ci95'][l] = [float(np.percentile(v, 2.5)), float(np.percentile(v, 97.5))] if len(v) > 20 else None
    for l in levels:
        if l == 0 or l in out['bound']: continue
        rb = np.array(B[l]) / np.array(B[0]) if len(B[l]) == len(B[0]) and len(B[0]) > 20 else np.array([])
        rb = rb[np.isfinite(rb)]
        out['ratios'][l] = dict(r=float(F50[l] / F50[0]), ci95=[float(np.percentile(rb, 2.5)), float(np.percentile(rb, 97.5))] if len(rb) > 20 else None,
                                pred=float(np.exp(-A.OMEGA * l / 1000.)))
    out['estimable'] = True; out['slope'] = float(b); out['coef_extra'] = [float(v) for v in th[nl + 1:]]
    return out


def med_iqr(v):
    v = [x for x in v if x is not None and np.isfinite(x)]
    return dict(n=len(v), median=float(np.median(v)), iqr=[float(np.percentile(v, 25)), float(np.percentile(v, 75))]) if v else dict(n=0)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('runs', nargs='+'); ap.add_argument('--out', default='hwl1_report')
    ap.add_argument('--boot', type=int, default=2000); ap.add_argument('--seed', type=int, default=0); a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    allp = []
    for run in a.runs:
        s = json.load(open(os.path.join(run, 'session.json'))); early = s['start_wall_ns'] / 1e9 < A.AMEND5_WALL
        for p in A.analyse_run(run):
            p['set'] = 'EARLY' if early else 'PRIMARY'; allp.append(p)
    R = dict(criteria='CRITERIA_HWL1.json (amendment 6 report)', runs=a.runs, pushes=allp)
    for setname in ('PRIMARY', 'EARLY', 'POOLED'):
        C = [p for p in allp if (setname == 'POOLED' or p['set'] == setname) and p['counted']]
        if not C: R[setname] = dict(counted=0); continue
        S = dict(counted=len(C))
        p1 = boundary(C, 'plateau', True, boot=a.boot, seed=a.seed); S['P1'] = p1
        dec = {}
        if p1['estimable'] and 40 in p1['ratios'] and p1['ratios'][40]['ci95']:
            dec['L1-a r40 upper 95 % < 1'] = dict(upper=p1['ratios'][40]['ci95'][1], met=bool(p1['ratios'][40]['ci95'][1] < 1))
        else: dec['L1-a r40 upper 95 % < 1'] = 'not estimable'
        if p1['estimable'] and 20 in p1['ratios'] and 40 in p1['ratios']:
            r20, r40 = p1['ratios'][20]['r'], p1['ratios'][40]['r']
            dec['L1-b'] = dict(r20=r20, r40=r40, met=bool(abs(r20 - A.PRED[20]) <= A.BAND and abs(r40 - A.PRED[40]) <= A.BAND))
        else: dec['L1-b'] = 'not estimable'
        S['decisions'] = dec if setname == 'PRIMARY' else f'none ({setname} set is reported only)'
        S['S1_entry_latency_ms'] = {l: med_iqr([p['entry_after_25N_ms'] for p in C if p['L'] == l]) for l in LEVELS}
        S2 = {}
        for l in LEVELS:
            Cl = [p for p in C if p['L'] == l]; h = [p['plateau'] for p in Cl if p['held']]; f = [p for p in Cl if not p['held']]
            S2[l] = dict(counted=len(Cl), held=len(h), failed=len(f), held_range=[min(h), max(h)] if h else None,
                         failed_range=[min(p['plateau'] for p in f), max(p['plateau'] for p in f)] if f else None,
                         modes={k: sum(bool(p[k]) for p in f) for k in ('lift', 'tilt', 'knee', 'damp', 'left_run', 'ended')})
        S['S2_per_level'] = S2
        S['S3_impulse'] = boundary(C, 'impulse', False, boot=a.boot, seed=a.seed)
        S['S4_delta_dcm'] = boundary(C, 'delta_dcm', False, boot=a.boot, seed=a.seed, scale=100.)   # fitted in cm, reported in m
        for p in C: p['side_R'] = 1. if p['side'] == 'R' else 0.
        S['S5_side'] = boundary(C, 'plateau', True, extra=['side_R'], boot=a.boot, seed=a.seed) if len({p['side'] for p in C}) == 2 else 'one side only'
        bk = {}
        for p in C:
            key = (p['L'], p['block']); bk.setdefault(key, []).append(p)
        for key, v in bk.items():
            for i, p in enumerate(sorted(v, key=lambda q: q['t'])): p['push_idx'] = float(i)
        bl = {}
        for (l, b) in sorted(bk, key=lambda k: (k[0], int(k[1]) if k[1].isdigit() else 0)): bl.setdefault(l, []).append(b)
        for p in C: p['block_idx'] = float(bl[p['L']].index(p['block']))
        S['S6_order'] = boundary(C, 'plateau', True, extra=['block_idx', 'push_idx'], boot=a.boot, seed=a.seed)
        Cr = [p for p in C if p['shape_registered']]
        S['S7_registered_shape'] = boundary(Cr, 'plateau', True, boot=a.boot, seed=a.seed) if Cr else dict(n=0)
        S['S8_rebound_m'] = {l: med_iqr([p['rebound'] for p in C if p['L'] == l and p['held']]) for l in LEVELS}
        hv = [p for p in C if p['held']]
        if len(hv) > 4:
            rho, pv = spearmanr([p['plateau'] for p in hv], [p['rebound'] for p in hv]); S['S8_rebound_vs_plateau'] = dict(rho=float(rho), p=float(pv), n=len(hv))
        R[setname] = S
    json.dump(R, open(os.path.join(a.out, 'hwl1_report.json'), 'w'), indent=1, default=float)
    figure(R, allp, a.out); macros(R, a.out); summary(R, a.out)
    print(open(os.path.join(a.out, 'hwl1_report.md')).read())


def figure(R, allp, out):
    try:
        import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
    except Exception: return
    S = R.get('PRIMARY', {}); p1 = S.get('P1') if isinstance(S, dict) else None
    fig, ax = plt.subplots(1, 2, figsize=(7.2, 2.8)); col = {0: '#1f77b4', 20: '#ff7f0e', 40: '#d62728'}
    C = [p for p in allp if p['set'] == 'PRIMARY' and p['counted']]
    for l in LEVELS:
        pl = [p for p in C if p['L'] == l]
        if not pl: continue
        ax[0].scatter([p['plateau'] for p in pl], [p['held'] + (np.random.default_rng(l).random() - .5) * .06 for p in pl], s=12, color=col[l], label=f'+{l} ms')
        if p1 and p1.get('estimable') and l in p1['F50']:
            f = np.linspace(min(p['plateau'] for p in C) * .9, max(p['plateau'] for p in C) * 1.05, 100)
            ax[0].plot(f, 1 / (1 + np.exp(-p1['slope'] * (p1['F50'][l] - f))), color=col[l])
    ax[0].set_xlabel('push plateau (N, load cell)'); ax[0].set_ylabel('held'); ax[0].legend(fontsize=7)
    Ls = np.linspace(0, 45, 50); ax[1].plot(Ls, np.exp(-A.OMEGA * Ls / 1000), 'k--', lw=1, label='exp(-omega L)')
    if p1 and p1.get('estimable'):
        ax[1].plot([0], [1], 'ko')
        for l, r in p1['ratios'].items():
            ci = r['ci95'] or [r['r'], r['r']]; ax[1].errorbar([l], [r['r']], yerr=[[r['r'] - ci[0]], [ci[1] - r['r']]], fmt='o', color=col[l], capsize=3)
    ax[1].set_xlabel('added delay L (ms)'); ax[1].set_ylabel('F50(L) / F50(0)'); ax[1].legend(fontsize=7)
    fig.tight_layout(); fig.savefig(os.path.join(out, 'hwl1_fig.pdf')); fig.savefig(os.path.join(out, 'hwl1_fig.png'), dpi=150); plt.close(fig)


def fmt_f50(p1, l):
    if l in p1.get('bound', {}): s, v = p1['bound'][l]; return ('$>$' if s == '>' else '$<$') + f'{v:.0f}'
    if l in p1.get('F50', {}):
        ci = p1['ci95'].get(l); return f"{p1['F50'][l]:.0f}" + (f" ({ci[0]:.0f}--{ci[1]:.0f})" if ci else '')
    return r'\tbd'


def macros(R, out):
    S = R.get('PRIMARY', {}); p1 = S.get('P1', {}) if isinstance(S, dict) else {}
    m = {'hwLoneZero': fmt_f50(p1, 0), 'hwLoneTwenty': fmt_f50(p1, 20), 'hwLoneForty': fmt_f50(p1, 40)}
    for l, k in ((20, 'hwLoneRtwenty'), (40, 'hwLoneRforty')):
        r = p1.get('ratios', {}).get(l); m[k] = (f"{r['r']:.2f}" + (f" ({r['ci95'][0]:.2f}--{r['ci95'][1]:.2f})" if r.get('ci95') else '')) if r else r'\tbd'
    d = S.get('decisions', {}) if isinstance(S, dict) else {}
    a_ = d.get('L1-a r40 upper 95 % < 1'); m['hwLoneSummary'] = ('met' if isinstance(a_, dict) and a_['met'] else 'not met' if isinstance(a_, dict) else 'not estimable')
    s2 = S.get('S2_per_level', {}).get(0, {}) if isinstance(S, dict) else {}
    m['hwHoldOurs'] = str(s2.get('held', r'\tbd')); m['hwHoldN'] = str(s2.get('counted', r'\tbd'))
    e = S.get('S1_entry_latency_ms', {}).get(0, {}) if isinstance(S, dict) else {}
    m['hwEntryLat'] = f"{e['median']:.0f}" if e.get('n') else r'\tbd'
    with open(os.path.join(out, 'hwl1_numbers.tex'), 'w') as f:
        f.write('% generated by hwl1_report.py (CRITERIA_HWL1 amendment 6); copy into hw_numbers.tex when the result is final\n')
        for k, v in m.items(): f.write(f'\\renewcommand{{\\{k}}}{{{v}}}\n')


def summary(R, out):
    L = ['# HWL1 report (pre-registered outputs, CRITERIA_HWL1 amendment 6)', '']
    for setname in ('PRIMARY', 'EARLY', 'POOLED'):
        S = R.get(setname, {}); L.append(f'## {setname} set: {S.get("counted", 0)} counted pushes')
        if not S.get('counted'): L.append(''); continue
        p1 = S['P1']; L.append(f"P1 F50 at 0.5 s (N): " + ', '.join(f'L{l}: {fmt_f50(p1, l)}' for l in p1['levels']))
        L.append('P1 ratios: ' + (', '.join(f"r{l} {r['r']:.3f} CI {r['ci95']} (pred {r['pred']:.3f})" for l, r in p1['ratios'].items()) or 'not estimable'))
        L.append(f"decisions: {S['decisions']}")
        L.append('S1 entry latency after 25 N (ms): ' + ', '.join(f"L{l} {v.get('median', float('nan')):.0f} (n {v['n']})" for l, v in S['S1_entry_latency_ms'].items() if v['n']))
        L.append('S2 per level: ' + '; '.join(f"L{l}: {v['counted']} counted, {v['held']} held {v['held_range']}, {v['failed']} failed {v['failed_range']} {v['modes']}" for l, v in S['S2_per_level'].items() if v['counted']))
        for k in ('S3_impulse', 'S4_delta_dcm', 'S5_side', 'S6_order', 'S7_registered_shape'):
            v = S.get(k)
            if isinstance(v, dict) and v.get('estimable'): L.append(f"{k}: ratios " + ', '.join(f"r{l} {r['r']:.3f}" for l, r in v['ratios'].items()) + (f", coef {v.get('coef_extra')}" if v.get('coef_extra') else ''))
            elif isinstance(v, dict): L.append(f"{k}: not estimable (n {v.get('n')}, bounds {v.get('bound')})")
            else: L.append(f'{k}: {v}')
        L.append('S8 rebound (m, held pushes): ' + ', '.join(f"L{l} {v.get('median', float('nan')):.3f} (n {v['n']})" for l, v in S['S8_rebound_m'].items() if v['n']))
        L.append('')
    L.append('Figure: hwl1_fig.pdf / .png; manuscript macros: hwl1_numbers.tex')
    open(os.path.join(out, 'hwl1_report.md'), 'w').write('\n'.join(L) + '\n')


if __name__ == '__main__':
    main()
