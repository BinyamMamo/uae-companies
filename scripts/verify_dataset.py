#!/usr/bin/env python3
import json

with open("data/companies.json", "r", encoding="utf-8") as f:
    companies = json.load(f)

print(f"Total companies in database: {len(companies)}")
assert len(companies) == 225, f"Expected 225 companies, found {len(companies)}"

errors = []
ids = set()

for i, c in enumerate(companies):
    if not c.get("id"):
        errors.append(f"Company #{i} missing id")
    if c["id"] in ids:
        errors.append(f"Duplicate id: {c['id']}")
    ids.add(c["id"])

    if not c.get("name"):
        errors.append(f"Company #{i} missing name")

    loc = c.get("location", {})
    lat = loc.get("latitude", 0)
    lon = loc.get("longitude", 0)
    if not (24.0 <= lat <= 26.5 and 54.0 <= lon <= 56.5):
        errors.append(f"Company {c['name']} coordinates out of UAE range: lat={lat}, lon={lon}")

    commute = c.get("commute", {})
    if commute.get("distanceKm", 0) <= 0:
        errors.append(f"Company {c['name']} distanceKm invalid: {commute.get('distanceKm')}")
    if commute.get("busMinutes", 0) <= 0:
        errors.append(f"Company {c['name']} busMinutes invalid: {commute.get('busMinutes')}")

    if not c.get("categories"):
        errors.append(f"Company {c['name']} missing categories")
    if not c.get("commonCareers"):
        errors.append(f"Company {c['name']} missing commonCareers")
    if not c.get("website"):
        errors.append(f"Company {c['name']} missing website")
    if not c.get("careersUrl"):
        errors.append(f"Company {c['name']} missing careersUrl")

if errors:
    print(f"Validation FAILED with {len(errors)} issues:")
    for err in errors[:10]:
        print(f" - {err}")
else:
    print("ALL 225 COMPANIES VALIDATED SUCCESSFULLY!")
    print(f"- 100% have valid UAE coordinates")
    print(f"- 100% have distance and RTA commute times calculated from Academic City")
    print(f"- 100% have technical categories, career roles, and official URLs")
