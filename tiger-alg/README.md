# TigerMatch-Core (drop-in)

This folder contains the pre-registered TigerMatch-Core v1.0 algorithm and evaluation scripts.

Quickstart:

1) Install deps

```
pip install -r requirements.txt
```

2) Build `meta.json` from your repo questions (handles IMC gracefully)

```
python tools/build_meta_from_repo.py \
  --questions_json ../data/questions.json \
  --export_csv ../export.csv \
  --out meta.json
```

3) Primary evaluation (pre-registered winner by AUC)

```
python eval/evaluate_couples.py \
  --export_csv ../export.csv \
  --couples_csv couples.csv \
  --meta_json meta.json \
  --questions_json ../data/questions.json \
  --outdir out
```

4) Optional interpretable ML to learn domain weights (secondary)

```
python ml/learn_domain_weights.py \
  --export_csv ../export.csv \
  --couples_csv couples.csv \
  --meta_json meta.json \
  --out out/ml_weights.json

5) Evaluate with learned weights (sensitivity)

Once `out/ml_weights.json` exists, you can override the default domain multipliers:

```
python eval/evaluate_couples.py \
  --export_csv ../export.csv \
  --couples_csv couples.csv \
  --meta_json meta.json \
  --questions_json ../data/questions.json \
  --weights_json out/ml_weights.json \
  --outdir out_ml
```

This scales the learned weights to the same total as the default multipliers for comparability.
```

Expected outputs:

- `out/summary_by_variant.csv` – AUC / lift / median rank per variant; top row = winner
- `out/per_couple_scores.csv` – per-couple FinalMatch + overlaps for the winner
- `out/ml_weights.json` – optional learned domain multipliers (secondary)

Notes:

- Q47 is parsed from your `data/questions.json` so option labels map correctly to domains.
- If an IMC item (e.g., `IMC1`) appears in the export but not in questions, it's added to `meta.json` with Domain `Quality` and contributes zero in scoring.
- MC-MULTI (e.g., Q50) defaults acceptable to the user's own selection(s) when left blank.
