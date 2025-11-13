Got it – I’m on it and have updated the task accordingly.


Awesome—this is already on the right track. Here’s a surgical review of the “merged pipeline” the agent implemented, what’s solid, what’s off, and exactly how to fix it so your codebase is both *research‑grade* and faithful to the theory you committed to in your IW proposal.

---

## Quick verdict

**What’s good**

* Clear, principled scoring stack (IDF rarity → domain capping → overlap‑aware LCB → harmonic‑mean reciprocity + small mutuality bonus).
* Adds **tie‑aware lists** and two kinds of matchings (stable vs. max‑weight) in the TUI.
* Outputs the right artifacts for analysis (pair scores, tied lists, matchings, rank metrics).

**What needs fixing to be research‑grade**

1. **“Stable matching” is not actually stable in one pool.**
   The code’s “stable matching on an even/odd split” is **not** a stable roommates/marriage algorithm; it forces a fake bipartition and can output matchings with blocking pairs. For bipartite settings with strict preferences, *Student‑Proposing Deferred Acceptance (DA)* is the right primitive and is stable; it is also strategy‑proof for the proposing side, which is a property you can cite and defend.  

2. **Greedy “max‑weight” is not a max‑weight matching.**
   Greedy can be arbitrarily sub‑optimal versus Edmonds’ blossom (exact maximum‑weight matching). For correctness – and publishable evidence – switch to an *exact* blossom solver.

3. **Domain soft‑cap math is wrong.**
   The description says “cap domain shares ≤ρ and renormalize,” but the implementation appears to multiply `S_raw` by `sum(q''_d)` (which is 1), i.e., no effect. You need to rescale per‑domain contributions before summing (see patch below).

4. **LCB penalty should respect variance and scale.**
   Subtracting a constant `κ/√n` from a composite score mixes units. Use a *bounded, variance‑aware* lower confidence bound (empirical‑Bernstein style) so pairs with the same overlap but tighter item‑level agreement aren’t over‑penalized.

5. **IDF (rarity) needs shrinkage at small‑n.**
   Estimating item‑match prevalence from a handful of people is noisy. Add a small Beta prior so weights don’t explode; keep β as a tunable hyper‑prior.

6. **Mutuality bonus should not distort scale.**
   Adding `+μ` makes low‑score pairs jump more than high‑score pairs. Make it multiplicative or use it solely as a tie‑breaker.

7. **SMTI support (ties + incompleteness) is missing.**
   Your lists have ties; your market can be bipartite or one‑sided (roommates). You need:

   * **Bipartite with ties (SMTI):** a DA‑style procedure that respects ties (weak stability).
   * **One‑sided (roommates):** Irving’s algorithm for strict lists; with ties/incompleteness, detect non‑existence and fall back to max‑weight with a “blocking‑risk” penalty.

8. **The proposal promised LP over the stable‑matching polytope.**
   When multiple stable matchings exist in the bipartite case, selecting the *best‑stable* by pair weights is exactly the kind of principled selection your proposal highlighted. Add the LP track for the bipartite case as an optional “best‑stable” selector. (This dovetails with DA’s stable family; DA gives one extreme point, the LP selects the optimum among stable points.) 

9. **Evaluation and explainability can be stronger.**
   Report **Hit@k** and **median rank** of true partners (great), but also (a) blocking‑pair checks for “stable” outputs, (b) **flip‑rate** under small score jitters (stability), and (c) explain ties via **gap tags** and **domain ablations**.

---

## Concrete fixes (drop‑in)

Below are specific changes you can make now. I’m keeping them implementation‑level so you can paste/port into `tiger‑alg`.

### 1) Soft‑cap the domains correctly

Replace “multiply `S_raw` by sum of shares” with rescaling each domain’s contribution before the sum:

