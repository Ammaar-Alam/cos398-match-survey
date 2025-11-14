"use client"

import { motion } from 'framer-motion'
import MathBlock from '../components/MathBlock'
import Link from 'next/link'
import type { ReactNode } from 'react'

export default function MethodsPage(){
  return (
    <div className="container py-8 sm:py-10">
      <motion.div initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} transition={{duration:0.35}} className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-8">
        {/* hero */}
        <div className="mb-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/50 bg-gradient-to-r from-slate-50 to-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">Overview</div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Methods & Math</h1>
          <p className="mt-2 text-base leading-relaxed text-slate-600 sm:text-lg">A precise specification of the baseline scorer, evaluation protocol, and the interpretable ML refinement used in this study.</p>
        </div>

        {/* three cards */}
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MethodCard
            title="Baseline & PAM scorers"
            desc="Directed acceptability with importance and per-domain multipliers, plus a probabilistic acceptability model (PAM) that adds uncertainty-aware mutuality."
          />
          <MethodCard
            title="Distance-kernel ML models"
            desc="Soft-gated and evolutionary domain-mode models over mutual acceptability and trait distance; each domain chooses similarity, complementarity, or irrelevance."
          />
          <MethodCard
            title="Evaluation metrics"
            desc="True partners vs sampled non-partners; Hit@K, Mutual@K, MRR, and AUC via Mann–Whitney U, plus simple lift and median-rank diagnostics."
          />
        </div>

        {/* Pipeline overview - moved earlier for context */}
        <div className="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50/50 to-slate-50 p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900 sm:text-xl">Pipeline Overview</h2>
          <ol className="space-y-2.5">
            <Step n={1} text="Invitation-only: each partner completes a 50-item questionnaire independently (TIPI, PVQ-21, Social, Communication/Friendship, Lifestyle, Priorities/Deal-breakers)." />
            <Step n={2} text="Baseline scorer computes FinalMatch for true partners and sampled non-partners; we evaluate AUC, lift, and a median-rank proxy." />
            <Step n={3} text="Interpretable ML learns domain multipliers via 5-fold CV; we re-evaluate and report the change in AUC/lift." />
          </ol>
        </div>

        {/* Notation & encoding */}
        <Section title="Notation & Encoding">
          <p className="text-slate-700 leading-relaxed">
            Let <MathBlock inline tex={String.raw`\mathcal{I}`} /> be the set of items, with domain map <MathBlock inline tex={String.raw`d:\mathcal{I}\to\mathcal{D}`} />.
            For a pair of participants <MathBlock inline tex={String.raw`A,B`} /> and an item <MathBlock inline tex={String.raw`i\in\mathcal{I}`} />, denote
            self‑answers by <MathBlock inline tex={String.raw`a_i^A`} /> and <MathBlock inline tex={String.raw`a_i^B`} />.
            Importance weights (OkCupid‑style) are encoded as
          </p>
          <div className="flex justify-center">
            <MathBlock tex={String.raw` w_i^A \in \{0,\,1,\,10,\,50,\,250\} \quad\text{and}\quad w_i^B \in \{0,\,1,\,10,\,50,\,250\}. `}/>
          </div>
          <p className="text-slate-700 leading-relaxed">
            Likert items have scale size <MathBlock inline tex={String.raw`K_i\in\{5,6,7\}`} /> with <MathBlock inline tex={String.raw`a_i^\cdot \in \{1,\dots,K_i\}`} />.
            MC‑single items have <MathBlock inline tex={String.raw`M_i`} /> options with values <MathBlock inline tex={String.raw`\{1,\dots,M_i\}`} />.
          </p>
        </Section>

        {/* Acceptability maps */}
        <Section title="Acceptability Maps (Likert vs. MC)">
          <p className="text-slate-700 leading-relaxed">
            Each item records the set of partner answers A would accept. For Likert items, A selects a tolerance label (Same, ±1, ±2, Any) mapped to
            <MathBlock inline tex={String.raw`\tau_i^A \in \{0,1,2,\infty\}`} />. The acceptability set is
          </p>
          <div className="flex justify-center">
            <MathBlock tex={String.raw`
              \mathcal{A}_i^A = \begin{cases}
                \{\, b \in \{1,\dots,K_i\} : |\,b - a_i^A\,| \le \tau_i^A \,\}, & \tau_i^A < \infty\\[2mm]
                \{1,\dots,K_i\}, & \tau_i^A = \infty
              \end{cases}
            `}/>
          </div>
          <p className="text-slate-700 leading-relaxed">
            For MC‑single items, A selects <MathBlock inline tex={String.raw`\Omega_i^A \subseteq \{1,\dots,M_i\}`} /> (defaulting to A's own choice if unspecified). The directed indicator is
          </p>
          <div className="flex justify-center">
            <MathBlock tex={String.raw`
              I_i^A(B) = \begin{cases}
                \mathbf{1}\!\left[\, a_i^B \in \Omega_i^A \,\right], & \text{MC\_SINGLE}\\[2mm]
                \mathbf{1}\!\left[\, a_i^B \in \mathcal{A}_i^A \,\right], & \text{Likert}
              \end{cases}
            `}/>
          </div>
          <p className="text-slate-700 leading-relaxed text-sm">
            (MC‑multi items are retained for analysis; when placed in a domain with base multiplier 0, they do not affect the score.)
          </p>
        </Section>

        {/* Per-domain multipliers & priorities */}
        <Section title="Per‑Domain Multipliers & User Priorities">
          <p className="text-slate-700 leading-relaxed">
            Let <MathBlock inline tex={String.raw`m_d`} /> be the base multiplier for domain <MathBlock inline tex={String.raw`d\in\mathcal{D}`} />. Preregistered defaults:
          </p>
          <ul className="text-slate-700 list-disc pl-5 my-3 space-y-1 text-sm sm:text-base">
            <li>Values: <span className="font-mono">3.0</span>, Communication: <span className="font-mono">2.0</span>, Lifestyle: <span className="font-mono">2.0</span>, Social: <span className="font-mono">1.5</span>, Personality: <span className="font-mono">1.0</span>, Friendship: <span className="font-mono">1.0</span></li>
            <li>Quality/IMC or unknown domains: <span className="font-mono">0.0</span> (excluded from scoring)</li>
          </ul>
          <p className="text-slate-700 leading-relaxed">
            User priorities (<em>Q47</em>) map option labels → domains; if A prioritizes <MathBlock inline tex={String.raw`d`} />, set
            <MathBlock inline tex={String.raw`p_d^A = 1.5`} />, else <MathBlock inline tex={String.raw`p_d^A = 1`} />.
          </p>
          <div className="flex justify-center">
            <MathBlock tex={String.raw` W_i^A = w_i^A \cdot m_{\,d(i)} \cdot p_{\,d(i)}^A, \qquad W_i^B = w_i^B \cdot m_{\,d(i)} \cdot p_{\,d(i)}^B. `}/>
          </div>
        </Section>

        {/* Core scoring - baseline */}
        <Section title="Core Scoring: Baseline Algorithm">
          <p className="text-slate-700 leading-relaxed">
            Items contribute only if both answered and at least one side's weight is non‑zero. Define
          </p>
          <div className="flex justify-center">
            <MathBlock tex={String.raw`
              \mathcal{I}_{AB} = \bigl\{\, i\in\mathcal{I} : a_i^A\neq\varnothing,\; a_i^B\neq\varnothing,\; W_i^A>0 \text{ or } W_i^B>0 \,\bigr\},\quad
              n = |\mathcal{I}_{AB}|.
            `}/>
          </div>
          <p className="text-slate-700 leading-relaxed text-center">
            Directional (A←B) satisfaction and its B←A analogue:
          </p>
          <div className="flex justify-center">
            <MathBlock tex={String.raw`
              s_A(B) = \frac{\sum_{i\in\mathcal{I}_{AB}} W_i^A \, I_i^A(B)}{\sum_{i\in\mathcal{I}_{AB}} W_i^A},
              \qquad
              s_B(A) = \frac{\sum_{i\in\mathcal{I}_{AB}} W_i^B \, I_i^B(A)}{\sum_{i\in\mathcal{I}_{AB}} W_i^B}.
            `}/>
          </div>
          <p className="text-slate-700 leading-relaxed text-center">
            Mutuality (primary: geometric; sensitivity: arithmetic):
          </p>
          <div className="flex justify-center">
            <MathBlock tex={String.raw`
              \text{Match}_{\mathrm{geo}} = 100\,\sqrt{s_A(B)\,s_B(A)},\qquad
              \text{Match}_{\mathrm{mean}} = 100\cdot \tfrac{1}{2}\bigl(s_A(B)+s_B(A)\bigr).
            `}/>
          </div>
          <p className="text-slate-700 leading-relaxed text-center">
            Apply a finite‑sample penalty with hyperparameter <MathBlock inline tex={String.raw`c>0`} /> and a min‑overlap gate <MathBlock inline tex={String.raw`n_{\min}`} />:
          </p>
          <div className="flex justify-center">
            <MathBlock tex={String.raw`
              \mathrm{FinalMatch} = \begin{cases}
                \max\!\bigl(0,\; \text{Match}_{\star} - \dfrac{c}{\sqrt{n}} \bigr), & n \ge n_{\min} \\[3mm]
                \text{undefined (filtered)}, & n < n_{\min}
              \end{cases}
              \quad \text{ where } \star\in\{\mathrm{geo},\mathrm{mean}\}.
            `}/>
          </div>
          <p className="text-slate-700 leading-relaxed text-sm text-center">
            Preregistered grid: <MathBlock inline tex={String.raw`c\in\{60,100,140\}`} /> and <MathBlock inline tex={String.raw`n_{\min}\in\{15,20,25\}`} />, with both aggregators evaluated.
          </p>
        </Section>

        {/* Compact scoring sketch - visual summary */}
        <div className="bg-white border-2 border-brand-300 rounded-2xl shadow-lg p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-brand-600 to-brand-500"></div>
          <h3 className="text-lg font-bold mb-3 text-slate-900 sm:text-xl text-center">Quick Reference: Scoring Formula</h3>
          <div className="my-4 bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200 flex flex-col items-center">
            <div className="flex justify-center">
              <MathBlock tex={String.raw`
                s_A(B) = \frac{\sum_{i\in\mathcal I_{AB}} W_i^A \cdot I_i^A(B)}{\sum_{i\in\mathcal I_{AB}} W_i^A},
                \qquad
                W_i^A = w_i^A\, m_{d(i)}\, p_{d(i)}^A
              `}/>
            </div>
            <div className="flex justify-center">
              <MathBlock tex={String.raw`
                \text{FinalMatch} = \max\!\Bigl(0,\; 100\,\sqrt{s_A(B)\, s_B(A)} - \frac{c}{\sqrt{n}}\Bigr)
              `}/>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200">
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed italic text-center">
              IMC/Quality items carry base weight 0 and are excluded. Pairs with insufficient overlap are filtered (<MathBlock inline tex={String.raw`n<n_{\min}`} />).
            </p>
          </div>
        </div>

        {/* ML refinement */}
        <Section title="ML Refinement: Learned Domain Weights">
          <p className="text-slate-700 leading-relaxed">
            Features are per‑domain mutual satisfactions (no penalty), normalized to [0,1]:
          </p>
          <div className="flex justify-center">
            <MathBlock tex={String.raw`
              x_{AB}^{(d)} = \frac{1}{100}\,\mathrm{Match}^{(d)}_{\mathrm{geo}}
              = \sqrt{ s_A^{(d)}(B)\, s_B^{(d)}(A) } \,,\quad d\in\mathcal{D}.
            `}/>
          </div>
          <p className="text-slate-700 leading-relaxed">
            We fit L2‑regularized logistic regression with 5‑fold stratified cross‑validation (liblinear solver, <MathBlock inline tex={String.raw`C=1.0`} />).
            The objective is
          </p>
          <div className="flex justify-center">
            <MathBlock tex={String.raw`
              \min_{\beta\in\mathbb{R}^{|\mathcal{D}|}}
              \sum_{j=1}^N \log\!\bigl(1 + \exp\{-y_j\,\beta^\top x_j\}\bigr)
              + \lambda \,\|\beta\|_2^2, \qquad \lambda=\tfrac{1}{C}.
            `}/>
          </div>
          <p className="text-slate-700 leading-relaxed">
            Foldwise coefficients are averaged; we map them to positive, normalized multipliers (for interpretability and drop‑in use):
          </p>
          <div className="flex justify-center">
            <MathBlock tex={String.raw`
              m_d^{\mathrm{learned}} = \frac{\max(\bar\beta_d,\varepsilon)}{\sum_{k\in\mathcal{D}}\max(\bar\beta_k,\varepsilon)}\,,\quad \varepsilon=10^{-3}.
            `}/>
          </div>
          <p className="text-slate-700 leading-relaxed text-sm">
            We report cross‑validated AUC as a measure of separability. (Negative sampling yields a contrastive dataset of positives vs. sampled non‑partners; stratification mitigates class‑imbalance variance.)
          </p>
        </Section>

        {/* Unified distance-kernel family - make this prominent */}
        <div className="rounded-2xl border-2 border-slate-300 bg-gradient-to-br from-white to-slate-50/50 p-5 shadow-md sm:p-7">
          <h2 className="text-xl font-bold text-slate-900 mb-1 sm:text-2xl">Advanced Models: Distance‑Kernel Family</h2>
          <p className="text-sm text-slate-600 mb-5 sm:text-base">PAM, soft‑gated, and evolutionary variants that incorporate trait distance</p>
          
          <div className="mb-6">
            <p className="text-slate-700 leading-relaxed mb-3">
              Downstream ML models operate on per‑domain mutual acceptability <MathBlock inline tex={String.raw`m_d(A,B)\in[0,1]`} /> (derived from a probabilistic acceptability model, PAM),
              a trait distance <MathBlock inline tex={String.raw`\Delta_d(A,B)\in[0,1]`} /> from normalized self‑reports, and an optional reliability weight <MathBlock inline tex={String.raw`r_{A,B,d}\in(0,1]`} />.
              All distance‑kernel variants used in this study share the same core score:
            </p>
            <div className="my-3 rounded-xl border-2 border-brand-200 bg-brand-50/30 px-3 py-3 sm:px-4 sm:py-4 flex justify-center">
              <MathBlock tex={String.raw`
                S(A,B;\Theta) \;=\; \sum_{d} w_d\,[m_d(A,B)]^{\alpha_d}\,k_d\!\bigl(\Delta_d(A,B);\mu_d,\sigma_d\bigr)^{\beta_d}\,r_{A,B,d},
              `}/>
            </div>
            <p className="text-slate-700 leading-relaxed text-sm mb-2">
              where <MathBlock inline tex={String.raw`w_d\ge 0`} /> are domain weights, <MathBlock inline tex={String.raw`\alpha_d,\beta_d\ge 0`} /> exponents (default 1),
              and <MathBlock inline tex={String.raw`k_d`} /> is a distance kernel chosen per domain:
            </p>
            <div className="flex justify-center">
              <MathBlock tex={String.raw`
                k_{\mathrm{sim}}(\Delta) = \exp\!\bigl(-(\Delta/\sigma)^2\bigr), \quad
                k_{\mathrm{comp}}(\Delta) = \exp\!\Bigl(-\frac{(\Delta-\mu)^2}{2\sigma^2}\Bigr), \quad
                k_{\mathrm{irr}}(\Delta)\equiv 1.
              `}/>
            </div>
          </div>

          {/* Algorithm variants - vertical stack */}
          <div className="space-y-4 mt-6">
            <div className="rounded-xl border-2 border-blue-200 bg-blue-50/30 p-4">
              <div className="mb-2">
                <h3 className="text-base font-semibold text-slate-900 sm:text-lg">Baseline / PAM <span className="text-sm font-normal text-slate-600">(Similarity‑only)</span></h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-700 mb-2">
                At the domain level we drop distance and use logit‑transformed mutuality:
              </p>
              <div className="flex justify-center">
                <MathBlock tex={String.raw`
                  S_{\mathrm{base}}(A,B) \;=\; \sum_d w_d\,\operatorname{logit}\!\bigl(m_d(A,B)\bigr),
                `}/>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 mt-2">
                with <MathBlock inline tex={String.raw`\alpha_d=1,\ \beta_d=0`} /> and <MathBlock inline tex={String.raw`k_d\equiv 1`} />.
                PAM refines <MathBlock inline tex={String.raw`m_d(A,B)`} /> using directional lower‑confidence bounds before mutual aggregation.
              </p>
            </div>

            <div className="rounded-xl border-2 border-green-200 bg-green-50/30 p-4">
              <div className="mb-2">
                <h3 className="text-base font-semibold text-slate-900 sm:text-lg">Soft‑Gated Model <span className="text-sm font-normal text-slate-600">(Learns similarity vs complementarity)</span></h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-700 mb-2">
                Each domain mixes similarity and complementarity with non‑negative gates:
              </p>
              <div className="flex justify-center">
                <MathBlock tex={String.raw`S_d(A,B) = w_d\, m_d(A,B)\,\bigl(a_d\,k_{\mathrm{sim}}(\Delta_d) + b_d\,k_{\mathrm{comp}}(\Delta_d)\bigr),`}/>
              </div>
              <div className="flex justify-center">
                <MathBlock tex={String.raw`S_{\mathrm{soft}}(A,B)=\sum_d S_d(A,B).`}/>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 mt-2 text-center">
                We learn <MathBlock inline tex={String.raw`w_d,a_d,b_d\ge 0`} /> by minimizing a pairwise ranking (BPR) loss over triples
                (anchor <MathBlock inline tex={String.raw`A`} />, partner <MathBlock inline tex={String.raw`P`} />, non‑partner <MathBlock inline tex={String.raw`N`} />):
              </p>
              <div className="flex justify-center mt-1">
                <MathBlock tex={String.raw`
                  \ell(A,P,N) = \log\!\bigl(1 + \exp\bigl(-(S_{\mathrm{soft}}(A,P)-S_{\mathrm{soft}}(A,N))\bigr)\bigr) + \lambda_1\!\sum_d |w_d| + \lambda_{\mathrm{excl}}\!\sum_d a_d b_d.
                `}/>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 mt-2 text-center">
                After training we infer each domain as similarity (<MathBlock inline tex={String.raw`a_d\gg b_d`} />),
                complementarity (<MathBlock inline tex={String.raw`b_d\gg a_d`} />), or irrelevant (<MathBlock inline tex={String.raw`w_d\approx 0`} />).
              </p>
            </div>

            <div className="rounded-xl border-2 border-purple-200 bg-purple-50/30 p-4">
              <div className="mb-2">
                <h3 className="text-base font-semibold text-slate-900 sm:text-lg">Evolutionary Model <span className="text-sm font-normal text-slate-600">(Discrete search)</span></h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-700 mb-2 text-center">
                Here each domain chooses a discrete mode and kernel parameters that are searched rather than learned by gradient:
              </p>
              <div className="flex justify-center">
                <MathBlock tex={String.raw`
                  z_d \in \{\mathrm{sim},\mathrm{comp},\mathrm{irr}\},\;
                  w_d\in[0,5],\;
                  \mu_d\in\{0.25,0.50,0.75\},\;
                  \sigma_d\in\{0.15,0.25,0.35\}.
                `}/>
              </div>
              <div className="flex max-w-full items-center justify-center gap-4 overflow-x-auto whitespace-nowrap px-2">
                <MathBlock tex={String.raw`
                  k_d(\Delta_d) = \begin{cases}
                    1, & z_d=\mathrm{irr}\\[2pt]
                    k_{\mathrm{sim}}(\Delta_d), & z_d=\mathrm{sim}\\[2pt]
                    k_{\mathrm{comp}}(\Delta_d), & z_d=\mathrm{comp}
                  \end{cases}
                `}/>
                <MathBlock inline tex={String.raw`\Longrightarrow`}/>
                <MathBlock tex={String.raw`S_{\mathrm{evo}}(A,B) = \sum_d w_d\, m_d(A,B)\,k_d\!\bigl(\Delta_d(A,B)\bigr).`}/>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 mt-2 text-center">
                The evolutionary search maximizes an identification‑focused objective over generations:
              </p>
              <div className="flex justify-center">
                <MathBlock tex={String.raw`J = 3\cdot \mathrm{Hit@1} + 2\cdot \mathrm{Mutual@}K + \mathrm{Hit@}K + 0.5\cdot \mathrm{AUC},`}/>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 mt-1 text-center">
                using elitism, domain‑wise crossover, and small mutations in <MathBlock inline tex={String.raw`z_d,w_d,\mu_d,\sigma_d`} /> to obtain an interpretable configuration.
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500 sm:text-sm italic text-center">
            In the current pilot data, the soft‑gated model and ML refinement perform best on Hit@K and Mutual@K; the evolutionary model provides a complementary, fully discrete summary of domain modes.
          </p>
        </div>

        {/* Evaluation */}
        <Section title="Evaluation Protocol (Ranking‑Based)">
          <p className="text-slate-700 leading-relaxed">
            For each observed couple, we score the true pair and <em>k</em> sampled non‑partners (default <MathBlock inline tex={String.raw`k=20`} />). The primary metric is AUC via the Mann–Whitney U statistic with standard tie handling:
          </p>
          <div className="flex justify-center">
            <MathBlock tex={String.raw`
              \mathrm{AUC} = \frac{U}{N_+ N_-}, \qquad
              U = \sum_{x\in\text{true}} \sum_{y\in\text{non}} \mathbf{1}[\, x>y \,] + \tfrac{1}{2}\mathbf{1}[\, x=y \,].
            `}/>
          </div>
          <p className="text-slate-700 leading-relaxed">
            We also report <em>lift</em> <MathBlock inline tex={String.raw`\ \Delta = \mathbb{E}[S\,|\,Y{=}1]-\mathbb{E}[S\,|\,Y{=}0]`} /> and a median‑rank proxy derived from the sampled distractors. Multiple preregistered variants (different <MathBlock inline tex={String.raw`c`} />, <MathBlock inline tex={String.raw`n_{\min}`} />, aggregator) are compared transparently.
          </p>
          <p className="text-slate-700 leading-relaxed">
            For the distance‑kernel models we additionally track <MathBlock inline tex={String.raw`\mathrm{Hit@}K`} /> (fraction of anchors whose true partner is ranked in the top <MathBlock inline tex={String.raw`K`} />),
            <MathBlock inline tex={String.raw`\mathrm{Mutual@}K`} /> (fraction of true couples where both rank each other in the top <MathBlock inline tex={String.raw`K`} />),
            and mean reciprocal rank <MathBlock inline tex={String.raw`\mathrm{MRR} = \tfrac{1}{N}\sum_i 1/\mathrm{rank}_i`} /> as complementary identification metrics.
          </p>
        </Section>

        {/* Properties & complexity */}
        <Section title="Mathematical Properties & Computational Profile">
          <ul className="text-slate-700 list-disc pl-5 space-y-2 text-sm sm:text-base">
            <li><strong>Range & truncation:</strong> <MathBlock inline tex={String.raw`s_A,s_B\in[0,1]`} />, so <MathBlock inline tex={String.raw`\text{Match}_{\mathrm{geo}}\in[0,100]`} />; <MathBlock inline tex={String.raw`\mathrm{FinalMatch}\in[0,100]`} /> after penalty and floor at 0.</li>
            <li><strong>Monotonicity in acceptability:</strong> Expanding <MathBlock inline tex={String.raw`\mathcal{A}_i^A`} /> or <MathBlock inline tex={String.raw`\Omega_i^A`} /> weakly increases <MathBlock inline tex={String.raw`s_A(B)`} /> (and analogously for B).</li>
            <li><strong>Scale invariance (per‑direction):</strong> Multiplying all <MathBlock inline tex={String.raw`W_i^A`} /> by a constant leaves <MathBlock inline tex={String.raw`s_A(B)`} /> unchanged (ratio).</li>
            <li><strong>Bottleneck effect:</strong> Geometric aggregation gives <MathBlock inline tex={String.raw`\text{Match}_{\mathrm{geo}}=0`} /> if either direction is 0; arithmetic mean is used only for sensitivity.</li>
            <li><strong>Penalty shape:</strong> <MathBlock inline tex={String.raw`c/\sqrt{n}`} /> yields diminishing penalty as overlap grows; the gate <MathBlock inline tex={String.raw`n_{\min}`} /> suppresses unstable scores.</li>
            <li><strong>Complexity:</strong> Scoring one pair is <MathBlock inline tex={String.raw`\mathcal{O}(|\mathcal{I}_{AB}|)`} />; evaluation with <MathBlock inline tex={String.raw`k`} /> sampled non‑partners per couple is <MathBlock inline tex={String.raw`\mathcal{O}(C\cdot (k{+}1)\cdot\bar{I})`} /> where <MathBlock inline tex={String.raw`C`} /> couples and <MathBlock inline tex={String.raw`\bar{I}`} /> average overlap.</li>
          </ul>
        </Section>

        {/* References */}
        <Section title="References">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700 sm:text-base">
            <li><strong>TIPI (Ten‑Item Personality Inventory).</strong> Gosling, S. D., Rentfrow, P. J., & Swann, W. B. (2003). <em>A very brief measure of the Big‑Five personality domains</em>. <span className="italic">Journal of Research in Personality</span>, 37(6), 504–528.</li>
            <li><strong>Schwartz values / PVQ‑21.</strong> Schwartz, S. H. (2012). <em>An overview of the Schwartz theory of basic values</em>. <span className="italic">Online Readings in Psychology and Culture</span>, 2(1). (PVQ‑21 used by the European Social Survey.)</li>
            <li><strong>AUC and Mann–Whitney U.</strong> Mann, H. B., & Whitney, D. R. (1947). <em>On a test of whether one of two random variables is stochastically larger than the other</em>. <span className="italic">Annals of Mathematical Statistics</span>, 18(1), 50–60.</li>
            <li><strong>Stable matching (DA).</strong> Gale, D., & Shapley, L. S. (1962). <em>College admissions and the stability of marriage</em>. <span className="italic">American Mathematical Monthly</span>, 69(1), 9–15.</li>
            <li><strong>Strategy‑proofness (proposers).</strong> Dubins, L. E., & Freedman, D. A. (1981). <em>Machiavelli and the Gale–Shapley algorithm</em>. <span className="italic">American Mathematical Monthly</span>, 88(7), 485–494.</li>
            <li><strong>Stability & incentives.</strong> Roth, A. E. (1982). <em>The economics of matching: Stability and incentives</em>. <span className="italic">Mathematics of Operations Research</span>, 7(4), 617–628.</li>
            <li><strong>Probabilistic serial (random assignment).</strong> Bogomolnaia, A., & Moulin, H. (2001). <em>A new solution to the random assignment problem</em>. <span className="italic">Journal of Economic Theory</span>, 100(2), 295–328.</li>
            <li><strong>Software (scikit‑learn).</strong> Pedregosa, F., et&nbsp;al. (2011). <em>Scikit‑learn: Machine learning in Python</em>. <span className="italic">Journal of Machine Learning Research</span>, 12, 2825–2830.</li>
            <li><strong>Software (LIBLINEAR).</strong> Fan, R.‑E., Chang, K.‑W., Hsieh, C.‑J., Wang, X.‑R., & Lin, C.‑J. (2008). <em>LIBLINEAR: A library for large linear classification</em>. <span className="italic">JMLR</span>, 9, 1871–1874.</li>
          </ol>
          <p className="mt-3 text-sm text-slate-500">
            Notes: PVQ‑21 portrait wording is attributed to the ESS instrument; our app exposes official text when provided. We cite scikit‑learn and LIBLINEAR corresponding to the code paths used in <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">tiger-alg/ml/learn_domain_weights.py</code>.
          </p>
        </Section>

        {/* footer ctas */}
        <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Link href="/" className="w-full rounded-md border border-slate-300 px-5 py-2.5 text-center font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto">Back</Link>
          <Link href="/start" className="w-full rounded-md bg-brand-600 px-6 py-2.5 text-center font-medium text-white shadow-sm transition-colors hover:bg-brand-700 sm:w-auto">Begin Questionnaire</Link>
        </div>
      </motion.div>
    </div>
  )
}

