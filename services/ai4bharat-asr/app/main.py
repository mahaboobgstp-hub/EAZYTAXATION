import io
import os
import time
import logging
from typing import Optional

import httpx
import numpy as np
import soundfile as sf
import torch
import torchaudio
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from transformers import AutoModel

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("syd-asr")

APP_NAME = "SYD AI4Bharat Speech Service"
MODEL_ID = os.getenv("AI4BHARAT_MODEL_ID", "ai4bharat/indic-conformer-600m-multilingual")
HF_TOKEN = os.getenv("HF_TOKEN")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_TRANSCRIPTION_MODEL = os.getenv("OPENAI_TRANSCRIPTION_MODEL", "gpt-4o-mini-transcribe")
ASR_API_KEY = os.getenv("ASR_API_KEY")
MAX_AUDIO_BYTES = int(os.getenv("MAX_AUDIO_BYTES", str(25 * 1024 * 1024)))
TARGET_SAMPLE_RATE = 16000

LANGUAGES = {
    "as", "bn", "brx", "doi", "gu", "hi", "kn", "kok", "ks", "mai",
    "ml", "mni", "mr", "ne", "or", "pa", "sa", "sat", "sd", "ta", "te", "ur"
}

app = FastAPI(title=APP_NAME, version="0.1.0")
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
        _model_load_error = str(exc)
        logger.exception("AI4Bharat model load failed")
        raise


def check_auth(authorization: Optional[str]):
    if not ASR_API_KEY:
        raise HTTPException(status_code=503, detail="ASR_API_KEY is not configured on the server")
    if authorization != f"Bearer {ASR_API_KEY}":
        raise HTTPException(status_code=401, detail="Invalid service credentials")


def decode_audio(data: bytes):
    try:
        audio, sample_rate = sf.read(io.BytesIO(data), dtype="float32", always_2d=True)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Unsupported or invalid audio file: {exc}")
    if audio.size == 0:
        raise HTTPException(status_code=400, detail="Audio file is empty")
    mono = np.mean(audio, axis=1, dtype=np.float32)
    waveform = torch.from_numpy(mono).unsqueeze(0)
    if sample_rate != TARGET_SAMPLE_RATE:
        waveform = torchaudio.functional.resample(waveform, sample_rate, TARGET_SAMPLE_RATE)
    return waveform.contiguous()


def transcribe_ai4bharat(audio: torch.Tensor, language: str):
    model = load_model()
    with torch.inference_mode():
        # Official IndicConformer usage: model(waveform, language_code, decoder).
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
    files = {"file": (filename or "recording.wav", audio_bytes, content_type or "application/octet-stream")}
    data = {"model": OPENAI_TRANSCRIPTION_MODEL}
    timeout = httpx.Timeout(120.0, connect=15.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers=headers,
            files=files,
            data=data,
        )
    if response.status_code >= 400:
        raise RuntimeError(f"OpenAI transcription failed ({response.status_code}): {response.text[:500]}")
    transcript = str(response.json().get("text", "")).strip()
    if not transcript:
        raise RuntimeError("OpenAI returned an empty transcript")
    return transcript


@app.get("/")
async def root():
    return {"service": APP_NAME, "version": "0.1.0", "primary": "AI4Bharat", "fallback": "OpenAI"}


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": _model is not None,
        "model_id": MODEL_ID,
        "model_load_error": _model_load_error,
        "openai_fallback_configured": bool(OPENAI_API_KEY),
    }


@app.post("/v1/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    language: str = Form("te"),
    authorization: Optional[str] = Header(default=None),
):
    check_auth(authorization)
    language = language.lower().strip()
    if language not in LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Unsupported language code: {language}")
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Audio file is empty")
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio file exceeds the configured upload limit")

    started = time.perf_counter()
    try:
        waveform = decode_audio(audio_bytes)
        transcript = transcribe_ai4bharat(waveform, language)
        return {
            "transcript": transcript,
            "provider": "ai4bharat",
            "fallback_used": False,
            "language": language,
            "duration_seconds": round(time.perf_counter() - started, 3),
        }
    except Exception as primary_error:
        logger.exception("AI4Bharat transcription failed; attempting OpenAI fallback")
        try:
            transcript = await transcribe_openai(audio_bytes, file.filename or "recording.wav", file.content_type or "")
            return {
                "transcript": transcript,
                "provider": "openai",
                "fallback_used": True,
                "language": language,
                "primary_error": str(primary_error)[:300],
                "duration_seconds": round(time.perf_counter() - started, 3),
            }
        except Exception as fallback_error:
            logger.exception("OpenAI fallback also failed")
            raise HTTPException(
                status_code=502,
                detail={
                    "message": "Both AI4Bharat and OpenAI transcription failed",
                    "ai4bharat_error": str(primary_error)[:300],
                    "openai_error": str(fallback_error)[:300],
                },
            )
