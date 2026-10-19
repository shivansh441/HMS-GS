export interface AvatarProps {
  src?: string;
  name?: string;
  colorClass?: string;
  isInactive?: boolean;
  className?: string;
}

export function Avatar({ src, name, colorClass, isInactive, className }: AvatarProps) {
  const initials = !name
    ? "A"
    : name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

  const defaultBg = "bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-indigo-500/30";
  const bgStyle = colorClass || defaultBg;

  return (
    <div className={`relative w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-lg group-hover:scale-105 transition-transform overflow-hidden ${bgStyle} ${isInactive ? 'opacity-50 grayscale' : ''} ${className || ''}`}>
      {src ? (
        <img src={src} alt={name || "Avatar"} className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}