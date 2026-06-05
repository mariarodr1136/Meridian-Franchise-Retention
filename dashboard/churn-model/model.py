"""
JETSET Pilates — Member Churn Risk Model
Generates synthetic member data, trains XGBoost classifier,
outputs predictions.json for the Next.js dashboard.
"""

import json, random
from datetime import datetime, timezone
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, classification_report

random.seed(42)
np.random.seed(42)

# ── Studio definitions (match names in the DB seed) ─────────────────────────

STUDIOS = [
    # (name, city, status, n_members, churn_rate)
    ("Wynwood",         "Miami",         "healthy",    28, 0.07),
    ("Brickell",        "Miami",         "at-risk",    14, 0.31),
    ("Coral Gables",    "Miami",         "healthy",    26, 0.08),
    ("Boca Raton",      "Boca Raton",    "healthy",    24, 0.09),
    ("Fort Lauderdale", "Fort Lauderdale","healthy",   18, 0.10),
    ("Buckhead",        "Atlanta",       "new",        11, 0.18),
    ("Upper East Side", "New York",      "healthy",    30, 0.06),
    ("SoHo",            "New York",      "healthy",    28, 0.07),
    ("Beacon Hill",     "Boston",        "healthy",    22, 0.09),
    ("Uptown",          "Dallas",        "at-risk",    16, 0.28),
    ("River Oaks",      "Houston",       "healthy",    20, 0.10),
    ("West Hollywood",  "Los Angeles",   "healthy",    27, 0.07),
    ("Pacific Heights", "San Francisco", "at-risk",    15, 0.26),
    ("Lincoln Park",    "Chicago",       "new",         9, 0.20),
    ("South Yarra",     "Melbourne",     "healthy",    18, 0.11),
]

FIRST_NAMES = [
    "Sofia","Elena","Diana","Natalie","Camille","Jasmine","Claire","Rachel",
    "Lauren","Brittany","Amanda","Priya","Michelle","Taylor","Olivia","Mia",
    "Harper","Willow","Stella","Luna","Aurora","Nova","Grace","Sophia","Lily",
    "Emma","Abby","Maya","Chloe","Riley","Paige","Hannah","Alexis","Brooklyn",
    "Aria","Quinn","Ivy","Zoey","Skylar","Keisha","Ashley","Zoe","Jade","Nadia",
    "Simone","Ana","Bridget","Carmen","Sydney","Morgan","Hailey","Charlotte",
    "Victoria","Penelope","Daniela","Isabelle","Valentina","Kayla","Mia","Tori",
    "James","Michael","Alex","Jordan","Tyler","Ryan","Chris","Sam","Drew","Avery",
]
LAST_NAMES = [
    "Rodriguez","Martinez","Johnson","Williams","Chen","Kim","Patel","Brown",
    "Davis","Wilson","Thompson","Garcia","Lee","Anderson","Taylor","Thomas",
    "Jackson","White","Harris","Martin","Walker","Hall","Young","Allen","Wright",
    "Scott","Torres","Nguyen","Hill","Mitchell","Carter","Phillips","Evans","Turner",
]

TIERS = ["basic", "premium", "unlimited"]
TIER_VALUES = {"basic": 120, "premium": 165, "unlimited": 195}  # monthly $

# ── Feature generation ───────────────────────────────────────────────────────

