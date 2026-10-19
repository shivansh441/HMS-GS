import React, { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/src/lib/gsap';
import { MapPin, Star, Wifi, ShieldCheck, Coffee, Tv, Wind, Dumbbell, ArrowRight, Calendar, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePropertyStore, Property } from '../store/usePropertyStore';
import { getPropertyImage } from '../constants/roomImages';
import { cn } from '@/src/lib/utils';

interface DisplayProperty {
  id: number;
  name: string;
  location: string;
  price: string;
  rating: number;
  image: string;
  type: string;
  typeOriginal: string;
  description: string;
  amenities: { name: string; icon: any }[];
  floors: number;
  contactPhone: string;
  contactEmail?: string;
  pincode: string;
  facilities: string[];
}

const descriptions = [
  'Experience premium living with state-of-the-art amenities, high-speed internet, and a vibrant community. Perfect for students and young professionals looking for a comfortable and productive environment.',
  'Designed specifically for modern living, offering quiet study areas, collaborative spaces, and proximity to major institutions. Enjoy a balanced lifestyle with our comprehensive amenities.',
  'Indulge in luxury with exquisite design, world-class service, and premium facilities. The perfect choice for short stays, business trips, or a relaxing weekend getaway.',
  'A contemporary living space that combines comfort with convenience. Features modern amenities, secure environment, and excellent connectivity to key locations.',
];

const getRandomPrice = (type: string) => {
  if (type.includes('HOTEL')) {
    return `₹${Math.floor(Math.random() * 2000 + 2500)}/day`;
  }
  return `₹${Math.floor(Math.random() * 5000 + 6000)}`;
};

const getRandomDescription = () => {
  return descriptions[Math.floor(Math.random() * descriptions.length)];
};

const mapPropertyToDisplay = (property: Property): DisplayProperty => {
  const amenityIcons = {
    'WiFi': Wifi,
    'Security': ShieldCheck,
    'Cafeteria': Coffee,
    'TV': Tv,
    'AC': Wind,
    'Gym': Dumbbell,
    'Parking': Wifi,
    'Laundry': Coffee,
    'Common Room': Tv,
    'Study Room': Coffee,
    'Mess': Coffee,
    'Water Cooler': Wind,
    'Power Backup': Wifi,
    'Housekeeping': Coffee,
  };

  const facilities = property.facilities || ['WiFi', 'Security', 'Cafeteria'];
  const amenities = facilities.slice(0, 8).map(facility => ({
    name: facility,
    icon: amenityIcons[facility as keyof typeof amenityIcons] || Wifi,
  }));

  return {
    id: property.id,
    name: property.name,
    location: `${property.address}, ${property.city}, ${property.state}`,
    price: getRandomPrice(property.type),
    rating: Math.floor(Math.random() * 10 + 40) / 10, // Random rating between 4.0 and 5.0
    image: getPropertyImage(property.type),
    type: property.type.replace('_', ' '),
    typeOriginal: property.type,
    description: getRandomDescription(),
    amenities,
    // Additional property details
    floors: property.floors,
    contactPhone: property.contactPhone,
    contactEmail: property.contactEmail,
    pincode: property.pincode,
    facilities: property.facilities,
  };
};

export default function Properties() {
  const containerRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const { properties, loading, error, fetchProperties } = usePropertyStore();
  const [selectedProperty, setSelectedProperty] = useState<DisplayProperty | null>(null);
  const [displayProperties, setDisplayProperties] = useState<DisplayProperty[]>([]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    if (properties.length > 0) {
      const mapped = properties.map(mapPropertyToDisplay);
      setDisplayProperties(mapped);
      setSelectedProperty(mapped[0]);
    }
  }, [properties]);

  useGSAP(() => {
    gsap.fromTo('.prop-header-reveal',
      { y: 60, opacity: 0 },
      {
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
        },
        y: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.15,
        ease: 'power4.out'
      }
    );
  }, { scope: containerRef });

  useGSAP(() => {
    gsap.fromTo('.detail-section',
      { y: 80, opacity: 0 },
      { 
        y: 0, 
        opacity: 1, 
        duration: 0.8, 
        ease: 'power3.out',
        delay: 0.2
      }
    );
  }, { scope: detailRef, dependencies: [selectedProperty] });

  if (loading) {
    return (
      <div className="pt-32 pb-32 bg-transparent min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">Loading properties...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-32 pb-32 bg-transparent min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={fetchProperties}
            className="px-6 py-3 bg-primary text-white rounded-full font-bold uppercase tracking-widest text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (displayProperties.length === 0) {
    return (
      <div className="pt-32 pb-32 bg-transparent min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 dark:text-zinc-400">No properties available at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="pt-24 pb-24 bg-transparent min-h-screen transition-colors duration-500" id="properties-page">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 w-full">
        {/* Header */}
        <div className="mb-20 text-center">
          <h1 className="prop-header-reveal text-5xl lg:text-7xl font-display font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-8">
            Explore Our <span className="text-primary">Properties</span>
          </h1>
          <p className="prop-header-reveal text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto font-light">
            Select a property to explore detailed information about amenities, pricing, and what makes each one special.
          </p>
        </div>

        {/* Property Tabs */}
        <div className={cn(
          "flex flex-wrap gap-4 justify-center mb-16",
          displayProperties.length > 6 ? "max-h-32 overflow-y-auto" : ""
        )}>
          {displayProperties.map((property) => (
            <button
              key={property.id}
              onClick={() => setSelectedProperty(property)}
              className={`px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm transition-all duration-300 ${
                selectedProperty?.id === property.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                  : 'bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white hover:border-primary hover:bg-zinc-50 dark:hover:bg-white/10'
              }`}
            >
              {property.name}
            </button>
          ))}
        </div>

              {/* Property Details Section */}
        {selectedProperty && (
          <div ref={detailRef} className="detail-section relative">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Image Section */}
              <div className="relative aspect-[4/5] rounded-4xl overflow-hidden shadow-2xl shadow-black/10">
                <img
                  src={selectedProperty.image}
                  alt={selectedProperty.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute top-8 right-8 px-5 py-2 rounded-full bg-white/90 backdrop-blur-xl border border-white/30 text-zinc-900 text-[10px] font-bold uppercase tracking-widest">
                  {selectedProperty.type}
                </div>
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="flex items-center gap-2 text-white mb-3">
                    <MapPin size={16} className="text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest">{selectedProperty.location}</span>
                  </div>
                  <p className="text-2xl font-display font-black text-white">{selectedProperty.price}</p>
                </div>
              </div>

              {/* Details Section */}
              <div>
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Star size={18} className="text-primary fill-primary" />
                    <span className="text-lg font-bold text-zinc-900 dark:text-white">{selectedProperty.rating} Rating</span>
                  </div>
                  <h2 className="text-5xl font-display font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-6">
                    {selectedProperty.name}
                  </h2>
                  <p className="text-lg text-zinc-600 dark:text-zinc-300 font-light leading-relaxed mb-6">
                    {selectedProperty.description}
                  </p>
                  
                  {/* Additional Property Details */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Type</p>
                      <p className="font-bold text-zinc-900 dark:text-white">{selectedProperty.typeOriginal.replace('_', ' ')}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Floors</p>
                      <p className="font-bold text-zinc-900 dark:text-white">{selectedProperty.floors}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Contact</p>
                      <p className="font-bold text-zinc-900 dark:text-white text-sm">{selectedProperty.contactPhone}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Pincode</p>
                      <p className="font-bold text-zinc-900 dark:text-white">{selectedProperty.pincode}</p>
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div className="mb-10">
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6 uppercase tracking-tight">Available Amenities</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedProperty.amenities.map((amenity, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                          <amenity.icon size={18} />
                        </div>
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{amenity.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

              {/* CTA Buttons */}
              <div className="flex gap-4">
                <Link
                  to={`/property-details/${selectedProperty.id}`}
                  className="flex-1 py-4 rounded-full bg-primary text-white font-bold uppercase tracking-widest text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                >
                  View Full Details
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/booking"
                  className="flex-1 py-4 rounded-full border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white font-bold uppercase tracking-widest text-sm hover:bg-zinc-100 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                >
                  <Calendar size={16} />
                  Book Now
                </Link>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
