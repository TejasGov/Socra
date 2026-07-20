# vLLM model server for Socra. Requires an NVIDIA GPU at runtime
# (docker run --gpus all). The official vLLM image bundles CUDA + vLLM.
FROM vllm/vllm-openai:latest

WORKDIR /app
COPY scripts/ ./scripts/

EXPOSE 8001
ENTRYPOINT ["bash", "scripts/serve.sh"]
