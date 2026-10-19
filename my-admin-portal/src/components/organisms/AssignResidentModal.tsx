import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { fetchAccountsApi, fetchPendingReservationsApi, createAssignmentApi } from '../../services/propertyService.js';

interface AssignOccupantModalProps {
  show: boolean;
  room: any | null;
  isHotel: boolean;
  propertyId: number | null;
  token?: string;
  onClose: () => void;
  onAssigned?: () => void;
}

const AssignResidentModal: React.FC<AssignOccupantModalProps> = ({ show, room, isHotel, propertyId, token, onClose, onAssigned }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [occupantType, setOccupantType] = useState<'HOSTELER' | 'GUEST'>(isHotel ? 'GUEST' : 'HOSTELER');
  const [selectedId, setSelectedId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [unassignedResidents, setUnassignedResidents] = useState<any[]>([]);
  const [pendingGuests, setPendingGuests] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedRate, setAgreedRate] = useState('');
  const [useCustomRate, setUseCustomRate] = useState(false);

  useEffect(() => {
    if (show) {
      setOccupantType(isHotel ? 'GUEST' : 'HOSTELER');
      setSelectedId('');
      setSearchQuery('');
      setUseCustomRate(false);
      const defaultRate = isHotel ? room?.defaultPricePerNight : room?.defaultRecurringMonthlyRate;
      setAgreedRate(defaultRate == null ? '' : String(defaultRate));
      gsap.fromTo(modalRef.current, { opacity: 0, scale: 0.95, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'power3.out' });
    }
  }, [show, isHotel]);

  const handleClose = () => {
    if (isSubmitting) return;
    gsap.to(modalRef.current, { opacity: 0, scale: 0.95, y: 10, duration: 0.2, onComplete: onClose });
  };

  const handleTabSwitch = (type: 'HOSTELER' | 'GUEST') => {
    setOccupantType(type);
    setSelectedId('');
    setSearchQuery('');
  };

  useEffect(() => {
    if (!show || !propertyId) return;

    // fetch candidate accounts and pending reservations
    (async () => {
      try {
        const accounts = await fetchAccountsApi(token);
        setUnassignedResidents(accounts ?? []);
      } catch (e) {
        setUnassignedResidents([]);
      }

      try {
        const reservations = await fetchPendingReservationsApi(propertyId, token);
        setPendingGuests(reservations ?? []);
      } catch (e) {
        setPendingGuests([]);
      }
    })();
  }, [show, propertyId, token]);

  if (!show || !room) return null;

  const currentList = occupantType === 'HOSTELER' ? unassignedResidents : pendingGuests;
  const filteredList = currentList.filter(person => {
    const fullName = occupantType === 'HOSTELER' ? `${person.firstName} ${person.lastName}` : person.name;
    const query = searchQuery.toLowerCase();
    return fullName.toLowerCase().includes(query) || (person.idNumber && person.idNumber.toLowerCase().includes(query));
  });

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:pl-72">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleClose} />
      <div ref={modalRef} className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white"><i className="fas fa-bed" /></div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{isHotel ? 'Check-In Guest' : 'Assign Occupant'}</h2>
              <p className="text-xs font-bold text-slate-500">To Room {room.unitNumber || room.number}</p>
            </div>
          </div>
          <button type="button" onClick={handleClose} disabled={isSubmitting} className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition-colors shadow-sm"><i className="fas fa-times" /></button>
        </div>

        <div className="p-6 flex flex-col overflow-hidden h-full">
          {!isHotel && (
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 shrink-0">
              <button type="button" onClick={() => handleTabSwitch('HOSTELER')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${occupantType === 'HOSTELER' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Resident</button>
              <button type="button" onClick={() => handleTabSwitch('GUEST')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${occupantType === 'GUEST' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Guest</button>
            </div>
          )}

          {currentList.length > 0 ? (
            <>
              <div className="relative mb-4 shrink-0">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input type="text" placeholder={`Search ${occupantType === 'HOSTELER' ? 'residents' : 'guests'} by name or ID...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 transition-all text-sm font-bold dark:text-white" disabled={isSubmitting} />
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-700 rounded-xl min-h-[200px]">
                {filteredList.length > 0 ? (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {filteredList.map(person => {
                      const isSelected = selectedId === String(person.id);
                      const fullName = occupantType === 'HOSTELER' ? `${person.firstName} ${person.lastName}` : person.name;

                      return (
                        <li key={person.id} onClick={() => !isSubmitting && setSelectedId(String(person.id))} className={`p-3 cursor-pointer transition-colors flex items-center justify-between ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${isSelected ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}>{fullName.substring(0,2).toUpperCase()}</div>
                            <div>
                              <p className={`text-sm font-bold ${isSelected ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>{fullName}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">ID: {person.idNumber || 'N/A'}</p>
                            </div>
                          </div>
                          {isSelected && <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px]"><i className="fas fa-check" /></div>}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="p-8 text-center text-slate-400"><i className="fas fa-search text-2xl mb-2 opacity-50" /><p className="text-sm font-bold">No results found.</p></div>
                )}
              </div>
            </>
          ) : (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-400 text-sm font-bold text-center mt-4">No pending {occupantType === 'HOSTELER' ? 'residents' : 'guests'} available. <br/><span className="font-normal text-xs opacity-80">Please register a new one first.</span></div>
          )}

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{isHotel ? 'Nightly rate' : 'Monthly rate'}</label>
            <input type="number" min="0" step="0.01" value={agreedRate} readOnly={!useCustomRate} onChange={(event) => setAgreedRate(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" placeholder={isHotel ? 'Enter nightly rate' : 'Enter monthly rate'} />
            <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={useCustomRate} onChange={(event) => { const enabled = event.target.checked; setUseCustomRate(enabled); if (!enabled) { const defaultRate = isHotel ? room.defaultPricePerNight : room.defaultRecurringMonthlyRate; setAgreedRate(defaultRate == null ? '' : String(defaultRate)); } }} className="h-4 w-4 accent-indigo-600" />
              Use custom rate for this guest
            </label>
          </div>
        </div>

          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex gap-3 shrink-0">
          <button type="button" onClick={handleClose} disabled={isSubmitting} className="flex-1 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={async () => {
            if (!propertyId || !room) return;
            const numericRate = Number(agreedRate);
            if (!Number.isFinite(numericRate) || numericRate <= 0) {
              alert(`Enter a valid ${isHotel ? 'nightly' : 'monthly'} rate before assigning this guest.`);
              return;
            }
            setIsSubmitting(true);
            try {
              await createAssignmentApi(propertyId, { unitId: Number(room.id), accountId: Number(selectedId), expectedCheckIn: new Date().toISOString(), expectedCheckOut: null, ...(isHotel ? { agreedPricePerNight: numericRate } : { agreedMonthlyRate: numericRate }) }, token);
              setIsSubmitting(false);
              onAssigned?.();
              handleClose();
            } catch (e: any) {
              console.error('Assignment failed', e);
              setIsSubmitting(false);
              // show a simple alert for now
              alert(e?.message || 'Assignment failed.');
            }
          }} disabled={isSubmitting || !selectedId} className={`flex-1 py-3.5 text-white rounded-xl font-bold shadow-md transition-all disabled:opacity-50 ${occupantType === 'HOSTELER' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-500 hover:bg-emerald-600'}`}>{isSubmitting ? 'Processing...' : (isHotel ? 'Check In Room' : 'Assign to Room')}</button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default AssignResidentModal;
