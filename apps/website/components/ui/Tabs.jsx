'use client';

export function Tabs({ tabs, activeTab, onChange, className = '', variant = 'default' }) {
  if (variant === 'pills') {
    return (
      <div className={`w-full flex gap-2 overflow-x-auto scrollbar-hide ${className}`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              type='button'
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                px-4 py-2 rounded-full font-medium text-body-sm whitespace-nowrap
                ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-600 hover:border-neutral-300 dark:hover:border-neutral-500'
                }
              `}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`ml-1.5 px-1.5 py-0.5 rounded-full text-body-xs ${
                    isActive ? 'bg-primary-700' : 'bg-neutral-100 dark:bg-neutral-700'
                  }`}
                >
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
    <div className={`w-full border-b border-neutral-200 dark:border-neutral-600 ${className}`}>
      <nav className='w-full flex flex-wrap items-center gap-x-6 gap-y-1 overflow-x-auto scrollbar-hide py-2'>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              type='button'
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                py-2 px-1 border-b-2 font-medium text-body-sm whitespace-nowrap
                ${
                  isActive
                    ? 'border-primary-500 text-primary-500 dark:text-primary-300'
                    : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-500'
                }
              `}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-body-xs ${
                    isActive ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
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
