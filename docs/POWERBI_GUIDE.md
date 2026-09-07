# HireLens AI — Power BI Dashboard Guide

This guide shows how to build the **required Power BI report** from HireLens AI data. The app has a built-in CSV export that feeds Power BI directly.

---

## Step 1 — Get data

**Option A — Use the ready-made sample dataset (fastest):**

A realistic 120-candidate dataset ships with the repo: **`powerbi-sample-data.csv`** (same columns as the app's export). Use it to build and screenshot your report in minutes.

**Option B — Export real data from the app:**

1. Open the app → **Candidates** page → click **Export CSV**
   (or open a specific job → **Export CSV** for that job's candidates)
2. Save the file, e.g. `hirelens-candidates.csv`

Both files contain per candidate: `Name, Email, Phone, Status, Best Match %, Job Title, Matched Skills Count, Required Skills Count, Missing Skills, Years Experience, Seniority, Tags, Notes Count, Interviews Count, Source, Created At`.

(You can regenerate the sample with different data: `python scripts/generate_sample_csv.py`)

## Step 2 — Import into Power BI Desktop

1. Open **Power BI Desktop** (free: https://powerbi.microsoft.com/desktop)
2. **Home → Get Data → Text/CSV** → select the exported CSV
3. Click **Load**

## Step 3 — Build the four required visuals

### Visual 1 — Pipeline Funnel (bar chart)
- **Axis:** `Status` (New, Screening, Shortlisted, Interview, Hired, Rejected)
- **Values:** Count of Name
- *Shows candidate flow through hiring stages — the conversion funnel.*

### Visual 2 — Match Score Distribution (column chart)
- **Axis:** `Best Match %`
- **Values:** Count of Name
- *Or use a histogram with 10-point buckets: 0–9, 10–19, … 90–100.*

### Visual 3 — Skill Gap Analysis (bar chart)
- **Axis:** `Missing Skills` (Power BI auto-splits the semicolon list)
- **Values:** Count of Name
- *Which required skills are most often missing across candidates.*

### Visual 4 — Average Score by Job (clustered bar)
- **Axis:** `Job Title`
- **Values:** Average of `Best Match %`

## Step 4 — Add slicers (filters)

Add slicers for: `Status`, `Job Title`, `Seniority`, `Tags` — lets professors interactively filter the report during your demo.

## Step 5 — (Optional) Live dataset

For a live connection instead of CSV:
1. In Power BI: **Get Data → Web** 
2. URL: `https://hirelens-ai-black.vercel.app/api/public-jobs?wsId=YOUR_WORKSPACE_ID`
3. Power BI will parse the JSON jobs feed.

CSV export is recommended for the submission since it works offline.

---

## What this demonstrates to evaluators

- Connecting Power BI to a real application's data export
- Building funnel, distribution, gap-analysis, and comparative visuals
- Interactive filtering with slicers
- The same analytics concepts already implemented in the app's Analytics page
  (funnel conversion, score buckets, skill gaps, per-job performance)
