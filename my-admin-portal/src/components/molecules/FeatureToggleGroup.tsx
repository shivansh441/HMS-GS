interface FeatureToggleGroupProps {
  availableFeatures: string[];
  selectedFeatures: string[];
  onToggle: (feature: string) => void;
  hint?: string;
  helperLabel: string;
}

export function FeatureToggleGroup({
  availableFeatures,
  selectedFeatures,
  onToggle,
  hint,
  helperLabel,
}: FeatureToggleGroupProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Features</label>
        <span className="text-xs text-slate-500 dark:text-slate-400">{helperLabel}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {availableFeatures.map((feature) => {
          const active = selectedFeatures.includes(feature);
          return (
            <button
              key={feature}
              type="button"
              onClick={() => onToggle(feature)}
              className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                active
                  ? 'border-indigo-500 bg-indigo-600 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
              }`}
            >
              {feature}
            </button>
          );
        })}
      </div>
      {hint ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  );
}