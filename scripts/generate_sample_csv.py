"""
Generate a realistic sample dataset and export it as CSV for Power BI.

This simulates the app's built-in CSV export (Candidates page → Export CSV)
with enough rows to make every recommended Power BI visual meaningful:
funnel, score distribution, skill gaps, per-job performance.

Run:  python generate_sample_csv.py
Output: powerbi-sample-data.csv  (same columns as the app's export)
"""
import csv
import random
from datetime import datetime, timedelta

random.seed(42)

JOBS = [
    ("Senior Frontend Engineer", ["React", "TypeScript", "Next.js", "Tailwind CSS", "Testing", "GraphQL", "CI/CD", "Accessibility"], 5),
    ("Backend Engineer (Python)", ["Python", "Django", "PostgreSQL", "REST APIs", "Docker", "Redis", "Testing", "CI/CD"], 4),
    ("Data Analyst", ["SQL", "Python", "Pandas", "Power BI", "Tableau", "Statistics", "Excel", "Data Visualization"], 3),
    ("ML Engineer", ["Python", "Scikit-learn", "TensorFlow", "Pandas", "NumPy", "Machine Learning", "Docker", "SQL"], 3),
    ("DevOps Engineer", ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD", "Linux", "Monitoring", "Bash"], 4),
]

STATUSES = ["new", "screening", "shortlisted", "interview", "rejected", "hired"]
STATUS_WEIGHTS = [22, 18, 15, 12, 23, 10]  # realistic funnel shape

FIRST_NAMES = ["Aisha", "Bilal", "Chen", "Dana", "Emre", "Farah", "Giovanni", "Hana", "Imran", "Julia",
               "Karim", "Lena", "Mustafa", "Nadia", "Omar", "Priya", "Qasim", "Rana", "Sofia", "Tariq",
               "Uma", "Victor", "Warda", "Xin", "Yusuf", "Zara", "Adnan", "Bisma", "Colin", "Divya"]
LAST_NAMES = ["Khan", "Ahmed", "Chowdhury", "Silva", "Yilmaz", "Malik", "Rossi", "Sato", "Kaur", "Novak",
              "Haddad", "Weber", "Iqbal", "Patel", "Bakr", "Lopez", "Chen", "Aziz", "Kim", "Farooq"]

TAG_POOL = ["Applied Online", "Priority", "Remote OK", "Needs Visa", "Referred", "Follow-up", ""]

def make_row(i: int) -> dict:
    job_title, skills, min_years = random.choice(JOBS)
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    name = f"{first} {last}"

    # Match % — most candidates land mid-range
    base = random.gauss(62, 18)
    match_pct = round(max(5, min(98, base)), 0)

    # Higher scores correlate with stronger pipeline progression
    status_weights = STATUS_WEIGHTS.copy()
    if match_pct >= 80:
        status_weights = [5, 8, 22, 25, 15, 25]
    elif match_pct < 45:
        status_weights = [30, 25, 4, 2, 39, 0]
    status = random.choices(STATUSES, weights=status_weights, k=1)[0]

    matched = round(len(skills) * (match_pct / 100) * random.uniform(0.7, 1.1))
    matched = max(1, min(len(skills), matched))
    missing = [s for s in skills if s not in random.sample(skills, matched)]
    missing_str = ";".join(missing) if missing else ""

    years = round(max(0, min(15, random.gauss(min_years + 1, 3))), 1)
    seniority = "junior" if years < 2 else "mid" if years < 5 else "senior" if years < 9 else "lead"

    created = datetime(2026, 8, 24) + timedelta(days=random.randint(0, 14), hours=random.randint(0, 23))

    return {
        "Name": name,
        "Email": f"{first.lower()}.{last.lower()}@example.com",
        "Phone": f"+1-555-{random.randint(100,999)}-{random.randint(1000,9999)}",
        "Status": status,
        "Best Match %": int(match_pct),
        "Job Title": job_title,
        "Matched Skills Count": matched,
        "Required Skills Count": len(skills),
        "Missing Skills": missing_str,
        "Years Experience": years,
        "Seniority": seniority,
        "Tags": random.choice(TAG_POOL),
        "Notes Count": random.randint(0, 4),
        "Interviews Count": random.randint(0, 2) if status in ("interview", "hired", "shortlisted") else 0,
        "Source": random.choices(["Screening", "Applied Online"], weights=[70, 30], k=1)[0],
        "Created At": created.strftime("%Y-%m-%d %H:%M"),
    }


def main() -> None:
    rows = [make_row(i) for i in range(120)]
    out = "powerbi-sample-data.csv"
    with open(out, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    hired = sum(1 for r in rows if r["Status"] == "hired")
    print(f"Wrote {len(rows)} candidates to {out}")
    print(f"  Jobs: {len(JOBS)} | Hired: {hired} | Avg match: {sum(r['Best Match %'] for r in rows)/len(rows):.0f}%")
    print("Import this file into Power BI Desktop per docs/POWERBI_GUIDE.md")


if __name__ == "__main__":
    main()
