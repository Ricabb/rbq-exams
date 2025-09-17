# split_banks_to_exams.py
# Reads banks/* and writes exam files into questions_* folders.
import os, json, random, math

# --- settings ---
EXAMS_PER_MODULE = 2          # with 100-question banks, 2×50 is perfect
QUESTIONS_PER_EXAM = 50
ALLOW_OVERLAP = False         # keep False for clean, non-overlapping splits

BANKS_DIR = "banks"
OUT = {
    "en": {
        "admin":     "questions_admin",
        "safety":    "questions_safety",
        "project":   "questions_project",
        "execution": "questions_execution",
    },
    "fr": {
        "admin":     "questions_admin_fr",
        "safety":    "questions_safety_fr",
        "project":   "questions_project_fr",
        "execution": "questions_execution_fr",
    },
}

def load_bank(path):
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list) or not data:
        raise ValueError(f"Empty or invalid bank: {path}")
    return data

def write_exam(out_dir, idx, items):
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, f"exam{idx}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print("  wrote", path, f"({len(items)} questions)")

def split_bank(bank, exams, per_exam, allow_overlap):
    bank = bank[:]  # copy
    random.shuffle(bank)
    need = exams * per_exam
    if not allow_overlap and need > len(bank):
        raise ValueError(f"Need {need} unique questions but bank has {len(bank)}. Set ALLOW_OVERLAP=True or reduce EXAMS_PER_MODULE/QUESTIONS_PER_EXAM.")
    out = []
    if allow_overlap:
        # sample with replacement
        for i in range(exams):
            out.append([random.choice(bank) for _ in range(per_exam)])
    else:
        # non-overlapping slices
        for i in range(exams):
            chunk = bank[i*per_exam:(i+1)*per_exam]
            out.append(chunk)
    return out

def process(lang, module):
    bank_path = os.path.join(BANKS_DIR, f"{lang}_{module}.json")
    bank = load_bank(bank_path)
    exams = split_bank(bank, EXAMS_PER_MODULE, QUESTIONS_PER_EXAM, ALLOW_OVERLAP)
    out_dir = OUT[lang][module]
    for i, chunk in enumerate(exams, start=1):
        write_exam(out_dir, i, chunk)

def main():
    random.seed(12345)
    for lang in OUT:
        for module in OUT[lang]:
            print(f"\n[{lang.upper()} · {module}]")
            process(lang, module)
    print("\nDone.")
    print("Commit & push the new exam files. Open:")
    print("  exam.html?module=admin&exam=1&lang=en&mode=exam")

if __name__ == "__main__":
    main()
