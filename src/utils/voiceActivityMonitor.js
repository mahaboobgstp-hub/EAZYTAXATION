// Local voice-activity gate: reject silence before any paid transcription request.
export function createVoiceActivityMonitor(stream) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error("This device cannot verify microphone audio. Please update Android System WebView.");
  const context = new AudioContextClass();
  context.resume().catch(() => {});
  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);
  const samples = new Float32Array(analyser.fftSize);
  let activeMs = 0;
  let peakRms = 0;
  let checks = 0;
  const interval = window.setInterval(() => {
    analyser.getFloatTimeDomainData(samples);
    let sum = 0;
    for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
    const rms = Math.sqrt(sum / samples.length);
    peakRms = Math.max(peakRms, rms);
    checks += 1;
    if (rms >= 0.015) activeMs += 100;
  }, 100);
  return {
    getStats: () => ({ activeMs, peakRms, checks }),
    stop: async () => {
      window.clearInterval(interval);
      try { source.disconnect(); analyser.disconnect(); } catch {}
      try { await context.close(); } catch {}
    },
  };
}
