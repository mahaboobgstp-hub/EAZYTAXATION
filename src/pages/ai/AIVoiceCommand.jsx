import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiMic, FiMicOff, FiSend, FiCheck, FiRotateCcw, FiTrash2, FiActivity } from "react-icons/fi";
import { useCompany } from "../../context/CompanyContext";
import { processVoiceCommand, transcribeVoiceAudio, confirmVoiceDraft } from "../../services/voiceCommandService";
import "../../css/AIWorkflows.css";

const suggestions = ["Create a sales invoice", "Create a purchase invoice", "Record an expense", "Create a customer", "Create a vendor", "Create an item"];
const languageOptions = [
  { value: "auto", label: "Automatic", sub: "OpenAI language detection" },
  { value: "en-IN", label: "English", sub: "OpenAI" },
  { value: "hi", label: "हिन्दी", sub: "OpenAI" },
  { value: "te", label: "తెలుగు", sub: "OpenAI" },
];

export default function AIVoiceCommand() {
  const navigate = useNavigate();
  const { currentCompanyId } = useCompany();
  const mediaRecorder = useRef(null);
  const mediaStream = useRef(null);
  const audioChunks = useRef([]);
  const [language, setLanguage] = useState("auto");
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState("Ready. Tap the microphone, speak, then stop and send when ready.");
  const [providerInfo, setProviderInfo] = useState(null);

  useEffect(() => {
    if (!recording) return undefined;
    const timer = window.setInterval(() => setRecordingSeconds(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => () => {
    try { if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") mediaRecorder.current.stop(); } catch {}
    mediaStream.current?.getTracks().forEach(track => track.stop());
  }, []);

  const formatTime = seconds => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  const startListening = async () => {
    if (!currentCompanyId) { setNotice("Please select a company before using voice commands."); return; }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setNotice("Audio recording is not supported by this Android WebView. Update the SYD app WebView or use a supported browser.");
      return;
    }
    setTranscript(""); setResult(null); setProviderInfo(null); setRecordedAudio(null); setRecordingSeconds(0);
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
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        mediaStream.current = null;
        const blob = new Blob(audioChunks.current, { type: recorder.mimeType || "audio/webm" });
        setRecording(false);
        if (!blob.size || recordingSeconds < 1) {
          setRecordedAudio(null);
          setNotice("No usable recording detected. Nothing was sent to OpenAI. Please speak for at least one second and try again.");
          return;
        }
        if (blob.size > 25 * 1024 * 1024) {
          setRecordedAudio(null);
          setNotice("Recording is too large. Please keep voice commands under 90 seconds.");
          return;
        }
        setRecordedAudio(blob);
        setNotice("Recording saved on this device. Listen/review, then tap Send to OpenAI when ready.");
      };
      recorder.start(250);
      setRecording(true);
      setNotice("Recording on this device only. Speak clearly, then tap Stop.");
    } catch (error) {
      mediaStream.current?.getTracks().forEach(track => track.stop());
      mediaStream.current = null;
      setRecording(false);
      setNotice(error.name === "NotAllowedError" ? "Microphone permission was denied. Allow microphone access for SYD." : (error.message || "Could not start recording."));
    }
  };

  const stopListening = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      setNotice("Finishing recording on this device…");
      mediaRecorder.current.stop();
    }
  };

  const sendAudioForTranscription = async () => {
    if (!recordedAudio || recordedAudio.size < 1500) {
      setNotice("This recording is empty or too short. Nothing was sent. Please record your command again.");
      return;
    }
    setBusy(true);
    setNotice("Sending your recording securely to OpenAI for transcription…");
    try {
      const data = await transcribeVoiceAudio({ audioBlob: recordedAudio, language });
      const recognized = String(data.transcript || "").trim();
      setTranscript(recognized);
      setProviderInfo(data);
      setRecordedAudio(null);
      setNotice(recognized ? "Speech recognized. Your words are shown below. Edit them if needed, then process the transcript." : "No speech was recognized. No command was processed. Please record again.");
    } catch (error) {
      setNotice(error.message || "Transcription failed. Your recording was not processed as a command.");
    } finally { setBusy(false); }
  };

  const discardRecording = () => {
    setRecordedAudio(null);
    setRecordingSeconds(0);
    setNotice("Recording discarded. Nothing was sent to OpenAI.");
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

  const reset = () => { setResult(null); setTranscript(""); setProviderInfo(null); setRecordedAudio(null); setNotice("Ready for another command."); };

  return <main className="ai-screen ai-voice-screen">
    <header className="ai-screen-header"><button type="button" onClick={() => navigate("/app/ai-assistant")} aria-label="Back"><FiArrowLeft /></button><h1>Voice Command</h1></header>
    <section className="ai-mic-area">
      <button type="button" className={recording ? "ai-mic-button listening" : "ai-mic-button"} onClick={recording ? stopListening : startListening} disabled={busy || Boolean(recordedAudio)} aria-label={recording ? "Stop recording" : "Start recording"}>{recording ? <FiMicOff /> : <FiMic />}</button>
      <h2>{recording ? "Recording… Tap to Stop" : busy ? "Processing…" : recordedAudio ? "Recording ready to send" : "Tap and Speak"}</h2>
      <div className="ai-language-picker">
        <span className="ai-language-title">Speech language</span>
        <div className="ai-language-options" role="group" aria-label="Speech language">
          {languageOptions.map(option => <button type="button" key={option.value} className={language === option.value ? "selected" : ""} onClick={() => setLanguage(option.value)} disabled={recording || busy || Boolean(recordedAudio)}><b>{option.label}</b><small>{option.sub}</small></button>)}
        </div>
      </div>
      <p>Audio is processed securely by OpenAI only after you tap Send.</p>
    </section>
    {(recording || recordedAudio) && <section className="ai-recording-float" aria-live="polite">
      <div className="ai-recording-top"><span className="ai-recording-dot"/><b>{recording ? "Recording on this device" : "Recording ready"}</b><strong>{formatTime(recordingSeconds)}</strong></div>
      <div className={recording ? "ai-waveform active" : "ai-waveform"} aria-label="Audio recording visualizer">{Array.from({length: 28}, (_, i) => <i key={i} style={{"--wave": `${18 + ((i * 17) % 58)}%`}}/>)}</div>
      <p>{recording ? "Speak now. Your audio is not being uploaded." : "Your audio is saved locally. Nothing has been sent yet."}</p>
      {!recording && <div className="ai-recording-actions">
        <button type="button" className="ai-discard-button" onClick={discardRecording} disabled={busy}><FiTrash2/> Discard</button>
        <button type="button" className="ai-send-audio-button" onClick={sendAudioForTranscription} disabled={busy || !recordedAudio}><FiSend/> Send to OpenAI</button>
      </div>}
    </section>}
    <div className="ai-suggestion-list">{suggestions.map(item => <button type="button" key={item} onClick={() => setTranscript(item)}>{item}</button>)}</div>
    <section className="ai-command-form ai-live-transcript">
      <label><FiActivity/> Recognized speech</label>
      <textarea rows="4" value={transcript} onChange={event => setTranscript(event.target.value)} placeholder="Your recognized words will appear here after you send the recording. You can edit them before processing…" />
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
    <p className="ai-safe-note">Your audio remains on this device until you tap Send to OpenAI. Only the transcript is sent to the command interpreter. No accounting entry is posted automatically.</p>
  </main>;
}
