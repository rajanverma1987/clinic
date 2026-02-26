'use client';

/**
 * Next.js global-error.jsx – replaces the entire root layout when a fatal error occurs.
 * Must include its own <html> and <body>. Catches errors that escape the root error boundary.
 * Auto hard-refreshes on chunk/stale-build errors (same logic as error.jsx and chunk-recovery.js).
 */
import { Button } from '@/components/ui/Button';
import { useEffect } from 'react';

function isChunkOrStaleError(msg) {
  if (!msg || typeof msg !== 'string') return false;
  const s = msg.toLowerCase();
  return (
    s.includes("reading 'call'") ||
    s.includes('chunkloaderror') ||
    (s.includes('loading chunk') && s.includes('failed')) ||
    s.includes('loading css chunk') ||
    s.includes('failed to fetch dynamically imported module') ||
    s.includes('import promise')
  );
}

function tryChunkRecovery() {
  try {
    const KEY = 'chunkReloadAttempted';
    const COOLDOWN_MS = 10000;
    const raw = sessionStorage.getItem(KEY);
    const last = raw ? parseInt(raw, 10) : 0;
    if (Date.now() - last < COOLDOWN_MS) return false;
    sessionStorage.setItem(KEY, String(Date.now()));

    const doReload = () => window.location.reload();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .then(doReload)
        .catch(doReload);
    } else {
      doReload();
    }
    return true;
  } catch (e) {
    return false;
  }
}

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    const msg = error?.message ?? '';
    if (isChunkOrStaleError(msg) && tryChunkRecovery()) return;
  }, [error]);

  const msg = error?.message ?? '';
  const isChunk = isChunkOrStaleError(msg);

  return (
    <html lang='en'>
      <body>
        <div
          style={{
            fontFamily: 'system-ui, sans-serif',
            padding: '2rem',
            maxWidth: '32rem',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            {isChunk ? 'Updating…' : 'Something went wrong'}
          </h1>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            {isChunk
              ? 'The app is refreshing to load the latest version.'
              : 'An unexpected error occurred.'}
          </p>
          {!isChunk && (
            <Button type='button' variant='primary' size='md' onClick={() => reset()}>
              Try again
            </Button>
          )}
        </div>
      </body>
    </html>
  );
}
