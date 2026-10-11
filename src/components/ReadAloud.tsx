"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { IconSpeaker } from "./icons";

/** A voice the device has for this language, if any ("ur" matches "ur-PK"). */
function voiceFor(lang: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang.toLowerCase().replace("_", "-").startsWith(lang)) ?? null;
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return () => {};
  window.speechSynthesis.addEventListener?.("voiceschanged", onChange);
  return () => window.speechSynthesis.removeEventListener?.("voiceschanged", onChange);
}

/**
 * Reads the text aloud with the device's own voice, for people who find
 * reading hard. Nothing is sent anywhere. Hidden when the device has no voice
 * for the page's language, rather than reading Urdu in an English voice.
 */
export default function ReadAloud({
  text,
  lang,
  listen,
  stop,
  className = "",
}: {
  text: string;
  lang: string;
  listen: string;
  stop: string;
  className?: string;
}) {
  const available = useSyncExternalStore(subscribe, () => voiceFor(lang) !== null, () => false);
  const [speaking, setSpeaking] = useState(false);
  const current = useRef<SpeechSynthesisUtterance | null>(null);

  // Stop when the text changes (a new step) or the page is left.
  useEffect(() => {
    return () => {
      if (current.current) window.speechSynthesis.cancel();
    };
  }, [text]);

  if (!available) return null;

  function toggle() {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voiceFor(lang);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }
    utterance.rate = 0.9;
    const done = () => {
      current.current = null;
      setSpeaking(false);
    };
    utterance.onend = done;
    utterance.onerror = done;
    current.current = utterance;
    synth.speak(utterance);
    setSpeaking(true);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={speaking}
      className={
        "inline-flex min-h-[36px] items-center gap-1.5 border border-pine/40 bg-pine/5 px-3 text-sm font-medium text-pine transition hover:bg-pine/10 " +
        className
      }
    >
      <IconSpeaker className="h-4 w-4" />
      {speaking ? stop : listen}
    </button>
  );
}
