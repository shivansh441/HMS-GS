import React, { useRef, useEffect, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/src/lib/gsap';
import { MapPin, Star, Users, ArrowRight, Loader2, Building2, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePropertyStore, Property } from '../store/usePropertyStore';
import { getPropertyImage } from '../constants/roomImages';
import { cn } from '@/src/lib/utils';

const getPropertyTypeDisplay = (type: string) => {
  const typeMap: Record<string, string> = {
    'HOSTEL_BOYS': 'Boys Hostel',
    'HOSTEL_GIRLS': 'Girls Hostel', 
    'HOSTEL_COED': 'Co-Ed Hostel',
    'HOTEL': 'Hotel',
    'CO_LIVING': 'Co-Living',
  };
  return typeMap[type] || type.replace('_', ' ');
};

const getPropertyIcon = (type: string) => {
  return type.includes('HOTEL') ? Building2 : Home;
};

const getRandomPrice = (type: string) => {
  if (type.includes('HOTEL')) {
    return `₹${Math.floor(Math.random() * 2000 + 2500)}`;
  }
  return `₹${Math.floor(Math.random() * 5000 + 6000)}`;
};

export default function HostelGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { properties, loading, error, fetchProperties } = usePropertyStore();
  const [displayProperties, setDisplayProperties] = useState<any[]>([]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    if (properties.length > 0) {
      const mapped = properties.map((property: Property) => ({
        ...property,
        image: getPropertyImage(property.type),
        price: getRandomPrice(property.type),
        rating: Math.floor(Math.random() * 10 + 40) / 10,
        typeDisplay: getPropertyTypeDisplay(property.type),
        typeIcon: getPropertyIcon(property.type),
      }));
      setDisplayProperties(mapped);
    }
  }, [properties]);

  useGSAP(() => {
    if (displayProperties.length > 0) {
      gsap.fromTo('.hostel-card', 
        { y: 100, opacity: 0 },
        {
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 80%',
          },
          y: 0,
          opacity: 1,
          duration: 1.2,
          stagger: 0.2,
          ease: 'power4.out',
        }
      );
    }
  }, { scope: containerRef, dependencies: [displayProperties] });

  if (loading) {
    return (
      <section id="properties" ref={containerRef} className="py-24 bg-transparent transition-colors duration-500">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 w-full">
          <div className="flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-zinc-500 dark:text-zinc-400">Loading properties...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="properties" ref={containerRef} className="py-24 bg-transparent transition-colors duration-500">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 w-full">
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
      </section>
    );
  }

  if (displayProperties.length === 0) {
    return (
      <section id="properties" ref={containerRef} className="py-24 bg-transparent transition-colors duration-500">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 w-full">
          <div className="text-center">
            <p className="text-zinc-500 dark:text-zinc-400">No properties available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="properties" ref={containerRef} className="py-32 bg-transparent transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 mb-6">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Curated Spaces</span>
            </div>
            <h2 className="text-6xl lg:text-8xl font-display font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-[0.85]">
              PREMIUM <br />
              <span className="text-primary">PROPERTIES.</span>
            </h2>
          </div>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 font-light max-w-sm leading-relaxed">
            Discover our handpicked selection of premium living spaces, each designed to provide the ultimate student experience in Jaipur.
          </p>
        </div>

        <div className={cn(
          "grid gap-12",
          displayProperties.length === 1 ? "grid-cols-1 max-w-3xl mx-auto" :
          displayProperties.length === 2 ? "grid-cols-1 md:grid-cols-2" :
          "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        )}>
          {displayProperties.map((property) => (
            <div 
              key={property.id}
              className="hostel-card group relative"
            >
              <div className="relative aspect-[4/5] rounded-[48px] overflow-hidden mb-8 shadow-2xl shadow-black/5 transition-transform duration-500 group-hover:scale-[1.02]">
                <img 
                  src={property.image} 
                  alt={property.name} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                
                <div className="absolute top-8 right-8">
                  <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest">
                    <property.typeIcon size={14} />
                    {property.typeDisplay}
                  </div>
                </div>

                <div className="absolute bottom-10 left-10 right-10">
                  <div className="flex items-center gap-2 text-white/80 mb-3">
                    <MapPin size={14} className="text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{property.city}, {property.state}</span>
                  </div>
                  <h3 className="text-4xl font-display font-black text-white uppercase tracking-tight mb-6 leading-none">{property.name}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-white">
                        <property.typeIcon size={14} className="text-primary" />
                        <span className="text-xs font-bold uppercase tracking-widest">{property.typeDisplay}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-white">
                        <Star size={14} className="text-primary fill-primary" />
                        <span className="text-xs font-bold uppercase tracking-widest">{property.rating}</span>
                      </div>
                    </div>
                    <p className="text-2xl font-display font-black text-white">{property.price}<span className="text-[10px] font-bold uppercase tracking-widest text-white/60 ml-1">/mo</span></p>
                  </div>
                </div>
              </div>

              <div className="px-6">
                <Link 
                  to={`/property-details/${property.id}`} 
                  className="w-full flex items-center justify-center gap-3 py-6 rounded-full border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white font-bold uppercase tracking-widest text-[10px] hover:bg-zinc-900 dark:hover:bg-white hover:text-white dark:hover:text-zinc-900 transition-all duration-500"
                >
                  Explore Details
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
