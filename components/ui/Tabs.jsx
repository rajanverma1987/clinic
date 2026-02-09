'use client';

import { useCallback, useRef } from 'react';

/**
 * Accessible tab list. Use idPrefix for stable ids (tab panels should use role="tabpanel" and aria-labelledby={`${idPrefix}-tab-${activeTab}`}).
 */
export function Tabs({
  tabs,
  activeTab,
  onChange,
  className = '',
  variant = 'default',
  idPrefix = 'tabs',
  ariaLabel = 'Tabs',
}) {
  const tabListRef = useRef(null);
  const tabIds = tabs.map((t) => t.id);
  const currentIndex = tabIds.indexOf(activeTab);

  const handleKeyDown = useCallback(
    (e) => {
      if (!tabListRef.current || tabIds.length === 0) return;
      let nextIndex = currentIndex;
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          nextIndex = currentIndex <= 0 ? tabIds.length - 1 : currentIndex - 1;
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          nextIndex = currentIndex >= tabIds.length - 1 ? 0 : currentIndex + 1;
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = tabIds.length - 1;
          break;
        default:
          return;
      }
      onChange(tabIds[nextIndex]);
      const nextEl = tabListRef.current.querySelector(
        `[id="${idPrefix}-tab-${tabIds[nextIndex]}"]`,
      );
      if (nextEl) nextEl.focus();
    },
    [currentIndex, tabIds, onChange, idPrefix],
  );

  const tabListClass =
    variant === 'pills'
      ? 'w-full flex gap-x-4 gap-y-1 overflow-x-auto scrollbar-hide py-1.5 border-b border-neutral-200 dark:border-neutral-600'
      : 'w-full flex flex-wrap items-center gap-x-4 gap-y-1 overflow-x-auto scrollbar-hide py-1.5';

  const nav = (
    <nav
      ref={tabListRef}
      role='tablist'
      aria-label={ariaLabel}
      className={tabListClass}
      onKeyDown={handleKeyDown}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const tabId = `${idPrefix}-tab-${tab.id}`;
        return (
          <button
            type='button'
            key={tab.id}
            id={tabId}
            role='tab'
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={
              isActive
                ? 'py-1.5 px-1 border-b-2 border-primary-500 text-primary-500 dark:text-primary-300 font-medium text-body-sm whitespace-nowrap'
                : 'py-1.5 px-1 border-b-2 border-transparent text-neutral-500 dark:text-neutral-400 font-medium text-body-sm whitespace-nowrap hover:text-neutral-700 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-500'
            }
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-body-xs ${
                  isActive
                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                    : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  if (variant === 'pills') {
    return <div className={`w-full ${className}`}>{nav}</div>;
  }

  return (
    <div className={`w-full border-b border-neutral-200 dark:border-neutral-600 ${className}`}>
      {nav}
    </div>
  );
}

/** Id for a tab panel that matches Tabs idPrefix. Use with role="tabpanel" aria-labelledby={getTabPanelLabelledBy(idPrefix, activeTab)} */
export function getTabPanelId(idPrefix, tabId) {
  return `${idPrefix}-panel-${tabId}`;
}

/** aria-labelledby value for the active tab panel */
export function getTabPanelLabelledBy(idPrefix, tabId) {
  return `${idPrefix}-tab-${tabId}`;
}
