import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiMic, FiMicOff, FiSend, FiCheck, FiRotateCcw } from "react-icons/fi";
import { useCompany } from "../../context/CompanyContext";
import { processVoiceCommand, confirmVoiceDraft } from "../../services/voiceCommandService";
import "../../css/AIWorkflows.css";

const suggestions = ["Create a sales invoice", "Create a purchase invoice", "Record an expense", "Create a customer", "Create a vendor", "Create an item"];

export default function AIVoiceCommand() {
  const navigate = useNavigate();
  const { currentCompanyId } = useCompany();
  const recorder = useRef(null);
  const chunks = useRef([]);
  const speechEngine = useRef(null);
  const micStream = useRef(null);
  const liveTranscript = useRef("");
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => () => {
    try { speechEngine.current?.stop(); } catch {}
    try { if (recorder.current?.state === "recording") recorder.current.stop(); } catch {}
    micStream.current?.getTracks?.().forEach(track => track.stop());
  }, []);

  const microphoneError = error => {
    if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
      return "Microphone permission is blocked for this app/site. On Android, open Settings → Apps → EAZYTAXATION → Permissions → Microphone → Allow. Also check Chrome/Android System WebView site permissions if you opened the web preview.";
    }
    if (error?.name === "NotFoundError") return "No microphone was found on this device.";
    if (error?.name === "NotReadableError") return "The microphone is busy or unavailable. Close other apps using it and try again.";
    return error?.message || "Could not start the microphone.";
  };

  const startListening = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("This app environment does not expose microphone access. Update Android System WebView and check app permissions.");
      setNotice("Requesting microphone permission…");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      micStream.current = stream;
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        const engine = new SpeechRecognition();
        speechEngine.current = engine;
        engine.lang = "en-IN";
        engine.continuous = true;
        engine.interimResults = true;
        liveTranscript.current = "";
        setTranscript("");
        engine.onresult = event => {
          let interim = "";
          let finalText = liveTranscript.current;
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const phrase = event.results[i][0]?.transcript || "";
            if (event.results[i].isFinal) finalText += (finalText ? " " : "") + phrase.trim();
            else interim += phrase;
          }
          liveTranscript.current = finalText;
          setTranscript([finalText, interim.trim()].filter(Boolean).join(" "));
          setNotice(interim ? "Listening… recognizing your words live." : "Listening… keep speaking or tap the microphone to finish.");
        };
        engine.onerror = event => {
          setRecording(false);
          micStream.current?.getTracks?.().forEach(track => track.stop());
          micStream.current = null;
          const reason = event.error === "not-allowed" || event.error === "service-not-allowed"
            ? "Microphone permission was denied by Android or the browser. Open Android Settings → Apps → EAZYTAXATION → Permissions → Microphone → Allow, then reopen the app."
            : event.error === "no-speech" ? "I did not hear speech. Please try again closer to the microphone."
            : event.error === "network" ? "Live speech recognition needs an internet connection. Check your connection and try again."
            : "Speech recognition failed (" + event.error + "). Please try again.";
          setNotice(reason);
        };
        engine.onend = () => {
          setRecording(false);
          micStream.current?.getTracks?.().forEach(track => track.stop());
          micStream.current = null;
          if (liveTranscript.current.trim()) {
            setTranscript(liveTranscript.current.trim());
            setNotice("Voice recognized. Review or edit the text, then tap Process command.");
          }
        };
        engine.start();
        setRecording(true);
        setNotice("Listening… your recognized words will appear below as you speak.");
        return;
      }

      if (!window.MediaRecorder) throw new Error("Live speech recognition is not supported in this Android WebView. Update Android System WebView/Chrome.");
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : (MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "");
      const recorderEngine = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorder.current = recorderEngine;
      chunks.current = [];
      recorderEngine.ondataavailable = event => { if (event.data?.size) chunks.current.push(event.data); };
      recorderEngine.onerror = () => {
        stream.getTracks().forEach(track => track.stop());
        micStream.current = null;
        setRecording(false);
        setNotice("Audio recording failed. Please try again.");
      };
      recorderEngine.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        micStream.current = null;
        setRecording(false);
        const blob = new Blob(chunks.current, { type: recorderEngine.mimeType || "audio/webm" });
        if (!blob.size) { setNotice("No audio was captured. Please try again."); return; }
        await runCommand({ audioBlob: blob });
      };
      recorderEngine.start(250);
      setRecording(true);
      setNotice("Recording audio. Live on-screen transcription is unavailable in this WebView.");
    } catch (error) {
      micStream.current?.getTracks?.().forEach(track => track.stop());
      micStream.current = null;
      setRecording(false);
      setNotice(microphoneError(error));
    }
  };

  const stopListening = () => {
    if (speechEngine.current) {
      const engine = speechEngine.current;
      speechEngine.current = null;
      try { engine.stop(); } catch {}
      micStream.current?.getTracks?.().forEach(track => track.stop());
      micStream.current = null;
      setRecording(false);
      if (liveTranscript.current.trim()) {
        setTranscript(liveTranscript.current.trim());
        setNotice("Voice recognized. Review or edit the text, then tap Process command.");
      } else {
        setNotice("No words were recognized. Please try speaking again.");
      }
      return;
    }
    if (recorder.current?.state === "recording") recorder.current.stop();
  };

  const runCommand = async ({ audioBlob, typed } = {}) => {
    if (!currentCompanyId) { setNotice("Please select a company before using voice commands."); return; }
    setBusy(true); setNotice("Sending your command securely for speech recognition and AI understanding…");
    try {
      const data = await processVoiceCommand({
        companyId: currentCompanyId,
        audioBlob,
        text: typed,
        sessionId: result?.session?.id,
        previousDraft: result ? { transcript: result.transcript, commands: result.commands } : null,
      });
      setResult(data);
      setTranscript(data.transcript || typed || "");
      setNotice("Command understood. Review the draft below. Nothing has been saved to your accounts.");
    } catch (error) {
      setNotice(error.message || "Voice command processing failed. Check your internet connection and try again.");
    } finally { setBusy(false); }
  };

  const submitText = event => { event.preventDefault(); if (transcript.trim()) runCommand({ typed: transcript.trim() }); };

  const confirmDraft = async () => {
    if (!result?.session?.id) return;
    setBusy(true);
    try {
      await confirmVoiceDraft(result.session.id, currentCompanyId, {
        transcript: result.transcript, language: result.detectedLanguage,
        commands: result.commands, response: result.response,
      });
      setNotice("Your draft confirmation has been recorded. No invoice, purchase or expense has been posted. Actual accounting save integration is not enabled yet.");
      setResult(null); setTranscript("");
    } catch (error) { setNotice(error.message || "Could not confirm this draft."); }
    finally { setBusy(false); }
  };

  const reset = () => { setResult(null); setTranscript(""); setNotice(""); };

  return <main className="ai-screen ai-voice-screen">
    <header className="ai-screen-header"><button type="button" onClick={() => navigate("/app/ai-assistant")} aria-label="Back"><FiArrowLeft /></button><h1>Voice Command</h1></header>
    <section className="ai-mic-area">
      <button type="button" className={recording ? "ai-mic-button listening" : "ai-mic-button"} onClick={recording ? stopListening : startListening} onPointerUp={event => event.currentTarget.blur()} disabled={busy} aria-label={recording ? "Stop recording" : "Start voice recording"}><>{recording ? <FiMicOff /> : <FiMic />}</></button>
      <h2>{recording ? "Listening… Tap to Stop" : busy ? "Processing…" : "Tap and Speak"}</h2>
      <p>English · हिन्दी · తెలుగు · Mixed language</p>
    </section>
    <div className="ai-suggestion-list">{suggestions.map(item => <button type="button" key={item} onClick={() => setTranscript(item)}>{item}</button>)}</div>
    <form className="ai-command-form" onSubmit={submitText}>
      <label htmlFor="ai-command-text">{recording ? "Live voice transcription" : "Your command or correction"}</label>
      <textarea id="ai-command-text" rows="3" value={transcript} onChange={event => setTranscript(event.target.value)} placeholder="Your spoken words will appear here while you speak. You can also type or edit a command…"/>
      <button type="submit" disabled={busy || !transcript.trim()}><FiSend /> Process command</button>
    </form>
    {notice && <p className="ai-notice" role="status" aria-live="polite">{notice}</p>}
    {result && <section className="ai-command-form" style={{marginTop:14}}>
      <h3 style={{margin:"0 0 5px"}}>Review AI interpretation</h3>
      <p><b>Recognized:</b> {result.transcript}</p>
      <p><b>Language:</b> {result.detectedLanguage}</p>
      <p>{result.response}</p>
      {(result.commands || []).map((command, index) => <article key={index} style={{padding:12,margin:"8px 0",border:"1px solid #e3e8f2",borderRadius:12}}>
        <b>{index + 1}. {command.summary || command.intent}</b>
        <p>Type: {command.transaction_type}</p>
        <pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",fontSize:12,background:"#f5f6fa",padding:10,borderRadius:8}}>{JSON.stringify(command.fields || {}, null, 2)}</pre>
        {command.missing_fields?.length > 0 && <p>Still required: {command.missing_fields.join(", ")}</p>}
        {command.requires_clarification && <p>Please clarify before proceeding.</p>}
      </article>)}
      <p className="ai-safe-note">Confirmation stores this reviewed draft only. It does not create or post financial entries.</p>
      <button type="button" onClick={confirmDraft} disabled={busy} style={{width:"100%",padding:13,border:0,borderRadius:12,background:"#5636d5",color:"#fff",fontWeight:750,display:"flex",justifyContent:"center",gap:8,alignItems:"center"}}><FiCheck/> Confirm draft</button>
      <button type="button" onClick={reset} disabled={busy} style={{width:"100%",marginTop:8,padding:12,border:"1px solid #dce3ef",borderRadius:12,background:"#fff",color:"#263451"}}><FiRotateCcw/> Start over</button>
    </section>}
    <p className="ai-safe-note">All commands are processed through the secure OpenAI service. Review is required before a draft is confirmed.</p>
  </main>;
}
