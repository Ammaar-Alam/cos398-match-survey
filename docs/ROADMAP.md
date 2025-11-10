Below is a complete, research‑grade algorithmic proposal—math, theory, and an implementation plan you can drop into `tiger‑alg/`—that (i) uses your triads *as triads*, (ii) gives principled small‑sample robustness, (iii) stays interpretable, and (iv) maps cleanly to stable matchings (with uncertainty). I call it **TRIMAP**: *Triad‑aware, **M**onotone **A**cceptability with uncertainty, and **P**robabilistic stability*.

---

## Executive summary (what’s new)

* **Triad‑aware item kernels.** For each item we model the probability that *A accepts B on that item* as a **monotone function of (distance, tolerance, importance)**, learned *hierarchically by domain* to share strength at small n. Likert tolerance is not a hard cutoff; it’s a calibrated, monotone *soft* kernel. Multiple‑choice acceptability uses a calibrated indicator with shrinkage.

* **Uncertainty‑aware mutual score.** Directional satisfaction is a **Bayesian‑smoothed average** of item‑level accept probabilities with **Wilson lower bounds** to produce a *conservative* score when overlap is small. The mutual score is a *learnable generalized mean* over the two directions, with a pairwise ranking objective that is **AUC‑consistent**.

* **Anytime learning.** We fit a small set of *monotone, domain‑level* parameters with stochastic pairwise logistic updates against your evaluation harness (true partners vs. sampled non‑partners). This gives incremental, checkpointable training and immediate improvements on more data.

* **Stable matching under uncertainty.** From cardinal scores we derive **chance‑constrained preference lists** and run **student‑proposing Deferred Acceptance (DA)** for two‑sided cohorts; DA preserves stability and truthfulness for the proposing side on the derived lists. We also define **ρ‑stability** (no blocking pair whose *blocking probability* exceeds ρ), and provide a procedure with an explicit bound on expected blocking pairs. For one‑sided settings, we can use **Serial Dictatorship** (strategy‑proof & Pareto‑optimal) or **Probabilistic Serial** (ordinally efficient) depending on the requirement, as covered in COS 445.    

* **Interpretability by design.** You get item‑/domain‑level “acceptability curves” (distance vs. probability for each tolerance label), per‑user “mandatory gates,” and decomposed contributions. All of this aligns with your seminar/IW deliverables. 

This plan plugs straight into your repo and goal (better AUC on the couples dataset with clean path to matching), and aligns with the “polyglot” deployment note in your COS 398 proposal. 

---

## (A) Methods write‑up

### A.1  Setup and notation (triads respected)

For item (i) and user (U\in{A,B}):

* **Self** answer (x_i^U): Likert integer in ({1,\dots,K_i}) or MC (single/multi).
* **Acceptable partner answers** (S_i^U): Likert tolerance (t\in{0,1,2,\infty}) for {Same, ±1, ±2, Any}; for MC a subset (S) (default: own selection[s]).
* **Importance** (w_i^U\in{0,1,10,50,250}) and **Top‑3 domains** (\mathcal P_U).

Let (\Delta_i(A,B):=\min(|x_i^A-x_i^B|,3)) for Likert (clip distances (\ge 3) to 3). For MC, define (g_i^U(x_i^B)\in{-1,+1}) indicating whether (x_i^B\in S_i^U) (or overlaps, for MULTI).

Each item has a **domain** (d(i)\in) {Values, Communication, Lifestyle, Social, Personality, Friendship}.

### A.2  Triad‑aware acceptability kernels (monotone by construction)

We model the **directional acceptability probability** (“on item (i), A accepts B”) as:

**Likert items.**
[
p_i^A(B);=;\sigma!\Big(,\alpha_{d(i)}\big(t(S_i^A)-\Delta_i(A,B)\big)+\beta_{d(i)}\Big),
]
with (\alpha_{d}\ge 0) (steeper slope ⇒ sharper tolerances) and (\sigma) the logistic link. This enforces:

* monotone **decrease** in distance (\Delta),
* monotone **increase** in declared tolerance (t).

