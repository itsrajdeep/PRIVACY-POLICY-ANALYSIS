import csv
import sys
import re
import textstat

csv.field_size_limit(sys.maxsize)

input_file = "d:/Project Y/dataset/privacy_policies.csv"
output_file = "d:/Project Y/dataset/policy_features.csv"

legal_terms = [
    "affiliate",
    "third party",
    "arbitration",
    "indemnify",
    "consent",
    "retention",
    "processor",
    "controller",
    "jurisdiction",
    "liability"
]

with open(input_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

# Build fieldnames: base features + single legal term count
fieldnames = [
    'company', 'word_count', 'sentence_count', 'avg_sentence_length',
    'char_count', 'unique_words', 'flesch_reading_ease', 'flesch_kincaid_grade',
    'legal_term_count'
]

with open(output_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()

    for row in rows:
        text = row['policy_text']
        text_lower = text.lower()
        unique_words = len(set(text_lower.split()))
        flesch = textstat.flesch_reading_ease(text)
        grade = textstat.flesch_kincaid_grade(text)

        # Count legal jargon (combined)
        legal_term_count = 0
        for term in legal_terms:
            legal_term_count += len(re.findall(r'\b' + re.escape(term) + r'\b', text_lower))

        writer.writerow({
            'company': row['company'],
            'word_count': row['word_count'],
            'sentence_count': row['sentence_count'],
            'avg_sentence_length': row['avg_sentence_length'],
            'char_count': row['char_count'],
            'unique_words': unique_words,
            'flesch_reading_ease': flesch,
            'flesch_kincaid_grade': grade,
            'legal_term_count': legal_term_count
        })

print("Generated policy_features.csv with readability scores and legal jargon counts.")
