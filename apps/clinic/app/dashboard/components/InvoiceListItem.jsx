'use client';

import { Button } from '@/components/ui/Button';
import { ChevronRightIcon, DocumentIcon } from '@/components/icons';
import { useI18n } from '@/contexts/I18nContext';

export function InvoiceListItem({ invoice, onClick, formatCurrency }) {
  const { t } = useI18n();
  const patientName =
    invoice.patientId?.name ||
    `${invoice.patientId?.firstName || ''} ${invoice.patientId?.lastName || ''}`.trim() ||
    t('common.unknownPatient');

  const invoiceNumber = invoice.invoiceNumber || invoice._id?.slice(-6) || 'N/A';
  const amount = formatCurrency
    ? formatCurrency(invoice.totalAmount || invoice.amount || 0)
    : `$${invoice.totalAmount || invoice.amount || 0}`;

  const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'No due date';
  const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date();

  return (
    <Button
      type='button'
      variant='ghost'
      size='listRow'
      fullWidth
      align='start'
      className='dashboard-list-item dashboard-list-item-warning group border-0 bg-transparent'
      onClick={onClick}
      aria-label={`${patientName}, Invoice ${invoiceNumber}`}
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-start gap-3 flex-1 min-w-0'>
          {/* Icon */}
          <div className='icon-bg-warning w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0'>
            <DocumentIcon className='icon icon-xs text-status-warning' />
          </div>

          {/* Content */}
          <div className='flex-1 min-w-0'>
            <h4 className='text-body-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1 truncate'>
              {patientName}
            </h4>
            <p className='text-body-xs text-neutral-600 dark:text-neutral-400 mb-1.5 truncate'>
              Invoice #{invoiceNumber}
            </p>
            <div className='flex items-center gap-3 flex-wrap text-body-xs'>
              <span className='font-semibold text-status-warning'>{amount}</span>
              <span className={isOverdue ? 'text-status-error font-medium' : 'text-neutral-500 dark:text-neutral-400'}>
                Due: {dueDate}
              </span>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRightIcon className='icon icon-sm text-neutral-400 group-hover:text-status-warning transition-colors flex-shrink-0' />
      </div>
    </Button>
  );
}