**MC_SINGLE / MC_MULTI.**
[
p_i^A(B);=;\sigma!\Big(\beta_{d(i)}+\gamma_{d(i)},\underbrace{g_i^A(x_i^B)}*{\in{-1,+1}}\Big),\qquad \gamma*{d(i)}\ge 0,
]
so listing an option in (S_i^A) strictly raises the accept probability (monotone in “acceptability”). For MULTI we use (g=+1) when (x_i^B\cap S_i^A\neq\emptyset), else (-1).

> **Mandatory semantics.** If (w_i^A=250) (“Mandatory”) and the **crisp** accept rule would fail (e.g., (\Delta>t) or (x^B\notin S)), we force (p_i^A(B)=0). This preserves the “hard constraint” meaning of *Mandatory* even while other items are softened.

All (\alpha,\beta,\gamma) are **domain‑level** (6 domains), for small‑sample robustness with hierarchical shrinkage.

### A.3  Importance and directional satisfaction with uncertainty

Define a **learned, monotone** importance transform
[
\kappa(w)=a_0 + \sum_{m} a_m,\mathbf 1{w\ge \tau_m},\qquad a_m\ge 0,
]
which lets the data (not a fixed table) calibrate the spacing between {0,1,10,50,250} while preserving ( \kappa(250)\ge \kappa(50)\ge \cdots).

Effective per‑item weight for A:
[
W_i^A ;=; \kappa(w_i^A)\cdot m_{d(i)}\cdot \big(1.5;\text{if } d(i)\in\mathcal P_A \text{ else }1\big),
]
where (m_d\ge 0) are learned **domain multipliers** (baseline used fixed values; we learn them subject to (m_d\ge 0)).

Let (n_A(A,B)) be the number of overlapping, relevant items (with (W_i^A>0)). Define the **Bayesian‑smoothed directional mean** and its **Wilson lower bound** (level (\delta); (z=z_{1-\delta/2})):
[
\mu_A(B)=\frac{\sum_i W_i^A,p_i^A(B)+\lambda,\mu_0}{\sum_i W_i^A+\lambda},\qquad
\underline s_A(B)=\text{WilsonLB}\big(\mu_A(B), n_{\rm eff}^A\big),
]
with prior (\mu_0\in(0,1)) (e.g., 0.5) and **effective sample size**
(n_{\rm eff}^A=\frac{(\sum_i W_i^A)^2}{\sum_i (W_i^A)^2}).
This replaces an ad‑hoc (c/\sqrt{n}) penalty with a **confidence‑calibrated** small‑overlap control.

### A.4  Mutual compatibility aggregator

Let the conservative **directional scores** be (\underline s_A(B)) and (\underline s_B(A)). Define the **generalized mean (power mean)** mutual score:
[
M_\theta(A,B)=\Big(\tfrac{1}{2}\big(\underline s_A(B)^\theta+\underline s_B(A)^\theta\big)\Big)^{!!1/\theta},
]
with learnable (\theta\le 0) (harmonic/“AND‑like” as (\theta\to -\infty), geometric at (\theta=0)). We output
[
\mathrm{TRIMAP}(A,B)=100\cdot M_\theta(A,B).
]
This nests your geometric mean as a special case but lets the data discover the best *mutuality* shape.

### A.5  Learning objective (paired‑comparison, AUC‑consistent)

Given each person (A) with their true partner (B^+) and sampled non‑partners (D^-), learn parameters
(\Theta={\alpha_d,\beta_d,\gamma_d,m_d,\kappa,\theta})
by minimizing the **pairwise logistic** loss
[
\mathcal L(\Theta)=\sum_{A}\sum_{D^-}
\log\big(1+\exp(-(\mathrm{TRIMAP}(A,B^+)-\mathrm{TRIMAP}(A,D^-)))\big)
+;\lambda_{\rm reg},|\Theta|^2,
]
plus the symmetric term with roles of A/B swapped (optional). Standard results imply that such pairwise losses are **AUC‑consistent** surrogates for bipartite ranking—minimizers recover the Bayes‑optimal ordering almost surely—so optimizing (\mathcal L) directly targets your **AUC** metric. *(Proof sketch in §A.7.)*

