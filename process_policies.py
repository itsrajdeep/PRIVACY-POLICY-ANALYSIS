import csv
import trafilatura
import time
import re
import os

input_file = "d:/Project Y/companies_privacy_policies.csv"
output_file = "d:/Project Y/dataset/privacy_policies.csv"
raw_text_dir = "d:/Project Y/dataset/raw_text"

os.makedirs(raw_text_dir, exist_ok=True)

print("Starting to process privacy policies...")

with open(input_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

# Remove null rows (missing URL)
valid_rows = [r for r in rows if r['url'].strip()]
print(f"Total rows: {len(rows)}, Valid rows: {len(valid_rows)}")

results = []
failed = []

for r in valid_rows:
    company = r['company name']
    url = r['url']
    industry = r['company category']
    
    print(f"Processing {company}...")
    try:
        downloaded = trafilatura.fetch_url(url)
        if downloaded:
            text = trafilatura.extract(downloaded)
            if text and len(text.split()) > 500:
                word_count = len(text.split())
                sentence_count = len(re.split(r'[.!?]+', text))
                char_count = len(text)
                
                avg_sentence_length = word_count / max(sentence_count, 1)
                
                results.append({
                    "company": company,
                    "industry": industry,
                    "policy_url": url,
                    "policy_text": text,
                    "word_count": word_count,
                    "sentence_count": sentence_count,
                    "char_count": char_count,
                    "avg_sentence_length": avg_sentence_length
                })
                
                # Save raw text
                # Safely replacing potential invalid characters for filenames
                safe_company_name = "".join(c for c in company if c not in r'\/:*?"<>|')
                with open(f"{raw_text_dir}/{safe_company_name}.txt", "w", encoding="utf-8") as out:
                    out.write(text)
            else:
                print(f"  -> No text extracted for {company} or text too short")
                failed.append(company)
        else:
            print(f"  -> Failed to download for {company}")
            failed.append(company)
    except Exception as e:
        print(f"  -> Error processing {company}: {e}")
        failed.append(company)
    
    # Sleep briefly to be polite
    time.sleep(0.5)

print(f"Successfully processed {len(results)} policies. Saving...")

with open(output_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=[
        "company", "industry", "policy_url", "policy_text", 
        "word_count", "sentence_count", "char_count", "avg_sentence_length"
    ])
    writer.writeheader()
    for res in results:
        writer.writerow(res)

print("Done!")
print(f"Failed companies: {failed}")


