import React, { useState, useRef, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/src/lib/gsap';
import { Plus, Minus, MessageCircleQuestion } from 'lucide-react';

const faqs = [
  {
    question: 'What documents are required for booking?',
    answer: 'You will need a valid government-issued ID (Aadhar, PAN, or Passport), proof of admission (for students), or proof of employment (for professionals), and two passport-sized photographs.'
  },
  {
    question: 'Is there a security deposit?',
    answer: 'Yes, we require a security deposit equivalent to one month\'s rent. This is fully refundable at the time of checkout, provided there are no damages or outstanding dues.'
  },
  {
    question: 'What are the mess timings?',
    answer: 'Breakfast: 7:30 AM - 9:30 AM, Lunch: 12:30 PM - 2:30 PM, Dinner: 7:30 PM - 9:30 PM. We offer a rotating menu with both vegetarian and non-vegetarian options.'
  },
  {
    question: 'Is there a curfew time?',
    answer: 'For the safety of our residents, we have a general curfew of 10:30 PM. However, late entry is permitted with prior notification and valid reasons.'
  },
  {
    question: 'Are guests allowed?',
    answer: 'Day guests are allowed in the common areas until 8:00 PM. Overnight guests are not permitted in the rooms for security reasons.'
  },
  {
    question: 'How do I pay my monthly rent?',
    answer: 'Rent can be paid through our mobile app, net banking, or UPI. Payments are due by the 5th of every month.'
  }
];

export default function FAQ() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    const tl = gsap.timeline();
    
    tl.fromTo('.faq-header-item',
      { y: 100, opacity: 0, skewY: 5 },
      { y: 0, opacity: 1, skewY: 0, duration: 1.2, stagger: 0.15, ease: 'power4.out' }
    );

    gsap.utils.toArray('.faq-item').forEach((item: any, i) => {
      gsap.fromTo(item, 
        { y: 60, opacity: 0 },
        {
          scrollTrigger: {
            trigger: item,
            start: 'top 85%',
          },
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'power4.out',
          delay: i * 0.1
        }
      );
    });
  }, { scope: containerRef });

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  useEffect(() => {
    contentRefs.current.forEach((el, i) => {
      if (el) {
        if (openIndex === i) {
          gsap.to(el, {
            height: 'auto',
            opacity: 1,
            duration: 0.5,
            ease: 'power3.out'
          });
        } else {
          gsap.to(el, {
            height: 0,
            opacity: 0,
            duration: 0.4,
            ease: 'power3.inOut'
          });
        }
      }
    });
  }, [openIndex]);

  return (
    <div ref={containerRef} className="pt-24 pb-24 bg-transparent transition-colors duration-500 relative overflow-hidden px-6 md:px-12 lg:px-16">
      {/* Decorative background elements */}
      <div className="absolute top-40 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[150px] -z-10 pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 w-full">
        <div className="text-center mb-24">
          <div className="faq-header-item inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 mb-8">
            <MessageCircleQuestion size={14} className="text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Help Center</span>
          </div>
          <h1 className="faq-header-item text-5xl md:text-7xl lg:text-8xl font-display font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-[0.9] mb-8">
            FREQUENTLY <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">ASKED QUESTIONS.</span>
          </h1>
          <p className="faq-header-item text-lg text-zinc-500 dark:text-zinc-400 font-light leading-relaxed max-w-2xl mx-auto">
            Everything you need to know about living at Maharana Pratap Properties. Can't find the answer you're looking for? Feel free to contact our support team.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`faq-item group glass-card rounded-[32px] overflow-hidden transition-all duration-500 ${openIndex === index ? 'border-primary/30 shadow-primary/5' : 'hover:border-zinc-300 dark:hover:border-white/20'}`}
            >
              <button
                className="w-full px-8 py-8 flex items-center justify-between text-left gap-6"
                onClick={() => toggleAccordion(index)}
              >
                <span className={`text-xl md:text-2xl font-display font-bold tracking-tight transition-colors duration-300 ${openIndex === index ? 'text-primary' : 'text-zinc-900 dark:text-white'}`}>
                  {faq.question}
                </span>
                <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${openIndex === index ? 'bg-primary text-white rotate-180' : 'bg-zinc-100 dark:bg-white/5 text-zinc-400 group-hover:bg-zinc-200 dark:group-hover:bg-white/10'}`}>
                  {openIndex === index ? <Minus size={20} /> : <Plus size={20} />}
                </div>
              </button>
              <div 
                ref={el => {contentRefs.current[index] = el}}
                className="h-0 opacity-0 overflow-hidden"
              >
                <div className="px-8 pb-8 pt-0">
                  <p className="text-zinc-500 dark:text-zinc-400 font-light leading-relaxed text-lg">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
