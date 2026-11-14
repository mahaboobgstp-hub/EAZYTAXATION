import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiMic, FiMicOff, FiSend, FiCheck, FiRotateCcw } from "react-icons/fi";
import { useCompany } from "../../context/CompanyContext";
import { processVoiceCommand, transcribeVoiceAudio, confirmVoiceDraft } from "../../services/voiceCommandService";
import "../../css/AIWorkflows.css";

const suggestions = ["Create a sales invoice", "Create a purchase invoice", "Record an expense", "Create a customer", "Create a vendor", "Create an item"];
const languageOptions = [
  { value: "auto", label: "Automatic", sub: "OpenAI language detection" },
  { value: "en-IN", label: "English", sub: "OpenAI" },
  { value: "hi", label: "हिन्दी", sub: "AI4Bharat first" },
  { value: "te", label: "తెలుగు", sub: "AI4Bharat first" },
];

export default function AIVoiceCommand() {
  const navigate = useNavigate();
  const { currentCompanyId } = useCompany();
  const mediaRecorder = useRef(null);
  const mediaStream = useRef(null);
  const audioChunks = useRef([]);
  const [language, setLanguage] = useState("te");
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState("Ready. Record a short voice command.");
  const [providerInfo, setProviderInfo] = useState(null);

  useEffect(() => () => {
    try { mediaRecorder.current?.state !== "inactive" && mediaRecorder.current?.stop(); } catch {}
    mediaStream.current?.getTracks().forEach(track => track.stop());
  }, []);

  const startListening = async () => {
    if (!currentCompanyId) { setNotice("Please select a company before using voice commands."); return; }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setNotice("Audio recording is not supported by this Android WebView. Update the SYD app WebView or use a supported browser.");
      return;
    }
    setTranscript(""); setResult(null); setProviderInfo(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      mediaStream.current = stream;
      audioChunks.current = [];
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find(type => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorder.current = recorder;
      recorder.ondataavailable = event => { if (event.data?.size) audioChunks.current.push(event.data); };
      recorder.onerror = () => setNotice("Recording failed. Please check microphone permission and try again.");
      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        mediaStream.current = null;
        const blob = new Blob(audioChunks.current, { type: recorder.mimeType || "audio/webm" });
        if (!blob.size) { setRecording(false); setNotice("No audio was recorded. Please try again."); return; }
        if (blob.size > 25 * 1024 * 1024) { setRecording(false); setNotice("Recording is too large. Please keep voice commands under 90 seconds."); return; }
        setBusy(true); setNotice("Sending audio securely for transcription…");
        try {
          const data = await transcribeVoiceAudio({ audioBlob: blob, language });
          setTranscript(data.transcript || "");
          setProviderInfo(data);
          setNotice(data.transcript ? `Transcribed by ${data.provider === "ai4bharat" ? "AI4Bharat" : "OpenAI"}${data.fallback_used ? " after AI4Bharat fallback" : ""}. Review or edit the transcript.` : "No speech was detected. Please record again.");
        } catch (error) { setNotice(error.message || "Transcription failed. Please try again."); }
        finally { setBusy(false); setRecording(false); }
      };
      recorder.start();
      setRecording(true);
      setNotice("Recording… speak clearly, then tap Stop.");
    } catch (error) {
      mediaStream.current?.getTracks().forEach(track => track.stop());
      mediaStream.current = null;
      setRecording(false);
      setNotice(error.name === "NotAllowedError" ? "Microphone permission was denied. Allow microphone access for SYD." : (error.message || "Could not start recording."));
    }
  };

  const stopListening = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      setNotice("Finishing recording…");
      mediaRecorder.current.stop();
    }
  };

  const runCommand = async (text = transcript) => {
    const commandText = String(text || "").trim();
    if (!commandText) { setNotice("No transcript is available. Record a command first."); return; }
    if (!currentCompanyId) { setNotice("Please select a company before using voice commands."); return; }
    setBusy(true); setNotice("Sending transcript for AI command interpretation…");
    try {
      const data = await processVoiceCommand({ companyId: currentCompanyId, text: commandText, sessionId: result?.session?.id, previousDraft: result ? { transcript: result.transcript, commands: result.commands } : null });
      setResult(data); setTranscript(data.transcript || commandText);
      setNotice("Command understood. Review the draft below. Nothing has been saved.");
    } catch (error) { setNotice(error.message || "Command interpretation failed."); }
    finally { setBusy(false); }
  };

  const confirmDraft = async () => {
    if (!result?.session?.id) return;
    setBusy(true);
    try {
      await confirmVoiceDraft(result.session.id, currentCompanyId, {
        transcript: result.transcript, language: result.detectedLanguage,
        commands: result.commands, response: result.response
      });
      setNotice("Draft confirmation recorded. No accounting entry has been posted.");
      setResult(null); setTranscript(""); setProviderInfo(null);
    } catch (error) { setNotice(error.message || "Could not confirm draft."); }
    finally { setBusy(false); }
  };

  const reset = () => { setResult(null); setTranscript(""); setProviderInfo(null); setNotice("Ready for another command."); };

  return <main className="ai-screen ai-voice-screen">
    <header className="ai-screen-header"><button type="button" onClick={() => navigate("/app/ai-assistant")} aria-label="Back"><FiArrowLeft /></button><h1>Voice Command</h1></header>
    <section className="ai-mic-area">
      <button type="button" className={recording ? "ai-mic-button listening" : "ai-mic-button"} onClick={recording ? stopListening : startListening} disabled={busy} aria-label={recording ? "Stop recording" : "Start recording"}>{recording ? <FiMicOff /> : <FiMic />}</button>
      <h2>{recording ? "Recording… Tap to Stop" : busy ? "Processing…" : "Tap and Speak"}</h2>
      <div className="ai-language-picker">
        <span className="ai-language-title">Speech language</span>
        <div className="ai-language-options" role="group" aria-label="Speech language">
          {languageOptions.map(option => <button type="button" key={option.value} className={language === option.value ? "selected" : ""} onClick={() => setLanguage(option.value)} disabled={recording || busy}><b>{option.label}</b><small>{option.sub}</small></button>)}
        </div>
      </div>
      <p>Audio is processed securely. Indic languages use AI4Bharat first; OpenAI is the fallback.</p>
    </section>
    <div className="ai-suggestion-list">{suggestions.map(item => <button type="button" key={item} onClick={() => setTranscript(item)}>{item}</button>)}</div>
    <section className="ai-command-form ai-live-transcript">
      <label>Transcribed words</label>
      <textarea rows="3" value={transcript} onChange={event => setTranscript(event.target.value)} placeholder="Your transcript will appear here. You can edit it before processing…" />
      {providerInfo && <p className="ai-safe-note">Provider: {providerInfo.provider} · Fallback used: {providerInfo.fallback_used ? "Yes" : "No"}</p>}
      <button type="button" onClick={() => runCommand()} disabled={busy || !transcript.trim()}><FiSend /> Process transcript</button>
    </section>
    {notice && <p className="ai-notice" role="status" aria-live="polite">{notice}</p>}
    {result && <section className="ai-command-form" style={{marginTop:14}}>
      <h3>Review AI interpretation</h3><p><b>Recognized:</b> {result.transcript}</p><p><b>Language:</b> {result.detectedLanguage}</p><p>{result.response}</p>
      {(result.commands || []).map((command,index) => <article key={index}><b>{index+1}. {command.summary || command.intent}</b><p>Type: {command.transaction_type}</p><pre>{JSON.stringify(command.fields || {},null,2)}</pre>{command.missing_fields?.length > 0 && <p>Required: {command.missing_fields.join(", ")}</p>}</article>)}
      <p className="ai-safe-note">Confirmation records this draft only. It does not post an accounting entry.</p>
      <button type="button" onClick={confirmDraft} disabled={busy}><FiCheck/> Confirm draft</button>
      <button type="button" onClick={reset} disabled={busy}><FiRotateCcw/> Start over</button>
    </section>}
    <p className="ai-safe-note">Your recording is sent to the SYD transcription server. AI4Bharat is attempted first for supported Indian languages; OpenAI is used for automatic language detection, English, or when AI4Bharat fails. Only the transcript is sent to the command interpreter. No accounting entry is posted automatically.</p>
  </main>;
}
