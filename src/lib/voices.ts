/**
 * Choosing a voice for "Listen". Devices list many voices, and the first one
 * for a language is often the worst: Apple devices start English with joke
 * voices ("Albert", "Bad News", "Zarvox") and old robotic ones, Windows with
 * "Microsoft David". The natural-sounding ones (Siri, "Enhanced", "Natural",
 * Google's) are usually there too, further down.
 */

export interface VoiceLike {
  name: string;
  lang: string;
  default?: boolean;
  localService?: boolean;
}

/** Apple's novelty voices: sound effects, not speech. Never used. */
const NOVELTY = [
  "albert",
  "bad news",
  "bahh",
  "bells",
  "boing",
  "bubbles",
  "cellos",
  "deranged",
  "good news",
  "hysterical",
  "jester",
  "organ",
  "pipe organ",
  "superstar",
  "trinoids",
  "whisper",
  "wobble",
  "zarvox",
];

/** Old or deliberately synthetic-sounding voices: used only if nothing else. */
const ROBOTIC = [
  "agnes",
  "bruce",
  "eddy",
  "flo",
  "fred",
  "grandma",
  "grandpa",
  "junior",
  "kathy",
  "princess",
  "ralph",
  "reed",
  "rocko",
  "sandy",
  "shelley",
  "vicki",
  "victoria",
  "microsoft david",
  "microsoft zira",
  "microsoft mark",
  "espeak",
];

/** Apple's standard voices for the site's languages: clear, if not the best. */
const GOOD = [
  "samantha",
  "daniel",
  "karen",
  "moira",
  "tessa",
  "rishi",
  "majed",
  "maged",
  "tarik",
  "lekha",
  "damayanti",
  "amira",
  "yelda",
  "thomas",
  "amélie",
  "amelie",
];

function starts(name: string, list: string[]): boolean {
  return list.some((n) => name === n || name.startsWith(`${n} `) || name.startsWith(`${n}(`));
}

/** Higher is better; -Infinity means never use it. */
export function voiceScore(voice: VoiceLike): number {
  const name = voice.name.toLowerCase().trim();
  if (starts(name, NOVELTY)) return -Infinity;
  let score = 0;
  if (/natural|neural|premium|enhanced/.test(name)) score += 100;
  if (/siri/.test(name)) score += 90;
  if (/google/.test(name)) score += 60;
  if (/online/.test(name)) score += 40;
  if (starts(name, GOOD)) score += 30;
  if (voice.default) score += 10;
  if (starts(name, ROBOTIC) || /espeak|compact/.test(name)) score -= 50;
  return score;
}

/** The best voice for a language ("ur" matches "ur-PK"), or none worth using. */
export function pickVoice<T extends VoiceLike>(voices: readonly T[], lang: string): T | null {
  const want = lang.toLowerCase();
  let best: T | null = null;
  let bestScore = -Infinity;
  for (const voice of voices) {
    const tag = voice.lang.toLowerCase().replace("_", "-");
    if (tag !== want && !tag.startsWith(`${want}-`)) continue;
    const score = voiceScore(voice);
    if (score > bestScore) {
      best = voice;
      bestScore = score;
    }
  }
  return best;
}

/**
 * Text cut into sentences, so the voice pauses where a reader would and long
 * passages are not cut off (some browsers stop a single utterance after
 * about fifteen seconds).
 */
export function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?؟۔।])\s+/u)
    .map((s) => s.trim())
    .filter(Boolean);
}
