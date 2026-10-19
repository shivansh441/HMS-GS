interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  fullHeight?: boolean;
}

export function EmptyState({ icon = '🏢', title, description, fullHeight = false }: EmptyStateProps) {
  return (
    <div className={fullHeight ? "flex items-center justify-center h-[70vh]" : "text-center py-12"}>
      <div className={fullHeight ? "text-center" : ""}>
        <div className="mb-4 text-6xl">{icon}</div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-slate-500">{description}</p>
      </div>
    </div>
  );
}
