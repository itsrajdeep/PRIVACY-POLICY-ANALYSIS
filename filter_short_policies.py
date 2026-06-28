import csv
import os

def filter_short_policies(features_csv_path, raw_text_dir, output_file_path, max_words=1000):
    short_companies = []
    
    # Read the features CSV to find companies with less than max_words
    with open(features_csv_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                word_count = int(row['word_count'])
                if word_count < max_words:
                    short_companies.append((row['company'], word_count))
            except ValueError:
                continue

    print(f"Found {len(short_companies)} policies with less than {max_words} words.")
    
    # Write the policies to the output text file
    with open(output_file_path, mode='w', encoding='utf-8') as out_f:
        for company, count in short_companies:
            out_f.write(f"{'='*80}\n")
            out_f.write(f"COMPANY: {company}\n")
            out_f.write(f"WORD COUNT: {count}\n")
            out_f.write(f"{'='*80}\n\n")
            
            policy_file_path = os.path.join(raw_text_dir, f"{company}.txt")
            if os.path.exists(policy_file_path):
                with open(policy_file_path, mode='r', encoding='utf-8') as p_f:
                    out_f.write(p_f.read())
            else:
                out_f.write(f"Policy file not found: {policy_file_path}")
            
            out_f.write("\n\n\n")
            
    print(f"Policies written to {output_file_path}")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    features_csv = os.path.join(base_dir, "dataset", "policy_features.csv")
    raw_text_directory = os.path.join(base_dir, "dataset", "raw_text")
    output_txt = os.path.join(base_dir, "short_policies.txt")
    
    filter_short_policies(features_csv, raw_text_directory, output_txt)
