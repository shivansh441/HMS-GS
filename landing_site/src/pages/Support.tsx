import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/src/lib/gsap';
import { LifeBuoy, MessageSquare, Phone, Mail, FileText, ArrowRight } from 'lucide-react';

export default function Support() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo('.support-reveal', 
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out'
      }
    );
  }, { scope: containerRef });

  const supportOptions = [
    {
      title: 'Chat Support',
      description: 'Chat with our support team in real-time.',
      icon: MessageSquare,
      action: 'Start Chat',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      title: 'Email Us',
      description: 'Send us an email and we\'ll get back to you within 24 hours.',
      icon: Mail,
      action: 'Send Email',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      title: 'Call Us',
      description: 'Speak directly with a customer service representative.',
      icon: Phone,
      action: '+91 98765 43210',
      color: 'text-rose-500',
      bg: 'bg-rose-500/10'
    },
    {
      title: 'Documentation',
      description: 'Read our detailed guides and documentation.',
      icon: FileText,
      action: 'View Docs',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    }
  ];

  return (
    <div ref={containerRef} className="pt-24 pb-24 bg-transparent transition-colors duration-500 min-h-screen relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-20 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
      
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 w-full">
        <div className="text-center max-w-3xl mx-auto mb-24">
          <div className="support-reveal inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 mb-8">
            <LifeBuoy size={14} className="text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Help & Support</span>
          </div>
          <h1 className="support-reveal text-5xl md:text-7xl font-display font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-[0.9] mb-8">
            HOW CAN WE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">HELP YOU?</span>
          </h1>
          <p className="support-reveal text-lg text-zinc-500 dark:text-zinc-400 font-light leading-relaxed">
            Our dedicated support team is here to assist you with any questions or issues you might have. Choose the best way to reach us below.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
          {supportOptions.map((option, index) => (
            <div key={index} className="support-reveal glass-card rounded-[32px] p-10 group hover:border-primary/30 transition-all duration-500 cursor-pointer">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6 ${option.bg} ${option.color}`}>
                <option.icon size={28} />
              </div>
              <h3 className="text-2xl font-display font-bold text-zinc-900 dark:text-white mb-4">{option.title}</h3>
              <p className="text-zinc-500 dark:text-zinc-400 font-light leading-relaxed mb-8">{option.description}</p>
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs group-hover:translate-x-2 transition-transform duration-300">
                {option.action}
                <ArrowRight size={16} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
