#!/usr/bin/env bash
# Start the vLLM OpenAI-compatible server for Socra.
# Requires an NVIDIA GPU. Only the backend should reach this port.
set -euo pipefail

: "${MODEL_NAME:=google/gemma-4-E4B-it}"
: "${PORT:=8001}"
: "${MAX_MODEL_LEN:=4096}"
: "${GPU_MEMORY_UTILIZATION:=0.90}"

if [[ -z "${MODEL_SERVER_API_KEY:-}" ]]; then
  echo "❌ MODEL_SERVER_API_KEY is required (the backend authenticates with it)."
  exit 1
fi

exec python -m vllm.entrypoints.openai.api_server \
  --model "$MODEL_NAME" \
  --port "$PORT" \
  --max-model-len "$MAX_MODEL_LEN" \
  --gpu-memory-utilization "$GPU_MEMORY_UTILIZATION" \
  --api-key "$MODEL_SERVER_API_KEY"
