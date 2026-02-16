'use client';

/**
 * App-wide keyboard shortcuts for fast navigation.
 * g+d = Dashboard, g+q = Queue, g+a = Appointments, / = focus search (when not in input).
 * Must be used inside Layout where router is available.
 */
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

const SEQ_TIMEOUT_MS = 800;

export function useAppKeyboardShortcuts({ onOpenSearch }) {
  const router = useRouter();
  const seqRef = useRef(null);

  const navigate = useCallback(
    (path) => {
      router.push(path);
    },
    [router],
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName);
      const isContentEditable = target?.isContentEditable === true;

      if (isInput || isContentEditable) {
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        if (typeof onOpenSearch === 'function') onOpenSearch();
        return;
      }

      const now = Date.now();
      if (seqRef.current && now - seqRef.current.ts > SEQ_TIMEOUT_MS) {
        seqRef.current = null;
      }

      if (e.key === 'g' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        seqRef.current = { ts: now, key: 'g' };
        e.preventDefault();
        return;
      }

      if (seqRef.current?.key === 'g') {
        if (e.key === 'd') {
          e.preventDefault();
          navigate('/dashboard');
        } else if (e.key === 'q') {
          e.preventDefault();
          navigate('/queue');
        } else if (e.key === 'a') {
          e.preventDefault();
          navigate('/appointments');
        } else if (e.key === 'p') {
          e.preventDefault();
          navigate('/patients');
        }
        seqRef.current = null;
        return;
      }

      seqRef.current = null;
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [navigate, onOpenSearch]);
}
