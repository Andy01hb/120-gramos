// Tiny module-level store for "where to go after the user logs in".
// Used so a guest who taps "pay" returns to checkout after authenticating.
// Module variable (not React state) to avoid render-timing races with RootGuard.

let pending: string | null = null;

export function setPostLoginRedirect(path: string | null): void {
  pending = path;
}

/** Returns the pending redirect (once) and clears it. */
export function takePostLoginRedirect(): string | null {
  const p = pending;
  pending = null;
  return p;
}
