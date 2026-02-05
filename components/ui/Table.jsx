'use client';

/**
 * Table subcomponents – styled by .clinic-table in globals.css when used inside <table className="clinic-table">.
 * TableHeader / TableHeaderRow / TableHeaderCell: no inline styles so .clinic-table thead/th apply.
 * TableRow: optional selected state; TableCell: pass className for overrides.
 */
export function TableHeader({ children, className = '', ...props }) {
  return (
    <thead className={className} {...props}>
      {children}
    </thead>
  );
}

export function TableHeaderRow({ children, className = '', ...props }) {
  return (
    <tr className={className} {...props}>
      {children}
    </tr>
  );
}

export function TableHeaderCell({ children, className = '', ...props }) {
  return (
    <th className={className} {...props}>
      {children}
    </th>
  );
}

export function TableBody({ children, className = '', ...props }) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  );
}

/** Row: .clinic-table styles border/hover; add selected and onClick when needed. */
export function TableRow({ children, className = '', selected = false, onClick, ...props }) {
  const selectedClasses = selected
    ? '!bg-primary-100 dark:!bg-primary-900/40 border-l-[3px] border-l-primary-500'
    : '';
  return (
    <tr className={`${selectedClasses} ${className}`.trim()} onClick={onClick} {...props}>
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '', ...props }) {
  return (
    <td className={className} {...props}>
      {children}
    </td>
  );
}

/**
 * Table Component - Clinic Theme
 * Follows theme specifications for tables
 *
 * Supports two usage patterns:
 * 1. Children-based: <Table><thead>...</thead></Table>
 * 2. Data-driven: <Table data={[]} columns={[]} />
 */
export function Table({
  children,
  className = '',
  data,
  columns,
  emptyMessage = 'No data available',
  onRowClick,
  loading,
  ...rest
}) {
  // Don't pass loading to DOM (native <table> has no loading attribute); use data-loading and aria-busy only
  const tableProps = {
    ...rest,
    'data-loading': loading ? 'true' : undefined,
    'aria-busy': loading === true ? true : loading === false ? false : undefined,
  };
  if ('loading' in tableProps) delete tableProps.loading;
  // Data-driven table rendering – uses global .clinic-table design
  if (data !== undefined && columns !== undefined) {
    return (
      <div className={`clinic-table-wrap ${className}`.trim()}>
        <table className='clinic-table' {...tableProps}>
          <TableHeader>
            <TableHeaderRow>
              {columns.map((column, index) => (
                <TableHeaderCell key={index} className={column.headerClassName}>
                  {column.header}
                </TableHeaderCell>
              ))}
            </TableHeaderRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow data-empty>
                <TableCell colSpan={columns.length}>{emptyMessage}</TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => (
                <TableRow
                  key={row._id || row.id || rowIndex}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex} className={column.cellClassName}>
                      {typeof column.accessor === 'function'
                        ? column.accessor(row)
                        : row[column.accessor] || ''}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </table>
      </div>
    );
  }

  // Children-based table rendering (backward compatibility)
  return (
    <div className={`clinic-table-wrap ${className}`.trim()}>
      <table className='clinic-table' {...tableProps}>
        {children}
      </table>
    </div>
  );
}

// Export default Table component
export default Table;
