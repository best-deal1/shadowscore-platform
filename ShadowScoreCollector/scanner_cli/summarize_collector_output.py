import csv
import json
import sys
from pathlib import Path

def load_json(path):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    if isinstance(data, dict) and "rows" in data:
        return data["rows"]
    if isinstance(data, list):
        return data
    return []

def summarize(rows):
    by_severity = {}
    by_category = {}
    by_marketplace = {}

    for row in rows:
        severity = row.get("severity", "Unknown")
        marketplace = row.get("marketplace", "Unknown")
        by_severity[severity] = by_severity.get(severity, 0) + 1
        by_marketplace[marketplace] = by_marketplace.get(marketplace, 0) + 1

        cats = row.get("categories", [])
        if isinstance(cats, str):
            cats = cats.split(" | ")
        for cat in cats:
            by_category[cat] = by_category.get(cat, 0) + 1

    return by_severity, by_category, by_marketplace

def main():
    if len(sys.argv) < 2:
        print("Usage: python summarize_collector_output.py collector-output.json")
        raise SystemExit(1)

    rows = load_json(sys.argv[1])
    by_severity, by_category, by_marketplace = summarize(rows)

    print(f"Total matched posts/comments: {len(rows)}")

    print("\nBy severity:")
    for key, value in sorted(by_severity.items(), key=lambda item: item[1], reverse=True):
        print(f"- {key}: {value}")

    print("\nBy category:")
    for key, value in sorted(by_category.items(), key=lambda item: item[1], reverse=True):
        print(f"- {key}: {value}")

    print("\nBy marketplace:")
    for key, value in sorted(by_marketplace.items(), key=lambda item: item[1], reverse=True):
        print(f"- {key}: {value}")

    out = Path("collector_summary.csv")
    with out.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["severity", "score", "marketplace", "categories", "matched_terms", "excerpt", "url"])
        writer.writeheader()
        for row in rows:
            writer.writerow({
                "severity": row.get("severity"),
                "score": row.get("score"),
                "marketplace": row.get("marketplace"),
                "categories": " | ".join(row.get("categories", [])) if isinstance(row.get("categories"), list) else row.get("categories"),
                "matched_terms": ", ".join(row.get("matched_terms", [])) if isinstance(row.get("matched_terms"), list) else row.get("matched_terms"),
                "excerpt": row.get("excerpt"),
                "url": row.get("url"),
            })

    print(f"\nSaved: {out}")

if __name__ == "__main__":
    main()
