import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiMic, FiMicOff, FiSend, FiCheck, FiRotateCcw } from "react-icons/fi";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { useCompany } from "../../context/CompanyContext";
import { processVoiceCommand, confirmVoiceDraft } from "../../services/voiceCommandService";
import "../../css/AIWorkflows.css";

const OfflineSpeechRecognition = registerPlugin("OfflineSpeechRecognition");
const suggestions = ["Create a sales invoice", "Create a purchase invoice", "Record an expense", "Create a customer", "Create a vendor", "Create an item"];

export default function AIVoiceCommand() {
  const navigate = useNavigate();
  const { currentCompanyId } = useCompany();
  const listeners = useRef([]);
  const [language, setLanguage] = useState("auto");
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [partial, setPartial] = useState("");
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState("Checking Android offline speech recognition…");
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      setNotice("Offline speech recognition requires the installed Android app.");
      return;
    }
    OfflineSpeechRecognition.checkAvailability().then(value => {
      setAvailable(Boolean(value?.available));
      setNotice(value?.available ? "Offline speech recognition is ready." : (value?.reason || "Offline recognition is unavailable. Online recognition is disabled."));
    }).catch(error => setNotice(error.message || "Could not check offline recognition."));
    return () => {
      listeners.current.forEach(item => item.remove());
      OfflineSpeechRecognition.cancelListening().catch(() => {});
    };
  }, []);

  const startListening = async () => {
    if (!Capacitor.isNativePlatform()) { setNotice("Use the installed Android app for offline voice recognition."); return; }
    setTranscript(""); setPartial(""); setResult(null);
    try {
      const status = await OfflineSpeechRecognition.checkAvailability();
      if (!status?.available) { setAvailable(false); setNotice(status?.reason || "Offline recognition unavailable. No online fallback will be used."); return; }
      listeners.current.forEach(item => item.remove());
      listeners.current = [
        await OfflineSpeechRecognition.addListener("partialResults", event => { setPartial(event.transcript || ""); setRecording(true); }),
        await OfflineSpeechRecognition.addListener("recognized", event => {
          const words = String(event.transcript || "").trim();
          setTranscript(words); setPartial(""); setRecording(false);
          setNotice(words ? "Recognized offline. Review or edit the words, then process them." : "No words recognized. Nothing was sent to OpenAI.");
        }),
        await OfflineSpeechRecognition.addListener("recognitionError", event => { setRecording(false); setPartial(""); setNotice(event.message || "Offline recognition failed. Nothing was sent to OpenAI."); }),
        await OfflineSpeechRecognition.addListener("speechStatus", event => { if (event.status === "ready" || event.status === "speaking") setRecording(true); if (event.status === "processing") setNotice("Finishing offline recognition…"); })
      ];
      await OfflineSpeechRecognition.startListening({ language });
      setRecording(true); setNotice("Listening offline… speak your command.");
    } catch (error) { setRecording(false); setNotice(error.message || "Could not start offline recognition."); }
  };

  const stopListening = async () => {
    try { setNotice("Finishing offline recognition…"); await OfflineSpeechRecognition.stopListening(); }
    catch (error) { setRecording(false); setNotice(error.message || "Could not stop recognition."); }
  };

  const runCommand = async (text = transcript) => {
    const commandText = String(text || "").trim();
    if (!commandText) { setNotice("No recognized words are available. Nothing was sent to OpenAI."); return; }
    if (!currentCompanyId) { setNotice("Please select a company before using voice commands."); return; }
    setBusy(true); setNotice("Sending recognized text for AI command interpretation…");
    try {
      const data = await processVoiceCommand({ companyId: currentCompanyId, text: commandText, sessionId: result?.session?.id, previousDraft: result ? { transcript: result.transcript, commands: result.commands } : null });
      setResult(data); setTranscript(data.transcript || commandText); setNotice("Command understood. Review the draft below. Nothing has been saved.");
    } catch (error) { setNotice(error.message || "Command interpretation failed."); }
    finally { setBusy(false); }
  };

  const confirmDraft = async () => {
    if (!result?.session?.id) return;
    setBusy(true);
    try {
      await confirmVoiceDraft(result.session.id, currentCompanyId, { transcript: result.transcript, language: result.detectedLanguage, commands: result.commands, response: result.response });
      setNotice("Draft confirmation recorded. No accounting entry has been posted.");
      setResult(null); setTranscript("");
    } catch (error) { setNotice(error.message || "Could not confirm draft."); }
    finally { setBusy(false); }
  };
  const reset = () => { setResult(null); setTranscript(""); setPartial(""); setNotice(""); };

  return <main className="ai-screen ai-voice-screen">
    <header className="ai-screen-header"><button type="button" onClick={() => navigate("/app/ai-assistant")} aria-label="Back"><FiArrowLeft /></button><h1>Voice Command</h1></header>
    <section className="ai-mic-area">
      <button type="button" className={recording ? "ai-mic-button listening" : "ai-mic-button"} onClick={recording ? stopListening : startListening} disabled={busy || (!available && !recording)} aria-label={recording ? "Stop recognition" : "Start offline recognition"}>{recording ? <FiMicOff /> : <FiMic />}</button>
      <h2>{recording ? "Listening… Tap to Stop" : busy ? "Processing…" : "Tap and Speak"}</h2>
      <div className="ai-language-picker">
        <span className="ai-language-title">Recognition language</span>
        <div className="ai-language-options" role="group" aria-label="Recognition language">
          {[{value:"auto",label:"Automatic",sub:"Detect language"},{value:"en-IN",label:"English",sub:"India"},{value:"hi-IN",label:"हिन्दी",sub:"Hindi"},{value:"te-IN",label:"తెలుగు",sub:"Telugu"}].map(option => <button type="button" key={option.value} className={language===option.value ? "selected" : ""} onClick={() => setLanguage(option.value)} disabled={recording || busy}><b>{option.label}</b><small>{option.sub}</small></button>)}
        </div>
      </div>
      <p>Android native recognition · Automatic or manual language</p>
    </section>
    <div className="ai-suggestion-list">{suggestions.map(item => <button type="button" key={item} onClick={() => setTranscript(item)}>{item}</button>)}</div>
    <section className="ai-command-form ai-live-transcript">
      <label>Live recognized words</label>
      <div className="ai-live-words" aria-live="polite">{transcript} {partial && <span className="ai-partial-words">{partial}</span>}{!transcript && !partial && <span className="ai-transcript-placeholder">Your words will appear here as you speak…</span>}</div>
      <textarea rows="2" value={transcript} onChange={event => setTranscript(event.target.value)} placeholder="Edit recognized words here…"/>
      <button type="button" onClick={() => runCommand()} disabled={busy || !transcript.trim()}><FiSend /> Process recognized text</button>
    </section>
    {notice && <p className="ai-notice" role="status" aria-live="polite">{notice}</p>}
    {result && <section className="ai-command-form" style={{marginTop:14}}>
      <h3>Review AI interpretation</h3><p><b>Recognized:</b> {result.transcript}</p><p><b>Language:</b> {result.detectedLanguage}</p><p>{result.response}</p>
      {(result.commands || []).map((command,index) => <article key={index}><b>{index+1}. {command.summary || command.intent}</b><p>Type: {command.transaction_type}</p><pre>{JSON.stringify(command.fields || {},null,2)}</pre>{command.missing_fields?.length>0 && <p>Required: {command.missing_fields.join(", ")}</p>}</article>)}
      <p className="ai-safe-note">Confirmation records this draft only. It does not post an accounting entry.</p>
      <button type="button" onClick={confirmDraft} disabled={busy}><FiCheck/> Confirm draft</button>
      <button type="button" onClick={reset} disabled={busy}><FiRotateCcw/> Start over</button>
    </section>}
    <p className="ai-safe-note">Speech recognition uses the Android recognition service. Offline operation depends on the service and installed language packs. Only recognized text is sent for command interpretation; audio is never uploaded.</p>
  </main>;
}
