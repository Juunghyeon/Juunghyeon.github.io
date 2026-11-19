"""HWE1 registered analysis (CRITERIA_HWE1.json, 2026-11-13): load-cell estimator validation on the real G1, pooled over recordings.

Input: compare_sync_dirmean.json of each recording (compare_sync.py --dir mean). Pushes are included by load-cell and contact state
only (never by an estimate): plateau 15-80 N, duration 0.15-1.5 s, load-cell 50 % crossing before the first foot lift (cens50 > 0).
A delay50 that an estimator never reaches before the foot lift / push end is censored at that time (cens50, a lower bound);
a pair is dropped only if both are undefined.

  python hwe1_analyze.py <run dir> [<run dir> ...] [--out hwe1_results.json]
"""
import os, json, argparse
import numpy as np
from scipy.stats import wilcoxon

NAMES = ('IMUSME', 'MOB', 'EMO', 'CIMU', 'SME')


def included(r):
    return 15. <= r['Fpl'] <= 80. and .15 <= r['dur'] <= 1.5 and np.isfinite(r.get('cens50', np.nan)) and r['cens50'] > 0


def paired(S, other, key='lat50'):
    d = []
    for r in S:
        a, b = r['IMUSME'][key], r[other][key]
        if key == 'lat50':
            a = a if np.isfinite(a) else r['cens50']; b = b if np.isfinite(b) else r['cens50']
            if not (np.isfinite(r['IMUSME'][key]) or np.isfinite(r[other][key])):
                continue
        elif not (np.isfinite(a) and np.isfinite(b)):
            continue
        d.append(b - a)
    return np.array(d)


def test(d, alpha):
    if len(d) < 1 or not np.any(d):
        return dict(n=int(len(d)), met=False)
    p = float(wilcoxon(d, alternative='greater').pvalue)
    return dict(n=int(len(d)), median_ms=float(np.median(d)), earlier=int((d > 0).sum()), p=p, alpha=alpha, met=bool(p < alpha))


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('runs', nargs='+'); ap.add_argument('--out', default='hwe1_results.json')
    a = ap.parse_args()
    S, excl, quiet = [], 0, []
    for run in a.runs:
        d = json.load(open(os.path.join(run, 'compare_sync_dirmean.json')))
        for r in d['pushes']:
            (S.append(dict(r, run=os.path.basename(run.rstrip('/')))) if included(r) else None); excl += not included(r)
        if d.get('quiet'):
            quiet.append(dict(run=os.path.basename(run.rstrip('/')), n=d['quiet_n'], **d['quiet']))
    dec = {'H1 (primary) delay50 MOB > ours': test(paired(S, 'MOB'), .01),
           'H2 delay50 EMO > ours': test(paired(S, 'EMO'), .05),
           'H3 latency @25 N MOB > ours': test(paired(S, 'MOB', 'lat1'), .05)}
    if dec['H1 (primary) delay50 MOB > ours']['n'] < 30:
        dec['H1 (primary) delay50 MOB > ours']['met'] = None                                   # fewer than 30 pairs: inconclusive
    rep = {nm: dict(delay50_median=float(np.nanmedian([r[nm]['lat50'] for r in S])) if S else None,
                    lat25_median=float(np.nanmedian([r[nm]['lat1'] for r in S])) if S else None,
                    rms_median=float(np.median([r[nm]['rms'] for r in S])) if S else None,
                    ratio_median=float(np.nanmedian([r[nm]['ratio'] for r in S])) if S else None) for nm in NAMES}
    rep['CIMU - ours delay50'] = test(paired(S, 'CIMU'), .05)
    rep['rms MOB - ours'] = (lambda d: dict(n=len(d), median_N=float(np.median(d)) if len(d) else None))(
        np.array([r['MOB']['rms'] - r['IMUSME']['rms'] for r in S]))
    by_dir = {}
    for r in S:
        q = ['+x', '+y', '-x', '-y'][int(((r['dir'] + 45) % 360) // 90)]
        by_dir.setdefault(q, []).append(r)
    rep['by direction'] = {q: dict(pushes=len(R), **{k: v for k, v in test(paired(R, 'MOB'), .05).items() if k != 'met'}) for q, R in sorted(by_dir.items())}
    out = dict(criteria='CRITERIA_HWE1.json', runs=a.runs, included=len(S), excluded=excl, decisions=dec, reported=rep, quiet=quiet)
    json.dump(out, open(a.out, 'w'), indent=1, default=float)
    print(json.dumps(dict(included=len(S), excluded=excl, decisions=dec), indent=1, default=float))


if __name__ == '__main__':
    main()
