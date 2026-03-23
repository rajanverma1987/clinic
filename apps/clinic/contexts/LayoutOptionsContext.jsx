'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const LayoutOptionsContext = createContext({
  options: {},
  setOptions: () => {},
  isInsideMainLayout: false,
});

/**
 * Provides layout options and marks that we're inside the shared (main) app shell,
 * so nested <Layout> from pages just pass through (no double sidebar).
 */
export function LayoutOptionsProvider({ children }) {
  const [options, setOptionsState] = useState({});
  const setOptions = useCallback((next) => {
    setOptionsState((prev) => (typeof next === 'function' ? next(prev) : { ...prev, ...next }));
  }, []);
  return (
    <LayoutOptionsContext.Provider
      value={{ options, setOptions, isInsideMainLayout: true }}
    >
      {children}
    </LayoutOptionsContext.Provider>
  );
}

export function useLayoutOptionsContext() {
  return useContext(LayoutOptionsContext);
}

/**
 * Call from a page to set layout options (title, subtitle, actionButton, loading, skeleton, etc.).
 * Used when the page is rendered inside the shared (main) layout so Layout can show header/loading.
 */
export function useLayoutOptions(opts) {
  const { setOptions } = useLayoutOptionsContext();
  useEffect(() => {
    if (!opts) return;
    setOptions(opts);
  }, [setOptions, opts?.title, opts?.subtitle, opts?.loading, opts?.loadingText, opts?.actionButton, opts?.skeleton]);
}
