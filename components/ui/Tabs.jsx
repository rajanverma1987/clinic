'use client';

import React from 'react';

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className = '',
  variant = 'default',
}) {
  if (variant === 'pills') {
    return (
      <div className={`flex gap-2 overflow-x-auto scrollbar-hide ${className}`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                px-4 py-2 rounded-full font-medium text-body-sm whitespace-nowrap
                ${isActive
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-300'
                }
              `}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-body-xs ${
                  isActive ? 'bg-primary-700' : 'bg-neutral-100'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`border-b border-neutral-200 ${className}`}>
      <nav className="flex space-x-8 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-body-sm whitespace-nowrap
                ${isActive
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }
              `}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-body-xs ${
                  isActive ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

