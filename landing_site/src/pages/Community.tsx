import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/src/lib/gsap';
import { Users, Heart, Sparkles, MessageSquare, Calendar, Zap } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export default function CommunityPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  const activities = [
    { title: "Weekly Networking", desc: "Connect with fellow residents and professionals.", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Study Groups", desc: "Collaborate and grow together in our dedicated spaces.", icon: Zap, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Social Events", desc: "Regular movie nights, sports, and cultural festivals.", icon: Heart, color: "text-rose-500", bg: "bg-rose-500/10" }
  ];

  useGSAP(() => {
    gsap.fromTo('.community-reveal', 
      { y: 60, opacity: 0 },
      {
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
        },
        y: 0,
        opacity: 1,
        duration: 1.2,
        stagger: 0.2,
        ease: 'power4.out'
      }
    );
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="pt-24 pb-24 bg-transparent transition-colors duration-500 px-6 md:px-12 lg:px-16">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 w-full">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center mb-40">
          <div className="flex-1 order-2 lg:order-1">
            <div className="community-reveal inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 mb-8">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Join the Tribe</span>
            </div>
            <h1 className="community-reveal text-6xl md:text-7xl lg:text-9xl font-display font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-[0.85] mb-8 lg:mb-12">
              VIBRANT <br />
              <span className="text-primary">COMMUNITY.</span>
            </h1>
            <p className="community-reveal text-lg lg:text-xl text-zinc-500 dark:text-zinc-400 font-light leading-relaxed mb-10 lg:mb-12 max-w-xl">
              Life at Maharana Pratap Properties is about more than just a room. It's about the people you meet and the memories you create together in Jaipur.
            </p>
            <button className="community-reveal px-8 py-4 lg:px-10 lg:py-6 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full font-bold uppercase tracking-widest text-xs hover:scale-105 transition-all duration-500 shadow-2xl shadow-black/10">
              Join Our Discord
            </button>
          </div>
          
          <div className="flex-1 order-1 lg:order-2 community-reveal relative w-full max-w-lg mx-auto lg:max-w-none">
            <div className="aspect-square rounded-[40px] lg:rounded-[64px] overflow-hidden shadow-2xl shadow-black/10 relative z-10">
              <img 
                src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=2000" 
                alt="Community Life" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-8 -right-8 lg:-bottom-12 lg:-right-12 w-48 h-48 lg:w-64 lg:h-64 bg-primary rounded-full blur-[80px] lg:blur-[120px] opacity-30 dark:opacity-20 z-0" />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {activities.map((a, i) => (
            <div key={i} className="community-reveal group glass-card rounded-[48px] p-12 card-hover">
              <div className={cn("w-20 h-20 rounded-[32px] flex items-center justify-center mb-10 transition-all duration-700 group-hover:rotate-6 group-hover:scale-110", a.bg)}>
                <a.icon className={cn("w-10 h-10", a.color)} />
              </div>
              <h3 className="text-3xl font-display font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-6 leading-none">{a.title}</h3>
              <p className="text-zinc-500 dark:text-zinc-400 font-light leading-relaxed">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
