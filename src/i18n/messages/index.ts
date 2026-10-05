import type { Locale } from "../config";
import en, { type Messages } from "./en";
import ar from "./ar";
import ur from "./ur";
import id from "./id";
import ms from "./ms";
import tr from "./tr";
import fr from "./fr";

export type { Messages };

const ALL: Record<Locale, Messages> = { en, ar, ur, id, ms, tr, fr };

export function messagesFor(locale: Locale): Messages {
  return ALL[locale];
}
