import re

pdf_path = r'c:\Users\karth\Downloads\CloudComputing\report\CloudCampus_AWS_Cloud_Computing_Report.pdf'

with open(pdf_path, 'rb') as f:
    data = f.read()

# Accurate page count from PDF trailer / Catalog
page_matches = re.findall(rb'/Type\s*/Page(?![sS])', data)
print(f"Exact Page Objects: {len(page_matches)}")
