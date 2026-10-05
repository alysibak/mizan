/** Default ceiling for a JSON request body. Backup restore passes its own. */
export const MAX_JSON_BYTES = 64 * 1024;
/** A full backup with years of giving fits comfortably under this. */
export const MAX_BACKUP_BYTES = 8 * 1024 * 1024;

/**
 * Parse a JSON body, reading at most `maxBytes`. Returns null for a body that
 * is missing, malformed, or too large, so routes answer 400 instead of
 * buffering whatever a client chooses to send.
 */
export async function readJson(request: Request, maxBytes = MAX_JSON_BYTES): Promise<unknown> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  if (!request.body) return null;

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}