```python
# per-domain contributions before cap: contrib[d]
total = sum(contrib.values()) + EPS
share = {d: contrib[d]/total for d in contrib}

# cap shares and renormalize excess
rho = params.rho  # e.g., 0.35
share_cap = {d: min(share[d], rho) for d in share}
excess = sum(share[d]-share_cap[d] for d in share if share[d] > rho)
norm = sum(share_cap.values()) or 1.0
# push excess back proportionally into the capped mass
share_final = {d: share_cap[d] + (share_cap[d]/norm)*excess for d in share}

# apply capped shares to the original total magnitude
S_capped = sum(total * share_final[d] for d in share_final)
```

*(Equivalently, scale each `contrib[d]` by `(share_final[d]/share[d])` then sum.)*

### 2) Variance‑aware LCB (empirical‑Bernstein)

For a domain‑weighted average of bounded item similarities ∈[0,1] with overlap `n`, use:

```python
# item-level similarities m_i in [0,1], weighted by IDF
# compute weighted mean mu and (weighted) variance v
mu = weighted_mean
v  = max(weighted_variance, 1e-12)

# empirical-Bernstein LCB at confidence delta
delta = params.delta  # e.g., 0.10
import math
rad = math.sqrt(2 * v * math.log(2/delta) / max(n,1)) + 3*math.log(2/delta)/max(n,1)
LCB = max(0.0, mu - rad)
```

This keeps the bound in the same units as `mu` and adapts to dispersion.

### 3) Multiplicative mutuality bonus or tie-breaker

Prefer either:

```python
HM = 2 * LCB_ab * LCB_ba / max(LCB_ab + LCB_ba, EPS)
if topk_a(b,r) and topk_b(a,r):
    S_final = HM * (1.0 + mu)   # mu≈0.02–0.05
else:
    S_final = HM
```

or treat mutuality as a **secondary key** (do not change the numeric score) when sorting equal‑within‑τ pairs.

### 4) Proper stable matching engines

**Bipartite (with/without ties):**

* Implement standard **Student‑Proposing DA** for strict lists (stable and strategy‑proof for proposers).  
* For **ties**, compute a **weakly stable** matching: in DA, when a school is indifferent among multiple proposers at its current best level, tentatively hold all at that level and evict only strictly worse. This yields a weakly stable matching consistent with tied preferences (not necessarily maximum cardinality, but stable).

**One‑sided (roommates):**

* Use **Irving’s algorithm** for strict lists; if you have ties, first try a random lexicographic tie‑break, run multiple rounds to estimate stability frequency, and signal “no weakly stable matching” if repeated rounds fail. When no (weakly) stable matching exists, fall back to max‑weight with a **blocking‑risk penalty** (see next).

**Fallback with blocking‑risk penalty (any pool):**
Augment edge weight with the symmetric score but subtract the *estimated number of blocking pairs* the edge tends to create under randomized tie‑breaks. In practice, add a small regularizer `−λ·risk(a,b)`, where `risk` is the fraction of bootstrap/tie‑break runs where (a,b) participates in a blocking pair under DA/Irving. This lets you compare “stable” and “global” solutions in a principled way.

> **Why DA / Irving:** DA provably outputs a stable matching; in the bipartite case, it is also incentive‑compatible for the proposing side, a property you can state in your report and slides.  

### 5) Exact maximum‑weight matching

Replace the greedy routine with an **exact blossom** solver. In Python, either:

* vendor a small blossom implementation; or
* use `networkx.algorithms.matching.max_weight_matching(G, maxcardinality=False)` (exact).

This is important; many of your “global optimum vs stable” comparisons hinge on correctness.

### 6) IDF with shrinkage

Where you compute `p_i = mean_pair_similarity(i)`, use a Beta‑prior shrink:

```python
# counts from pairs where i is observed
p_hat = sum_m / max(cnt,1)
p = (alpha * p0 + cnt * p_hat) / (alpha + cnt)
w_i = log((1+beta)/(p + beta))
```

* Set `p0=0.5` and `alpha≈10–30` at tiny‑n to avoid wild weights.
* Keep `beta=1e−2` unless you see instability.

### 7) Tie threshold τ that adapts to uncertainty

