import type { Unit } from '../../types/unit.types';

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

interface RoomStatsProps {
  units: Unit[];
}

export function RoomStats({ units }: RoomStatsProps) {
  const total = units.length;
  let occupiedRooms = 0;
  let vacantRooms = 0;
  let partiallyFilled = 0;

  units.forEach((u: any) => {
    const assignments = Array.isArray(u.unitAssignments) ? u.unitAssignments : [];
    const occupantCount = assignments.reduce((sum: number, a: any) => sum + 1 + (Array.isArray(a.accompanyingGuests) ? a.accompanyingGuests.length : 0), 0);

    if (occupantCount === 0) vacantRooms += 1;
    else if (occupantCount >= (u.capacity ?? 1)) occupiedRooms += 1;
    else partiallyFilled += 1;
  });

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatCard title="Total Rooms" value={String(total)} subtitle="All rooms and beds in this property" />
      <StatCard title="Occupied" value={String(occupiedRooms)} subtitle="Rooms fully occupied" />
      <StatCard title="Vacant" value={String(vacantRooms)} subtitle="No current occupants" />
      <StatCard title="Partially Filled" value={String(partiallyFilled)} subtitle="Rooms with some occupants remaining" />
    </div>
  );
}
