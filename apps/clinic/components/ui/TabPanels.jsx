'use client';

import { useEffect, useState } from 'react';
import { getTabPanelId, getTabPanelLabelledBy } from './Tabs.jsx';

/**
 * Tab panels that stay mounted when switching tabs (use display:none for inactive).
 * Avoids remounting and losing state. Only mounts a panel when its tab has been selected at least once.
 *
 * @param {object} props
 * @param {{ id: string }[]} props.tabs - List of tab descriptors (at least id).
 * @param {string} props.activeTab - Currently active tab id.
 * @param {string} [props.idPrefix='tabs'] - Prefix for panel id and aria-labelledby (must match Tabs idPrefix).
 * @param {(tabId: string) => React.ReactNode} props.children - Render prop: (tabId) => content for that tab.
 * @param {string} [props.className] - Optional class for the panels wrapper.
 */
export function TabPanels({ tabs, activeTab, idPrefix = 'tabs', children, className = '' }) {
  const [loadedTabs, setLoadedTabs] = useState(() => new Set([activeTab]));

  useEffect(() => {
    setLoadedTabs((prev) => new Set([...prev, activeTab]));
  }, [activeTab]);

  return (
    <div className={className} data-tab-panels>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const loaded = loadedTabs.has(tab.id);
        const panelId = getTabPanelId(idPrefix, tab.id);
        const labelledBy = getTabPanelLabelledBy(idPrefix, tab.id);

        return (
          <div
            key={tab.id}
            role="tabpanel"
            id={panelId}
            aria-labelledby={labelledBy}
            aria-hidden={!isActive}
            className={isActive ? 'block' : 'hidden'}
            style={{ display: isActive ? 'block' : 'none' }}
          >
            {loaded && typeof children === 'function' ? children(tab.id) : null}
          </div>
        );
      })}
    </div>
  );
}
