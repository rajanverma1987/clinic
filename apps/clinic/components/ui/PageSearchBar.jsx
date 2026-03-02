'use client';

/**
 * Standard search bar pattern used across list pages (admin and clinic).
 * Layout: [ Search icon + input ] [ Search button ] [ optional right slot e.g. Advanced search ].
 */
import { SearchIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useI18n } from '@/contexts/I18nContext';

export function PageSearchBar({
  value,
  onChange,
  onSearch,
  placeholder,
  searchButtonLabel,
  className = '',
  children,
  ...inputProps
}) {
  const { t } = useI18n();

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch?.();
    }
  };

  return (
    <Card className={`mb-6 ${className}`}>
      <div className='p-4'>
        <div className='flex flex-col sm:flex-row gap-3'>
          <div className='flex-1 flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500'>
            <SearchIcon className='icon icon-sm ml-3 text-neutral-400' ariaHidden />
            <Input
              type='text'
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange?.(e)}
              onKeyPress={handleKeyPress}
              variant='borderless'
              className='min-w-0'
              {...inputProps}
            />
          </div>
          <div className='flex gap-2 shrink-0'>
            <Button variant='primary' size='md' onClick={() => onSearch?.()}>
              {searchButtonLabel ?? t('common.search')}
            </Button>
            {children}
          </div>
        </div>
      </div>
    </Card>
  );
}
