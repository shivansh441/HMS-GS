import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const SHOWCASE_IMAGES = [
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=2069&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop"
];

export const ShowcasePanel = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const imagesRef = useRef<(HTMLImageElement | null)[]>([]);

    useGSAP(() => {
        if (!imagesRef.current.length) return;
        const imageTl = gsap.timeline({ repeat: -1 });

        imagesRef.current.forEach((img, i) => {
            if (!img) return;
            gsap.set(img, { opacity: 0, scale: 1 });
            imageTl.to(img, { opacity: 1, duration: 1.5, ease: "power1.inOut" }, i * 5)
                .to(img, { scale: 1.15, duration: 6.5, ease: "none" }, i * 5)
                .to(img, { opacity: 0, duration: 1.5, ease: "power1.inOut" }, (i * 5) + 5);
        });
    }, { scope: containerRef });

    return (
        <div ref={containerRef} className="hidden lg:block lg:w-[55%] relative overflow-hidden bg-black">
            <div className="absolute inset-0 z-0">
                {SHOWCASE_IMAGES.map((src, index) => (
                    <img key={index} ref={(el) => { imagesRef.current[index] = el; }} src={src} alt="Showcase" className="absolute inset-0 w-full h-full object-cover opacity-0" />
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 z-10"></div>
            </div>
            <div className="relative z-20 h-full flex flex-col justify-end p-16">
                <div className="max-w-lg backdrop-blur-md bg-black/40 border border-white/10 p-8 rounded-2xl shadow-2xl">
                    <h2 className="text-3xl font-semibold text-white mb-3 tracking-tight">Excellence in Residence.</h2>
                    <p className="text-white/70 text-sm leading-relaxed mb-6">Providing top-tier accommodation, robust security, and an environment curated for academic and personal growth.</p>
                </div>
            </div>
        </div>
    );
};