import React,{useEffect,useRef,useState} from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft,FiMic,FiMicOff,FiSend } from "react-icons/fi";
import "../../css/AIWorkflows.css";

const suggestions=["Create a sales invoice","Create a purchase invoice","Record an expense","Create a customer","Create a vendor","Create an item"];

export default function AIVoiceCommand(){
 const navigate=useNavigate(),recognition=useRef(null);
 const [listening,setListening]=useState(false),[transcript,setTranscript]=useState(""),[notice,setNotice]=useState("");
 useEffect(()=>()=>{try{recognition.current?.stop()}catch{}},[]);
 const startListening=()=>{
   const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
   if(!Speech){setNotice("Voice recognition is not available in this Android WebView yet. You can type your command here.");return;}
   try{
     const engine=new Speech();recognition.current=engine;engine.lang="en-IN";engine.continuous=false;engine.interimResults=true;
     engine.onstart=()=>{setListening(true);setNotice("Listening… speak your command");};
     engine.onresult=e=>{let text="";for(let i=e.resultIndex;i<e.results.length;i++)text+=e.results[i][0].transcript;setTranscript(text);};
     engine.onerror=()=>{setListening(false);setNotice("Could not capture speech. Please try again or type your command.");};
     engine.onend=()=>setListening(false);engine.start();
   }catch{setListening(false);setNotice("Microphone could not be started. Please try again.");}
 };
 const stopListening=()=>{try{recognition.current?.stop()}catch{}setListening(false)};
 const submit=e=>{e.preventDefault();if(!transcript.trim())return;setNotice("Command captured. Secure AI command processing will be connected before commands can create or change records.");};
 return <main className="ai-screen ai-voice-screen">
  <header className="ai-screen-header"><button type="button" onClick={()=>navigate("/app/ai-assistant")} aria-label="Back"><FiArrowLeft/></button><h1>Voice Command</h1></header>
  <section className="ai-mic-area"><button type="button" className={listening?"ai-mic-button listening":"ai-mic-button"} onClick={listening?stopListening:startListening} aria-label={listening?"Stop listening":"Tap and speak"}>{listening?<FiMicOff/>:<FiMic/>}</button><h2>{listening?"Listening…":"Tap and Speak"}</h2><p>or say something like…</p></section>
  <div className="ai-suggestion-list">{suggestions.map(x=><button type="button" key={x} onClick={()=>setTranscript(x)}>{x}</button>)}</div>
  <form className="ai-command-form" onSubmit={submit}><label htmlFor="ai-command-text">Your command</label><textarea id="ai-command-text" rows="3" value={transcript} onChange={e=>setTranscript(e.target.value)} placeholder="Speak or type what you want to do…"/><button type="submit" disabled={!transcript.trim()}><FiSend/> Submit command</button></form>
  {notice&&<p className="ai-notice">{notice}</p>}
  <p className="ai-safe-note">Nothing will be posted automatically. Every AI-prepared entry will require your review and confirmation.</p>
 </main>;
}
