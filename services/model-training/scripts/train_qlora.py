"""QLoRA fine-tuning entry point for Socra (Gemma 4).

Scaffold: parses a YAML config and outlines the training flow. Fill in the TRL
SFTTrainer wiring when running on a GPU environment. Requires a Hugging Face
token (HUGGINGFACE_TOKEN) with access to the Gemma weights.
"""

from __future__ import annotations

import argparse
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="QLoRA fine-tune Gemma for Socra")
    parser.add_argument(
        "--config",
        type=Path,
        default=Path("configs/qlora.yaml"),
        help="Path to the QLoRA YAML config.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.config.exists():
        raise SystemExit(f"Config not found: {args.config}")

    # TODO: implement on GPU.
    #   1. Load YAML config.
    #   2. Authenticate to Hugging Face (HUGGINGFACE_TOKEN).
    #   3. Load base model with bitsandbytes 4-bit quantization.
    #   4. Apply PEFT LoRA adapters.
    #   5. Train with trl.SFTTrainer on data/train.jsonl.
    #   6. Save adapter to outputs/<model_version> (git-ignored).
    print(f"[scaffold] Would train using config: {args.config}")


if __name__ == "__main__":
    main()