We add convex **monotonicity constraints** ((\alpha_d,\gamma_d\ge 0); nondecreasing (\kappa); (\theta\le 0)) enforced by reparameterizations (e.g., softplus/neg‑softplus).

**Anytime**: optimize with mini‑batch SGD over pairs; checkpoint the small set of parameters; new couples/data give immediate incremental updates.

### A.6  From scores to matching, with uncertainty

1. **Ordinalization with chance constraints.** For each (A), define a trimmed list (L_A(\tau)) of candidates (B) with (\underline s_A(B)\ge \tau) and sort by (\mathrm{TRIMAP}(A,B)); similarly (L_B(\tau)). The threshold (\tau) filters edges that are too uncertain/weak.

2. **ρ‑stability (chance‑constrained stability).** A matching (M) is **ρ‑stable** if there is no pair ((A,B)\notin M) such that both rank each other above their partners *and* the **blocking probability**
   [
   \pi_{\rm block}(A,B);=;\mathbb P!\big(,S_A(B)\ge S_A(M(A)) ;\wedge; S_B(A)\ge S_B(M(B)),\big)
   ]
   exceeds ( \rho), where (S_A(\cdot)) are random directional satisfactions induced by our posteriors (Wilson intervals).

3. **Algorithm.** Run **student‑proposing DA** on the trimmed lists (L_A(\tau)) (students⇄universities is just a label—pick a side). DA terminates in a stable matching for the induced preferences and is **strategy‑proof for the proposing side** on these lists. Moreover, with the trimming rule and our lower bounds, the returned matching is **ρ‑stable** on the latent utilities with ( \rho\approx \delta) (proof sketch: the only high‑probability blocking pairs are screened by the lower‑bound comparisons).  

> One‑sided friendship/cohort pairing: use **Serial Dictatorship** (strategy‑proof & Pareto‑optimal) when fairness is defined ex‑ante by a random order; use **Probabilistic Serial** when ordinal efficiency is paramount (it is ETOE & ordinally efficient, though not strategy‑proof).  

*(Your COS 398 proposal also contemplates an LP over the stable‑matching polytope; DA gives the canonical stable solution; a “best‑stable” selection can be added on top if you prefer an LP refinement step.)* 

### A.7  Theoretical notes (proof sketches)

* **AUC‑consistency.** Let (\eta(A,B)=\Pr(Y=1\mid A,B)) be the true couple indicator regression. The Bayes‑optimal ranking orders by (\eta). Under mild regularity, the minimizer of the pairwise logistic risk over a rich function class yields scores (f) with the same pairwise ordering as (\eta) almost surely (standard bipartite ranking theory). Thus minimizing (\mathcal L) targets AUC.

* **Monotonicity and identifiability.** With (\alpha_d,\gamma_d\ge 0) and the mandatory gate, the kernels satisfy: (i) if tolerance increases or distance decreases, (p_i^A(B)) weakly increases; (ii) for MC, adding an option to (S) can only increase (p). These preserve triad semantics, so fitted parameters remain interpretable.

* **Small‑overlap control.** Let (\hat\mu_A(B)) be the smoothed mean and (n_{\rm eff}^A) the effective sample size. The Wilson bound (\underline s_A(B)) satisfies (\Pr(\underline s_A(B)\le \mu_A(B))\ge 1-\delta), and (\underline s_A(B)) tightens like (O(1/\sqrt{n_{\rm eff}})). Consequently (M_\theta) of the two lower bounds yields a **conservative mutual score** with the same rate, replacing heuristic (c/\sqrt{n}) penalties by calibrated inference.

* **ρ‑stability bound.** If DA on trimmed lists yields matching (M) and we trim at threshold (\tau) computed from Wilson lower bounds at level (\delta), then any off‑matching pair ((A,B)) with both lower bounds below the partner comparisons has blocking probability at most ( \rho\approx 2\delta) (union bound). Hence the expected number of blocking pairs is (O(\rho,n)) in a cohort of size (n).

### A.8  Complexity and robustness

