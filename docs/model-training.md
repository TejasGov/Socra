# Model Training

Socra fine-tunes **Gemma 4 Instruction-Tuned** (`google/gemma-4-E4B-it`) with
parameter-efficient QLoRA to produce a Socratic tutoring model.

## Stack

| Concern | Tool |
| --- | --- |
| Fine-tuning | Hugging Face TRL |
| PEFT | LoRA / QLoRA (PEFT) |
| Quantization | bitsandbytes |
| Environment | Google Colab Pro+ (GPU) |
| Base model | `google/gemma-4-E4B-it` |
| Inference | vLLM (`services/model-server`) |

## Prerequisites

- Accept the Gemma model terms on Hugging Face.
- Configure a Hugging Face token **locally / training-only** — never in the frontend.

  ```bash
  export HUGGINGFACE_TOKEN=hf_xxx        # or use `huggingface-cli login`
  ```

- A GPU environment (Colab Pro+ or equivalent).

## Layout

```text
services/model-training/
├── configs/        # training + LoRA/QLoRA hyperparameters
├── data/           # datasets (GIT-IGNORED — never commit real student data)
├── notebooks/      # Colab notebooks
├── scripts/        # train / merge / export scripts
└── evaluations/    # eval harness + reports
```

## Model version naming

Every trained adapter/model gets an explicit, incrementing version:

```text
socra-gemma-4-E4B-v1
socra-gemma-4-E4B-v2
...
```

Record the version in `MODEL_VERSION` and in the eval report. Never overwrite a
released version.

## Training output storage

- Adapters/checkpoints are large and **git-ignored**.
- Store released adapters in the designated model bucket / registry (per
  environment), not in the repo.
- Keep a short model card per version: base model, dataset snapshot, hyperparams,
  eval metrics.

## Data rules

- `services/model-training/data/` is git-ignored.
- Never commit real student data. Use synthetic or de-identified data for
  development.

## Evaluation

- Run the eval harness in `evaluations/` before promoting a version.
- Compare against the previous version; record metrics in the research issue
  (see the "Research / data task" issue template).
