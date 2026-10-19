import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import type { Account } from '../../types/account.types';
import { ResidentCard } from './ResidentCard';

interface ResidentGridProps {
  residents: Account[];
  currentUser: Account | null;
  onEdit: (resident: Account) => void;
  onDelete: (resident: Account) => void;
  canEdit: (viewer: Account | null, resident: Account) => boolean;
  canDelete: (viewer: Account | null, resident: Account) => boolean;
}

export function ResidentGrid({ residents, currentUser, onEdit, onDelete, canEdit, canDelete }: ResidentGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out' }
      );
    },
    { dependencies: [residents] }
  );

  if (residents.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800/40">
        <i className="fas fa-user-friends text-3xl" />
        <p className="mt-3 text-lg font-semibold">No residents match the current filters.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {residents.map((resident) => (
        <ResidentCard
          key={resident.id}
          resident={resident}
          canEdit={canEdit(currentUser, resident)}
          canDelete={canDelete(currentUser, resident)}
          onEdit={() => onEdit(resident)}
          onDelete={() => onDelete(resident)}
        />
      ))}
    </div>
  );
}
