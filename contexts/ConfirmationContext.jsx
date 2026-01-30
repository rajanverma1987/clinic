'use client';

/**
 * Confirmation context – provides imperative open/close for ConfirmationModal.
 * Use useConfirmation().open({ title, message, onConfirm, variant }) to replace window.confirm.
 */
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { createContext, useCallback, useContext, useState } from 'react';

const ConfirmationContext = createContext(undefined);

const DEFAULT_STATE = {
  isOpen: false,
  title: null,
  message: null,
  confirmLabel: null,
  cancelLabel: null,
  variant: 'danger',
  onConfirm: null,
  confirmLoading: false,
};

export function ConfirmationProvider({ children }) {
  const [state, setState] = useState(DEFAULT_STATE);

  const open = useCallback((options = {}) => {
    setState({
      isOpen: true,
      title: options.title ?? null,
      message: options.message ?? null,
      confirmLabel: options.confirmLabel ?? null,
      cancelLabel: options.cancelLabel ?? null,
      variant: options.variant ?? 'danger',
      onConfirm: options.onConfirm ?? null,
      confirmLoading: false,
    });
  }, []);

  const close = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  const setConfirmLoading = useCallback((loading) => {
    setState((prev) => (prev.isOpen ? { ...prev, confirmLoading: !!loading } : prev));
  }, []);

  const handleConfirm = useCallback(async () => {
    const fn = state.onConfirm;
    if (typeof fn !== 'function') {
      close();
      return;
    }
    const result = fn();
    if (result && typeof result.then === 'function') {
      setConfirmLoading(true);
      try {
        await result;
        close();
      } catch (_e) {
        setConfirmLoading(false);
      } finally {
        setConfirmLoading(false);
      }
    } else {
      close();
    }
  }, [state.onConfirm, close, setConfirmLoading]);

  const value = { open, close, setConfirmLoading };

  return (
    <ConfirmationContext.Provider value={value}>
      {children}
      <ConfirmationModal
        isOpen={state.isOpen}
        onClose={close}
        onConfirm={handleConfirm}
        title={state.title}
        message={state.message}
        confirmLabel={state.confirmLabel}
        cancelLabel={state.cancelLabel}
        variant={state.variant}
        confirmLoading={state.confirmLoading}
      />
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  const ctx = useContext(ConfirmationContext);
  if (ctx === undefined) {
    throw new Error('useConfirmation must be used within ConfirmationProvider');
  }
  return ctx;
}
