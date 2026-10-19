import React from 'react';
import type { Unit } from '../../types/unit.types';

interface RoomCardProps {
  room: Unit;
  isHotel: boolean;
  onView: (room: Unit) => void;
  onEdit: (room: Unit) => void;
  onDelete: (unit: Unit) => void;
  onAssignClick: (room: Unit) => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, isHotel, onView, onEdit, onDelete, onAssignClick }) => {
  const occupied = (room as any).occupied ?? 0;
  const capacity = room.capacity ?? 1;
  const isVacant = occupied === 0;
  const isFull = isHotel ? occupied > 0 : occupied >= capacity;
  const themeColor = isVacant ? 'emerald' : isFull ? 'rose' : 'amber';

  const statusLabel = isVacant ? 'Vacant' : isHotel ? 'Occupied' : isFull ? 'Full' : `${capacity - occupied} Bed Left`;

  const getInitials = (name: string) => name ? name.substring(0, 2).toUpperCase() : '??';

  return (
    <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col relative group hover:-translate-y-1`}>
      <div className={`absolute top-0 left-6 right-6 h-1 rounded-b-md bg-${themeColor}-500 opacity-50`} />
      <div className="flex justify-between items-start mb-6 pt-2">
        <div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{room.unitNumber}</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{room.type} · {room.category}</p>
        </div>
        <div className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border bg-${themeColor}-50 dark:bg-${themeColor}-500/10 text-${themeColor}-600 dark:text-${themeColor}-400 border-${themeColor}-200`}>{statusLabel}</div>
      </div>

      <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Capacity</span>
          <span className="text-xs font-black text-slate-700 dark:text-slate-300">{occupied} / {capacity}</span>
        </div>
        <div className="flex gap-3 justify-center items-center flex-wrap">
          {(room as any).hostelers?.map((occ: any) => (
            <div key={occ.id} className="w-10 h-10 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center text-white font-black text-[10px] shadow-sm">{getInitials(occ.firstName)}</div>
          ))}
          {Array.from({ length: Math.max(0, capacity - occupied) }).map((_, i) => (
            <button key={i} onClick={() => onAssignClick(room)} className="w-10 h-10 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-indigo-500 hover:text-indigo-500 transition-all">
              <i className="fas fa-plus text-xs" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => onView(room)} className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-indigo-600 hover:text-white transition-colors flex items-center justify-center gap-2"><i className="fas fa-eye" /> View</button>
        <button onClick={() => onEdit(room)} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-emerald-500 hover:text-white transition-colors flex items-center justify-center"><i className="fas fa-pen text-xs" /></button>
        <button onClick={() => onDelete(room)} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-rose-500 hover:text-white transition-colors flex items-center justify-center"><i className="fas fa-trash text-xs" /></button>
      </div>
    </div>
  );
};

export default RoomCard;
