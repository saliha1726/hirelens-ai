"""
Build a fully-formatted Excel dashboard from the Power BI sample data.

Creates HireLens-PowerBI-Dashboard.xlsx with:
  1. "Dashboard" sheet  — 4 pre-built charts (funnel, distribution, skill gaps, avg by job)
  2. "Data" sheet        — the raw 120-candidate dataset (importable to Power BI)
  3. "Pivot Data" sheet  — pre-aggregated tables behind each chart

The file doubles as:
  - Screenshot-ready dashboard for the college report
  - A clean data source for importing into Power BI Desktop
"""
import csv
import random
from collections import Counter, defaultdict

from openpyxl import Workbook
from openpyxl.chart import BarChart, Reference
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

ROSE = "F43F5E"
PINK = "EC4899"
LIGHT = "FFF1F2"
DARK = "881337"
SLATE = "334155"

def load_rows(path="powerbi-sample-data.csv"):
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def style_header(ws, row, cols, fill=ROSE):
    for c in cols:
        cell = ws.cell(row=row, column=c)
        cell.font = Font(bold=True, color="FFFFFF", size=11)
        cell.fill = PatternFill("solid", fgColor=fill)
        cell.alignment = Alignment(horizontal="center", vertical="center")


def style_body(ws, start_row, end_row, cols, zebra=True):
    thin = Side(style="thin", color="E2E8F0")
    for r in range(start_row, end_row + 1):
        for c in cols:
            cell = ws.cell(row=r, column=c)
            cell.border = Border(bottom=thin)
            cell.alignment = Alignment(vertical="center")
            if zebra and (r - start_row) % 2 == 1:
                cell.fill = PatternFill("solid", fgColor="F8FAFC")


def build_dashboard(wb, rows):
    ws = wb.active
    ws.title = "Dashboard"

    # Title banner
    ws.merge_cells("B2:N2")
    t = ws["B2"]
    t.value = "HireLens AI — Recruitment Analytics Dashboard"
    t.font = Font(bold=True, size=20, color="FFFFFF")
    t.fill = PatternFill("solid", fgColor=ROSE)
    t.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[2].height = 34

    ws.merge_cells("B3:N3")
    s = ws["B3"]
    s.value = "Generated from 120 candidate screenings · 5 jobs · funnel, distribution, skill-gap and per-job performance"
    s.font = Font(size=10, color=SLATE, italic=True)
    s.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[3].height = 16

    # KPI strip
    total = len(rows)
    hired = sum(1 for r in rows if r["Status"] == "hired")
    in_pipeline = sum(1 for r in rows if r["Status"] in ("screening", "shortlisted", "interview"))
    avg_score = round(sum(int(r["Best Match %"]) for r in rows) / total)
    kpis = [
        ("Total Candidates", total, "B5:E5"),
        ("In Pipeline", in_pipeline, "F5:I5"),
        ("Hired", hired, "J5:M5"),
        ("Avg Match Score", f"{avg_score}%", "N5:Q5"),
    ]
    for label, value, rng in kpis:
        ws[rng.split(":")[0]] = label
        first = rng.split(":")[0]
        cell = ws[first]
        cell.font = Font(size=10, color=SLATE)
        col = first[0] if len(first) == 2 else first[:1]
        row_n = int(first[1:]) if len(first) == 2 else int(first[2:])
        val_cell = ws.cell(row=row_n + 1, column=ws[first].column)
        val_cell.value = value
        val_cell.font = Font(bold=True, size=16, color=DARK)
        for c in range(cell.column, cell.column + 4):
            for rr in (row_n, row_n + 1):
                ws.cell(row=rr, column=c).fill = PatternFill("solid", fgColor=LIGHT)
    ws.row_dimensions[6].height = 24

    # Charts placed on grid — each references Pivot Data sheet
    def place(chart, anchor, title, width=13, height=8):
        chart.title = title
        chart.width = width
        chart.height = height
        chart.style = 10
        ws.add_chart(chart, anchor)

    # 1. Funnel (horizontal bars)
    ch1 = BarChart()
    ch1.type = "bar"
    ch1.add_data(Reference(wb["Pivot Data"], min_col=2, min_row=2, max_row=8), titles_from_data=True)
    ch1.set_categories(Reference(wb["Pivot Data"], min_col=1, min_row=3, max_row=8))
    ch1.series[0].graphicalProperties.solidFill = ROSE
    place(ch1, "B9", "Pipeline Funnel — Candidates by Stage")

    # 2. Score distribution (vertical columns)
    ch2 = BarChart()
    ch2.type = "col"
    ch2.add_data(Reference(wb["Pivot Data"], min_col=4, min_row=2, max_row=12), titles_from_data=True)
    ch2.set_categories(Reference(wb["Pivot Data"], min_col=3, min_row=3, max_row=12))
    ch2.series[0].graphicalProperties.solidFill = PINK
    place(ch2, "I9", "Match Score Distribution (10-point buckets)")

    # 3. Skill gaps
    ch3 = BarChart()
    ch3.type = "bar"
    ch3.add_data(Reference(wb["Pivot Data"], min_col=6, min_row=2, max_row=13), titles_from_data=True)
    ch3.set_categories(Reference(wb["Pivot Data"], min_col=5, min_row=3, max_row=13))
    ch3.series[0].graphicalProperties.solidFill = "0EA5E9"
    place(ch3, "B26", "Skill Gaps — Most Commonly Missing Skills")

    # 4. Avg score by job
    ch4 = BarChart()
    ch4.type = "bar"
    ch4.add_data(Reference(wb["Pivot Data"], min_col=8, min_row=2, max_row=7), titles_from_data=True)
    ch4.set_categories(Reference(wb["Pivot Data"], min_col=7, min_row=3, max_row=7))
    ch4.series[0].graphicalProperties.solidFill = "10B981"
    place(ch4, "I26", "Average Match Score by Job")

    # Footer note
    ws.merge_cells("B43:N43")
    f = ws["B43"]
    f.value = "Tip: import the 'Data' sheet into Power BI Desktop (Get Data → Excel) to rebuild these visuals interactively."
    f.font = Font(size=9, italic=True, color="94A3B8")

    for col, w in {"A": 2, "B": 12}.items():
        ws.column_dimensions[col].width = w


