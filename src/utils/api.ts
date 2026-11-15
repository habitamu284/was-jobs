/**
 * Safe JSON parser for fetch responses that prevents 'Unexpected token <' SyntaxError
 * when an upstream gateway, auth cookie proxy, or error page returns HTML instead of JSON.
 */
export async function safeJsonFetch<T = any>(
  res: Response,
  defaultErrorMsg = 'የሰርቨር ግንኙነት ችግር አጋጥሟል። እባክዎ እንደገና ይሞክሩ።'
): Promise<{ ok: boolean; data: T | null; error?: string }> {
  try {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data?.error || data?.message || defaultErrorMsg;
        return { ok: false, data, error: errorMsg };
      }
      return { ok: true, data };
    }

    // Response was not JSON (e.g. HTML 502/503 while server wakes up or 500 error)
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      return {
        ok: false,
        data: null,
        error: 'ሰርቨሩ እየነቃ ነው፤ እባክዎ 15 ሰከንድ ጠብቀው እንደገና ይሞክሩ። (Server is waking up, please wait a moment and retry.)',
      };
    }

    return {
      ok: false,
      data: null,
      error: res.status === 401
        ? 'እባክዎ መጀመሪያ ይግቡ።'
        : defaultErrorMsg,
    };
  } catch (err: any) {
    return {
      ok: false,
      data: null,
      error: defaultErrorMsg,
    };
  }
}
