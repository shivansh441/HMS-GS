import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { gsap, ScrollTrigger } from './lib/gsap';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Amenities from './components/Amenities';
import HostelGrid from './components/HostelGrid';
import ContactPage from './pages/Contact';
import Properties from './pages/Properties';
import Login from './pages/Login';
import Booking from './pages/Booking';
import CommunityPage from './pages/Community';
import About from './pages/About';
import Gallery from './pages/Gallery';
import FAQ from './pages/FAQ';
import MyBookings from './pages/MyBookings';
import Settings from './pages/Settings';
import Support from './pages/Support';
import PropertyDetails from './pages/PropertyDetails';

function Footer() {
  return (
    <footer className="py-24 bg-zinc-50 dark:bg-transparent border-t border-zinc-200 dark:border-white/10 transition-colors duration-500">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 w-full grid md:grid-cols-4 gap-16">
        <div className="col-span-2">
          <h2 className="text-4xl font-display font-black mb-8 text-zinc-900 dark:text-white uppercase tracking-tighter">
            MAHARANA <span className="text-primary">PRATAP.</span>
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mb-10 font-light leading-relaxed">
            Premium living spaces designed for the ambitious. Experience a blend of luxury, community, and productivity in the heart of Jaipur.
          </p>
          <div className="flex gap-6">
            {['Twitter', 'Instagram', 'LinkedIn'].map((social) => (
              <a key={social} href="#" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-primary transition-colors">{social}</a>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-900 dark:text-white mb-8">Navigation</h3>
          <ul className="space-y-4">
            {['Properties', 'About', 'Gallery', 'FAQ', 'Community'].map((item) => (
              <li key={item}>
                <Link to={item === 'Properties' ? '/#properties' : `/${item.toLowerCase()}`} className="text-sm text-zinc-500 hover:text-primary transition-colors font-light">{item}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-900 dark:text-white mb-8">Contact</h3>
          <ul className="space-y-4 text-sm text-zinc-500 font-light">
            <li>Malviya Nagar, Jaipur</li>
            <li>+91 98765 43210</li>
            <li>hello@maharanapratap.com</li>
          </ul>
        </div>
      </div>
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 w-full mt-24 pt-12 border-t border-zinc-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-xs text-zinc-400 uppercase tracking-widest font-medium">© 2026 Maharana Pratap Properties. All rights reserved.</p>
        <div className="flex gap-8">
          <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-primary transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}

function Landing() {
  const location = useLocation();

  React.useEffect(() => {
    const scrollToHash = () => {
      if (!location.hash) {
        // Scroll to top immediately on page load/route change
        window.scrollTo(0, 0);
        return;
      }

      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (!element) return;

      const headerOffset = 84; // fixed navbar height
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    };

    scrollToHash();

    // Refresh ScrollTrigger after route change and scroll
    const timeout = window.setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);

    return () => window.clearTimeout(timeout);
  }, [location]);

  return (
    <div className="bg-transparent min-h-screen transition-colors duration-500">
      <Hero />
      <Features />
      <Amenities />
      <HostelGrid />
      <ContactPage />
    </div>
  );
}

function PageLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const previousPathRef = React.useRef<string>('');

  React.useEffect(() => {
    // Only scroll if we're actually navigating to a different page
    if (previousPathRef.current !== '' && previousPathRef.current !== location.pathname) {
      // Disable smooth scroll temporarily
      const originalBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      
      // Kill all ScrollTrigger instances to prevent interference
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      
      // Use a microtask to ensure this runs after React renders
      queueMicrotask(() => {
        // Perform the scroll
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        
        // Restore original behavior and refresh ScrollTrigger
        requestAnimationFrame(() => {
          document.documentElement.style.scrollBehavior = originalBehavior;
          setTimeout(() => {
            ScrollTrigger.refresh();
          }, 0);
        });
      });
    }
    
    // Update the previous path ref
    previousPathRef.current = location.pathname;

  }, [location.pathname]);

  return (
    <div className="bg-transparent min-h-screen transition-colors duration-500 flex flex-col">
      <Navbar />
      <div className="flex-grow">
        {children}
      </div>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
   
      <Router>
        <Routes>
          <Route path="/" element={<PageLayout><Landing /></PageLayout>} />
          <Route path="/login" element={<Login />} />
          <Route path="/booking" element={<PageLayout><Booking /></PageLayout>} />
          <Route path="/properties" element={<PageLayout><Properties /></PageLayout>} />
          <Route path="/bookings" element={<PageLayout><MyBookings /></PageLayout>} />
          <Route path="/community" element={<PageLayout><CommunityPage /></PageLayout>} />
          <Route path="/about" element={<PageLayout><About /></PageLayout>} />
          <Route path="/gallery" element={<PageLayout><Gallery /></PageLayout>} />
          <Route path="/faq" element={<PageLayout><FAQ /></PageLayout>} />
          <Route path="/settings" element={<PageLayout><Settings /></PageLayout>} />
          <Route path="/support" element={<PageLayout><Support /></PageLayout>} />
          <Route path="/contact" element={<PageLayout><ContactPage /></PageLayout>} />
          <Route path="/property/:id" element={<PageLayout><PropertyDetails /></PageLayout>} />
          <Route path="*" element={<PageLayout><Landing /></PageLayout>} />
        </Routes>
      </Router>
   
  );
}