def build_pivot(wb, rows):
    ws = wb.create_sheet("Pivot Data")

    # A/B — funnel counts
    ws["A1"], ws["B1"] = "Status", "Candidates"
    order = ["new", "screening", "shortlisted", "interview", "hired", "rejected"]
    counts = Counter(r["Status"] for r in rows)
    for i, st in enumerate(order, start=2):
        ws.cell(row=i, column=1, value=st.capitalize())
        ws.cell(row=i, column=2, value=counts.get(st, 0))

    # C/D — score buckets
    ws["C1"], ws["D1"] = "Score Bucket", "Candidates"
    buckets = Counter((int(r["Best Match %"]) // 10) * 10 for r in rows)
    for i, b in enumerate(range(0, 100, 10), start=2):
        ws.cell(row=i, column=3, value=f"{b}-{b+9}")
        ws.cell(row=i, column=4, value=buckets.get(b, 0))

    # E/F — skill gaps
    ws["E1"], ws["F1"] = "Missing Skill", "Candidates Missing It"
    skill_counts = Counter()
    for r in rows:
        for sk in filter(None, r["Missing Skills"].split(";")):
            skill_counts[sk.strip()] += 1
    for i, (sk, n) in enumerate(skill_counts.most_common(10), start=2):
        ws.cell(row=i, column=5, value=sk)
        ws.cell(row=i, column=6, value=n)

    # G/H — avg score per job
    ws["G1"], ws["H1"] = "Job Title", "Avg Match %"
    per_job = defaultdict(list)
    for r in rows:
        per_job[r["Job Title"]].append(int(r["Best Match %"]))
    for i, (job, scores) in enumerate(per_job.items(), start=2):
        ws.cell(row=i, column=7, value=job)
        ws.cell(row=i, column=8, value=round(sum(scores) / len(scores), 1))

    style_header(ws, 1, range(1, 9))
    max_rows = ws.max_row
    style_body(ws, 2, max_rows, range(1, 9))
    for c in "ACEG":
        ws.column_dimensions[c].width = 26
    for c in "BDFH":
        ws.column_dimensions[c].width = 16


def build_data(wb, rows):
    ws = wb.create_sheet("Data")
    headers = list(rows[0].keys())
    for c, h in enumerate(headers, start=1):
        ws.cell(row=1, column=c, value=h)
    style_header(ws, 1, range(1, len(headers) + 1))
    for r, row in enumerate(rows, start=2):
        for c, h in enumerate(headers, start=1):
            v = row[h]
            if h in ("Best Match %", "Matched Skills Count", "Required Skills Count", "Notes Count", "Interviews Count"):
                ws.cell(row=r, column=c, value=int(v))
            elif h == "Years Experience":
                ws.cell(row=r, column=c, value=float(v))
            else:
                ws.cell(row=r, column=c, value=v)
    style_body(ws, 2, len(rows) + 1, range(1, len(headers) + 1))
    for c, h in enumerate(headers, start=1):
        ws.column_dimensions[get_column_letter(c)].width = max(len(h) + 2, 14)
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = f"A1:{get_column_letter(len(headers))}{len(rows)+1}"


def main():
    rows = load_rows()
    wb = Workbook()
    build_pivot(wb, rows)      # pivot first — charts reference it
    build_dashboard(wb, rows)   # dashboard uses pivot refs
    build_data(wb, rows)       # raw data last
    out = "HireLens-PowerBI-Dashboard.xlsx"
    wb.save(out)
    print(f"Created {out}: 3 sheets (Dashboard with 4 charts, Pivot Data, Data with {len(rows)} rows)")


if __name__ == "__main__":
    main()
