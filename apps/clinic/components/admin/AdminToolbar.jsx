'use client';

/**
 * Admin list toolbar: intro (optional) + search + filters + actions.
 * Uses design-system classes: admin-toolbar-intro, admin-toolbar, admin-toolbar__filters,
 * admin-toolbar__search-wrap, admin-toolbar__select, admin-toolbar__actions.
 * Use for consistent search and filter design across admin pages.
 */
import { SearchIcon } from '@/components/icons';
import { Input } from '@/components/ui/Input';

export function AdminToolbar({
  intro,
  searchValue = '',
  onSearchChange,
  searchPlaceholder,
  searchAriaLabel,
  filters,
  actions,
  className = '',
}) {
  return (
    <>
      {intro != null && intro !== '' && (
        <p className='admin-toolbar-intro' data-admin-toolbar-intro>
          {intro}
        </p>
      )}
      <div className={`admin-toolbar ${className}`.trim()} role='search' data-admin-toolbar>
        <div className='admin-toolbar__filters'>
          {(onSearchChange != null || searchPlaceholder != null) && (
            <div className='admin-toolbar__search-wrap'>
              <SearchIcon className='icon icon-sm admin-toolbar__search-icon' aria-hidden />
              <Input
                type='text'
                value={searchValue}
                onChange={onSearchChange}
                placeholder={searchPlaceholder}
                aria-label={searchAriaLabel || searchPlaceholder || 'Search'}
                className='admin-toolbar__search-input form-control-height form-control-md pl-[2.5rem]'
                variant='default'
                size='md'
              />
            </div>
          )}
          {Array.isArray(filters) &&
            filters.map((node, i) => (
              <div key={node.key ?? i} className='admin-toolbar__select'>
                {node}
              </div>
            ))}
        </div>
        {actions != null && <div className='admin-toolbar__actions'>{actions}</div>}
      </div>
    </>
  );
}
