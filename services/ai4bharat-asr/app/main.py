import os
import time
import logging
import subprocess
from typing import Optional

import httpx
import numpy as np
import torch
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool
from transformers import AutoModel

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("syd-asr")

APP_NAME = "SYD AI4Bharat Speech Service"
MODEL_ID = os.getenv("AI4BHARAT_MODEL_ID", "ai4bharat/indic-conformer-600m-multilingual")
HF_TOKEN = os.getenv("HF_TOKEN")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_TRANSCRIPTION_MODEL = os.getenv("OPENAI_TRANSCRIPTION_MODEL", "gpt-transcribe")
ASR_API_KEY = os.getenv("ASR_API_KEY")
MAX_AUDIO_BYTES = int(os.getenv("MAX_AUDIO_BYTES", str(25 * 1024 * 1024)))
MAX_AUDIO_SECONDS = int(os.getenv("MAX_AUDIO_SECONDS", "90"))
TARGET_SAMPLE_RATE = 16000

LANGUAGES = {
    "as", "bn", "brx", "doi", "gu", "hi", "kn", "kok", "ks", "mai",
    "ml", "mni", "mr", "ne", "or", "pa", "sa", "sat", "sd", "ta", "te", "ur"
}

app = FastAPI(title=APP_NAME, version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "").split(",") if os.getenv("CORS_ORIGINS") else [],
    allow_credentials=False,
    allow_methods=["POST", "GET"],
    allow_headers=["Authorization", "Content-Type"],
)

_model = None
_model_load_error: Optional[str] = None


def load_model():
    global _model, _model_load_error
    if _model is not None:
        return _model
    try:
        logger.info("Loading AI4Bharat model: %s", MODEL_ID)
        kwargs = {"trust_remote_code": True}
        if HF_TOKEN:
            kwargs["token"] = HF_TOKEN
        _model = AutoModel.from_pretrained(MODEL_ID, **kwargs)
        _model.eval()
        _model_load_error = None
        logger.info("AI4Bharat model loaded")
        return _model
    except Exception as exc:
        _model_load_error = type(exc).__name__
        logger.exception("AI4Bharat model load failed")
        raise


def check_auth(authorization: Optional[str]):
    if not ASR_API_KEY:
        raise HTTPException(status_code=503, detail="ASR service credentials are not configured")
    if authorization != f"Bearer {ASR_API_KEY}":
        raise HTTPException(status_code=401, detail="Invalid service credentials")


def decode_audio(data: bytes) -> torch.Tensor:
    # Android WebView MediaRecorder commonly produces WebM/Opus. FFmpeg handles
    # WebM, Ogg, MP4/M4A, WAV and browser-specific container variants.
    command = [
        "ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error",
        "-i", "pipe:0", "-vn", "-ac", "1", "-ar", str(TARGET_SAMPLE_RATE),
        "-f", "f32le", "pipe:1",
    ]
    try:
        result = subprocess.run(
            command, input=data, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            timeout=30, check=False,
        )
    except FileNotFoundError:
        raise RuntimeError("FFmpeg is not installed on the ASR host")
    except subprocess.TimeoutExpired:
        raise RuntimeError("Audio decoding timed out")
    if result.returncode != 0 or not result.stdout:
        detail = result.stderr.decode("utf-8", errors="ignore")[-300:]
        raise RuntimeError("Audio format could not be decoded: " + detail)
    samples = np.frombuffer(result.stdout, dtype=np.float32).copy()
    if samples.size == 0:
        raise RuntimeError("Audio file contains no samples")
    duration = samples.size / TARGET_SAMPLE_RATE
    if duration > MAX_AUDIO_SECONDS:
        raise HTTPException(status_code=413, detail=f"Recording exceeds {MAX_AUDIO_SECONDS} seconds")
    samples = np.nan_to_num(samples, copy=False)
    return torch.from_numpy(samples).unsqueeze(0).contiguous()


def transcribe_ai4bharat(audio: torch.Tensor, language: str):
    model = load_model()
    with torch.inference_mode():
        result = model(audio, language, "ctc")
    if isinstance(result, (list, tuple)):
        result = result[0] if result else ""
    transcript = str(result).strip()
    if not transcript:
        raise RuntimeError("AI4Bharat returned an empty transcript")
    return transcript


async def transcribe_openai(audio_bytes: bytes, filename: str, content_type: str):
    if not OPENAI_API_KEY:
        raise RuntimeError("OpenAI fallback is not configured")
    headers = {"Authorization": f"Bearer {OPENAI_API_KEY}"}
    files = {"file": (filename or "recording.webm", audio_bytes, content_type or "application/octet-stream")}
    data = {"model": OPENAI_TRANSCRIPTION_MODEL}
    timeout = httpx.Timeout(120.0, connect=15.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers=headers, files=files, data=data,
        )
    if response.status_code >= 400:
        raise RuntimeError(f"OpenAI transcription failed ({response.status_code}): {response.text[:300]}")
    transcript = str(response.json().get("text", "")).strip()
    if not transcript:
        raise RuntimeError("OpenAI returned an empty transcript")
    return transcript


@app.get("/")
async def root():
    return {"service": APP_NAME, "version": "0.2.0", "primary": "AI4Bharat", "fallback": "OpenAI"}


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": _model is not None,
        "model_id": MODEL_ID,
        "model_load_failed": bool(_model_load_error),
        "openai_fallback_configured": bool(OPENAI_API_KEY),
    }


@app.post("/v1/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    language: str = Form("auto"),
    authorization: Optional[str] = Header(default=None),
):
    check_auth(authorization)
    language = language.lower().strip()
    audio_bytes = await file.read(MAX_AUDIO_BYTES + 1)
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Audio file is empty")
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio file exceeds the configured upload limit")

    started = time.perf_counter()
    # Auto-detection and English are intentionally sent to OpenAI. IndicConformer
    # is only selected when the user explicitly chooses a supported Indic language.
    use_openai_first = language in {"auto", "en", "en-in", "english"}
    if not use_openai_first and language not in LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Unsupported language code: {language}")

    primary_error = None
    if not use_openai_first:
        try:
            waveform = await run_in_threadpool(decode_audio, audio_bytes)
            transcript = await run_in_threadpool(transcribe_ai4bharat, waveform, language)
            return {
                "transcript": transcript, "provider": "ai4bharat",
                "fallback_used": False, "language": language,
                "duration_seconds": round(time.perf_counter() - started, 3),
            }
        except Exception as exc:
            primary_error = exc
            logger.exception("AI4Bharat failed; attempting OpenAI fallback")

    try:
        transcript = await transcribe_openai(audio_bytes, file.filename or "recording.webm", file.content_type or "")
        return {
            "transcript": transcript, "provider": "openai",
            "fallback_used": not use_openai_first,
            "language": language,
            "primary_error": (str(primary_error)[:200] if primary_error else None),
            "duration_seconds": round(time.perf_counter() - started, 3),
        }
    except Exception as fallback_error:
        logger.exception("OpenAI transcription failed")
        raise HTTPException(status_code=502, detail={
            "message": "Speech transcription failed",
            "primary_error": str(primary_error)[:200] if primary_error else "Automatic language detection or English uses OpenAI directly",
            "fallback_error": str(fallback_error)[:200],
        })
