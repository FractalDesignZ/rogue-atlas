export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function stopSpeaking() {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
}

export function speakText(text: string, onEnd?: () => void): boolean {
  if (!canSpeak()) return false;
  stopSpeaking();
  const u = new SpeechSynthesisUtterance(text.replace(/\s+/g, " ").trim());
  u.rate = 0.92;
  u.pitch = 0.96;
  u.lang = "en-US";
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
  return true;
}
