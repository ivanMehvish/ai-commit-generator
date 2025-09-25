# generate_commit.py
import os
import sys
from transformers import AutoTokenizer, AutoModelForCausalLM

# --- Configuration ---
checkpoint = "bigcode/starcoder"
device = "cuda" if os.environ.get("USE_CUDA") == "1" else "cpu"

# --- Hugging Face Authentication ---
# Reads token from environment variable
hf_token = os.getenv("HUGGINGFACE_HUB_TOKEN")
if not hf_token:
    raise ValueError("Please set HUGGINGFACE_HUB_TOKEN environment variable with your read token.")

# --- Load Tokenizer & Model ---
tokenizer = AutoTokenizer.from_pretrained(checkpoint, use_auth_token=hf_token)
model = AutoModelForCausalLM.from_pretrained(checkpoint, use_auth_token=hf_token).to(device)

# --- Read staged diff ---
diff = ""
if len(sys.argv) > 1:
    diff_file = sys.argv[1]
    with open(diff_file, "r", encoding="utf-8") as f:
        diff = f.read()
else:
    diff = sys.stdin.read()

if not diff.strip():
    print("No input diff provided.")
    sys.exit(0)

# --- Prepare prompt for commit message ---
prompt = f"Generate a concise git commit message for the following diff:\n{diff}"

inputs = tokenizer.encode(prompt, return_tensors="pt").to(device)

# --- Generate commit message ---
outputs = model.generate(inputs, max_length=50, do_sample=True)
commit_message = tokenizer.decode(outputs[0])

# --- Print commit suggestions ---
print(commit_message.strip())
