import type { Locale } from "../config";
import en, { type Messages } from "./en";
import ar from "./ar";
import ur from "./ur";
import bn from "./bn";
import id from "./id";
import ms from "./ms";
import tr from "./tr";
import fr from "./fr";

export type { Messages };

const ALL: Record<Locale, Messages> = { en, ar, ur, bn, id, ms, tr, fr };

export function messagesFor(locale: Locale): Messages {
  return ALL[locale];
}
