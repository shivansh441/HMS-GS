import type { ReactNode, KeyboardEvent } from 'react';

interface CardProps {
  children: ReactNode;
  isInactive?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, isInactive, className = '', onClick }: CardProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[1.5rem] relative group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full ${isInactive ? 'opacity-80 grayscale-[20%]' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex justify-between items-start mb-6 ${className}`}>{children}</div>;
};

Card.Body = function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mb-3 flex-1 ${className}`}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex gap-3 mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 ${className}`}>{children}</div>;
};