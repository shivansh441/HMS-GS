import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/src/lib/gsap';
import { Mail, Phone, MapPin, Send, Instagram, Facebook, Twitter } from 'lucide-react';

export default function Contact() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo('.contact-reveal', 
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
    <section id="contact" ref={containerRef} className="py-32 bg-zinc-50 dark:bg-[#09090B] transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-24">
          <div>
            <div className="contact-reveal inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 mb-8">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Get in Touch</span>
            </div>
            <h2 className="contact-reveal text-6xl lg:text-8xl font-display font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-[0.85] mb-10">
              LET'S <br />
              <span className="text-primary">CONNECT.</span>
            </h2>
            <p className="contact-reveal text-xl text-zinc-500 dark:text-zinc-400 font-light leading-relaxed mb-12 max-w-md">
              Have questions or ready to book your space? Our team is here to help you find your perfect home in Jaipur.
            </p>

            <div className="space-y-8">
              <div className="contact-reveal flex items-center gap-6 group">
                <div className="w-14 h-14 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center text-primary shadow-xl shadow-black/5 group-hover:scale-110 transition-transform duration-500">
                  <Phone size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Call Us</p>
                  <p className="text-xl font-display font-bold text-zinc-900 dark:text-white">+91 98765 43210</p>
                </div>
              </div>
              <div className="contact-reveal flex items-center gap-6 group">
                <div className="w-14 h-14 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center text-primary shadow-xl shadow-black/5 group-hover:scale-110 transition-transform duration-500">
                  <Mail size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Email Us</p>
                  <p className="text-xl font-display font-bold text-zinc-900 dark:text-white">hello@maharana.com</p>
                </div>
              </div>
              <div className="contact-reveal flex items-center gap-6 group">
                <div className="w-14 h-14 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center text-primary shadow-xl shadow-black/5 group-hover:scale-110 transition-transform duration-500">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Visit Us</p>
                  <p className="text-xl font-display font-bold text-zinc-900 dark:text-white">Malviya Nagar, Jaipur, Rajasthan</p>
                </div>
              </div>
            </div>
          </div>

          <div className="contact-reveal glass-card p-12 rounded-[48px]">
            <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-4">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="John Doe"
                    className="w-full px-8 py-5 bg-zinc-100 dark:bg-white/5 border border-transparent focus:border-primary/30 rounded-full outline-none transition-all text-zinc-900 dark:text-white font-medium"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-4">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="john@example.com"
                    className="w-full px-8 py-5 bg-zinc-100 dark:bg-white/5 border border-transparent focus:border-primary/30 rounded-full outline-none transition-all text-zinc-900 dark:text-white font-medium"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-4">Your Message</label>
                <textarea 
                  rows={4} 
                  placeholder="How can we help you?"
                  className="w-full px-8 py-6 bg-zinc-100 dark:bg-white/5 border border-transparent focus:border-primary/30 rounded-[32px] outline-none transition-all text-zinc-900 dark:text-white font-medium resize-none"
                />
              </div>
              <button className="w-full py-6 bg-primary text-white rounded-full font-bold uppercase tracking-widest text-xs hover:bg-primary/90 transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-3">
                Send Message
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
