import React, { useContext, useEffect, useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Bed, ArrowRight, CheckCircle2, Clock, XCircle, X, Receipt, CreditCard } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/src/lib/gsap';

const mockBookings = [
  {
    id: 'BKG-2024-001',
    property: 'Maharana Pratap Hostel',
    location: 'Malviya Nagar, Jaipur',
    roomType: 'Single Deluxe',
    checkIn: '2024-09-01',
    checkOut: '2025-06-30',
    status: 'active',
    amount: '₹12,000/month'
  },
  {
    id: 'BKG-2023-089',
    property: 'Maharana Pratap Premium',
    location: 'Raja Park, Jaipur',
    roomType: 'Double Sharing',
    checkIn: '2023-07-15',
    checkOut: '2024-05-30',
    status: 'completed',
    amount: '₹8,500/month'
  }
];

export default function MyBookings() {
  const user = useAppStore((state) => state.user);
  const navigate = useNavigate();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useGSAP(() => {
    gsap.fromTo('.booking-card', 
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
    );
  });

  const openModal = (booking: any) => {
    setSelectedBooking(booking);
    // Use setTimeout to ensure the DOM elements are rendered before animating
    setTimeout(() => {
      gsap.fromTo(modalRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      gsap.fromTo(modalContentRef.current, { y: 50, scale: 0.95, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.4, ease: 'power3.out', delay: 0.1 });
    }, 10);
  };

  const closeModal = () => {
    gsap.to(modalContentRef.current, { y: 20, scale: 0.95, opacity: 0, duration: 0.3, ease: 'power3.in' });
    gsap.to(modalRef.current, { opacity: 0, duration: 0.3, delay: 0.1, onComplete: () => setSelectedBooking(null) });
  };

  if (!user) return null;

  return (
    <div className="pt-24 pb-24 bg-transparent min-h-screen transition-colors duration-500 relative px-6 md:px-12 lg:px-16">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 w-full">
        <div className="mb-16">
          <h1 className="text-5xl md:text-7xl font-display font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none mb-6">
            MY <span className="text-primary">BOOKINGS.</span>
          </h1>
          <p className="text-xl text-zinc-500 dark:text-zinc-400 font-light">
            Manage your stays and view your booking history.
          </p>
        </div>

        <div className="space-y-6">
          {mockBookings.map((booking, i) => (
            <div key={i} className="booking-card bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-white/10 rounded-[32px] p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
              <div className="space-y-6 flex-1">
                <div className="flex items-center gap-4">
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${
                    booking.status === 'active' 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                      : booking.status === 'completed'
                      ? 'bg-zinc-100 text-zinc-600 dark:bg-white/5 dark:text-zinc-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                  }`}>
                    {booking.status === 'active' && <CheckCircle2 size={12} />}
                    {booking.status === 'completed' && <Clock size={12} />}
                    {booking.status === 'cancelled' && <XCircle size={12} />}
                    {booking.status}
                  </div>
                  <span className="text-sm font-mono text-zinc-400 dark:text-zinc-500">{booking.id}</span>
                </div>

                <div>
                  <h3 className="text-2xl md:text-3xl font-display font-bold text-zinc-900 dark:text-white uppercase tracking-tight mb-2">{booking.property}</h3>
                  <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                    <MapPin size={16} />
                    <span className="text-sm">{booking.location}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 pt-4 border-t border-zinc-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-900 dark:text-white">
                      <Bed size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Room Type</p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">{booking.roomType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-900 dark:text-white">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Duration</p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">{booking.checkIn} to {booking.checkOut}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-auto flex flex-col items-start md:items-end gap-6 md:pl-8 md:border-l border-zinc-100 dark:border-white/5">
                <div className="text-left md:text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Total Amount</p>
                  <p className="text-3xl font-display font-black text-primary">{booking.amount}</p>
                </div>
                <button 
                  onClick={() => openModal(booking)}
                  className="w-full md:w-auto flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                >
                  View Details
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Overlay */}
      <div 
        ref={modalRef} 
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm ${selectedBooking ? 'pointer-events-auto' : 'pointer-events-none opacity-0'}`}
        onClick={closeModal}
      >
        <div 
          ref={modalContentRef}
          className="bg-white dark:bg-[#18181B] w-full max-w-3xl rounded-[40px] overflow-hidden shadow-2xl shadow-black/20 border border-zinc-200 dark:border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {selectedBooking && (
            <div className="flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-8 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-[#18181B]/80 backdrop-blur-md z-10">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">{selectedBooking.id}</span>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${
                      selectedBooking.status === 'active' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                        : selectedBooking.status === 'completed'
                        ? 'bg-zinc-100 text-zinc-600 dark:bg-white/5 dark:text-zinc-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                    }`}>
                      {selectedBooking.status === 'active' && <CheckCircle2 size={10} />}
                      {selectedBooking.status === 'completed' && <Clock size={10} />}
                      {selectedBooking.status === 'cancelled' && <XCircle size={10} />}
                      {selectedBooking.status}
                    </div>
                  </div>
                  <h2 className="text-3xl font-display font-black text-zinc-900 dark:text-white uppercase tracking-tight">{selectedBooking.property}</h2>
                </div>
                <button 
                  onClick={closeModal}
                  className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 overflow-y-auto">
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Location</p>
                      <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-medium">
                        <MapPin size={16} className="text-primary" />
                        {selectedBooking.location}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Room Details</p>
                      <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-medium">
                        <Bed size={16} className="text-primary" />
                        {selectedBooking.roomType}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Stay Duration</p>
                      <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-medium">
                        <Calendar size={16} className="text-primary" />
                        {selectedBooking.checkIn} to {selectedBooking.checkOut}
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-50 dark:bg-white/5 rounded-[24px] p-6 border border-zinc-100 dark:border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Payment Summary</p>
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500 dark:text-zinc-400">Monthly Rent</span>
                        <span className="font-medium text-zinc-900 dark:text-white">{selectedBooking.amount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500 dark:text-zinc-400">Security Deposit</span>
                        <span className="font-medium text-zinc-900 dark:text-white">₹12,000</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500 dark:text-zinc-400">Maintenance</span>
                        <span className="font-medium text-zinc-900 dark:text-white">Included</span>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-zinc-200 dark:border-white/10 flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-white">Total Paid</span>
                      <span className="text-2xl font-display font-black text-primary">₹24,000</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <button className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-4 rounded-full text-xs font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95">
                    <Receipt size={16} />
                    Download Invoice
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-6 py-4 rounded-full text-xs font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20">
                    <CreditCard size={16} />
                    Pay Next Month
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
