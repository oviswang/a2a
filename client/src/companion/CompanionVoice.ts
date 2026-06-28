/**
 * CompanionVoice — speaks the companion's text replies aloud using the browser's
 * built-in `speechSynthesis` (TTS).
 *
 * This is the OUTPUT half of the browser-native voice loop: the companion's "brain"
 * runs over the text session (so it actually sees live world-state), its replies
 * arrive as text, and we voice them here. Using the device TTS keeps the microphone
 * free for the command recognizer (a provider voice call would own the mic and mute
 * it, which is what made commands unreliable).
 *
 * `onSpeakingChange` lets the caller gate the recognizer while we're talking, so the
 * companion's own voice isn't picked up as a command.
 */
export class CompanionVoice {
  static get supported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
  }

  private voice: SpeechSynthesisVoice | null = null;
  private enabled = false;

  constructor(
    private readonly lang: string,
    private readonly onSpeakingChange?: (speaking: boolean) => void,
  ) {
    if (!CompanionVoice.supported) return;
    this.pickVoice();
    // Voices often load asynchronously on first use.
    try {
      window.speechSynthesis.addEventListener("voiceschanged", () => this.pickVoice());
    } catch {
      /* some engines fire it only as an assignable handler */
    }
  }

  private pickVoice(): void {
    try {
      const voices = window.speechSynthesis.getVoices();
      const want = this.lang.toLowerCase();
      this.voice =
        voices.find((v) => v.lang?.toLowerCase() === want) ??
        voices.find((v) => v.lang?.toLowerCase().startsWith(want.split("-")[0]!)) ??
        null;
    } catch {
      this.voice = null;
    }
  }

  enable(): void {
    this.enabled = true;
  }

  /** Speak a line, cancelling anything in progress. No-op until enabled / if unsupported. */
  speak(text: string): void {
    if (!this.enabled || !CompanionVoice.supported) return;
    const clean = text.trim();
    if (!clean) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(clean.length > 240 ? clean.slice(0, 240) : clean);
      u.lang = this.lang;
      if (this.voice) u.voice = this.voice;
      u.onstart = () => this.onSpeakingChange?.(true);
      u.onend = () => this.onSpeakingChange?.(false);
      u.onerror = () => this.onSpeakingChange?.(false);
      window.speechSynthesis.speak(u);
    } catch {
      this.onSpeakingChange?.(false);
    }
  }

  stop(): void {
    this.enabled = false;
    if (!CompanionVoice.supported) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
    this.onSpeakingChange?.(false);
  }
}
