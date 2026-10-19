import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/src/lib/gsap';

const galleryImages = [
  { url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=2069', title: 'Modern Living Room' },
  { url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&q=80&w=2070', title: 'Premium Bedroom' },
  { url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=2071', title: 'Study Area' },
  { url: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=2070', title: 'Dining Hall' },
  { url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=2070', title: 'Common Area' },
  { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=2047', title: 'Cafeteria' },
  { url: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&q=80&w=2070', title: 'Gym' },
  { url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=2050', title: 'Lobby' },
  { url: 'https://images.unsplash.com/photo-1551882547-ff43c63e8c24?auto=format&fit=crop&q=80&w=2070', title: 'Terrace' },
];

export default function Gallery() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    
    tl.fromTo('.gallery-header-item',
      { y: 100, opacity: 0, skewY: 5 },
      { y: 0, opacity: 1, skewY: 0, duration: 1.2, stagger: 0.15, ease: 'power4.out' }
    );

    gsap.utils.toArray('.gallery-item').forEach((item: any, i) => {
      gsap.fromTo(item, 
        { y: 100, opacity: 0, scale: 0.95 },
        {
          scrollTrigger: {
            trigger: item,
            start: 'top 85%',
          },
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1.2,
          ease: 'power4.out',
          delay: (i % 3) * 0.1
        }
      );
      
      // Parallax effect on image
      const img = item.querySelector('img');
      gsap.to(img, {
        y: '20%',
        ease: 'none',
        scrollTrigger: {
          trigger: item,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="pt-24 pb-24 bg-transparent transition-colors duration-500 overflow-hidden px-6 md:px-12 lg:px-16">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 w-full">
        <div className="max-w-3xl mb-24">
          <div className="gallery-header-item inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 mb-8">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Visual Tour</span>
          </div>
          <h1 className="gallery-header-item text-7xl lg:text-9xl font-display font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-[0.8] mb-12">
            OUR <br />
            <span className="text-primary">SPACES.</span>
          </h1>
          <p className="gallery-header-item text-xl text-zinc-500 dark:text-zinc-400 font-light leading-relaxed max-w-xl">
            A glimpse into the life at Maharana Pratap Properties. Modern design meets community living in the heart of Jaipur.
          </p>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
          {galleryImages.map((image, i) => (
            <div 
              key={i} 
              className="gallery-item group relative rounded-[48px] overflow-hidden break-inside-avoid shadow-2xl shadow-black/5"
            >
              <div className="h-full w-full overflow-hidden relative" style={{ height: `${Math.floor(Math.random() * 200) + 300}px` }}>
                <img 
                  src={image.url} 
                  alt={image.title} 
                  className="absolute top-[-20%] left-0 w-full h-[140%] object-cover transition-transform duration-1000 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-10">
                <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Interior Design</p>
                  <h3 className="text-3xl font-display font-black text-white uppercase tracking-tight leading-none">{image.title}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
