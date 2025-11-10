# TigerMatch‑PAM v2.0

A Triad‑Aware Monotone Probabilistic Acceptability Model with AUC‑consistent pairwise training and δ‑stable matching

## Executive Summary
- Triad‑aware likelihood: each direction (A→B) contributes a probability of passing A’s filter, not a hard 0/1.
  - Likert: 2‑D monotone kernel F_i(t,d)∈[0,1], non‑decreasing in tolerance (t) and non‑increasing in self–partner distance (d=|x^A−x^B|).
  - MC: soft‑acceptance using a population item‑specific option similarity s_i(o,o′) so near‑miss answers partly pass.
- Importance calibration: learn a monotone map λ(cat) from {0,1,10,50,250}→R≥0; learn domain multipliers and Top‑3 boost.
- Uncertainty‑aware scoring: compute directional satisfaction posteriors and aggregate with additive logits; use a lower‑confidence bound (LCB) with Kish n_eff.
- AUC‑consistent training: pairwise logistic ranking loss over true‑vs‑decoy comparisons.
- δ‑stable matching: rank by LCB scores; run Stable Marriage/Roommates with ties and incomplete lists.

---

## 1) Formal Setup
For items i=1..50 and user A: Self x_i^A; Acceptable T_i^A (Likert tolerance 0/±1/±2/Any or MC set S_i^A⊂Ω_i); Importance c_i^A∈{0,1,10,50,250}; Domain d(i)∈D; Top‑3 priorities P_A⊂D.

### 1.1 Likert Acceptability (A→B)
Distance d_i(A,B)=min(|x_i^A−x_i^B|,3)∈{0,1,2,3}; tolerance t_i^A∈{0,1,2,3}.
Model pass probability:
  p_i^A(B)=σ(α_i + Σ_c a_{i,c}·1[d≥c] + Σ_r b_{i,r}·1[t≥r]),
with σ logistic; monotone constraints a_{i,c}≤0 (antitone in distance) and b_{i,r}≥0 (isotone in tolerance).

### 1.2 MC Acceptability (A→B)
Compute per‑item similarity s_i(o,o′)∈[0,1] from co‑acceptance. For B’s answer y:
  sim_i^A(y)=max_{o∈S_i^A} s_i(y,o),  p_i^A(B)=σ(α_i^MC + η_i·sim_i^A(y)), η_i≥0.

### 1.3 Importance & Domains
Learn λ:{0,1,10,50,250}→R≥0 monotone; domain weights m_d>0; Top‑3 multiplier ψ≥1.
Per‑item directional weight W_i^A = λ(c_i^A)·m_{d(i)}·(ψ if d(i)∈P_A else 1).

### 1.4 Directional Satisfaction, Uncertainty, Pair Score
Weighted mean pass:
  ŝ_A(B) = Σ_i W_i^A p_i^A(B) / Σ_i W_i^A.
Variance (independence approx):
  Var[ŝ_A(B)] ≈ Σ_i (W_i^A)^2 p(1−p) / (Σ_i W_i^A)^2.
Kish effective n: n_eff^A(B) = (Σ_i W)^2 / Σ_i W^2.
LCB(1−δ): s̲_A^δ(B) = max(0, ŝ_A(B) − z_δ·sqrt(Var)).
Aggregate two directions with additive logits:
  Score_δ(A,B) = logit(s̲_A^δ(B)) + logit(s̲_B^δ(A)).

---

## 2) Learning Objective (AUC‑consistent Pairwise Ranking)
Parameters Θ = {α_i, a_{i,·}, b_{i,·}, α_i^MC, η_i, λ(·), m_d, ψ}.
Minimize pairwise logistic loss over triples (A, P, D): true partner P, decoy D:
  L(Θ)=Σ_A Σ_D log(1+exp(−[Score_δ(A,P)−Score_δ(A,D)])) + R(Θ),
with regularization and monotone reparameterizations (softplus to enforce signs).
Consistency sketch: pairwise logistic is an AUC surrogate; with LCB→truth asymptotically and step‑surface capacity, minimizers approach Bayes rankings.

---

## 3) Properties (Sketches)
- Monotonicity: F_i antitone in distance, isotone in tolerance; λ monotone → raising tolerance/importance never decreases ŝ.
- Confidence‑aware shrinkage: s̲_A^δ(B) is a one‑sided normal LCB; logit is increasing; coverage preserved.
- AUC‑consistency: standard surrogate consistency under capacity assumptions.
- δ‑stability: rankings from LCBs yield probabilistic δ‑stable matchings (union bound on both directions).

---

