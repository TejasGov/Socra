# Model Training

QLoRA fine-tuning of **Gemma 4 Instruction-Tuned** (`google/gemma-4-E4B-it`)
for Socratic tutoring. See [../../docs/model-training.md](../../docs/model-training.md).

```text
configs/       # training + LoRA/QLoRA hyperparameters
data/          # datasets (GIT-IGNORED — never commit real student data)
notebooks/     # Colab notebooks
scripts/       # train / merge / export
evaluations/   # eval harness + reports
```

## Prerequisites

- Accept the Gemma terms on Hugging Face.
- `export HUGGINGFACE_TOKEN=hf_...` (backend/training only — never in the frontend).
- A GPU environment (Colab Pro+ or equivalent).

## Quickstart

```bash
pip install -r requirements.txt
python scripts/train_qlora.py --config configs/qlora.yaml
```

## Versioning

Name each adapter `socra-gemma-4-E4B-vN` and record it in `MODEL_VERSION`.
Do not commit weights/adapters — they are git-ignored and stored in the model
registry/bucket.
