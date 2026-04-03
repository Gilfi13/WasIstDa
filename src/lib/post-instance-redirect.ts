const KEY = "postInstanceRedirect";

export function savePostInstanceRedirect(pathWithQuery: string) {
  try {
    sessionStorage.setItem(KEY, pathWithQuery);
  } catch {
    /* ignore */
  }
}

export function consumePostInstanceRedirect(fallback: string): string {
  try {
    const v = sessionStorage.getItem(KEY);
    if (v) {
      sessionStorage.removeItem(KEY);
      return v;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}
