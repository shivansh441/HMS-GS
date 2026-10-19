import { useEffect, useState, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { 
  fetchPublicProperties, 
  fetchPublicUnits,
  createPublicReservation,
  setSelectedProperty,
  clearUnits
} from '../store/slices/publicSlice';
import type { PublicProperty, PublicReservationRequest } from '../types/index';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { Select } from '../components/atoms/Select';
import { SectionHeading } from '../components/atoms/SectionHeading';
import { Badge } from '../components/atoms/Badge';
import { Card } from '../components/molecules/Card';
import { DeleteConfirmDialog } from '../components/organisms/DeleteConfirmDialog';

gsap.registerPlugin(useGSAP);

const PROPERTY_TYPES = [
  { label: 'All Types', value: '' },
  { label: 'Hostel', value: 'HOSTEL' },
  { label: 'Hotel', value: 'HOTEL' },
  { label: 'PG', value: 'PG' },
];

const CUSTOMER_TYPES = [
  { label: 'Hotel Guest', value: 'HOTEL_GUEST' },
  { label: 'Hostel Guest', value: 'HOSTEL_GUEST' },
  { label: 'Hosteler (Long-term)', value: 'HOSTELER' },
];

const UNIT_CATEGORIES = [
  { label: 'Single', value: 'SINGLE' },
  { label: 'Double', value: 'DOUBLE' },
  { label: 'Triple', value: 'TRIPLE' },
  { label: 'Dorm', value: 'DORM' },
];

const UNIT_TYPES = [
  { label: 'Room', value: 'ROOM' },
  { label: 'Bed', value: 'BED' },
];

export default function LandingPage() {
  const dispatch = useAppDispatch();
  const publicState = useAppSelector((state) => state.public);
  const authUser = useAppSelector((state) => state.auth?.user ?? null);

  const [viewMode, setViewMode] = useState<'browse' | 'booking'>('browse');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Booking form state
  const [bookingForm, setBookingForm] = useState<Partial<PublicReservationRequest>>({
    customerType: 'HOTEL_GUEST',
    requestedCategory: 'SINGLE',
    requestedType: 'ROOM',
    requestedQuantity: 1,
    numberOfAdults: 1,
    numberOfChildren: 0,
  });

  useEffect(() => {
    void dispatch(fetchPublicProperties());
  }, [dispatch]);

  useEffect(() => {
    if (selectedPropertyId) {
      void dispatch(fetchPublicUnits(selectedPropertyId));
    }
  }, [dispatch, selectedPropertyId]);

  // GSAP Animations
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    
    tl.fromTo('.landing-header', 
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8 }
    )
    .fromTo('.landing-card',
      { y: 60, opacity: 0, scale: 0.95 },
      { 
        y: 0, 
        opacity: 1, 
        scale: 1, 
        duration: 0.6, 
        stagger: 0.1,
        ease: 'back.out(1.7)'
      },
      '-=0.4'
    );
  }, { scope: containerRef, dependencies: [publicState.properties, viewMode] });

  const filteredProperties = useMemo(() => {
    return publicState.properties.filter((property) => {
      const matchesType = !typeFilter || property.type === typeFilter;
      const matchesSearch = !search || 
        property.name.toLowerCase().includes(search.toLowerCase()) ||
        property.city.toLowerCase().includes(search.toLowerCase()) ||
        property.state.toLowerCase().includes(search.toLowerCase());
      
      return matchesType && matchesSearch;
    });
  }, [publicState.properties, typeFilter, search]);

  const handlePropertyClick = (property: PublicProperty) => {
    dispatch(setSelectedProperty(property));
    setSelectedPropertyId(property.id);
    setViewMode('booking');
  };

  const handleBackToBrowse = () => {
    setViewMode('browse');
    setSelectedPropertyId(null);
    dispatch(setSelectedProperty(null));
    dispatch(clearUnits());
  };

  const handleBookingSubmit = async () => {
    if (!selectedPropertyId || !authUser) return;

    try {
      const reservationData: PublicReservationRequest = {
        ...bookingForm,
        propertyId: selectedPropertyId,
        guestName: `${authUser.firstName || ''} ${authUser.lastName || ''}`,
        mobile: authUser.phone || '',
        email: authUser.email || '',
      } as PublicReservationRequest;

      await dispatch(createPublicReservation(reservationData)).unwrap();
      setShowBookingDialog(false);
      setViewMode('browse');
      // Reset form
      setBookingForm({
        customerType: 'HOTEL_GUEST',
        requestedCategory: 'SINGLE',
        requestedType: 'ROOM',
        requestedQuantity: 1,
        numberOfAdults: 1,
        numberOfChildren: 0,
      });
    } catch (error) {
      console.error('Failed to create reservation:', error);
    }
  };

  const availableUnits = useMemo(() => {
    return publicState.units.filter(unit => unit.isAvailable);
  }, [publicState.units]);

  if (viewMode === 'browse') {
    return (
      <div ref={containerRef} className="flex flex-col gap-6">
        {/* Header */}
        <div className="landing-header flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50 md:flex-row md:items-center md:justify-between">
          <div>
            <SectionHeading accent="indigo">Property Browse</SectionHeading>
            <p className="text-sm text-slate-500">Explore our premium properties and book your space.</p>
          </div>
          <div className="flex gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-400">Available Properties</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{publicState.properties.length}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="landing-header rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
          <div className="grid gap-4 md:grid-cols-3">
            <Input 
              placeholder="Search by name, city, or state" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
            <Select 
              options={PROPERTY_TYPES} 
              value={typeFilter} 
              onChange={(value) => setTypeFilter(value as string)} 
            />
          </div>
        </div>

        {/* Property Cards */}
        {publicState.loading ? (
          <div className="landing-card text-center py-20 text-slate-500">Loading properties...</div>
        ) : publicState.error ? (
          <div className="landing-card text-center py-20 text-rose-500">
            <p>Error loading properties: {publicState.error}</p>
            <Button variant="secondary" onClick={() => {
              void dispatch(fetchPublicProperties());
            }}>
              Retry
            </Button>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="landing-card text-center py-20 text-slate-500">
            <p>No properties found matching your filters.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((property) => (
              <Card key={property.id} className="landing-card overflow-hidden">
                <div className="aspect-video bg-slate-200 relative">
                  {property.images && property.images.length > 0 ? (
                    <img 
                      src={property.images[0]} 
                      alt={property.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      No Image
                    </div>
                  )}
                  <Badge className={`absolute top-4 right-4 ${property.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {property.isAvailable ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{property.name}</h3>
                  <p className="text-sm text-slate-500 mb-4">{property.city}, {property.state}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-blue-100 text-blue-700">{property.type}</Badge>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span key={i} className="text-amber-400">★</span>
                      ))}
                      <span className="text-sm text-slate-500">({property.rating})</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">₹{(property.basePrice || 0).toLocaleString()}</p>
                      <p className="text-xs text-slate-400">Starting from</p>
                    </div>
                    <Button 
                      variant="primary" 
                      onClick={() => handlePropertyClick(property)}
                      disabled={!property.isAvailable}
                      className={!property.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      Book Now
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Booking View
  const selectedProperty = publicState.selectedProperty;

  // Empty state when no specific hostel is selected
  if (!selectedPropertyId) {
    return (
      <div ref={containerRef} className="flex flex-col gap-6">
        <div className="landing-header flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50 md:flex-row md:items-center md:justify-between">
          <div>
            <SectionHeading accent="indigo">Book Your Space</SectionHeading>
            <p className="text-sm text-slate-500">Select a property to view available rooms and complete your booking.</p>
          </div>
          <Button variant="secondary" onClick={handleBackToBrowse}>
            ← Back to Browse
          </Button>
        </div>

        <Card className="landing-card p-12">
          <div className="text-center py-12">
            <div className="mb-4 text-6xl">🏢</div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Hostel Selected</h3>
            <p className="text-slate-500">Please select a hostel to view available rooms.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-6">
      {/* Header */}
      <div className="landing-header flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50 md:flex-row md:items-center md:justify-between">
        <div>
          <SectionHeading accent="indigo">Book Your Space</SectionHeading>
          <p className="text-sm text-slate-500">Complete your booking for {selectedProperty?.name}</p>
        </div>
        <Button variant="secondary" onClick={handleBackToBrowse}>
          ← Back to Browse
        </Button>
      </div>

      {/* Property Details */}
      <Card className="landing-card p-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{selectedProperty?.name}</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{selectedProperty?.description}</p>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedProperty?.amenities.map((amenity, index) => (
                <Badge key={index} className="bg-slate-100 text-slate-700">{amenity}</Badge>
              ))}
            </div>

            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              ₹{(selectedProperty?.basePrice || 0).toLocaleString()}
              <span className="text-sm text-slate-400 font-normal">/month</span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Available Units</h3>
            {availableUnits.length === 0 ? (
              <p className="text-slate-500">No units available for this property.</p>
            ) : (
              <div className="space-y-3">
                {availableUnits.slice(0, 5).map((unit) => (
                  <div key={unit.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{unit.unitNumber}</p>
                        <p className="text-sm text-slate-500">{unit.category} • {unit.type} • Capacity: {unit.capacity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-white">₹{(unit.price || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Booking Form */}
      <Card className="landing-card p-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Booking Details</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Customer Type</label>
            <Select 
              options={CUSTOMER_TYPES} 
              value={bookingForm.customerType || 'HOTEL_GUEST'} 
              onChange={(value) => setBookingForm({ ...bookingForm, customerType: value as any })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Room Category</label>
            <Select 
              options={UNIT_CATEGORIES} 
              value={bookingForm.requestedCategory || 'SINGLE'} 
              onChange={(value) => setBookingForm({ ...bookingForm, requestedCategory: value as any })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Room Type</label>
            <Select 
              options={UNIT_TYPES} 
              value={bookingForm.requestedType || 'ROOM'} 
              onChange={(value) => setBookingForm({ ...bookingForm, requestedType: value as any })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Quantity</label>
            <Input 
              type="number"
              value={bookingForm.requestedQuantity || 1}
              onChange={(e) => setBookingForm({ ...bookingForm, requestedQuantity: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Adults</label>
            <Input 
              type="number"
              value={bookingForm.numberOfAdults || 1}
              onChange={(e) => setBookingForm({ ...bookingForm, numberOfAdults: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Children</label>
            <Input 
              type="number"
              value={bookingForm.numberOfChildren || 0}
              onChange={(e) => setBookingForm({ ...bookingForm, numberOfChildren: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Check-in Date</label>
            <Input 
              type="date"
              value={bookingForm.expectedCheckIn || ''}
              onChange={(e) => setBookingForm({ ...bookingForm, expectedCheckIn: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Check-out Date</label>
            <Input 
              type="date"
              value={bookingForm.expectedCheckOut || ''}
              onChange={(e) => setBookingForm({ ...bookingForm, expectedCheckOut: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <Button variant="primary" onClick={() => setShowBookingDialog(true)}>
            Submit Booking Request
          </Button>
          <Button variant="secondary" onClick={handleBackToBrowse}>
            Cancel
          </Button>
        </div>
      </Card>

      {/* Booking Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showBookingDialog}
        title="Confirm Booking"
        description={`Submit booking request for ${selectedProperty?.name}? This will create a pending reservation that will be reviewed by staff.`}
        confirmLabel="Submit"
        cancelLabel="Cancel"
        onCancel={() => setShowBookingDialog(false)}
        onConfirm={handleBookingSubmit}
      />
    </div>
  );
}