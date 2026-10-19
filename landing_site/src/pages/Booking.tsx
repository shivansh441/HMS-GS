import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Users, MapPin, CheckCircle2, ArrowRight, Sparkles, ChevronRight, Bed, Coffee, ShieldCheck, Building2, Hotel, UserCircle, Loader2, ChevronLeft } from 'lucide-react';
import Navbar from '@/src/components/Navbar';
import { cn } from '@/src/lib/utils';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/src/lib/gsap';
import { useAuthStore } from '../store/useAuthStore';
import { usePropertyStore, Property, Unit } from '../store/usePropertyStore';
import { useNavigate } from 'react-router-dom';
import { getRoomImage } from '../constants/roomImages';

const steps = [
  { id: 1, name: 'Property', icon: Building2 },
  { id: 2, name: 'Room', icon: Bed },
  { id: 3, name: 'Details', icon: Users },
  { id: 4, name: 'Schedule', icon: Calendar },
  { id: 5, name: 'Review', icon: CheckCircle2 },
];

export default function BookingPage() {
  const { user } = useAuthStore();
  const { properties, fetchProperties, fetchUnitsByPropertyId, currentUnits } = usePropertyStore();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch properties on mount
  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const [formData, setFormData] = useState({
    propertyId: '', // property ID from backend
    unitId: '', // unit ID from backend
    userType: 'guest', // 'resident' or 'guest' (hostel only)
    customerType: 'HOTEL_GUEST', // from CustomerType enum
    requestedQuantity: 1, // number of rooms/beds
    phone: '', // required phone number
    checkInDate: '',
    checkOutDate: '',
    numberOfAdults: 1,
    numberOfChildren: 0,
    purpose: '',
    specialRequests: '',
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch units when property is selected
  useEffect(() => {
    if (formData.propertyId) {
      fetchUnitsByPropertyId(parseInt(formData.propertyId));
    }
  }, [formData.propertyId, fetchUnitsByPropertyId]);

  // Get the selected property
  const selectedProperty = properties.find(p => p.id === parseInt(formData.propertyId));
  const selectedUnit = currentUnits.find(u => u.id === parseInt(formData.unitId));

  // Determine if checkout date is required
  const isCheckoutRequired = () => {
    if (!selectedProperty) return true;
    // Checkout is NOT required for hostel residents
    if (selectedProperty.type.includes('HOSTEL') && formData.userType === 'resident') {
      return false;
    }
    // Checkout IS required for hotels and hostel guests
    return true;
  };

  // Get display price based on user type
  const getDisplayPrice = (unit: Unit) => {
    if (!selectedProperty) return '₹0';
    
    if (selectedProperty.type.includes('HOSTEL')) {
      if (formData.userType === 'resident') {
        // Show monthly rate for residents
        return unit.recurringMonthlyRate ? `₹${unit.recurringMonthlyRate}/month` : `₹${unit.pricePerNight}/night`;
      } else {
        // Show daily rate for guests
        return `₹${unit.pricePerNight}/night`;
      }
    }
    
    // Hotels always show daily rate
    return `₹${unit.pricePerNight}/night`;
  };

  // Handle reservation submission
  const handleSubmitReservation = async () => {
    if (!user || !selectedProperty || !selectedUnit) {
      alert('Please complete all required fields');
      return;
    }

    if (!formData.phone) {
      alert('Please provide your phone number');
      return;
    }

    setIsSubmitting(true);

    try {
      const API_BASE_URL = 'http://localhost:5000/api';
      
      const payload = {
        propertyId: formData.propertyId,
        guestName: `${user.firstName} ${user.lastName}`,
        mobile: formData.phone, // Use form phone number
        email: user.email,
        customerType: formData.customerType,
        requestedCategory: selectedUnit.category,
        requestedType: selectedUnit.type,
        requestedQuantity: formData.requestedQuantity,
        numberOfAdults: formData.numberOfAdults,
        numberOfChildren: formData.numberOfChildren,
        expectedCheckIn: formData.checkInDate,
        expectedCheckOut: formData.checkOutDate || null,
        purpose: formData.purpose,
        specialRequests: formData.specialRequests,
      };

      const response = await fetch(`${API_BASE_URL}/public/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create reservation');
      }

      setCurrentStep(6); // Move to success step
    } catch (error: any) {
      alert(error?.message || 'Failed to create reservation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useGSAP(() => {
    gsap.from('.step-indicator', {
      y: -20,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out'
    });
  }, { scope: containerRef });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-500">
      <Navbar />
      
      <div ref={containerRef} className="pt-40 pb-20 px-6 md:px-12 lg:px-16">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 w-full">
          {/* Header with back button */}
          <div className="flex items-center justify-between mb-12">
            <button
              onClick={() => navigate('/properties')}
              className="flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="text-sm font-bold uppercase tracking-widest">Back to Properties</span>
            </button>
            <div className="text-right">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Booking Reference</p>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">{user.firstName} {user.lastName}</p>
            </div>
          </div>

          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 mb-8">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Property Booking</span>
            </div>
            <h1 className="text-6xl lg:text-8xl font-display font-black mb-6 text-zinc-900 dark:text-white uppercase tracking-tighter leading-none">RESERVE YOUR <br /><span className="text-primary">PROPERTY.</span></h1>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto text-xl font-light leading-relaxed">Experience premium living in Jaipur. Secure your spot in just a few clicks.</p>
          </div>

          <div className="grid lg:grid-cols-[1fr_380px] gap-16 items-start">
            <div className="space-y-16">
              {/* Stepper */}
              <div className="flex justify-between items-center relative px-4">
                {steps.map((step) => (
                  <div key={step.id} className="step-indicator flex flex-col items-center gap-3 relative z-10">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                      currentStep > step.id ? "bg-primary text-white" : currentStep === step.id ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-zinc-100 dark:bg-white/5 text-zinc-400"
                    )}>
                      {currentStep > step.id ? <CheckCircle2 size={24} /> : <step.icon size={24} />}
                    </div>
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", currentStep >= step.id ? "text-primary" : "text-zinc-500")}>
                      {step.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Form Content */}
              <div className="min-h-[500px]">
                <AnimatePresence mode="wait">
                  {/* Step 1: Property Selection */}
                  {currentStep === 1 && (
                    <motion.div 
                      key="step1"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Select Property</h3>
                      {properties.length === 0 ? (
                        <div className="text-center py-12">
                          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                          <p className="text-zinc-500 dark:text-zinc-400">Loading properties...</p>
                        </div>
                      ) : (
                        <div className="grid sm:grid-cols-2 gap-6">
                          {properties.map((property) => (
                            <button
                              key={property.id}
                              onClick={() => { 
                                setFormData({...formData, propertyId: property.id.toString()}); 
                                setCurrentStep(2); 
                              }}
                              className={cn(
                                "group p-8 rounded-[32px] border-2 transition-all text-left",
                                formData.propertyId === property.id.toString() ? "bg-primary/5 border-primary" : "bg-zinc-50 dark:bg-[#18181B] border-zinc-200 dark:border-white/10 hover:border-primary/50"
                              )}
                            >
                              <div className="flex items-start gap-4">
                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary flex-shrink-0">
                                  {property.type.includes('HOTEL') ? <Hotel size={32} /> : <Building2 size={32} />}
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-xl font-display font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-2">{property.name}</h4>
                                  <p className="text-sm text-zinc-500 dark:text-zinc-400 font-light">{property.city}, {property.state}</p>
                                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                                    {property.type.replace('_', ' ')} • {property.floors} floors
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Step 2: Property Details */}
                  {currentStep === 2 && (
                    <motion.div 
                      key="step2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-8"
                    >
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors mb-4"
                      >
                        <ChevronLeft size={20} />
                        <span className="text-sm font-bold uppercase tracking-widest">Back</span>
                      </button>
                      <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Property Details</h3>
                      {selectedProperty && (
                        <div className="p-8 rounded-[32px] bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-white/10">
                          <div className="flex items-start gap-6 mb-6">
                            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary flex-shrink-0">
                              {selectedProperty.type.includes('HOTEL') ? <Hotel size={40} /> : <Building2 size={40} />}
                            </div>
                            <div>
                              <h4 className="text-3xl font-display font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-2">{selectedProperty.name}</h4>
                              <p className="text-lg text-zinc-500 dark:text-zinc-400 font-light">{selectedProperty.address}, {selectedProperty.city}, {selectedProperty.state}</p>
                              <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-2">Pincode: {selectedProperty.pincode}</p>
                            </div>
                          </div>
                          <div className="mb-6">
                            <h5 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Facilities</h5>
                            <div className="flex flex-wrap gap-3">
                              {selectedProperty.facilities.map((facility, i) => (
                                <span key={i} className="px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                                  {facility}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => setCurrentStep(3)}
                            className="w-full py-4 bg-primary text-white rounded-full font-bold uppercase tracking-widest text-sm hover:bg-primary/90 transition-all"
                          >
                            Continue to Room Selection
                            <ArrowRight size={16} className="inline ml-2" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Step 3: Room Selection */}
                  {currentStep === 3 && (
                    <motion.div 
                      key="step3"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors mb-4"
                      >
                        <ChevronLeft size={20} />
                        <span className="text-sm font-bold uppercase tracking-widest">Back</span>
                      </button>
                      <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Available Rooms</h3>
                      {currentUnits.length === 0 ? (
                        <div className="text-center py-12">
                          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                          <p className="text-zinc-500 dark:text-zinc-400">Loading available rooms...</p>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {currentUnits.map((unit) => (
                            <button
                              key={unit.id}
                              onClick={() => { 
                                setFormData({...formData, unitId: unit.id.toString()}); 
                                setCurrentStep(4); 
                              }}
                              className={cn(
                                "p-6 rounded-2xl border-2 transition-all text-left flex items-center gap-6",
                                formData.unitId === unit.id.toString() ? "bg-primary/5 border-primary" : "bg-zinc-50 dark:bg-[#18181B] border-zinc-200 dark:border-white/10 hover:border-primary/50"
                              )}
                            >
                              <img 
                                src={getRoomImage(unit.type, unit.category)} 
                                alt={unit.category}
                                className="w-24 h-24 rounded-xl object-cover"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-xl font-display font-black text-zinc-900 dark:text-white uppercase tracking-tight">{unit.category.replace('_', ' ')}</h4>
                                  <span className="text-lg font-bold text-primary">{getDisplayPrice(unit)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm mb-2">
                                  <Users size={16} />
                                  <span>Capacity: {unit.capacity}</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {unit.features.slice(0, 3).map((feature, i) => (
                                    <span key={i} className="text-xs text-zinc-400 dark:text-zinc-500">• {feature}</span>
                                  ))}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Step 4: Guest Details */}
                  {currentStep === 4 && (
                    <motion.div 
                      key="step4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="glass-card p-12 rounded-[48px] bg-zinc-50 dark:bg-[#18181B]"
                    >
                      <button
                        onClick={() => setCurrentStep(3)}
                        className="flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors mb-8"
                      >
                        <ChevronLeft size={20} />
                        <span className="text-sm font-bold uppercase tracking-widest">Back</span>
                      </button>
                      <h2 className="text-4xl font-display font-black mb-10 uppercase tracking-tighter text-zinc-900 dark:text-white">Guest Details</h2>
                      <div className="space-y-10">
                        {selectedProperty && selectedProperty.type.includes('HOSTEL') && (
                          <div className="space-y-6">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Booking Type</label>
                            <div className="grid grid-cols-2 gap-6">
                              <button 
                                onClick={() => setFormData({...formData, userType: 'resident', customerType: 'HOSTELER'})}
                                className={cn(
                                  "p-6 rounded-3xl border-2 flex items-center justify-center gap-4 font-bold uppercase tracking-widest text-xs transition-all",
                                  formData.userType === 'resident' ? "bg-primary border-primary text-white shadow-xl shadow-primary/20" : "bg-white dark:bg-[#09090B] border-zinc-200 dark:border-white/10 text-zinc-500"
                                )}
                              >
                                <UserCircle size={24} /> Resident (Monthly)
                              </button>
                              <button 
                                onClick={() => setFormData({...formData, userType: 'guest', customerType: 'HOSTEL_GUEST'})}
                                className={cn(
                                  "p-6 rounded-3xl border-2 flex items-center justify-center gap-4 font-bold uppercase tracking-widest text-xs transition-all",
                                  formData.userType === 'guest' ? "bg-primary border-primary text-white shadow-xl shadow-primary/20" : "bg-white dark:bg-[#09090B] border-zinc-200 dark:border-white/10 text-zinc-500"
                                )}
                              >
                                <Users size={24} /> Guest (Daily)
                              </button>
                            </div>
                          </div>
                        )}
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Phone Number *</label>
                          <input 
                            type="tel"
                            placeholder="Enter your phone number"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="w-full bg-white dark:bg-[#09090B] border border-zinc-200 dark:border-white/10 rounded-3xl p-6 text-2xl font-display font-black focus:outline-none focus:border-primary text-zinc-900 dark:text-white transition-all"
                            required
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Number of {selectedUnit?.type === 'BED' ? 'Beds' : 'Rooms'}</label>
                          <input 
                            type="number"
                            min="1"
                            max="10"
                            value={formData.requestedQuantity}
                            onChange={(e) => setFormData({...formData, requestedQuantity: parseInt(e.target.value) || 1})}
                            className="w-full bg-white dark:bg-[#09090B] border border-zinc-200 dark:border-white/10 rounded-3xl p-6 text-2xl font-display font-black focus:outline-none focus:border-primary text-zinc-900 dark:text-white transition-all"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Adults</label>
                            <input 
                              type="number"
                              min="1"
                              value={formData.numberOfAdults}
                              onChange={(e) => setFormData({...formData, numberOfAdults: parseInt(e.target.value) || 1})}
                              className="w-full bg-white dark:bg-[#09090B] border border-zinc-200 dark:border-white/10 rounded-3xl p-6 text-2xl font-display font-black focus:outline-none focus:border-primary text-zinc-900 dark:text-white transition-all"
                            />
                          </div>
                          <div className="space-y-4">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Children</label>
                            <input 
                              type="number"
                              min="0"
                              value={formData.numberOfChildren}
                              onChange={(e) => setFormData({...formData, numberOfChildren: parseInt(e.target.value) || 0})}
                              className="w-full bg-white dark:bg-[#09090B] border border-zinc-200 dark:border-white/10 rounded-3xl p-6 text-2xl font-display font-black focus:outline-none focus:border-primary text-zinc-900 dark:text-white transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Purpose of Stay</label>
                          <input 
                            type="text"
                            placeholder="e.g., Vacation, Business, Study"
                            value={formData.purpose}
                            onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                            className="w-full bg-white dark:bg-[#09090B] border border-zinc-200 dark:border-white/10 rounded-3xl p-6 text-lg font-display font-black focus:outline-none focus:border-primary text-zinc-900 dark:text-white transition-all"
                          />
                        </div>
                        <button 
                          onClick={() => setCurrentStep(5)}
                          className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-8 rounded-3xl font-black text-xl uppercase tracking-widest shadow-2xl shadow-black/10 transition-all flex items-center justify-center gap-4 hover:scale-[1.02]"
                        >
                          Continue to Schedule <ArrowRight size={24} />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 5: Schedule */}
                  {currentStep === 5 && (
                    <motion.div 
                      key="step5"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="glass-card p-12 rounded-[48px] bg-zinc-50 dark:bg-[#18181B]"
                    >
                      <button
                        onClick={() => setCurrentStep(4)}
                        className="flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors mb-8"
                      >
                        <ChevronLeft size={20} />
                        <span className="text-sm font-bold uppercase tracking-widest">Back</span>
                      </button>
                      <h2 className="text-4xl font-display font-black mb-10 uppercase tracking-tighter text-zinc-900 dark:text-white">Schedule</h2>
                      <div className="space-y-10">
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Check-in Date</label>
                          <input 
                            type="date" 
                            className="w-full bg-white dark:bg-[#09090B] border border-zinc-200 dark:border-white/10 rounded-3xl p-8 text-2xl font-display font-black focus:outline-none focus:border-primary text-zinc-900 dark:text-white transition-all"
                            onChange={(e) => setFormData({...formData, checkInDate: e.target.value})}
                          />
                        </div>
                        {isCheckoutRequired() && (
                          <div className="space-y-4">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Check-out Date</label>
                            <input 
                              type="date" 
                              className="w-full bg-white dark:bg-[#09090B] border border-zinc-200 dark:border-white/10 rounded-3xl p-8 text-2xl font-display font-black focus:outline-none focus:border-primary text-zinc-900 dark:text-white transition-all"
                              onChange={(e) => setFormData({...formData, checkOutDate: e.target.value})}
                            />
                          </div>
                        )}
                        {!isCheckoutRequired() && (
                          <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20">
                            <p className="text-sm text-primary font-medium">
                              Check-out date is not required for long-term resident bookings. You can provide it later.
                            </p>
                          </div>
                        )}
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Special Requests (Optional)</label>
                          <textarea 
                            placeholder="Any special requirements..."
                            value={formData.specialRequests}
                            onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
                            className="w-full bg-white dark:bg-[#09090B] border border-zinc-200 dark:border-white/10 rounded-3xl p-6 text-lg font-display font-black focus:outline-none focus:border-primary text-zinc-900 dark:text-white transition-all min-h-[120px]"
                          />
                        </div>
                        <button 
                          onClick={() => setCurrentStep(5)}
                          disabled={!formData.checkInDate}
                          className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-8 rounded-3xl font-black text-xl uppercase tracking-widest shadow-2xl shadow-black/10 transition-all flex items-center justify-center gap-4 disabled:opacity-50 hover:scale-[1.02]"
                        >
                          Review Booking <ArrowRight size={24} />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 5: Review & Submit */}
                  {currentStep === 5 && (
                    <motion.div 
                      key="step6"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-8"
                    >
                      <div className="glass-card p-12 rounded-[48px] bg-zinc-50 dark:bg-[#18181B]">
                        <button
                          onClick={() => setCurrentStep(5)}
                          className="flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors mb-8"
                        >
                          <ChevronLeft size={20} />
                          <span className="text-sm font-bold uppercase tracking-widest">Back</span>
                        </button>
                        <h2 className="text-4xl font-display font-black mb-10 uppercase tracking-tighter text-zinc-900 dark:text-white">Review Your Booking</h2>
                        
                        <div className="space-y-6 mb-10">
                          <div className="flex justify-between items-center p-4 rounded-2xl bg-zinc-100 dark:bg-white/5">
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">Property</span>
                            <span className="font-bold text-zinc-900 dark:text-white">{selectedProperty?.name}</span>
                          </div>
                          <div className="flex justify-between items-center p-4 rounded-2xl bg-zinc-100 dark:bg-white/5">
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">Type</span>
                            <span className="font-bold text-zinc-900 dark:text-white">{selectedProperty?.type.replace('_', ' ')}</span>
                          </div>
                          <div className="flex justify-between items-center p-4 rounded-2xl bg-zinc-100 dark:bg-white/5">
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">Room</span>
                            <span className="font-bold text-zinc-900 dark:text-white">{selectedUnit?.category.replace('_', ' ')}</span>
                          </div>
                          <div className="flex justify-between items-center p-4 rounded-2xl bg-zinc-100 dark:bg-white/5">
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">Quantity</span>
                            <span className="font-bold text-zinc-900 dark:text-white">{formData.requestedQuantity}</span>
                          </div>
                          <div className="flex justify-between items-center p-4 rounded-2xl bg-zinc-100 dark:bg-white/5">
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">Phone</span>
                            <span className="font-bold text-zinc-900 dark:text-white">{formData.phone}</span>
                          </div>
                          <div className="flex justify-between items-center p-4 rounded-2xl bg-zinc-100 dark:bg-white/5">
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">Check-in</span>
                            <span className="font-bold text-zinc-900 dark:text-white">{formData.checkInDate}</span>
                          </div>
                          {formData.checkOutDate && (
                            <div className="flex justify-between items-center p-4 rounded-2xl bg-zinc-100 dark:bg-white/5">
                              <span className="text-sm text-zinc-500 dark:text-zinc-400">Check-out</span>
                              <span className="font-bold text-zinc-900 dark:text-white">{formData.checkOutDate}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center p-4 rounded-2xl bg-zinc-100 dark:bg-white/5">
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">Guests</span>
                            <span className="font-bold text-zinc-900 dark:text-white">{formData.numberOfAdults} Adults, {formData.numberOfChildren} Children</span>
                          </div>
                          <div className="flex justify-between items-center p-4 rounded-2xl bg-zinc-100 dark:bg-white/5">
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">Price</span>
                            <span className="font-bold text-primary">{selectedUnit ? getDisplayPrice(selectedUnit) : '₹0'}</span>
                          </div>
                        </div>

                        <button 
                          onClick={handleSubmitReservation}
                          disabled={isSubmitting}
                          className="w-full bg-primary text-white py-8 rounded-3xl font-black text-xl uppercase tracking-widest shadow-2xl shadow-primary/20 transition-all flex items-center justify-center gap-4 disabled:opacity-50 hover:scale-[1.02]"
                        >
                          {isSubmitting ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                          ) : (
                            <>
                              Confirm & Submit <ArrowRight size={24} />
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 6: Success */}
                  {currentStep === 6 && (
                    <motion.div 
                      key="step7"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-24 glass-card rounded-[64px] bg-primary/5 border-primary/20"
                    >
                      <div className="w-32 h-32 bg-primary rounded-[40px] flex items-center justify-center mx-auto mb-10 shadow-3xl shadow-primary/40 rotate-12">
                        <CheckCircle2 className="text-white w-16 h-16" />
                      </div>
                      <h2 className="text-6xl font-display font-black mb-6 uppercase tracking-tighter text-zinc-900 dark:text-white leading-none">RESERVATION <br /><span className="text-primary">REQUESTED.</span></h2>
                      <p className="text-zinc-500 dark:text-zinc-400 mb-12 max-w-md mx-auto text-xl font-light leading-relaxed">
                        We've received your request for <span className="text-zinc-900 dark:text-white font-bold">{selectedUnit?.category.replace('_', ' ')}</span> at <span className="text-zinc-900 dark:text-white font-bold">{selectedProperty?.name || 'selected property'}</span>.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <button onClick={() => navigate('/my-bookings')} className="inline-flex items-center gap-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-12 py-6 rounded-3xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-2xl shadow-black/10">
                          View My Bookings <ArrowRight size={24} />
                        </button>
                        <button onClick={() => navigate('/')} className="inline-flex items-center gap-4 bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white px-12 py-6 rounded-3xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-all">
                          Back to Home
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Sidebar Summary */}
            <div className="sticky top-40 space-y-8">
              <div className="glass-card p-10 rounded-[48px] bg-zinc-50 dark:bg-[#18181B] border-zinc-200 dark:border-white/10">
                <div className="flex items-center justify-between mb-10 border-b border-zinc-200 dark:border-white/10 pb-6">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-white">Reservation Summary</h3>
                  {currentStep > 1 && currentStep < 6 && (
                    <button
                      onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                      className="text-xs text-primary hover:text-primary/80 font-bold uppercase tracking-widest"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <div className="space-y-10">
                  <div className="flex items-start gap-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary flex-shrink-0">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Property</div>
                      <div className="font-display font-black text-xl text-zinc-900 dark:text-white uppercase tracking-tight">{selectedProperty?.name || 'Not selected'}</div>
                      {selectedProperty && (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{selectedProperty.type.replace('_', ' ')}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary flex-shrink-0">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Location</div>
                      <div className="font-display font-black text-xl text-zinc-900 dark:text-white uppercase tracking-tight">{selectedProperty?.city ? `${selectedProperty.city}, ${selectedProperty.state}` : 'Not selected'}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary flex-shrink-0">
                      <Bed size={24} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Room</div>
                      <div className="font-display font-black text-xl text-zinc-900 dark:text-white uppercase tracking-tight">{selectedUnit?.category.replace('_', ' ') || 'Not selected'}</div>
                      {formData.requestedQuantity > 1 && (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Quantity: {formData.requestedQuantity}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary flex-shrink-0">
                      <Calendar size={24} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Arrival</div>
                      <div className="font-display font-black text-xl text-zinc-900 dark:text-white uppercase tracking-tight">{formData.checkInDate || 'Not selected'}</div>
                    </div>
                  </div>
                  {selectedUnit && (
                    <div className="flex items-start gap-6">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary flex-shrink-0">
                        <Sparkles size={24} />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Price</div>
                        <div className="font-display font-black text-xl text-primary uppercase tracking-tight">{getDisplayPrice(selectedUnit)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-card p-8 rounded-[32px] bg-primary/5 border-primary/20 flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                  <ShieldCheck size={20} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Verified Secure Stay</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}