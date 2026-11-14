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
  const micStream = useRef(null);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => () => {
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
    let stream;
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        throw new Error("Audio recording is not supported in this app. Please update Android System WebView and try again.");
      }
      setNotice("Requesting microphone permission…");
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      micStream.current = stream;

      const supportedTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
      const mimeType = supportedTypes.find(type => MediaRecorder.isTypeSupported(type));
      const recorderEngine = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.current = recorderEngine;
      chunks.current = [];
      setTranscript("");
      setResult(null);

      recorderEngine.ondataavailable = event => {
        if (event.data?.size) chunks.current.push(event.data);
      };
      recorderEngine.onerror = () => {
        stream.getTracks().forEach(track => track.stop());
        micStream.current = null;
        setRecording(false);
        setNotice("Audio recording failed. Please check your microphone and try again.");
      };
      recorderEngine.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        micStream.current = null;
        setRecording(false);
        const actualType = recorderEngine.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunks.current, { type: actualType });
        if (!blob.size) {
          setNotice("No audio was captured. Please speak for a little longer and try again.");
          return;
        }
        if (blob.size > 24 * 1024 * 1024) {
          setNotice("This recording is too large. Please record a shorter command (under 2 minutes).");
          return;
        }
        setNotice("Audio captured. Sending it for speech recognition…");
        await runCommand({ audioBlob: blob });
      };

      recorderEngine.start(500);
      setRecording(true);
      setNotice("Listening… speak your command, then tap the microphone again to stop and process it.");
    } catch (error) {
      stream?.getTracks?.().forEach(track => track.stop());
      micStream.current = null;
      setRecording(false);
      setNotice(microphoneError(error));
    }
  };

  const stopListening = () => {
    if (recorder.current?.state === "recording") {
      setNotice("Finishing your recording…");
      recorder.current.stop();
    }
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
      <label htmlFor="ai-command-text">{recording ? "Recording your voice" : "Your command or correction"}</label>
      <textarea id="ai-command-text" rows="3" value={transcript} onChange={event => setTranscript(event.target.value)} placeholder="Your recognized words will appear here after recording. You can also type or edit a command…"/>
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