## 4) Matching and Incentives
- Build incomplete ranked lists using R_A(B)=logit(s̲_A^δ(B)); drop pairs under thresholds (τ) or mandatory‑item caps.
- Run Gale‑Shapley (bipartite) or Stable Roommates with Ties and Incompletes.
- Incentives: importance inflation not strategy‑proof; tolerance increases proposer’s outgoing ranks; document clearly.

---

## 5) Implementation Plan (Maps to `tiger-alg/*`)
```
models/            accept_kernels.py, importance_map.py, domain_weights.py, mc_similarity.py
train/             data.py, pair_sampler.py, loss.py, trainer.py
scoring/           directional.py, pair_score.py, score_pairs_cli.py
eval/              evaluate_pam.py, plots.py
matching/          rankings.py, stable.py
tools/             build_meta_from_repo.py
```

### CLI Contracts
Train:
```
python -m train.trainer \
  --export_csv ../export.csv \
  --couples_csv ../couples.csv \
  --meta_json meta.json \
  --outdir out_pam \
  --negatives 20 --delta 0.10 --seed 1
```
Score:
```
python -m scoring.score_pairs_cli \
  --export_csv ../export.csv \
  --meta_json meta.json \
  --model out_pam/model.pt \
  --delta 0.10 \
  --out scores.csv
```
Evaluate:
```
python -m eval.evaluate_pam \
  --scores_csv scores.csv \
  --couples_csv ../couples.csv \
  --out summary.csv
```
Match (optional):
```
python -m matching.rankings --scores_csv scores.csv --delta 0.10 --tau 0.20 --out lists.json
python -m matching.stable --lists lists.json --mode bipartite --out matching.json
```

### Training Pseudocode (High‑Level)
```python
S = build_mc_similarity(export_csv, meta_json)
triples = sample_true_vs_decoys(couples_csv, export_csv, N=negatives)
Θ = init_params(meta_json, warm_start_from_baseline=True)
for epoch in range(E):
  for batch in minibatch(triples, B):
    diff = [Score_δ(A,P,Θ,S) - Score_δ(A,D,Θ,S) for (A,P,D) in batch]
    loss = mean(log1p(exp(-tensor(diff)))) + R(Θ)
    loss.backward(); optimizer.step(); optimizer.zero_grad()
```

---

## 6) Why It Beats the Baseline
1) Probabilistic acceptability captures near‑misses per item. 2) Learned importance scale λ calibrates discrimination. 3) MC similarity rescues sparse sets. 4) LCB is variance‑aware and interpretable. 5) Pairwise training aligns with AUC/rank evaluation.

## 7) Ablations & Sensitivity
A1: remove LCB; A2: identity λ; A3: freeze (m_d,ψ); A4: hard thresholds vs F_i; A5: MC exact‑set; A6: aggregator choices; A7: LCB vs c/√n; A8: negatives per A; A9: δ grid.

## 8) Interpretability
- Likert distance–tolerance surfaces F_i(t,d) heatmaps.
- Importance λ curve with CIs; domain weights m_d and ψ with CIs.
- Item and domain contributions; per‑pair top ± items.

## 9) Complexity & Anytime Updates
- Scoring O(|I_AB|) per direction. Training O(E·C·N·Ī). Supports incremental updates; cache MC similarities.

## 10) Small‑Sample Notes
- L2 regularization; domain‑level tying (optional). Missing items ignored; n_eff reflects weight concentration. Default MC acceptable = own selection(s) when blank.

## 11) Methods PDF Checklist
Model, Learning, Theory (monotonicity, AUC consistency, LCB, δ‑stability), Robustness, Matching (τ, δ), Ethics.

## 12) Expected Outputs
- `scores.csv`: A,B,score,dir stats, LCBs, n_eff, overlap.
- `summary.csv`: AUC, median‑rank, Hit@K, lift, CIs.
- `interp/*`: F_i grids, λ curve, m_d/ψ bars, contributions.
- `matching.json`: δ‑stable matching and rationale.

## 13) Relation to Baseline
- Reduces to v1.0 when kernels are hard thresholds, λ identity, and fixed multipliers; improvements via soft edges, calibrated importance, LCB, and AUC‑aligned training.

## 14) Sensible Defaults
- Negatives=20; δ=0.10; LR=1e‑2; Adam; batch=128; early stop on val AUC; weight decay=1e‑4; MC similarity via Jaccard of co‑acceptance.

### Appendices (Sketches)
- Monotonicity proof idea; AUC consistency sketch; δ‑stability union‑bound argument.

## Implementation Notes
- Scripts consume current export shape; Q47 mapped from `data/questions.json`; IMC items ignored via zero domain weight.

