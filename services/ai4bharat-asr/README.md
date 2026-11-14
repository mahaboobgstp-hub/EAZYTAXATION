# SYD AI4Bharat Speech Recognition API

Standalone FastAPI speech-to-text service for SYD Billing & Accounting.

## Request flow

1. The Android app records a short audio clip with the WebView MediaRecorder API.
2. The signed-in user uploads it to the Supabase Edge Function `transcribe-voice-audio`.
3. Supabase validates the user session and forwards the audio using a server-side `ASR_API_KEY`.
4. FastAPI decodes browser audio with FFmpeg and validates the 25 MB / 90-second limits.
5. For a selected supported Indic language, AI4Bharat IndicConformer is attempted first. If it fails, OpenAI `gpt-transcribe` is attempted once.
6. English and Automatic language selection go directly to OpenAI because the selected IndicConformer model does not claim English support and does not perform language identification.
7. The transcript returns to the app for user editing. The existing `process-voice-command` function then interprets text and prepares a draft. It does not post accounting entries.

## Repository and secrets

Model weights download at runtime and are cached in `HF_HOME`; they are not committed to Git.

Keep these values in the container host's secret manager:
- `ASR_API_KEY`: long random shared secret used only between Supabase and FastAPI.
- `OPENAI_API_KEY`: OpenAI transcription fallback.
- `HF_TOKEN`: optional Hugging Face read token if repository access requires it.

Set these Supabase Edge Function secrets:
- `ASR_SERVICE_URL`: public HTTPS base URL of the deployed FastAPI service, without a trailing slash.
- `ASR_API_KEY`: exactly the same secret as the FastAPI container.

Never put any of these secrets in React, Android assets, GitHub source, or a public Vercel environment variable.

## Indic language codes

The selected model supports: `as bn brx doi gu hi kn kok ks mai ml mni mr ne or pa sa sat sd ta te ur`.

The initial app exposes Telugu and Hindi as AI4Bharat-first options. English and Automatic route directly to OpenAI. The language selector is explicit; automatic language detection is not available in the selected AI4Bharat model.

## Run locally

Python 3.11 is recommended. FFmpeg is required.

```bash
cd services/ai4bharat-asr
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Add ASR_API_KEY and OPENAI_API_KEY to .env
set -a && source .env && set +a
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Health check: `GET /health`

Transcription:

```bash
curl -X POST http://localhost:8000/v1/transcribe \
  -H "Authorization: Bearer $ASR_API_KEY" \
  -F "language=te" \
  -F "file=@sample.webm"
```

## Docker

```bash
docker build -t syd-ai4bharat-asr .
docker run --env-file .env -p 8000:8000 -v syd-hf-cache:/opt/huggingface syd-ai4bharat-asr
```

## Hosting requirements

Do not run the 600M model in a Supabase Edge Function. Deploy the container to a persistent Python/container host with sufficient RAM, disk, CPU and request duration. The model is downloaded on first startup; persist `/opt/huggingface` to avoid repeated downloads. Free CPU hosting may sleep or run out of memory. We have not yet measured this model on a free host, so no free-tier provider is declared production-ready.

## Verification still required

- Actual AI4Bharat model download and access.
- Telugu and Hindi inference accuracy / latency on CPU.
- OpenAI fallback with a real recording.
- Android microphone permission and MediaRecorder test on the target Redmi device.
- Supabase Edge Function deployment with the two secrets.
- End-to-end test from Android through Supabase and FastAPI.

The CI workflow checks Python syntax, service files and the frontend production build. Passing CI does not replace real audio/model testing.