def gen_member(studio_status: str, is_churn_case: bool) -> dict:
    tier = random.choices(TIERS, weights=[0.3, 0.45, 0.25])[0]
    membership_age = random.randint(7, 730)
    is_new = membership_age < 60

    if is_churn_case:
        days_since = random.choices(
            [random.randint(8,21), random.randint(22,60), random.randint(1,7)],
            weights=[0.45, 0.40, 0.15]
        )[0]
        visits_last   = max(0, int(np.random.normal(1.8, 1.2)))
        visits_prev   = max(0, int(np.random.normal(5.5, 2.0)))
        noshows       = max(0, int(np.random.normal(2.8, 1.2)))
        noshows       = min(noshows, visits_last + noshows)
    else:
        days_since = random.choices(
            [random.randint(1,5), random.randint(6,14), random.randint(15,30)],
            weights=[0.60, 0.30, 0.10]
        )[0]
        visits_last   = max(1, int(np.random.normal(5.8, 1.8)))
        visits_prev   = max(1, int(np.random.normal(5.5, 1.6)))
        noshows       = max(0, int(np.random.normal(0.6, 0.7)))

    if studio_status == "at-risk" and not is_churn_case:
        days_since = min(days_since + random.randint(2, 6), 60)
        visits_last = max(0, visits_last - random.randint(0, 2))

    total_visits = max(1, int(membership_age / 7 * (visits_last + visits_prev) / 8))
    noshows = min(noshows, visits_last + 1)
    noshows_frac = noshows / max(visits_last + noshows, 1)

    return {
        "membership_age_days": membership_age,
        "is_new_member":       int(is_new),
        "tier_enc":            TIERS.index(tier),
        "days_since_last":     days_since,
        "visits_last_30d":     visits_last,
        "visits_prev_30d":     visits_prev,
        "visit_trend":         visits_last - visits_prev,
        "noshows_30d":         noshows,
        "noshows_frac":        round(noshows_frac, 3),
        "lifetime_visits":     total_visits,
        # stored for output, not for model
        "_tier":               tier,
        "_membership_age":     membership_age,
        "_days_since":         days_since,
        "_visits_last":        visits_last,
        "_visits_prev":        visits_prev,
        "_noshows":            noshows,
        "_noshows_frac":       round(noshows_frac, 3),
    }


# ── Training data ─────────────────────────────────────────────────────────────

def build_training_set(n=1400) -> pd.DataFrame:
    rows, labels = [], []
    for _ in range(n):
        status = random.choice(["healthy", "at-risk", "new"])
        rate   = {"healthy": 0.10, "at-risk": 0.30, "new": 0.18}[status]
        churn  = random.random() < rate
        r = gen_member(status, churn)
        rows.append({k: v for k, v in r.items() if not k.startswith("_")})
        labels.append(int(churn))
    df = pd.DataFrame(rows)
    df["churned"] = labels
    return df


FEATURES = [
    "membership_age_days","is_new_member","tier_enc",
    "days_since_last","visits_last_30d","visits_prev_30d",
    "visit_trend","noshows_30d","noshows_frac","lifetime_visits",
]

df_train = build_training_set(1400)
X = df_train[FEATURES]
y = df_train["churned"]

X_tr, X_val, y_tr, y_val = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

model = GradientBoostingClassifier(
    n_estimators=180,
    max_depth=4,
    learning_rate=0.08,
    subsample=0.85,
    random_state=42,
)
model.fit(X_tr, y_tr)

val_proba = model.predict_proba(X_val)[:, 1]
val_auc   = roc_auc_score(y_val, val_proba)
print(f"Validation AUC: {val_auc:.3f}")
print(classification_report(y_val, (val_proba > 0.5).astype(int), target_names=["retained","churned"]))


# ── Inference on current members ──────────────────────────────────────────────

def explain_risk(row: dict) -> list[str]:
    factors = []
    if row["_days_since"] > 21:
        factors.append(f"{row['_days_since']} days since last class")
    elif row["_days_since"] > 12:
        factors.append(f"{row['_days_since']} days since last visit")
    trend = row["_visits_last"] - row["_visits_prev"]
    if trend <= -3:
        factors.append(f"Weekly visits down {abs(trend)}/month vs prior period")
    elif trend <= -1:
        factors.append(f"Visit frequency declining")
    if row["_noshows_frac"] > 0.30:
        pct = int(row["_noshows_frac"] * 100)
        factors.append(f"{pct}% no-show rate this month")
    if row["_membership_age"] < 45:
        factors.append("Early dropout risk window (< 45 days)")
    if row["_visits_last"] == 0:
        factors.append("Zero classes attended this month")
    elif row["_visits_last"] <= 1:
        factors.append("Nearly inactive — 1 visit this month")
    return factors[:3] if factors else ["Declining engagement pattern detected"]


