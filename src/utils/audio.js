// Audio & Speech Synthesis Utility for the Pokédex
let audioCtx = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function getSoundPreference() {
  if (typeof window === "undefined") return true;
  const saved = localStorage.getItem("pokedex_sound_enabled");
  return saved === null ? true : saved === "true";
}

export function setSoundPreference(enabled) {
  if (typeof window === "undefined") return;
  localStorage.setItem("pokedex_sound_enabled", String(enabled));
}

// 8-bit Pokédex button click beep
export function playPokedexBeep() {
  if (!getSoundPreference()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (err) {
    console.debug("Audio error", err);
  }
}

// Pokédex entry open power-up chime
export function playPokedexOpen() {
  if (!getSoundPreference()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [440, 554.37, 659.25, 880]; // A major arpeggio
    notes.forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * 0.04;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.06, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.14);
    });
  } catch (err) {
    console.debug("Audio error", err);
  }
}

// Pokédex close tone
export function playPokedexClose() {
  if (!getSoundPreference()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [659.25, 440];
    notes.forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * 0.05;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.06, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.1);
    });
  } catch (err) {
    console.debug("Audio error", err);
  }
}

// Pokemon cry player
let currentCryAudio = null;

export function playPokemonCry(pokemonId, cryUrl) {
  if (currentCryAudio) {
    try {
      currentCryAudio.pause();
      currentCryAudio.currentTime = 0;
    } catch (e) {
      void e;
    }
  }

  const url =
    cryUrl ||
    `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokemonId}.ogg`;

  const audio = new Audio(url);
  audio.volume = 0.6;
  currentCryAudio = audio;

  return new Promise((resolve, reject) => {
    audio.onended = () => resolve(true);
    audio.onerror = (e) => {
      // Try fallback to legacy cry
      const fallbackUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/${pokemonId}.ogg`;
      const fallbackAudio = new Audio(fallbackUrl);
      fallbackAudio.volume = 0.6;
      currentCryAudio = fallbackAudio;
      fallbackAudio.onended = () => resolve(true);
      fallbackAudio.onerror = () => reject(e);
      fallbackAudio.play().catch(reject);
    };
    audio.play().catch(reject);
  });
}

export function stopPokemonCry() {
  if (currentCryAudio) {
    try {
      currentCryAudio.pause();
      currentCryAudio.currentTime = 0;
    } catch (e) {
      void e;
    }
    currentCryAudio = null;
  }
}

// Pokédex Speech Synthesis (Voice Assistant)
export function speakDexEntry(text, onStart, onEnd) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  window.speechSynthesis.cancel();

  // Clean up any text formatting artifacts
  const cleanText = text
    .replace(/\f/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 1.0;
  utterance.pitch = 0.95; // Slightly robotic/dexter-like

  // Find a clear English voice if available
  const voices = window.speechSynthesis.getVoices();
  const englishVoice =
    voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Daniel"))) ||
    voices.find((v) => v.lang.startsWith("en"));
  if (englishVoice) {
    utterance.voice = englishVoice;
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  utterance.onerror = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
