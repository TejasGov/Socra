# Model Server (vLLM)

Serves the fine-tuned Gemma 4 model over an OpenAI-compatible API using
**vLLM**. Runs on a GPU host.

> **Security:** Only the Socra backend may call this service. It must be
> authenticated (`MODEL_SERVER_API_KEY`) and network-restricted — never exposed
> to the public internet or the browser.

## Run (GPU host)

```bash
# Requires an NVIDIA GPU + drivers. Set the API key the backend will use.
export MODEL_SERVER_API_KEY=change-me
export HUGGINGFACE_TOKEN=hf_...        # to pull Gemma weights
bash scripts/serve.sh
```

Exposes `http://localhost:8001` with:

- `GET  /health`
- `POST /v1/chat/completions` (OpenAI-compatible)

## Config

- `config/server.env.example` — copy to `config/server.env` (git-ignored) and fill in.
- Base/served model set via `MODEL_NAME`; the fine-tuned adapter is merged or
  loaded per `MODEL_VERSION`.

## Docker

```bash
docker build -t socra-model-server .
docker run --gpus all -p 8001:8001 --env-file config/server.env socra-model-server
```
