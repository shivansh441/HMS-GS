import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/src/lib/gsap';
import { Phone, Mail, MapPin, Briefcase, Truck, Calendar, Send } from 'lucide-react';

export default function ContactPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo('.contact-page-reveal',
      { y: 60, opacity: 0 },
      {
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
        },
        y: 0,
        opacity: 1,
        duration: 1.1,
        stagger: 0.15,
        ease: 'power4.out'
      }
    );
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="pt-24 pb-24 bg-transparent min-h-screen transition-colors duration-500 scroll-mt-24 px-6 md:px-12 lg:px-16" id="contact-page">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 w-full">
        <div className="text-center mb-16">
          <h1 className="contact-page-reveal text-4xl md:text-5xl lg:text-6xl font-display font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-6">
            Business & Support
            <span className="text-primary"> Contact</span>
          </h1>
          <p className="contact-page-reveal text-base md:text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
          Whether you want corporate partnerships, merchandise collaboration, booking for events, or general assistance—our team is ready to help you grow with Maharana Pratap.
        </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          <article className="contact-page-reveal p-6 md:p-8 rounded-3xl bg-zinc-100 dark:bg-[#111] border border-zinc-200 dark:border-white/10 shadow-lg shadow-black/5">
            <div className="mb-5 inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/20 text-primary">
              <Briefcase size={24} />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white mb-3">Corporate Bookings</h3>
            <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-300 font-light leading-relaxed mb-5">
              Secure bulk accommodations for universities, corporate teams, or long-term housing requirements with tailored pricing and dedicated account management.
            </p>
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400">Email: corporate@maharana.com</p>
          </article>

          <article className="contact-page-reveal p-6 md:p-8 rounded-3xl bg-zinc-100 dark:bg-[#111] border border-zinc-200 dark:border-white/10 shadow-lg shadow-black/5">
            <div className="mb-5 inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/20 text-primary">
              <Truck size={24} />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white mb-3">Merchandise & Partnerships</h3>
            <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-300 font-light leading-relaxed mb-5">
              Interested in co-branded merchandise, campus pop-up stalls, or venue sponsorship? Contact our partnerships team for collaboration opportunities.
            </p>
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400">Email: merch@maharana.com</p>
          </article>

          <article className="contact-page-reveal p-6 md:p-8 rounded-3xl bg-zinc-100 dark:bg-[#111] border border-zinc-200 dark:border-white/10 shadow-lg shadow-black/5 sm:col-span-2 lg:col-span-1">
            <div className="mb-5 inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/20 text-primary">
              <Calendar size={24} />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white mb-3">Business Booking</h3>
            <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-300 font-light leading-relaxed mb-5">
              Plan events, training sessions, or student orientation stays with our dedicated business booking support and venue planning team.
            </p>
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400">Email: bookings@maharana.com</p>
          </article>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div className="contact-page-reveal relative flex justify-center lg:justify-start order-2 lg:order-1 mt-8 lg:mt-0">
            <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-black/10 w-full max-w-xs md:max-w-sm">
              <img
                src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=2000"
                alt="Business contact"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-primary rounded-full blur-[100px] opacity-20 -z-10" />
          </div>

          <div className="contact-page-reveal p-6 md:p-10 rounded-3xl bg-white dark:bg-[#050508] border border-zinc-200 dark:border-white/10 shadow-xl order-1 lg:order-2">
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white mb-3 md:mb-4">Get in touch with us</h2>
            <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 mb-6 md:mb-8">Submit your details and our team will follow up within 24 hours.</p>

            <form className="space-y-4 md:space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
                <input type="text" placeholder="Full Name" className="w-full rounded-xl border border-zinc-200 dark:border-white/10 px-4 py-3 bg-zinc-50 dark:bg-[#0F1115] text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm md:text-base focus:outline-none focus:border-primary transition-colors" />
                <input type="email" placeholder="Business Email" className="w-full rounded-xl border border-zinc-200 dark:border-white/10 px-4 py-3 bg-zinc-50 dark:bg-[#0F1115] text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm md:text-base focus:outline-none focus:border-primary transition-colors" />
              </div>
              <input type="text" placeholder="Company / Organization" className="w-full rounded-xl border border-zinc-200 dark:border-white/10 px-4 py-3 bg-zinc-50 dark:bg-[#0F1115] text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm md:text-base focus:outline-none focus:border-primary transition-colors" />
              <textarea rows={4} placeholder="Tell us how we can help" className="w-full rounded-xl border border-zinc-200 dark:border-white/10 px-4 py-3 bg-zinc-50 dark:bg-[#0F1115] text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm md:text-base focus:outline-none focus:border-primary transition-colors resize-none" />
              <button className="w-full py-3 md:py-4 rounded-full bg-primary text-white font-bold uppercase tracking-widest text-xs md:text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                Send Inquiry <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
