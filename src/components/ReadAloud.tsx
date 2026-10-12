"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { pickVoice, sentences } from "@/lib/voices";
import { IconSpeaker } from "./icons";

/** The best-sounding voice the device has for this language, if any ("ur" matches "ur-PK"). */
function voiceFor(lang: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  return pickVoice(window.speechSynthesis.getVoices(), lang);
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return () => {};
  window.speechSynthesis.addEventListener?.("voiceschanged", onChange);
  return () => window.speechSynthesis.removeEventListener?.("voiceschanged", onChange);
}

/**
 * Reads the text aloud with the device's own voice, for people who find
 * reading hard: the most natural voice it has for the language, a sentence
 * at a time. Nothing is sent anywhere. Hidden when the device has no voice
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
  // Each reading has a number; sentences cancelled from an earlier one report
  // back late and must not flip the button.
  const run = useRef(0);

  // Stop when the text changes (a new step) or the page is left.
  useEffect(() => {
    return () => {
      if (current.current) window.speechSynthesis.cancel();
    };
  }, [text]);

  if (!available) return null;

  function toggle() {
    const synth = window.speechSynthesis;
    const id = ++run.current;
    if (speaking) {
      synth.cancel();
      current.current = null;
      setSpeaking(false);
      return;
    }
    synth.cancel();
    const voice = voiceFor(lang);
    const done = () => {
      if (id !== run.current) return;
      current.current = null;
      setSpeaking(false);
    };
    const parts = sentences(text);
    parts.forEach((part, i) => {
      const utterance = new SpeechSynthesisUtterance(part);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }
      utterance.rate = 0.95;
      utterance.onerror = done;
      if (i === parts.length - 1) {
        utterance.onend = done;
        current.current = utterance;
      }
      synth.speak(utterance);
    });
    setSpeaking(parts.length > 0);
  }

  // A small round button beside a heading: the words are its accessible
  // name and tooltip, so it takes no line of its own.
  const label = speaking ? stop : listen;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-pine/30 transition " +
        (speaking ? "bg-pine text-surface" : "bg-pine/5 text-pine hover:bg-pine/10") +
        " " +
        className
      }
    >
      {speaking ? (
        <span className="block h-3 w-3 rounded-[1px] bg-current" aria-hidden />
      ) : (
        <IconSpeaker className="h-5 w-5" />
      )}
    </button>
  );
}

