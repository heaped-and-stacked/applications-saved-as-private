// Signing in with Google, in the browser: Google Identity Services, token
// model. ASAP asks only for the drive.file permission and gets a short-lived
// access token. There is no client secret and no server.
//
// Google asks for a new token to be requested from a user action, such as a
// button press, so ASAP only asks when the user presses Sign in or Sync.

const SCRIPT = 'https://accounts.google.com/gsi/client';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
/** Ask for a new token a minute before the old one runs out. */
const MARGIN_MS = 60_000;

// The small part of the Google library ASAP uses.
interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}
interface TokenClient {
  requestAccessToken(override?: { prompt?: string }): void;
}
interface GoogleOAuth {
  initTokenClient(config: {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
    error_callback: (error: { type: string }) => void;
  }): TokenClient;
}
declare global {
  interface Window {
    google?: { accounts: { oauth2: GoogleOAuth } };
  }
}

let loading: Promise<void> | null = null;

/** Loads Google's script once. Called early, so it's ready by the time the user clicks. */
export function loadGoogle(): Promise<void> {
  if (window.google?.accounts) return Promise.resolve();
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error('Google sign-in could not load. Check the connection and try again.'));
    };
    document.head.append(script);
  });
  return loading;
}

export interface GoogleAuth {
  /** A valid access token, asking the user to sign in when there is none. */
  token(): Promise<string>;
  /** Forgets the token (signing out of ASAP, not out of Google). */
  forget(): void;
}

export function googleAuth(clientId: string): GoogleAuth {
  let current: { value: string; expires: number } | null = null;
  let client: TokenClient | null = null;
  let pending: { resolve: (token: string) => void; reject: (error: Error) => void } | null = null;

  function settle(result: string | Error) {
    const waiting = pending;
    pending = null;
    if (!waiting) return;
    if (result instanceof Error) waiting.reject(result);
    else waiting.resolve(result);
  }

  return {
    async token() {
      if (current && Date.now() < current.expires - MARGIN_MS) return current.value;
      await loadGoogle();
      client ??= window.google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPE,
        callback: (response) => {
          if (response.error === 'access_denied') {
            // The user declined the permission (or, while the app is in testing, isn't invited).
            settle(
              new Error(
                "Google didn't give ASAP access to your Drive, so nothing was synced. Sign in again and allow access to sync. Offline mode works without it.",
              ),
            );
            return;
          }
          if (response.error || !response.access_token) {
            settle(new Error(response.error_description || 'Google sign-in did not complete.'));
            return;
          }
          current = { value: response.access_token, expires: Date.now() + (response.expires_in ?? 3600) * 1000 };
          settle(current.value);
        },
        error_callback: (error) =>
          settle(new Error(error.type === 'popup_closed' ? 'Sign-in was closed before it finished.' : 'Google sign-in did not open. Allow pop-ups for this site and try again.')),
      });
      return new Promise<string>((resolve, reject) => {
        pending = { resolve, reject };
        // An empty prompt: Google asks for consent only the first time.
        client!.requestAccessToken({ prompt: '' });
      });
    },
    forget() {
      current = null;
    },
  };
}
