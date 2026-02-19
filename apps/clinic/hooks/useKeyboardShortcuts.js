import { useEffect } from 'react';

/**
 * Custom hook for keyboard shortcuts
 * @param {Array} shortcuts Array of keyboard shortcut configurations
 * @param {boolean} enabled Whether shortcuts are enabled (default: true)
 */
export function useKeyboardShortcuts(shortcuts, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      const key = e.key;
      if (key == null) return;

      shortcuts.forEach((shortcut) => {
        if (shortcut.key == null) return;
        const ctrlMatch =
          shortcut.ctrlKey !== undefined
            ? shortcut.ctrlKey === e.ctrlKey || shortcut.ctrlKey === e.metaKey
            : true;
        const metaMatch =
          shortcut.metaKey !== undefined
            ? shortcut.metaKey === e.metaKey || shortcut.metaKey === e.ctrlKey
            : true;
        const shiftMatch =
          shortcut.shiftKey !== undefined ? shortcut.shiftKey === e.shiftKey : true;
        const keyMatch = key.toLowerCase() === String(shortcut.key).toLowerCase();

        if (ctrlMatch && metaMatch && shiftMatch && keyMatch) {
          e.preventDefault();
          shortcut.action(e);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}
