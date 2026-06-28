/**
 * VoiceCommander — a dedicated, always-listening speech-command channel built on
 * the browser's Web Speech API (`SpeechRecognition`), INDEPENDENT of the Pouchy
 * voice call.
 *
 * Why this exists: the companion voice call (ElevenLabs) mutes the player's mic
 * while the companion is speaking and gates input on conversational turn-taking,
 * so rapid flight commands ("left", "fire") get swallowed. A separate continuous
 * recognizer captures commands reliably regardless of what the companion is doing.
 *
 * It is best-effort: if the API is unavailable (or the mic can't be acquired) it
 * simply no-ops and the game falls back to the companion's own transcript path.
 */

type RecognitionResultLike = { 0?: { transcript?: string }; isFinal?: boolean };
type RecognitionEventLike = { resultIndex: number; results: ArrayLike<RecognitionResultLike> };
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: RecognitionEventLike) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export class VoiceCommander {
  static get supported(): boolean {
    return getCtor() != null;
  }

  private rec: SpeechRecognitionLike | null = null;
  private active = false;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly lang: string,
    private readonly onPhrase: (text: string, isFinal: boolean) => void,
  ) {}

  /** Start continuous listening. Returns false if unsupported. Safe to call twice. */
  start(): boolean {
    if (this.active) return true;
    const Ctor = getCtor();
    if (!Ctor) return false;
    this.active = true;
    this.spinUp(Ctor);
    return true;
  }

  private spinUp(Ctor: RecognitionCtor): void {
    let rec: SpeechRecognitionLike;
    try {
      rec = new Ctor();
    } catch {
      this.active = false;
      return;
    }
    rec.lang = this.lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const txt = r?.[0]?.transcript;
        if (txt) this.onPhrase(txt, r?.isFinal === true);
      }
    };
    rec.onerror = (e) => {
      // Permission / device denials are terminal; transient ones recover via onend.
      if (e?.error === "not-allowed" || e?.error === "service-not-allowed" || e?.error === "audio-capture") {
        this.active = false;
      }
    };
    rec.onend = () => {
      // Mobile recognizers auto-stop after a pause — restart to stay continuous.
      if (!this.active) return;
      if (this.restartTimer) clearTimeout(this.restartTimer);
      this.restartTimer = setTimeout(() => {
        if (!this.active) return;
        try {
          this.rec?.start();
        } catch {
          /* already running / not ready — next onend retries */
        }
      }, 250);
    };
    this.rec = rec;
    try {
      rec.start();
    } catch {
      /* a benign "already started" can throw; ignore */
    }
  }

  stop(): void {
    this.active = false;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    const rec = this.rec;
    this.rec = null;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
    }
  }
}
