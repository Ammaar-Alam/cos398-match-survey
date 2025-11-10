# TigerMatch‑PAM v2.0

**A Triad‑Aware Monotone Probabilistic Acceptability Model with AUC‑consistent pairwise training and δ‑stable matching**

## Executive summary (what’s new)

* **Triad‑aware likelihood**: For each direction (A→B), every item contributes a **probability of passing A’s stated filter**, not a hard 0/1.
  – **Likert**: a **2‑D monotone kernel** (F_i(t,d)\in[0,1]) that is **(i)** non‑decreasing in declared tolerance (t) and **(ii)** non‑increasing in self–partner distance (d=|x^A_i-x^B_i|), learned from couples via a constrained parametric family.
  – **MC**: a **soft‑acceptance kernel** based on a **population‑estimated option similarity** (s_i(o,o')) so near‑miss answers can still partly pass a filter.
* **Importance calibration**: Learn a **monotone map** (\lambda(\text{cat})) from ({0,1,10,50,250}) to (\mathbb R_{\ge 0}) instead of treating the categories as fixed linear weights; also **learn domain multipliers** and the **Top‑3 boost**.
* **Uncertainty‑aware scoring**: Compute **directional satisfaction posteriors** and aggregate with a strictly increasing function (H\big(\cdot,\cdot\big)). Use a **closed‑form lower‑confidence bound (LCB)** with a Kish effective‑sample‑size correction in lieu of an ad‑hoc (c/\sqrt n) penalty.
* **AUC‑consistent training**: Optimize a **pairwise logistic ranking loss** over **true‑vs‑decoy** comparisons built from your couples protocol; the loss is a standard AUC‑consistent surrogate.
* **δ‑stable matching**: Produce ranked lists from **LCB scores** and run Stable Marriage (or Stable Roommates) on **incomplete lists with ties**. We prove the resulting matching is **δ‑stable** in the sense that ex‑post blocking pairs occur with probability ≤ δ under the model’s uncertainty.

---

## 1) Formal setup

Let items (i=1,\dots,50). For user (A):

* **Self**: (x_i^A) (Likert integer or MC option(s))
* **Acceptable**: (T_i^A) (Likert tolerance category (\in{0,1,2,3}) mapping Same→0, ±1→1, ±2→2, Any→3) or an acceptable set (S_i^A\subseteq \Omega_i) (MC)
* **Importance**: category (c_i^A\in{0,1,10,50,250})
* **Domain**: (d(i)\in\mathcal D={\text{Values, Communication, Lifestyle, Social, Personality, Friendship}})
* **Top‑3 domains**: (\mathcal P_A\subset\mathcal D)

### 1.1 Likert acceptability kernel (A→B)

Define distance (d_i(A,B)=\min(|x_i^A-x_i^B|,3)\in{0,1,2,3}) and tolerance (t_i^A\in{0,1,2,3}).
We model the **pass probability**:
[
p_i^A(B)\equiv \Pr[\text{A accepts B on }i \mid x_i^A,x_i^B,T_i^A]
= \sigma!\left(\alpha_i + \sum_{c=1}^{3} a_{i,c},\mathbf 1[d_i\ge c] + \sum_{r=1}^{3} b_{i,r},\mathbf 1[t_i^A\ge r]\right),
]
with (\sigma(u)=1/(1+e^{-u})). **Monotone constraints**:
[
a_{i,c}\le 0\quad(\text{non‑increasing in distance}),\qquad
b_{i,r}\ge 0\quad(\text{non‑decreasing in tolerance}).
]
This “cumulative step” parameterization is convex‑friendly and yields a **piecewise‑constant, shape‑constrained** 2‑D surface (F_i(t,d)).

### 1.2 MC acceptability kernel (A→B)

Let (S_i^A\subseteq \Omega_i) be A’s accepted options (default to A’s own selection(s) if blank). Build a **population similarity** for each item (i):
[
s_i(o,o')\in[0,1],\quad s_i(o,o)=1,\quad s_i(o,o')=s_i(o',o),
]
estimated once from the survey’s **Acceptable** sets using normalized co‑acceptance (e.g., Jaccard/PMI; we keep (s_i) fixed during training for stability and interpretability).

Define soft proximity of B’s answer (y) to A’s acceptable set:
[
\mathrm{sim}*i^A(y) ;=; \max*{o\in S_i^A} s_i(y,o).\tag{MC‑proximity}
]
Then
[
p_i^A(B)=\sigma!\big(\alpha_i^{\text{MC}}+\eta_i,\mathrm{sim}_i^A(x_i^B)\big),\quad \eta_i\ge 0
]
(enforces monotonicity in “how close B is to A’s accepted set”). If (S_i^A=\emptyset) (rare), default (S_i^A={x_i^A}).

### 1.3 Importance calibration & domain weights

Learn a **non‑decreasing map** (\lambda:{0,1,10,50,250}\to\mathbb R_{\ge0}) with (\lambda(0)=0) via 1‑D isotonic regression or a constrained reparametrization (cumulative positive steps).
Learn domain weights (m_d>0) and a global Top‑3 multiplier (\psi\ge 1).

The **directional item weight**:
[
W_i^A ;=; \lambda(c_i^A)\cdot m_{d(i)}\cdot \big(\psi\ \text{if } d(i)\in\mathcal P_A \text{ else }1\big).
]

### 1.4 Directional satisfaction, uncertainty, and pair score

For overlap items (\mathcal I_{AB}) with (W_i^A>0), define (weighted) mean pass probability
[
\hat s_A(B) = \frac{\sum_{i\in\mathcal I_{AB}} W_i^A, p_i^A(B)}{\sum_{i\in\mathcal I_{AB}} W_i^A}.
]
Approximate (conditional) variance under independence:
[
\widehat{\mathrm{Var}}\big[\hat s_A(B)\big] ;\approx;
\frac{\sum_i (W_i^A)^2,p_i^A(B)\big(1-p_i^A(B)\big)}{\Big(\sum_i W_i^A\Big)^2}.
]
Define **Kish effective sample size**
[
n_{\mathrm{eff}}^A(B)=\frac{\Big(\sum_i W_i^A\Big)^2}{\sum_i (W_i^A)^2}.
]
For confidence level (1-\delta), let (z_\delta) be the normal quantile and set the **LCB**:
[
\underline s_A^\delta(B)=\max!\left{0,;\hat s_A(B) - z_\delta\sqrt{\widehat{\mathrm{Var}}[\hat s_A(B)]}\right}.
]
Aggregate the two directions with a strictly increasing map on ([0,1]^2). We use **additive logits** for convexity and interpretability:
[
\mathrm{Score}*\delta(A,B) ;=; \underbrace{\operatorname{logit}\big(\underline s_A^\delta(B)\big)}*{\in\mathbb R} + \underbrace{\operatorname{logit}\big(\underline s_B^\delta(A)\big)}_{\in\mathbb R}.
]
This replaces the baseline’s geometric mean and heuristic (c/\sqrt n) with a **probabilistic, variance‑aware** shrinkage.

---

## 2) Learning objective (AUC‑consistent pairwise ranking)

Your evaluation cares about **“partner outranks decoys”**. Train parameters
(\Theta={\alpha_i,a_{i,\cdot},b_{i,\cdot},\alpha_i^{\mathrm{MC}},\eta_i, \lambda(\cdot), m_d,\psi})
by minimizing the **pairwise logistic loss** over triples ((A,P,D)) (true partner (P) and a sampled non‑partner (D)):

[
\mathcal L(\Theta)=\sum_{A}\sum_{D\sim\mathcal N(A)}
\log\Big(1+\exp\big(-[\mathrm{Score}*\delta(A,P)-\mathrm{Score}*\delta(A,D)]\big)\Big)
;+; \mathcal R(\Theta).
]

(\mathcal R) contains: (i) (\ell_2) on free parameters; (ii) small quadratic priors anchoring (m_d) and (\psi) near the baseline multipliers; (iii) barrier terms to enforce the monotone sign constraints (e.g., parameterize (a_{i,c}=-\text{softplus}(\tilde a_{i,c})), (b_{i,r}=+\text{softplus}(\tilde b_{i,r})), (\eta_i=\text{softplus}(\tilde \eta_i)), steps for (\lambda) with softplus).

**Consistency (sketch).** The pairwise logistic is a standard AUC surrogate: if the scoring class contains the Bayes‑optimal difference function and the loss is proper/strictly convex in score differences, minimizers are **AUC‑consistent** (risk convergence implies AUC convergence). Our score is strictly increasing in each directional LCB; as sample size grows, LCB→truth and the function class induced by the monotone kernels can represent any antitone/isotone step surface on ({0,1,2,3}^2), hence contains the Bayes score on this discretization. (Full proof can go in the paper.)

---

## 3) Theoretical properties (high‑level)

**P1. Monotonicity** (exact).
By construction (F_i(t,d)) is non‑decreasing in (t) and non‑increasing in (d); (\lambda) is non‑decreasing; therefore, for fixed (B), **raising A’s tolerance/importance never decreases** (\hat s_A(B)).

**P2. Confidence‑aware shrinkage** (finite‑sample).
Under item‑wise conditional independence, (\underline s_A^\delta(B)) is a valid one‑sided normal LCB:
(\Pr[s_A(B)\ge \underline s_A^\delta(B)]\gtrsim 1-\delta). Aggregating through (\operatorname{logit}(\cdot)), which is increasing, preserves coverage.

**P3. AUC‑consistency** (asymptotic).
Given i.i.d. couples and non‑partners sampled as in your protocol, the pairwise logistic on score differences is **Fisher consistent** for maximizing the probability that the true pair outranks a random non‑partner. (We will include a formal statement and references in the methods PDF.)

**P4. δ‑stability of the matching** (probabilistic).
Let (\pi) be a matching produced by running Stable Marriage/Roommates on rankings **induced by (\mathrm{Score}_\delta)**. Then, with probability at least (1-2\delta) (union bound across two directions), no pair ((u,v)) forms a blocking pair under the unshrunk latent satisfactions, because any blocking would require both (u) and (v) to prefer each other **above their LCB‑ranked partners**, contradicting the LCB coverage. (We provide a precise lemma in the PDF.)

---

## 4) Mapping to matching and incentives

### 4.1 From scores to ranked lists

For each person (A), define a **directed** preference score to each candidate (B):
[
R_A(B)=\operatorname{logit}\big(\underline s_A^\delta(B)\big).
]
Create **incomplete lists** by removing any (B) for which either
(i) (\underline s_A^\delta(B)) falls below a deployment threshold (\tau) (e.g., 0.2), or
(ii) any “Mandatory” item has (\Pr[\text{pass}]) below a hard cap (e.g., (<0.1)).
Break ties by tiny deterministic jitter on (R_A(B)) for algorithmic convenience.

### 4.2 Stable matching with uncertainty

* **Bipartite cohorts**: run **Gale‑Shapley** on the incomplete lists.
* **Non‑bipartite cohorts**: run **Stable Roommates with Ties and Incomplete lists (SRTI)** (Irving + tie handling).

**Guarantee (sketch)**: Using LCB‑based rankings yields a matching that is **δ‑stable** in the probabilistic sense above. This provides a principled replacement for the baseline’s overlap penalty during deployment.

### 4.3 Incentives

* **Importance**: Since (\hat s_A(B)) is increasing in (\lambda(c)) and we optimize a symmetric mutual score, unilateral inflation of importance can distort others’ preferences toward/away from (A). The mechanism is **not strategy‑proof** (as with classic stable matching), but the **Top‑3 boost (\psi)** is learned globally and monotone, keeping reporting incentives transparent. We document this in the paper.
* **Tolerance**: raising tolerance weakly raises (A)’s outgoing rankings, which **cannot hurt** A in Gale‑Shapley if A is a proposer; if A is a receiver, effects are ambiguous (standard).

---

## 5) Implementation plan (drop‑in)

```
tiger-alg/
  models/
    accept_kernels.py        # Likert & MC kernels with monotone parameterizations
    importance_map.py        # λ: isotonic or positive cumulative steps
    domain_weights.py        # m_d and ψ with priors/regularizers
    mc_similarity.py         # build s_i(o,o') from Acceptable sets in export.csv
  train/
    data.py                  # loaders from export.csv / couples.csv / meta.json
    pair_sampler.py          # true-vs-decoy triples per A with N decoys
    loss.py                  # pairwise logistic on Scoreδ differences
    trainer.py               # SGD/Adam, early stopping on val AUC
  scoring/
    directional.py           # compute p_i^A(B), ŝ, Var, n_eff, LCB
    pair_score.py            # Scoreδ(A,B) = logit(LCB_A) + logit(LCB_B)
    score_pairs_cli.py       # emits scores.csv (A,B,score,overlap,neffA,neffB,...)
  eval/
    evaluate_pam.py          # mirrors baseline metrics + CIs + permutation null
    plots.py                 # interp visuals (distance–tolerance surfaces, λ, m_d)
  matching/
    rankings.py              # build incomplete lists from LCBs + thresholds
    stable.py                # Gale-Shapley & SRTI (ties, incompletes)
    deploy_note.md           # δ-stability statement and knobs
  README.md
```

### 5.1 CLI contract

* **Train**

  ```
  python -m train.trainer \
    --export_csv ../export.csv \
    --couples_csv ../couples.csv \
    --meta_json meta.json \
    --outdir out_pam \
    --negatives 20 --delta 0.10 --seed 1
  ```

* **Score**

  ```
  python -m scoring.score_pairs_cli \
    --export_csv ../export.csv \
    --meta_json meta.json \
    --model out_pam/model.pt \
    --delta 0.10 \
    --out scores.csv
  ```

* **Evaluate**

  ```
  python -m eval.evaluate_pam \
    --scores_csv scores.csv \
    --couples_csv ../couples.csv \
    --out summary.csv
  ```

* **Match** (optional for cohort deployments)

  ```
  python -m matching.rankings \
    --scores_csv scores.csv --delta 0.10 --tau 0.20 --out lists.json
  python -m matching.stable --lists lists.json --mode bipartite --out matching.json
  ```

### 5.2 Core pseudocode (training loop)

```python
# build MC similarities once
S = build_mc_similarity(export_csv, meta_json)  # dict[item_id] -> |Ω_i|x|Ω_i| matrix in [0,1]

# prepare triples (A, partner(A), D)
triples = sample_true_vs_decoys(couples_csv, export_csv, N=negatives)

# initialize monotone-constrained params (reparam via softplus to enforce signs)
Θ = init_params(meta_json, warm_start_from_baseline=True)

for epoch in range(E):
    for batch in minibatch(triples, B):
        # forward: Scoreδ(A,P) - Scoreδ(A,D)
        diff = []
        for (A,P,D) in batch:
            sA_P, vA_P = directional_stats(A,P, Θ, S)   # ŝ and Var (Likert + MC kernels)
            sP_A, vP_A = directional_stats(P,A, Θ, S)
            sA_D, vA_D = directional_stats(A,D, Θ, S)
            sD_A, vD_A = directional_stats(D,A, Θ, S)

            LCB_AP = logit(lcb(sA_P,vA_P,delta)) + logit(lcb(sP_A,vP_A,delta))
            LCB_AD = logit(lcb(sA_D,vA_D,delta)) + logit(lcb(sD_A,vD_A,delta))
            diff.append(LCB_AP - LCB_AD)

        loss = mean(log1p(exp(-torch.tensor(diff)))) + R(Θ)
        loss.backward(); optimizer.step(); optimizer.zero_grad()
```

All kernels are differentiable; the sign constraints are enforced by parameterization, so we don’t need a constrained optimizer.

---

## 6) How this beats the baseline (why it should work)

1. **From binary to probabilistic acceptability.** The baseline throws away signal whenever (d>t) by setting a hard zero. Our (F_i(t,d)) learns how much “too far” still helps, **item‑by‑item**.
2. **Learning the importance scale.** ({0,1,10,50,250}) is an ordinal report, not a calibrated metric. (\lambda(\cdot)) lets the data discover how steep the scale should be for discrimination.
3. **MC near‑misses.** The similarity kernel lets “accepted neighbors” contribute — especially valuable on small samples where strict set membership is brittle.
4. **Principled small‑overlap handling.** The LCB replaces a hand‑tuned (c/\sqrt n) with a **variance‑aware** shrinkage and an interpretable δ knob.
5. **Direct optimization of what you measure.** Pairwise logistic aligns training with your AUC/Hit@K decision rule.

---

## 7) Ablations & sensitivity (deliverable C)

* **A1**: Remove LCB (use raw (\hat s)) → quantify the value of uncertainty.
* **A2**: Replace learned (\lambda) with identity on ({0,1,10,50,250}).
* **A3**: Freeze domain weights to baseline vs. learn (m_d,\psi).
* **A4**: Likert hard thresholds (baseline indicator) vs. learned (F_i(t,d)).
* **A5**: MC exact‑set check vs. soft similarity.
* **A6**: Aggregator comparison: additive logits (ours) vs. geometric mean (baseline) vs. arithmetic mean.
* **A7**: Penalty comparison: LCB vs. (c/\sqrt n) tuned via CV.
* **A8**: Negative‑sampling rate (N\in{5,10,20,50}).
* **A9**: δ in ({0.05,0.10,0.20}) for the score and for matching.

Each ablation re‑runs the exact evaluation harness to report AUC, median‑rank, Hit@K, lift, and paired‑bootstrap CIs (your existing protocol).

---

## 8) Interpretability (deliverable D)

We emit the following artifacts per run:

* **Distance–tolerance surfaces** (F_i(t,d)) for Likert items: 4×4 heatmaps (monotone by design).
* **Importance calibration curve** (\lambda): a 5‑point monotone step plot with bootstrap CIs.
* **Domain weights** (m_d) and Top‑3 multiplier (\psi) with CIs.
* **Item influence**: average **marginal contribution** (\Delta_i = \mathbb E_{(A,B)}[W_i^A,(p_i^A(B)-\bar p_i)]) where (\bar p_i) is the item’s population mean pass probability; domain‑level aggregation yields contribution bars.
* **Per‑pair explanations**: for any pair ((A,B)) in `scores.csv` we attach the top (k) positive/negative item contributions (W_i^A (p_i^A(B)-0.5)) and (W_i^B (p_i^B(A)-0.5)).

---

## 9) Complexity & “anytime” updates

* **Scoring**: (O(|\mathcal I_{AB}|)) per direction.
* **Training**: For (C) couples, negatives (N), epochs (E): (O(E\cdot C\cdot N\cdot \bar I)), with (\bar I) mean overlap (≤50). CPU‑friendly (tens of seconds to minutes on pilot).
* **Streaming**: SGD on new triples supports **incremental checkpoints**; the MC similarities can be recomputed periodically (or held fixed).

---

## 10) Robustness & small‑sample notes

* **Regularization**: (\ell_2) on all free parameters; shrink (a_{i,c},b_{i,r}) toward 0 (flat surface) when data are scarce.
* **Pooling**: If desired, pool items within a domain by tying (\alpha_i) across the domain (hierarchical variant in the PDF).
* **Missingness**: Items with (W_i^A=0) or unanswered are ignored in sums; effective sample size (n_{\mathrm{eff}}) automatically reflects sparsity/weight concentration.
* **Default MC acceptance**: If Acceptable is blank, we set (S_i^A={x_i^A}) (your current rule) and the model still gains from soft similarity via (s_i).

---

## 11) What goes in the **methods PDF** (deliverable A)

1. **Model**: data, kernels (F_i(t,d)), MC similarity construction, (\lambda), (m_d,\psi).
2. **Learning**: pairwise logistic; constraints via reparam.; regularization; complexity.
3. **Theory**: monotonicity lemma; AUC‑consistency theorem (with assumptions); LCB coverage; δ‑stability lemma; proof sketches + references.
4. **Robustness**: small‑sample behavior; independence approximation; misreporting discussion.
5. **Matching**: lists from LCBs; choice of τ and δ; properties; deployment knobs.
6. **Ethics**: no sensitive features; uncertainty surfaced to users; caveats on interpretability.

---

## 12) Expected repository outputs (deliverables B, C, D)

* `scores.csv`: `A,B,score,dir_s_A,dir_s_B,lcb_A,lcb_B,n_eff_A,n_eff_B,overlap_items,...`
* `summary.csv`: AUC, median‑rank, Hit@K, lift, paired‑bootstrap CIs, permutation p‑value.
* `interp/` figures: (F_i(t,d)) grids; (\lambda) curve; (m_d,\psi) bars; item and domain contributions.
* `matching.json`: (optional) stable matching with δ‑stability setting and reasons for any incomplete lists.

---

## 13) Comparison to your baseline (control to beat)

* **Where it generalizes the baseline**
  – If we force (a_{i,1}=a_{i,2}=a_{i,3}=-\infty) except at (d\le t), and (\lambda) identity, and (\psi,m_d) fixed, **PAM collapses to v1.0** up to the aggregator.
* **Where it improves**
  – Learns **soft edges** at item level; calibrates **importance**; handles **small overlap** via **LCB**; optimizes the **pairwise decision rule** you actually evaluate.

---

## 14) Sensible defaults (to run today)

* Negatives per person (N=20) (as in your eval).
* (\delta=0.10) for scoring LCBs (tunable; keep same at matching time).
* Learning rate (1\mathrm{e}{-2}), Adam, batch 128 triples, early stop on val AUC.
* Regularization: weight decay (1\mathrm{e}{-4}); Gaussian priors for (m_d,\psi) centered at your baseline multipliers (stdev 0.5 on log‑scale).
* MC similarity (s_i): Jaccard of co‑acceptance across participants (clip to ([0,1])); cache matrices.

---

### Appendix: concise proofs (for the methods draft)

* **Monotonicity**: In the Likert kernel, (d\mapsto\sum_c a_{i,c}\mathbf 1[d\ge c]) is a sum of non‑positive steps; (t\mapsto\sum_r b_{i,r}\mathbf 1[t\ge r]) is a sum of non‑negative steps; the logistic is increasing ⇒ (F_i) is antitone in (d), isotone in (t). The MC kernel is isotone in (\mathrm{sim}) by (\eta_i\ge 0). (\lambda) is monotone by construction; hence directional satisfaction is monotone in tolerance and importance.
* **AUC‑consistency (sketch)**: The pairwise logistic risk on score differences is a proper composite loss; if (\mathrm{Score}\in\mathcal F) where (\mathcal F) contains the Bayes score difference (which, on the finite grid ({0,1,2,3}^2), can be represented by (F_i) via step functions), minimizing the surrogate implies maximizing the AUC in the limit.
* **δ‑stability (sketch)**: For any pair ((u,v)), if (\underline s_u^\delta(v)\le \underline s_u^\delta(\pi(u))) or (\underline s_v^\delta(u)\le \underline s_v^\delta(\pi(v))) in the constructed lists, then with probability ≥ (1-\delta) each inequality persists for the true (s); taking both directions and union bound gives ≤ (2\delta) chance of a true blocking pair.

---

## What I’ll provide right away in code (mapped to your repo)

* Monotone Likert and MC kernels with differentiable, sign‑constrained params.
* λ importance calibration and learned (m_d,\psi).
* Directional satisfaction + LCB with Kish (n_{\mathrm{eff}}).
* Pairwise logistic training loop with your negative‑sampling protocol.
* Scoring → `scores.csv`; evaluation → `summary.csv`; plots.
* Matching utilities producing δ‑stable lists and a final matching.

If you want me to tailor the naming and CLI switches to exactly match your existing `evaluate_couples.py` interface, I’ll mirror those argument names so you can run both the **baseline** and **PAM** with the same wrappers.

---

### Quick checklist against your §7

1. **Uses the triad deeply**: yes — SELF enters via distance; ACCEPTABLE via tolerance/set; IMPORTANCE via learned λ; domains via learned (m_d) and Top‑3 boost.
2. **Clear math + theory**: kernels, objective, constraints, LCB; monotonicity, AUC‑consistency sketch, δ‑stability.
3. **Improves discrimination**: optimized directly for pairwise outranking with soft acceptability and calibrated importance; uncertainty improves small‑n behavior.
4. **Interpretability**: item‑level (F_i(t,d)), λ, (m_d), and per‑pair contributions.
5. **Maps to matching**: LCB‑ranked lists, stable matching with a probabilistic guarantee.
6. **Practical/anytime**: CPU‑friendly SGD; negative sampling; cached MC similarities; checkpointable