function Section({ title, children }: { title:string, children:ReactNode }){
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <h2 className="text-base font-bold text-slate-900 sm:text-lg mb-3">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-slate-700 sm:text-base">
        {children}
      </div>
    </section>
  )
}

function MethodCard({ title, desc }: { title:string, desc:string }){
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md sm:p-5">
      <div className="text-base font-bold text-slate-900">{title}</div>
      <div className="mt-1.5 text-sm leading-relaxed text-slate-600 sm:text-[15px]">{desc}</div>
    </div>
  )
}

function AlgorithmCard({ title, subtitle, color, children, fullWidth }: { title:string, subtitle:string, color:"blue"|"green"|"purple", children:ReactNode, fullWidth?:boolean }){
  const colorClasses = {
    blue: "border-blue-200 bg-blue-50/30",
    green: "border-green-200 bg-green-50/30",
    purple: "border-purple-200 bg-purple-50/30"
  }
  return (
    <div className={`rounded-xl border-2 ${colorClasses[color]} p-3 shadow-sm ${fullWidth ? "md:col-span-2 lg:col-span-3" : ""}`}>
      <div className="mb-2">
        <p className="text-sm font-semibold text-slate-900 sm:text-base">{title}</p>
        <p className="text-xs text-slate-600 mt-0.5">{subtitle}</p>
      </div>
      <div className="text-xs sm:text-sm">
        {children}
      </div>
    </div>
  )
}

function Step({ n, text }: { n:number, text:string }){
  return (
    <li className="flex gap-3 rounded-xl border border-white/0 bg-white/70 p-3.5 shadow-sm ring-1 ring-slate-200/70">
      <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-sm sm:h-7 sm:w-7 sm:text-sm">{n}</span>
      <span className="text-sm leading-relaxed text-slate-700 sm:text-base">{text}</span>
    </li>
  )
}
