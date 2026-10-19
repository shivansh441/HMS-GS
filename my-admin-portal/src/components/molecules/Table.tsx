import React from 'react';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(({ children, className = '', ...props }, ref) => (
  <div className="overflow-x-auto">
    <table ref={ref} className={`w-full min-w-[1000px] border-collapse text-left ${className}`.trim()} {...props}>
      {children}
    </table>
  </div>
));
Table.displayName = 'Table';

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(({ children, className = '', ...props }, ref) => (
  <thead ref={ref} className={`bg-slate-50 dark:bg-slate-800/80 ${className}`.trim()} {...props}>
    {children}
  </thead>
));
TableHeader.displayName = 'TableHeader';

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
  isActive?: boolean;
}

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(({ children, isActive = false, className = '', ...props }, ref) => (
  <tr
    ref={ref}
    className={`transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${isActive ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''} ${className}`.trim()}
    {...props}
  >
    {children}
  </tr>
));
TableRow.displayName = 'TableRow';

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableHeaderCellElement> {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export const TableHead = React.forwardRef<HTMLTableHeaderCellElement, TableHeadProps>(({ children, align = 'left', className = '', ...props }, ref) => {
  const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

  return (
    <th ref={ref} className={`p-5 text-xs font-black uppercase tracking-wider text-slate-500 ${alignClass} ${className}`.trim()} {...props}>
      {children}
    </th>
  );
});
TableHead.displayName = 'TableHead';

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(({ children, align = 'left', className = '', ...props }, ref) => {
  const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

  return (
    <td ref={ref} className={`p-5 ${alignClass} ${className}`.trim()} {...props}>
      {children}
    </td>
  );
});
TableCell.displayName = 'TableCell';