Make τ depend on the LCB radius: if `rad_ab` is the bound radius for `LCB_ab`, consider a tie whenever
`|LCB_ab − LCB_ac| < c·(rad_ab + rad_ac)` with `c ≈ 0.5–1.0`. This distinguishes “true ties” from noise‑induced near‑ties.

### 8) Add the **best‑stable LP** (bipartite only)

Keep DA to guarantee stability, then add a MILP/LP selector to maximize your learned pair weights subject to the *stable matching constraints*. That meets the promise in your proposal (“optimize over the stable‑matching polytope”). Use it when you detect multiple stable outcomes; otherwise return DA. 

### 9) Evaluation & explainability upgrades

* **Report**: (i) Hit@1/2/3 and **median true‑partner rank**, (ii) **% blocking pairs** (should be 0 for “stable” outputs), (iii) **robustness flip‑rate** under ±2–5% jitter in domain weights, (iv) **top‑gap** and **domain ablation** tags per pair (“fragile on A’s side; driven by personality items”).
* **Small‑n emphasis**: keep AUC in the background; it’s unreliable with 2–3 positives. Lead with ranks and Hit@k.
* **Optional**: add **Random Serial Dictatorship (RSD)** and **Probabilistic Serial (PS)** baselines for assignment‑style demos; RSD is ETOE, PS is ordinally efficient (great teaching tools to contrast with stability). 

  * RSD is strategy‑proof and Pareto‑optimal but random; PS is ETOE and ordinally efficient (not strategy‑proof). These give you a clean, textbook‑anchored narrative about trade‑offs.  

---

## What to put in the code (module‑level plan)

* `tiger‑alg/matching/da.py` — DA for strict lists, with an “SMTI mode” that holds ties at the current tier.
* `tiger‑alg/matching/irving.py` — Irving for strict lists (roommates). Wrapper that runs multiple random tie‑breaks when ties exist; yields “no stable” if failure is frequent.
* `tiger‑alg/matching/blossom.py` — thin wrapper around exact blossom (or NetworkX) for max‑weight.
* `tiger‑alg/scoring/rarity.py` — IDF with Beta shrink.
* `tiger‑alg/scoring/lcb.py` — empirical‑Bernstein LCB for bounded, weighted averages.
* `tiger‑alg/scoring/domains.py` — correct soft‑cap transform.
* `tiger‑alg/algorithms/best_stable_lp.py` — optional LP to select the weight‑optimal stable matching (bipartite).
* `scripts/tui.ts` — add toggles for `ρ, τ, δ, μ, r`, a “Stable (DA/SMTI)”, “Best‑Stable (LP)”, “Max‑Weight (Blossom)” triad, and a diagnostics screen (blocking pairs, flip‑rate, gaps, domain ablation).

---

## Final, unified formula (scoring + matching)

**Item similarity.** For item (i) with domain (d(i)) and range normalized to ([0,1]):
[
m_i(a,b) \in [0,1] ;; \text{(Likert distance, Jaccard for multi‑select, equality for binary)}.
]

