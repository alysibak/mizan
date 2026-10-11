/**
 * Matching typed words against answers in any of the site's languages, the
 * way people type on a phone: without accents, harakat, or the exact letter
 * forms (أ/إ/ا, ى/ي, ک/ك, ہ/ه).
 */

/** Text folded for matching: lower case, no marks, one form of each letter. */
export function foldText(text: string, locale = "en"): string {
  return text
    .toLocaleLowerCase(locale === "tr" ? "tr" : undefined)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ـ/g, "") // tatweel
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[ىیئےۓ]/g, "ي")
    .replace(/ک/g, "ك")
    .replace(/[ہةۃھ]/g, "ه")
    .replace(/ı/g, "i")
    .replace(/[’'‘`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export interface Searchable {
  /** The question or label, which matters most. */
  title: string;
  /** The answer. */
  body: string;
}

/** A word and, for Arabic, the word without its joined prefixes (و ف ب ك ل ال). */
function stems(word: string): string[] {
  const bare = word.replace(/^[وف]?(?:[بكل]?ال|لل|[بكل])/, "");
  return bare && bare !== word ? [word, bare] : [word];
}

/**
 * A typed word, and for Arabic script the word without a leading "the" (ال)
 * and without a last vowel letter, so سونا also finds سونے. Never shorter
 * than three letters, which would match too much.
 */
function typedForms(word: string): string[] {
  const forms = new Set([word]);
  const bare = word.replace(/^[وف]?(?:[بكل]?ال|لل)/, "");
  if (bare.length > 1) forms.add(bare);
  for (const form of [...forms]) {
    const cut = form.replace(/[ايه]$/, "");
    if (cut.length >= 3) forms.add(cut);
  }
  return [...forms];
}

/** Whether some word of `text` begins with `word`, so "or" finds "or" but not "pour". */
function hasWord(text: string[], word: string): boolean {
  const typed = typedForms(word);
  return text.some((t) => stems(t).some((s) => typed.some((w) => s.startsWith(w))));
}

/**
 * Entries with a word beginning with each typed word, those that name it in
 * the title first. Words of one letter are ignored; an empty query matches
 * nothing.
 */
export function searchEntries<T extends Searchable>(entries: T[], query: string, locale = "en"): T[] {
  const words = foldText(query, locale)
    .split(" ")
    .filter((w) => w.length > 1);
  if (words.length === 0) return [];
  const scored: { entry: T; score: number; index: number }[] = [];
  entries.forEach((entry, index) => {
    const title = foldText(entry.title, locale).split(" ");
    const all = [...title, ...foldText(entry.body, locale).split(" ")];
    if (!words.every((w) => hasWord(all, w))) return;
    const score = words.filter((w) => hasWord(title, w)).length;
    scored.push({ entry, score, index });
  });
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.map((s) => s.entry);
}
