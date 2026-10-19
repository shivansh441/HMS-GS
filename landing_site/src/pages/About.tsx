import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/src/lib/gsap';
import { Users, Target, Heart, Shield } from 'lucide-react';

const values = [
  {
    icon: Users,
    title: 'Community First',
    desc: 'We believe in the power of connection. Our spaces are designed to foster meaningful relationships.'
  },
  {
    icon: Target,
    title: 'Excellence',
    desc: 'From hygiene to security, we never compromise on the quality of your living experience.'
  },
  {
    icon: Heart,
    title: 'Empathy',
    desc: 'We understand the challenges of living away from home. Our staff is here to support you like family.'
  },
  {
    icon: Shield,
    title: 'Integrity',
    desc: 'Transparent pricing, honest communication, and unwavering commitment to your safety.'
  }
];

export default function About() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo('.about-reveal', 
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
    <div ref={containerRef} id="about" className="pt-24 pb-24 bg-transparent transition-colors duration-500 scroll-mt-24">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start mb-40">
          <div className="pt-0 lg:pt-8">
            <div className="about-reveal inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 mb-8">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Our Story</span>
            </div>
            <h1 className="about-reveal text-5xl md:text-7xl lg:text-8xl font-display font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-[0.8] mb-12">
              REDEFINING <br />
              <span className="text-primary">LIVING.</span>
            </h1>
            <p className="about-reveal text-lg md:text-xl text-zinc-500 dark:text-zinc-400 font-light leading-relaxed mb-12 max-w-xl">
              Founded in the heart of Jaipur, we provide more than just a place to stay. We create environments where students and professionals can thrive, connect, and grow.
            </p>
            <div className="about-reveal grid grid-cols-2 gap-8 md:gap-12">
              <div>
                <div className="text-5xl md:text-6xl font-display font-black text-zinc-900 dark:text-white mb-2 tracking-tighter">10+</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Premium Properties</div>
              </div>
              <div>
                <div className="text-5xl md:text-6xl font-display font-black text-zinc-900 dark:text-white mb-2 tracking-tighter">500+</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Happy Residents</div>
              </div>
            </div>
          </div>
          
          <div className="about-reveal relative flex justify-center lg:justify-end mt-8 lg:mt-0">
            <div className="aspect-[4/5] rounded-[48px] overflow-hidden shadow-2xl shadow-black/10 w-full max-w-xs md:max-w-sm">
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2000" 
                alt="Community" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-12 -left-12 w-72 h-72 bg-primary rounded-full blur-[120px] opacity-20 -z-10" />
            <div className="absolute -top-12 -right-12 w-72 h-72 bg-purple-500 rounded-full blur-[120px] opacity-20 -z-10" />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-24 items-start mt-24">
          <div className="about-reveal sticky top-32">
            <h2 className="text-5xl lg:text-7xl font-display font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-[0.9] mb-8">
              OUR CORE <br />
              <span className="text-primary">VALUES.</span>
            </h2>
            <p className="text-lg text-zinc-500 dark:text-zinc-400 font-light leading-relaxed max-w-md">
              We are guided by a set of principles that ensure every resident experiences the highest standard of living and community.
            </p>
          </div>
          
          <div className="grid gap-8">
            {values.map((value, i) => (
              <div key={i} className="about-reveal group p-12 glass-card card-hover">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-all duration-500 group-hover:rotate-6">
                  <value.icon size={28} className="text-zinc-900 dark:text-white group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-3xl font-display font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-4 leading-none">{value.title}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 font-light leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
