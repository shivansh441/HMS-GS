import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/src/lib/gsap';
import { ArrowRight, Star, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out', duration: 1.2 } });

    tl.from('.hero-title-line', {
      y: 100,
      opacity: 0,
      skewY: 7,
      stagger: 0.2,
    })
    .from(subtitleRef.current, {
      y: 40,
      opacity: 0,
    }, '-=0.8')
    .from(ctaRef.current, {
      y: 40,
      opacity: 0,
    }, '-=0.8')
    .from(statsRef.current?.children || [], {
      y: 40,
      opacity: 0,
      stagger: 0.1,
    }, '-=0.8')
    .from(imageRef.current, {
      scale: 1.2,
      opacity: 0,
      duration: 2,
    }, '-=1.5');

    // Floating animation for accent elements
    gsap.to('.hero-accent', {
      y: 'random(-20, 20)',
      x: 'random(-20, 20)',
      rotation: 'random(-15, 15)',
      duration: 'random(3, 5)',
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }, { scope: heroRef });

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center pt-24 pb-20 overflow-hidden bg-transparent">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 dark:bg-primary/10 blur-[120px] -z-10 rounded-full translate-x-1/2 -translate-y-1/4" />
      <div className="absolute bottom-0 left-0 w-1/3 h-full bg-accent/5 dark:bg-accent/10 blur-[120px] -z-10 rounded-full -translate-x-1/2 translate-y-1/4" />

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 grid lg:grid-cols-2 gap-20 items-center w-full">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 mb-8">
            <Sparkles size={14} className="text-primary animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Premium Student Living</span>
          </div>

          <h1 ref={titleRef} className="text-6xl md:text-8xl font-display font-black text-zinc-900 dark:text-white leading-[0.9] mb-8 uppercase tracking-tighter">
            <span className="block hero-title-line">ELEVATE YOUR</span>
            <span className="block hero-title-line text-primary">LIFESTYLE.</span>
          </h1>

          <p ref={subtitleRef} className="text-lg md:text-xl text-zinc-500 dark:text-zinc-400 font-light leading-relaxed max-w-lg mb-12">
            Experience a new standard of student accommodation in Jaipur. Luxury spaces, vibrant community, and unmatched amenities designed for your success.
          </p>

          <div ref={ctaRef} className="flex flex-col sm:flex-row gap-6 mb-16">
            <Link 
              to="/booking" 
              className="group relative px-10 py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full font-bold uppercase tracking-widest text-xs overflow-hidden transition-transform hover:scale-105 active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-2">
                Book Your Space
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </Link>
            <Link 
              to="/properties" 
              className="px-10 py-5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white rounded-full font-bold uppercase tracking-widest text-xs hover:bg-zinc-50 dark:hover:bg-white/5 transition-all"
            >
              View Properties
            </Link>
          </div>

          <div ref={statsRef} className="grid grid-cols-3 gap-8 border-t border-zinc-100 dark:border-white/5 pt-12">
            {[
              { label: 'Properties', value: '12+' },
              { label: 'Happy Residents', value: '500+' },
              { label: 'Cities', value: '03' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-display font-black text-zinc-900 dark:text-white mb-1">{stat.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div ref={imageRef} className="relative aspect-[4/5] rounded-[48px] overflow-hidden shadow-2xl border border-zinc-200 dark:border-white/10">
            <img 
              src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80" 
              alt="Premium Living" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            <div className="absolute bottom-10 left-10 right-10 p-8 glass-card">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-zinc-900 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Resident" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest">Join 500+ Residents</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={10} className="fill-primary text-primary" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Accents */}
          <div className="hero-accent absolute -top-10 -right-10 w-32 h-32 bg-accent/20 backdrop-blur-3xl rounded-full border border-white/20 -z-10" />
          <div className="hero-accent absolute -bottom-10 -left-10 w-48 h-48 bg-primary/20 backdrop-blur-3xl rounded-full border border-white/20 -z-10" />
        </div>
      </div>
    </section>
  );
}