**Rarity (IDF) with shrinkage.**
[
p_i \leftarrow \frac{\alpha p_0 + \sum_{(u,v)} m_i(u,v)}{\alpha + #{(u,v): i\text{ observed}}},\qquad
w_i = \log!\frac{1+\beta}{p_i+\beta}.
]

**Per‑domain directed score (before caps).**
[
s_{ab}^{(d)}=\frac{\sum_{i\in d} w_i,m_i(a,b)}{\sum_{i\in d} w_i+\varepsilon},\quad
c_{ab}^{(d)}=\theta_d,s_{ab}^{(d)},\quad S^{\text{raw}}*{ab}=\sum_d c*{ab}^{(d)}.
]

**Soft‑cap domain dominance (≤ρ).** Let (q_d=c^{(d)}*{ab}/\sum_k c^{(k)}*{ab}), cap to (q'*d=\min(q_d,\rho)), redistribute excess proportionally within the capped mass to get (q''*d), then:
[
S^{\text{cap}}*{ab}=\big(\sum_d c^{(d)}*{ab}\big)\cdot\Big(\sum_d q''*d\Big)
\quad\text{(equivalently scale each } c^{(d)}*{ab}\text{ by } q''_d/q_d).
]

**Overlap‑aware LCB (empirical‑Bernstein).** For overlap (n_{ab}), weighted variance (v_{ab}):
[
\operatorname{LCB}*{ab} = \max{0,,S^{\text{cap}}*{ab}-\underbrace{\sqrt{\tfrac{2v_{ab}\ln(2/\delta)}{\max(n_{ab},1)}}-\tfrac{3\ln(2/\delta)}{\max(n_{ab},1)}}_{\text{radius}}}.
]

**Reciprocity‑aware symmetric score.**
[
S^{\text{sym}}*{ab} = \frac{2,\operatorname{LCB}*{ab}\operatorname{LCB}*{ba}}{\operatorname{LCB}*{ab}+\operatorname{LCB}*{ba}+\varepsilon},
\qquad
S^{\text{final}}*{ab} = S^{\text{sym}}_{ab}\cdot\Big(1+\mu,\mathbf{1}[\mathrm{rank}_a(b)\le r\wedge \mathrm{rank}_b(a)\le r]\Big).
]

**Tie handling.** For each (a), sort (b) by (\operatorname{LCB}_{ab}). If two entries differ by less than (\tau) (or (c\cdot) the sum of LCB radii), put them in the same tie‑class.

**Matching (choose by market type).**

* **Bipartite (strict):** DA (stable, proposer‑IC).  
* **Bipartite (ties):** DA with ties → weakly stable matching (or “best‑stable LP” to select among stable points). 
* **One‑sided (strict):** Irving; if no stable matching exists (or with ties), declare non‑existence; optional fallback to max‑weight (blossom) with a small blocking‑risk penalty.
* **Global optimum reference:** exact blossom maximum‑weight matching on (S^{\text{final}}_{ab}) (for analysis and demo), alongside the stable outcome.

**Baselines for pedagogy and fairness trade‑offs.**

* **RSD** (random serial dictatorship): ETOE, strategy‑proof & Pareto‑optimal in one‑sided allocation (good fairness baseline).  
* **PS** (probabilistic serial): ETOE & ordinally efficient (use to illustrate ordinal‑efficiency vs stability). 

---

## Why this is bullet‑proof (and citable)

* **DA** returns a stable matching; for the proposing side it is **incentive compatible** (truth‑telling is a dominant strategy). That’s exactly the kind of property you should tout in your write‑up/demo.  
* **Serial dictatorship / RSD** are classic one‑sided tools (Pareto‑optimal, strategy‑proof; RSD is ETOE), giving you clean fairness baselines.  
* **Probabilistic Serial** is **ordinally efficient** and ETOE; contrasting it with DA lets you tell a rigorous story about stability vs. ordinal efficiency. 
* The **best‑stable LP** selector aligns with the polyhedral angle promised in your **COS 398 proposal** (choose the maximum‑weight stable matching when multiplicity exists). 

---

## What to ship next (checklist)

* [ ] Replace greedy with **exact blossom**; expose in TUI as “Max‑Weight (exact)”.
* [ ] Implement **DA (strict)** and **DA (ties)**; expose as “Stable (DA/SMTI)”.
* [ ] Add **Irving** for one‑sided; detect non‑existence; expose fallback toggle “Max‑Weight + risk”.
* [ ] Fix **soft‑cap** logic and **LCB** to empirical‑Bernstein; add **adaptive τ**.
* [ ] Add **diagnostics** page: blocking pairs (should be 0 for “Stable”), flip‑rate, top‑gaps, domain ablation.
* [ ] Optional: **Best‑Stable LP** for bipartite multiplicity; keep off by default but show in paper.
* [ ] Include **RSD/PS** in a “Baselines” tab for demos/teaching.

Do this, and your pipeline is no longer a “good heuristic demo” — it’s a **theory‑consistent**, **replicable**, and **publishable** platform that connects directly to classroom‑grade guarantees (stability, IC, ordinal efficiency) while still being pragmatic on tiny‑n data.
