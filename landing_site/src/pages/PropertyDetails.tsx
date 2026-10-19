import React, { useRef, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/src/lib/gsap';
import { MapPin, Star, Users, ArrowRight, ShieldCheck, Wifi, Coffee, Tv, Wind, Dumbbell, CheckCircle2, ChevronLeft, Loader2 } from 'lucide-react';
import { usePropertyStore, Property } from '../store/usePropertyStore';
import { getPropertyImage } from '../constants/roomImages';

const descriptions = [
  'Experience premium living with state-of-the-art amenities, high-speed internet, and a vibrant community. Perfect for students and young professionals looking for a comfortable and productive environment.',
  'Designed specifically for modern living, offering quiet study areas, collaborative spaces, and proximity to major institutions. Enjoy a balanced lifestyle with our comprehensive amenities.',
  'Indulge in luxury with exquisite design, world-class service, and premium facilities. The perfect choice for short stays, business trips, or a relaxing weekend getaway.',
  'A contemporary living space that combines comfort with convenience. Features modern amenities, secure environment, and excellent connectivity to key locations.',
];

const getRandomDescription = () => {
  return descriptions[Math.floor(Math.random() * descriptions.length)];
};

const getRandomPrice = (type: string) => {
  if (type.includes('HOTEL')) {
    return `₹${Math.floor(Math.random() * 2000 + 2500)}/day`;
  }
  return `₹${Math.floor(Math.random() * 5000 + 6000)}`;
};

const mapPropertyToDisplay = (property: Property) => {
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
  const amenities = facilities.slice(0, 6).map(facility => ({
    name: facility,
    icon: amenityIcons[facility as keyof typeof amenityIcons] || Wifi,
  }));

  return {
    ...property,
    location: `${property.city}, ${property.state}`,
    price: getRandomPrice(property.type),
    rating: Math.floor(Math.random() * 10 + 40) / 10,
    image: getPropertyImage(property.type),
    type: property.type.replace('_', ' '),
    description: getRandomDescription(),
    amenities,
  };
};

export default function PropertyDetails() {
  const { id } = useParams<{ id: string }>();
  const { fetchPropertyById, currentProperty, loading, error } = usePropertyStore();
  const [displayProperty, setDisplayProperty] = useState<any>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchPropertyById(parseInt(id));
    }
  }, [id, fetchPropertyById]);

  useEffect(() => {
    if (currentProperty) {
      setDisplayProperty(mapPropertyToDisplay(currentProperty));
    }
  }, [currentProperty]);

  if (loading) {
    return (
      <div className="pt-32 pb-32 bg-transparent min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-32 pb-32 bg-transparent min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link to="/properties" className="px-6 py-3 bg-primary text-white rounded-full font-bold uppercase tracking-widest text-sm">
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  if (!displayProperty) {
    return (
      <div className="pt-32 pb-32 bg-transparent min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 dark:text-zinc-400">Property not found.</p>
          <Link to="/properties" className="mt-4 inline-block px-6 py-3 bg-primary text-white rounded-full font-bold uppercase tracking-widest text-sm">
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  useGSAP(() => {
    if (!displayProperty) return;

    const tl = gsap.timeline();

    // Hero image parallax
    gsap.to(imageRef.current, {
      yPercent: 30,
      ease: 'none',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      }
    });

    // Content reveal
    tl.fromTo('.reveal-item', 
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out', delay: 0.2 }
    );

    // Sticky sidebar animation
    gsap.fromTo(sidebarRef.current,
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power4.out', delay: 0.5 }
    );

  }, { scope: containerRef, dependencies: [displayProperty] });

  return (
    <div ref={containerRef} className="min-h-screen bg-transparent transition-colors duration-500 pb-32">
      {/* Hero Image Section */}
      <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <img 
          ref={imageRef}
          src={displayProperty.image} 
          alt={displayProperty.name}
          className="w-full h-[130%] object-cover absolute top-[-15%]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-end pb-16 px-6 md:px-12 lg:px-16 max-w-[1440px] mx-auto">
          <Link to="/properties" className="reveal-item inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors w-fit">
            <ChevronLeft size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Back to Properties</span>
          </Link>
          <div className="reveal-item flex items-center gap-3 mb-4">
            <div className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-bold uppercase tracking-widest">
              {displayProperty.type}
            </div>
            <div className="flex items-center gap-1.5 text-white bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full">
              <Star size={14} className="text-primary fill-primary" />
              <span className="text-xs font-bold uppercase tracking-widest">{displayProperty.rating}</span>
            </div>
          </div>
          <h1 className="reveal-item text-5xl md:text-7xl lg:text-8xl font-display font-black text-white uppercase tracking-tighter leading-[0.9] mb-4">
            {displayProperty.name}
          </h1>
          <div className="reveal-item flex items-center gap-2 text-white/90">
            <MapPin size={18} className="text-primary" />
            <span className="text-sm md:text-base font-medium tracking-wide">{displayProperty.location}</span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 w-full mt-16">
        <div className="grid lg:grid-cols-[1fr_400px] gap-16 items-start">
          
          {/* Left Column - Details */}
          <div ref={contentRef} className="space-y-16">
            <section className="reveal-item">
              <h2 className="text-3xl font-display font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-6">About the Property</h2>
              <p className="text-lg text-zinc-500 dark:text-zinc-400 font-light leading-relaxed">
                {displayProperty.description}
              </p>
            </section>

            <section className="reveal-item">
              <h2 className="text-3xl font-display font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-8">Premium Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {displayProperty.amenities.map((amenity: any, index: number) => (
                  <div key={index} className="flex flex-col items-center justify-center p-6 rounded-3xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 hover:border-primary/30 transition-colors group">
                    <amenity.icon size={32} className="text-zinc-400 group-hover:text-primary mb-4 transition-colors" />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 text-center">{amenity.name}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="reveal-item">
              <h2 className="text-3xl font-display font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-8">Location & Map</h2>
              <div className="w-full h-[400px] rounded-[32px] overflow-hidden shadow-2xl shadow-black/5 border border-zinc-200 dark:border-white/10 relative">
                <iframe 
                  src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3559.025809063658!2d75.8068!3d26.8853!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396db67000000000%3A0x0!2zMjbCsDUzJzA3LjEiTiA3NcKwNDgnMjQuNSJF!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin`}
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 grayscale contrast-125 opacity-80 dark:invert dark:hue-rotate-180 transition-all duration-500 hover:grayscale-0 hover:opacity-100 dark:hover:invert-0"
                ></iframe>
              </div>
            </section>
          </div>

          {/* Right Column - Sticky Booking Card */}
          <div className="relative h-full">
            <div ref={sidebarRef} className="sticky top-32 glass-card rounded-[40px] p-8 shadow-2xl shadow-black/5">
              <div className="mb-8 pb-8 border-b border-zinc-100 dark:border-white/10">
                <p className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">Starting from</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-display font-black text-zinc-900 dark:text-white tracking-tighter">{displayProperty.price}</span>
                  <span className="text-sm font-bold uppercase tracking-widest text-zinc-500">/mo</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                  <CheckCircle2 size={20} className="text-emerald-500" />
                  <span className="text-sm font-medium">No hidden charges</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                  <CheckCircle2 size={20} className="text-emerald-500" />
                  <span className="text-sm font-medium">Instant confirmation</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                  <CheckCircle2 size={20} className="text-emerald-500" />
                  <span className="text-sm font-medium">Free cancellation up to 7 days</span>
                </div>
              </div>

              <Link 
                to="/booking" 
                className="w-full flex items-center justify-center gap-3 py-5 bg-primary text-white rounded-full font-bold uppercase tracking-widest text-xs hover:bg-primary-dark transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-primary/20"
              >
                Book Now
                <ArrowRight size={16} />
              </Link>
              
              <p className="text-center text-xs text-zinc-400 mt-6 font-medium">
                You won't be charged yet
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
