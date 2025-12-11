'use client';

import { DocumentIcon, ChevronRightIcon } from '@/components/icons';

export function InvoiceListItem({ invoice, onClick, formatCurrency }) {
  const patientName =
    invoice.patientId?.name ||
    `${invoice.patientId?.firstName || ''} ${invoice.patientId?.lastName || ''}`.trim() ||
    'Unknown Patient';

  const invoiceNumber = invoice.invoiceNumber || invoice._id?.slice(-6) || 'N/A';
  const amount = formatCurrency ? formatCurrency(invoice.totalAmount || invoice.amount || 0) : `$${invoice.totalAmount || invoice.amount || 0}`;

  const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'No due date';
  const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date();

  return (
    <div className="dashboard-list-item dashboard-list-item-warning group" onClick={onClick}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(245, 158, 11, 0.1)' }}
          >
            <DocumentIcon className="w-5 h-5 text-status-warning" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-body-md font-semibold text-neutral-900 mb-1 truncate">
              {patientName}
            </h4>
            <p className="text-body-sm text-neutral-600 mb-2 truncate">
              Invoice #{invoiceNumber}
            </p>
            <div className="flex items-center gap-3 flex-wrap text-body-xs">
              <span className="font-semibold text-status-warning">{amount}</span>
              <span className={isOverdue ? 'text-status-error' : 'text-neutral-500'}>
                Due: {dueDate}
              </span>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRightIcon className="w-5 h-5 text-neutral-400 group-hover:text-status-warning transition-colors flex-shrink-0 ml-2" />
      </div>
    </div>
  );
}
