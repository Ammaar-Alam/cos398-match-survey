import json, argparse, numpy as np, pandas as pd
from typing import Dict, Any, Tuple
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import roc_auc_score
from algorithms.core import final_match

DOMAINS = ["Values","Communication","Lifestyle","Social","Personality","Friendship"]

def load_meta(p): 
    with open(p,"r",encoding="utf-8") as f: return json.load(f)

def per_domain_features(export_df:pd.DataFrame, meta:Dict[str,Any], A:str, B:str)->Tuple[np.ndarray, int]:
    """
    Build features = per-domain mutual satisfactions (sqrt(sA*sB)), no penalty.
    We compute them by masking meta to one domain at a time.
    Returns (features array of length len(DOMAINS), overlap across all domains)
    """
    arow = export_df.loc[export_df["participantId"]==A]
    brow = export_df.loc[export_df["participantId"]==B]
    if arow.empty or brow.empty: return np.zeros(len(DOMAINS)), 0
    arow = arow.iloc[0].to_dict(); brow = brow.iloc[0].to_dict()

    feats=[]
    total_overlap=0
    for d in DOMAINS:
        submeta={k:v for k,v in meta.items() if v.get("Domain")==d}
        fm, n, sA, sB = final_match(arow, brow, submeta, set(), set(), c_penalty=0.0, min_overlap=1, symmetric_check=False)
        # fm = 100*sqrt(sA*sB), so feature is fm/100 in [0,1]
        feats.append((fm or 0.0)/100.0)
        total_overlap += n
    return np.array(feats, dtype=float), total_overlap

def build_dataset(export_df, couples_df, meta, rnd_per=10, seed=42):
    rng=np.random.default_rng(seed)
    ids=export_df["participantId"].astype(str).tolist()
    X=[]; y=[]
    for _,c in couples_df.iterrows():
        A=str(c["partner_a_id"]); B=str(c["partner_b_id"])
        if A in ids and B in ids:
            x,_ = per_domain_features(export_df, meta, A, B)
            X.append(x); y.append(1)
            others=[i for i in ids if i not in (A,B)]
            if others:
                for D in rng.choice(others, size=min(rnd_per, len(others)), replace=False):
                    x0,_ = per_domain_features(export_df, meta, A, str(D))
                    X.append(x0); y.append(0)
    return np.asarray(X), np.asarray(y)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--export_csv", required=True)
    ap.add_argument("--couples_csv", required=True)
    ap.add_argument("--meta_json", required=True)
    ap.add_argument("--out", default="out/ml_weights.json")
    args=ap.parse_args()

    export_df=pd.read_csv(args.export_csv)
    couples_df=pd.read_csv(args.couples_csv)
    meta=load_meta(args.meta_json)

    X,y=build_dataset(export_df,couples_df,meta)
    if len(X)==0:
        raise SystemExit("No data to fit.")

    skf=StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    aucs=[]; coefs=[]
    for tr,te in skf.split(X,y):
        clf=LogisticRegression(penalty="l2", C=1.0, solver="liblinear")
        clf.fit(X[tr], y[tr])
        aucs.append(roc_auc_score(y[te], clf.predict_proba(X[te])[:,1]))
        coefs.append(clf.coef_[0])

    coef=np.mean(coefs,axis=0)
    auc=float(np.mean(aucs))

    # Convert to positive normalized multipliers (keeps interpretability)
    eps=1e-3
    pos=np.maximum(coef, eps)
    norm = (pos/np.sum(pos)).tolist()
    learned = { d: float(norm[i]) for i,d in enumerate(DOMAINS) }
    learned["cv_auc"]=auc

    import os, json as js
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out,"w") as f: js.dump(learned,f,indent=2)
    print(js.dumps(learned, indent=2))

if __name__=="__main__":
    main()

