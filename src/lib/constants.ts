/** Session cookie name. Kept separate from auth so middleware can import it without Node APIs. */
export const SESSION_COOKIE = "mizan_session";

/**
 * Set beside the session cookie, readable by page scripts, holding only "1":
 * the static public pages use it to offer "Your ledger" instead of "Sign in".
 * It grants nothing; the session cookie stays HttpOnly.
 */
export const SIGNED_IN_HINT = "mizan_signed_in";
