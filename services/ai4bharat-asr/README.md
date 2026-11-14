# SYD AI4Bharat Speech Recognition API

A standalone FastAPI service for SYD Billing & Accounting. AI4Bharat IndicConformer is the primary ASR provider. OpenAI transcription is called only when primary transcription fails or returns no usable text.

## Important architecture

- This service is separate from the React/Capacitor Android app.
- Model weights are downloaded at runtime and cached in `HF_HOME`; they are not committed to Git.
- Keep `ASR_API_KEY`, `HF_TOKEN`, and `OPENAI_API_KEY` in the hosting provider's secret manager.
- The API requires a bearer `ASR_API_KEY`.
- Current endpoint accepts one of the model's supported language codes. Automatic language detection is not implemented in this first version.
- Audio is normalized to mono 16 kHz before AI4Bharat inference.
- This initial implementation uses CPU-compatible PyTorch dependencies. First model startup can take several minutes and requires substantial RAM/disk.

## Supported language codes

`as bn brx doi gu hi kn kok ks mai ml mni mr ne or pa sa sat sd ta te ur`

## Run locally

Python 3.11 is recommended.

```bash
cd services/ai4bharat-asr
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Set ASR_API_KEY and optionally HF_TOKEN / OPENAI_API_KEY in .env
set -a && source .env && set +a
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://localhost:8000/health
```

Transcription:

```bash
curl -X POST http://localhost:8000/v1/transcribe \
  -H "Authorization: Bearer $ASR_API_KEY" \
  -F "language=te" \
  -F "file=@sample.wav"
```

## Docker

```bash
docker build -t syd-ai4bharat-asr .
docker run --env-file .env -p 8000:8000 -v syd-hf-cache:/opt/huggingface syd-ai4bharat-asr
```

## Response

```json
{
  "transcript": "…",
  "provider": "ai4bharat",
  "fallback_used": false,
  "language": "te",
  "duration_seconds": 2.31
}
```

If AI4Bharat fails, the same audio is sent to OpenAI and the response reports `provider: openai` and `fallback_used: true`.

## Deployment notes

Do not deploy this model on Supabase Edge Functions. The model requires more memory and CPU time than an Edge Function provides. Deploy this container to a persistent Python/container host with enough RAM and disk. Free-tier hosts may sleep, have limited RAM, or use ephemeral storage; confirm those limits before selecting a production host.

## Current limitations

- No streaming transcription in this first version.
- No automatic language identification; client must send a supported language code.
- A successful HTTP response from the API is not proof of model accuracy; test recordings in English, Hindi and Telugu are required.
- The fallback model name can be overridden with `OPENAI_TRANSCRIPTION_MODEL`.
