import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/src/lib/gsap';
import { Shield, Zap, Coffee, Wifi, Wind, Tv, Users, Heart, Sparkles } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const features = [
  {
    title: "Vibrant Community",
    desc: "Join a network of 2500+ students and professionals. Regular events and networking sessions.",
    icon: Users,
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    title: "Unmatched Security",
    desc: "Biometric access, 24/7 CCTV, and professional security staff for your peace of mind.",
    icon: Shield,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10"
  },
  {
    title: "Modern Comfort",
    desc: "High-speed WiFi, AC rooms, and premium bedding designed for the ultimate rest.",
    icon: Wind,
    color: "text-primary",
    bg: "bg-primary/10"
  }
];

export default function Features() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo('.feature-item', 
      { y: 100, opacity: 0 },
      {
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
        },
        y: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.2,
        ease: 'power4.out'
      }
    );
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="py-24 bg-white dark:bg-[#020617] transition-colors duration-500">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 w-full">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
              <Sparkles size={14} />
              The MP Standard
            </div>
            <h2 className="text-5xl lg:text-7xl font-display font-black leading-tight text-zinc-900 dark:text-white uppercase tracking-tighter">
              BEYOND <span className="text-gradient">LIVING.</span><br />
              IT'S AN EXPERIENCE.
            </h2>
            <p className="text-xl text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-lg">
              We've redefined the property experience in Jaipur. No more cramped spaces or poor facilities. Just premium living for the modern generation.
            </p>
            
            <div className="space-y-8">
              {features.map((f, i) => (
                <div key={i} className="feature-item flex gap-6 group">
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110", f.bg)}>
                    <f.icon className={cn("w-8 h-8", f.color)} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">{f.title}</h3>
                    <p className="text-zinc-500 dark:text-zinc-400">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 blur-[100px] rounded-full" />
            <div className="relative rounded-[40px] overflow-hidden border border-zinc-200 dark:border-white/10 shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop" 
                alt="Community" 
                className="w-full h-[700px] object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-60" />
              
              <div className="absolute bottom-12 left-12 right-12 glass-card p-8 bg-white/10 dark:bg-white/5 border-white/20">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                      <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-10 h-10 rounded-full border-2 border-zinc-900" />
                    ))}
                  </div>
                  <div className="text-sm font-bold text-white">Join 2500+ Residents</div>
                </div>
                <p className="text-zinc-300 italic">"The best decision I made for my studies in Jaipur. The environment is perfect for both focus and fun."</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