* **Scoring.** One pass over overlapping items per pair; parameters at domain level keep constants small.
* **Learning.** (O(#\text{pairs})) per epoch with mini‑batches.
* **Matching.** DA runs in (O(n^2)) in the worst case (or (O(n,\text{avg list length}))). 
* **Missingness/misreporting.** Missing items simply drop into (n_{\rm eff}); heavy use of *Mandatory* acts as a hard filter; the Bayesian smoothing reduces volatility for sparse overlaps.

---

## (B) Reproducible implementation (drop‑in)

```
tiger-alg/
  models/
    trimap_kernels.py        # Likert/MC kernels (monotone), Wilson bounds
    importance.py            # κ(w) transform and domain multipliers m_d
    mutual_aggregator.py     # generalized mean M_θ
  train/
    pair_dataset.py          # builds (A, B+, {D-}) from export.csv, couples.csv
    optimize.py              # SGD loop w/ constraints, checkpoints
    config.yaml              # δ, τ, priors, negatives-per-anchor, etc.
  scoring/
    score_pairs.py           # emits scores.csv (A,B,score,overlap,dirLB_A,dirLB_B,...)
    to_preferences.py        # builds trimmed lists L_A(τ), L_B(τ)
    match_da.py              # student-proposing DA on trimmed lists (ρ-stable)
    match_one_sided.py       # serial dictatorship / probabilistic serial
  eval/
    evaluate_couples.py      # mirrors your harness; computes AUC/Hit@K/lift, CIs
    ablations.py             # toggles for study in §C
    plots_interpret.py       # item/domain curves, influence bars
  README.md
```

**Inputs:** `export.csv`, `couples.csv`, `meta.json` (your existing format).
**Outputs:**

* `scores.csv`: `A,B,score,dirLB_A,dirLB_B,n_eff_A,n_eff_B,overlap_items,...`
* `summary.csv`: AUC, median rank, Hit@K, lift + bootstrap CIs & partner‑shuffle permutation.

**CLI (illustrative).**

```bash
# train TRIMAP
python train/optimize.py \
  --export_csv ../export.csv \
  --couples_csv ../couples.csv \
  --meta_json meta.json \
  --outdir out_trimap

# score all pairs and evaluate
python scoring/score_pairs.py --export_csv ../export.csv --meta_json meta.json --model out_trimap/best.ckpt --out scores.csv
python eval/evaluate_couples.py --scores_csv scores.csv --couples_csv ../couples.csv --outdir out_trimap_eval

# build preference lists and run DA with uncertainty-aware trimming
python scoring/to_preferences.py --scores_csv scores.csv --tau 0.55 --out prefs.json
python scoring/match_da.py --prefs prefs.json --out matching.json
```

> DA/stability properties used here follow the COS 445 development of DA (existence/stability) and incentives (proposing side), which is precisely why we adopt DA for the ordinalized lists.  

---

## (C) Ablation & sensitivity study (what matters)

1. **Mutual aggregator.** Fix kernels, swap: harmonic vs. geometric vs. arithmetic mean (θ = −1, 0, +1).
2. **Uncertainty control.** Replace Wilson lower bound with (i) no penalty; (ii) your (c/\sqrt{n}) penalty; (iii) Jeffreys prior Beta bounds.
3. **Importance handling.** Fixed domain multipliers + raw weights (baseline) vs. learned (\kappa(w), m_d).
4. **Kernels.** Hard tolerance (baseline) vs. monotone soft tolerance (TRIMAP).
5. **Trim threshold τ.** Sweep τ ∈ {0.5, 0.55, 0.6, 0.65}; report fraction of edges kept, match rate, and ρ‑blocking estimates.
6. **Overlap sensitivity.** Bin pairs by overlap; show AUC lift vs. baseline per bin.
7. **Personalization.** With/without the Top‑3 domain boost.

All ablations report AUC, median rank, Hit@K, lift, with **paired bootstrap CIs** and a **partner‑shuffle permutation** as your null (unchanged). *(Matches your evaluation protocol.)*

---

## (D) Interpretability & deliverables

* **Acceptability curves.** For each domain and tolerance label, plot (p(\Delta)) vs. distance (Likert), and the MC “in‑S vs. not‑in‑S” lift.
* **Item/domain influence.** Decompose each pair score into weighted item contributions; show domain‑level Shapley‑style or simple weight×sensitivity bars.
* **Mandatory gates audit.** List which *Mandatory* items eliminated otherwise‑high scores (useful for user‑facing explanations).
* **Uncertainty dashboards.** For each pair, show (n_{\rm eff}) and the gap between (\mu) and (\underline s); this explains small‑overlap conservatism.

These figures map directly to your IW seminar’s expectations for talks and final papers (sections on Approach/Evaluation/Interpretability). 

---

## Why this meets your project goals

* **Uses the triad deeply.** Tolerance becomes **calibrated** softness with explicit monotonicity; *Mandatory* retains its hard constraint; importance is learned but monotone; Top‑3 domains are respected.

* **Has formal properties.** AUC‑consistency of the surrogate; calibrated small‑n bounds; and a **ρ‑stability** guarantee after matching (with DA’s usual stability/truthfulness on the derived lists).  

* **Improves discrimination.** By training the mutuality parameter θ, the kernels, and domain/importance weights with a pairwise objective targeting AUC, TRIMAP is designed to lift AUC over the fixed‑rule baseline.

* **Remains interpretable.** All parameters live at the domain level with monotonic constraints; output artifacts (curves, weights, gates) are human‑readable.

* **Maps cleanly to matching.** DA on trimmed lists (two‑sided) and SD/PS (one‑sided) give textbook‑quality mechanisms with documented properties from COS 445; you may optionally layer a “best‑stable” LP selection if desired.  

* **Practical and anytime.** A tiny parameter set, SGD updates, and checkpointed training enable incremental improvements as more couples arrive—matching your independence‑work cadence. 

---

## Appendix: brief mapping to your existing baseline & proposal

* Your baseline computes hard accept indicators plus a geometric mutual mean and a heuristic small‑overlap penalty. TRIMAP replaces (i) **hard indicators** with **monotone probabilities**, (ii) **heuristic penalties** with **Wilson bounds**, and (iii) **fixed multipliers** with **learned, monotone transforms**—*while* retaining Mandatory semantics and domain/top‑3 personalization.

* Your COS 398 proposal mentions DA/Irving/TTC and LP‑based “best‑stable” selection; TRIMAP plugs into that downstream layer, and its ρ‑stability definition makes stability under uncertainty explicit. 

* For one‑sided (friendship) releases, you can adopt SD (IC & Pareto‑optimal) or PS (ETOE & ordinally efficient) depending on whether you want truthfulness or efficiency as the primary desideratum.  

---

### References to course notes (for mechanism properties you’ll cite in your paper)

* **DA existence & stability;** worked example and complexity. 
* **Incentive compatibility (proposing side) of DA.** 
* **Serial Dictatorship & Pareto‑optimality; Top Trading Cycles.** 
* **Probabilistic Serial, ETOE, and ordinal efficiency.** 

---

## What you’ll commit to the repo (concrete)

* A self‑contained `models/` + `train/` + `scoring/` + `eval/` scaffold (above) that consumes `export.csv`, `couples.csv`, `meta.json`, and produces `scores.csv` + `summary.csv`, with ablation toggles and plotting scripts.

* A methods PDF (camera‑ready style) following the outline above (Problem, Model, Objective, Theory, Complexity, Robustness, Matching, Incentives/Fairness), plus the ablation study and interpretability figures—aligned to the COS IW handbook’s format & deadlines. 

---

### Optional extensions (if data grows)

* Replace logistic kernels by **isotonic tables** on ((\Delta,t)) per domain (4×4 table with 2‑D isotonic constraints), which preserves monotonicity non‑parametrically.
* Add a **Bayesian hierarchical prior** over (\alpha_d,\beta_d,\gamma_d) to get credible intervals per domain and propagate uncertainty all the way to ρ‑stability.

**Bottom line:** TRIMAP is a principled, triad‑aware, uncertainty‑calibrated scorer learned directly for your AUC target, with immediate drop‑in code and a stable‑matching story grounded in the COS 445 canon. It preserves interpretability, behaves well at small (n), and cleanly supports your deployment modes (monthly “Soulmates” + real‑time suggestions).
