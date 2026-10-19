import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/src/lib/gsap';
import { Wifi, Coffee, Shield, Zap, Wind, Tv } from 'lucide-react';

const amenities = [
  { icon: Wifi, name: 'High Speed WiFi', desc: 'Seamless connectivity for work and study.' },
  { icon: Coffee, name: 'Hygienic Mess', desc: 'Nutritious and delicious meals 3 times a day.' },
  { icon: Shield, name: 'Biometric Security', desc: 'Advanced entry systems for your safety.' },
  { icon: Zap, name: 'Power Backup', desc: '24/7 electricity with heavy-duty generators.' },
  { icon: Wind, name: 'AC Rooms', desc: 'Beat the Jaipur heat with premium cooling.' },
  { icon: Tv, name: 'Entertainment Zone', desc: 'Common area with Netflix, PS5, and games.' },
];

export default function Amenities() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo('.amenity-card', 
      { y: 60, opacity: 0 },
      {
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
        },
        y: 0,
        opacity: 1,
        duration: 1.2,
        stagger: 0.15,
        ease: 'power4.out',
      }
    );
  }, { scope: containerRef });

  return (
    <section id="amenities" ref={containerRef} className="py-24 bg-zinc-50 dark:bg-[#09090B] relative overflow-hidden transition-colors duration-500">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 mb-6">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">World Class Facilities</span>
            </div>
            <h2 className="text-6xl lg:text-8xl font-display font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-[0.85]">
              BEYOND <br />
              <span className="text-primary">UTILITY.</span>
            </h2>
          </div>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 font-light max-w-sm leading-relaxed">
            We've curated every detail to ensure your stay is seamless, productive, and comfortable in the heart of Jaipur.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {amenities.map((item, idx) => (
            <div 
              key={idx}
              className="amenity-card group p-12 glass-card card-hover"
            >
              <div className="w-20 h-20 bg-zinc-100 dark:bg-white/5 rounded-[32px] flex items-center justify-center mb-10 group-hover:bg-primary group-hover:text-white transition-all duration-700 group-hover:rotate-6 group-hover:scale-110">
                <item.icon size={32} className="text-zinc-900 dark:text-white group-hover:text-white transition-colors duration-500" />
              </div>
              <h3 className="text-3xl font-display font-black mb-6 text-zinc-900 dark:text-white uppercase tracking-tight leading-none">{item.name}</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed font-light">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
