import React, { useEffect, useRef, useState } from "react";
import { FiMic, FiMicOff, FiX, FiSend, FiCheck, FiRotateCcw } from "react-icons/fi";
import { useCompany } from "../context/CompanyContext";
import { processVoiceCommand, confirmVoiceDraft } from "../services/voiceCommandService";
import "../css/GlobalVoiceAssistant.css";

export default function GlobalVoiceAssistant() {
  const { currentCompanyId } = useCompany();
  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState("");
  const recorder = useRef(null);
  const chunks = useRef([]);
  useEffect(() => () => { try { recorder.current?.stop(); } catch {} }, []);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error("Audio recording is not supported in this app. You can type your command instead.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "";
      const mediaRecorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorder.current = mediaRecorder; chunks.current = [];
      mediaRecorder.ondataavailable = event => { if (event.data.size) chunks.current.push(event.data); };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        setRecording(false);
        const blob = new Blob(chunks.current, { type: mediaRecorder.mimeType || "audio/webm" });
        await submit({ audioBlob: blob });
      };
      mediaRecorder.start(); setRecording(true); setNotice("Listening… tap stop when you finish speaking.");
    } catch (error) { setNotice(error.message || "Microphone permission was not granted."); }
  };
  const stopRecording = () => { if (recorder.current?.state === "recording") recorder.current.stop(); };
  const submit = async ({ audioBlob, typed } = {}) => {
    if (!currentCompanyId) { setNotice("Please select a company first."); return; }
    setBusy(true); setNotice("Recognizing speech and understanding your commands…");
    try {
      const data = await processVoiceCommand({ companyId: currentCompanyId, audioBlob, text: typed || undefined, sessionId: result?.session?.id });
      setResult(data); setText(data.transcript || ""); setNotice("Draft prepared. Review every command before confirming.");
    } catch (error) { setNotice(error.message || "Could not process the command."); }
    finally { setBusy(false); }
  };
  const confirm = async () => {
    if (!result?.session?.id) return;
    setBusy(true);
    try {
      await confirmVoiceDraft(result.session.id, currentCompanyId, { transcript: result.transcript, language: result.detectedLanguage, commands: result.commands, response: result.response });
      setNotice("Draft confirmation recorded. No accounting entry has been posted; open the relevant module to complete and save it.");
      setResult(null); setText("");
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };
  const reset = () => { setResult(null); setText(""); setNotice(""); };
  return <>
    <button className="global-voice-trigger" type="button" onClick={() => setOpen(true)} aria-label="Open voice assistant"><FiMic/><span>Voice</span></button>
    {open && <div className="global-voice-backdrop" role="presentation" onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
      <section className="global-voice-panel" role="dialog" aria-modal="true" aria-labelledby="global-voice-title">
        <header><div><h2 id="global-voice-title">EAZYTAXATION Voice Assistant</h2><p>English · हिन्दी · తెలుగు · Mixed commands</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Close"><FiX/></button></header>
        <div className="global-voice-controls">
          <button type="button" className={recording ? "recording" : ""} disabled={busy} onClick={recording ? stopRecording : startRecording}>{recording ? <FiMicOff/> : <FiMic/>}{recording ? "Stop" : "Speak"}</button>
          <span>Tap Speak, say one or more tasks, then Stop.</span>
        </div>
        <label htmlFor="global-voice-text">Or type a command</label>
        <textarea id="global-voice-text" rows="3" value={text} onChange={e => setText(e.target.value)} placeholder="Example: Create an expense of 500 rupees for transport and add a customer named Ravi."/>
        <button className="global-voice-submit" type="button" disabled={busy || !text.trim()} onClick={() => submit({ typed: text })}><FiSend/> Process command</button>
        {busy && <p className="global-voice-status">{notice}</p>}
        {result && <div className="global-voice-review">
          <h3>Review your draft</h3><p><b>Recognized:</b> {result.transcript}</p><p><b>Language:</b> {result.detectedLanguage}</p><p>{result.response}</p>
          {result.commands.map((command, index) => <article key={index}><b>{index + 1}. {command.summary || command.intent}</b><p>Type: {command.transaction_type}</p><pre>{JSON.stringify(command.fields || {}, null, 2)}</pre>{command.missing_fields?.length > 0 && <p>Missing: {command.missing_fields.join(", ")}</p>}{command.requires_clarification && <p>Please clarify this command before proceeding.</p>}</article>)}
          <p className="global-voice-warning">Confirming records this draft only. It does not post an invoice, purchase, expense, or ledger entry.</p>
          <div className="global-voice-actions"><button type="button" disabled={busy} onClick={confirm}><FiCheck/> Confirm draft</button><button type="button" onClick={reset}><FiRotateCcw/> Start over</button></div>
        </div>}
        {notice && !busy && <p className="global-voice-status">{notice}</p>}
        <small>Every command is reviewed first. Nothing is automatically posted to your books.</small>
      </section>
    </div>}
  </>;
}