def suggest_action(risk_level: str, row: dict) -> str:
    days   = row["_days_since"]
    trend  = row["_visits_last"] - row["_visits_prev"]
    age    = row["_membership_age"]
    noshows = row["_noshows"]

    if risk_level == "high":
        if days > 21:
            return "Immediate personal outreach — call or text from studio lead with a complimentary drop-in offer"
        if trend <= -4:
            return "Re-engagement sequence — 3-touch email + SMS + 2-week membership pause option"
        if noshows >= 3:
            return "Goals check-in — 10-min call to identify barriers to attendance"
        return "Priority win-back — complimentary guest pass + exclusive member event invite"
    if risk_level == "medium":
        if age < 60:
            return "New member nurture — pair with a studio ambassador for next 3 classes"
        if trend < 0:
            return "Habit rebuild — send personalized class recommendations for their preferred time slot"
        return "Referral activation — double referral bonus to re-engage social motivation"
    return "Loyalty recognition — acknowledge milestone or add to VIP early-booking list"


member_names = [f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}" for _ in range(600)]
name_idx = 0

# First pass: collect all members and raw probabilities
raw_members = []

for studio_name, city, status, n_members, churn_rate in STUDIOS:
    for i in range(n_members):
        is_churn = random.random() < churn_rate
        row = gen_member(status, is_churn)
        features_df = pd.DataFrame([{k: v for k, v in row.items() if not k.startswith("_")}])
        prob = float(model.predict_proba(features_df[FEATURES])[0][1])
        raw_members.append((studio_name, city, status, i, row, prob))

# Percentile-based thresholds: top 15% = high, next 20% = medium, rest = low
all_probs = [m[5] for m in raw_members]
p85 = float(np.percentile(all_probs, 85))
p65 = float(np.percentile(all_probs, 65))

output_members = []

for studio_name, city, status, i, row, prob in raw_members:
        risk_level = "high" if prob >= p85 else "medium" if prob >= p65 else "low"
        # Rescale to 1-99 score based on rank position
        rank = sorted(all_probs).index(prob) / len(all_probs)
        risk_score = min(99, max(1, int(rank * 100)))

        monthly_value = TIER_VALUES[row["_tier"]]

        output_members.append({
            "id":               f"mbr_{studio_name.replace(' ','_').lower()}_{i:03d}",
            "name":             member_names[name_idx % len(member_names)],
            "studioName":       studio_name,
            "studioCity":       city,
            "studioStatus":     status,
            "membershipTier":   row["_tier"],
            "membershipAgeDays":row["_membership_age"],
            "daysSinceLastVisit":row["_days_since"],
            "visitsLast30d":    row["_visits_last"],
            "visitsPrev30d":    row["_visits_prev"],
            "noShowRate":       row["_noshows_frac"],
            "churnProbability": round(prob, 3),
            "riskScore":        risk_score,
            "riskLevel":        risk_level,
            "monthlyValue":     monthly_value,
            "topFactors":       explain_risk(row),
            "suggestedAction":  suggest_action(risk_level, row),
        })
        name_idx += 1


# ── Summary ───────────────────────────────────────────────────────────────────

high    = [m for m in output_members if m["riskLevel"] == "high"]
medium  = [m for m in output_members if m["riskLevel"] == "medium"]
low     = [m for m in output_members if m["riskLevel"] == "low"]

revenue_at_risk = sum(
    m["monthlyValue"] * 12 * m["churnProbability"]
    for m in output_members if m["riskLevel"] in ("high", "medium")
)

output = {
    "generatedAt": datetime.now(timezone.utc).isoformat(),
    "modelAUC":    round(val_auc, 3),
    "summary": {
        "totalAnalyzed":  len(output_members),
        "highRisk":       len(high),
        "mediumRisk":     len(medium),
        "lowRisk":        len(low),
        "revenueAtRisk":  int(revenue_at_risk),
    },
    "members": sorted(output_members, key=lambda m: -m["churnProbability"]),
}

out_path = "../predictions.json"
with open(out_path, "w") as f:
    json.dump(output, f, indent=2)

print(f"\n✓ {len(output_members)} members analyzed across {len(STUDIOS)} studios")
print(f"  High risk:   {len(high)}")
print(f"  Medium risk: {len(medium)}")
print(f"  Low risk:    {len(low)}")
print(f"  Annual revenue at risk: ${revenue_at_risk:,.0f}")
print(f"\n✓ Saved → dashboard/predictions.json")
