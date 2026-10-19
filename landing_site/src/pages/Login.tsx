import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ThemeMode } from '../types';
import { gsap } from '@/src/lib/gsap';
import { Mail, Key, Eye, EyeOff, ShieldCheck, Lock, Building, ArrowRight, CircleSlash, Sun, Moon, User } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';

export default function Login() {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const { login, register, loading, error, clearError, initializeAuth } = useAuthStore();
  const navigate = useNavigate();

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const containerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  
  const [isLogin, setIsLogin] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const showcaseImages = [
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=2069&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop"
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(leftPanelRef.current, { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 1.2 })
        .fromTo('.logo-icon', { scale: 0, rotation: -180 }, { scale: 1, rotation: 0, duration: 0.8, ease: 'back.out(1.5)' }, "-=0.9")
        .fromTo('.stagger-el', { opacity: 0, y: 25 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.1 }, "-=0.6");

      // Animate divider lines if they exist
      const dividerLines = document.querySelectorAll('.divider-line');
      if (dividerLines.length > 0) {
        tl.fromTo('.divider-line', { scaleX: 0 }, { scaleX: 1, duration: 0.8, transformOrigin: 'left', ease: 'power2.out' }, "-=0.5");
      }

      if (imagesRef.current.length > 0) {
        const imageTl = gsap.timeline({ repeat: -1 });
        const duration = 5; 
        const fade = 1.5;   

        imagesRef.current.forEach((img, i) => {
          if (!img) return;
          gsap.set(img, { opacity: 0, scale: 1 });
          imageTl.to(img, { opacity: 1, duration: fade, ease: "power1.inOut" }, i * duration)
                 .to(img, { scale: 1.15, duration: duration + fade, ease: "none" }, i * duration)
                 .to(img, { opacity: 0, duration: fade, ease: "power1.inOut" }, (i * duration) + duration);
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Animate form transitions when toggling between Login and Register
  useEffect(() => {
    if (formRef.current) {
      gsap.fromTo(formRef.current, 
        { opacity: 0, y: 10 }, 
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register({ firstName, lastName, email, password });
      }
      navigate('/'); 
    } catch (err) {
      gsap.fromTo('.form-container', 
        { x: -5 }, 
        { x: 5, duration: 0.06, repeat: 5, yoyo: true, ease: 'none', clearProps: 'x' }
      );
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen flex transition-colors duration-500 bg-transparent relative overflow-hidden">
      <div ref={leftPanelRef} className="w-full lg:w-[45%] flex flex-col relative z-10 bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-xl shadow-[20px_0_40px_-15px_rgba(0,0,0,0.05)] dark:shadow-[20px_0_40px_-15px_rgba(0,0,0,0.5)] transition-colors duration-500 overflow-y-auto">
        <div className="p-8 flex items-center justify-between shrink-0">
          <Link to="/" className="flex items-center gap-3">
            <div className="logo-icon w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-primary/30">
              <Building size={24} />
            </div>
            <span className="stagger-el font-display font-black text-2xl text-zinc-900 dark:text-white tracking-tighter uppercase">MP PROPERTIES.</span>
          </Link>
          <button 
            onClick={() => setTheme(theme === ThemeMode.LIGHT ? ThemeMode.DARK : ThemeMode.LIGHT)}
            className="w-10 h-10 rounded-full border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-500 hover:text-primary transition-all stagger-el"
          >
            {theme === ThemeMode.DARK ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 md:px-24 form-container py-8">
          <div className="max-w-md w-full mx-auto" ref={formRef}>
            <div className="mb-8">
              <h1 className="stagger-el text-5xl font-display font-black text-zinc-900 dark:text-white mb-4 tracking-tighter uppercase leading-none">
                {isLogin ? <><span className="text-primary">PORTAL</span><br />ACCESS.</> : <><span className="text-primary">CREATE</span><br />ACCOUNT.</>}
              </h1>
              <p className="stagger-el text-zinc-500 dark:text-zinc-400 text-lg font-light leading-relaxed mb-6">
                {isLogin 
                  ? "Welcome to the centralized management system. Please authenticate to access your dashboard."
                  : "Join the centralized management system. Fill in your details to create a new portal identity."}
              </p>
              <div className="stagger-el flex flex-wrap gap-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-primary" /> Secure Gateway</span>
                <span className="flex items-center gap-2"><Lock size={16} className="text-primary" /> AES-256 Encrypted</span>
              </div>
            </div>

            <div className="stagger-el flex items-center gap-4 mb-8">
              <div className="divider-line h-px flex-1 bg-zinc-200 dark:bg-white/10"></div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sign in with your credentials</span>
              <div className="divider-line h-px flex-1 bg-zinc-200 dark:bg-white/10"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="stagger-el flex gap-4">
                  <div className="space-y-2 flex-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">First Name</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <User size={18} className="text-zinc-400 group-focus-within:text-primary transition-colors" />
                      </div>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-white/10 rounded-[20px] text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-base font-medium"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 flex-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Last Name</label>
                    <div className="relative group">
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="w-full px-5 py-4 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-white/10 rounded-[20px] text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-base font-medium"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 stagger-el">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Mail size={18} className="text-zinc-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@maharanapratap.com"
                    className="w-full pl-12 pr-5 py-4 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-white/10 rounded-[20px] text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-base font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 stagger-el">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Password</label>
                  {isLogin && (
                    <button type="button" className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline transition-colors">Forgot password?</button>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Key size={18} className="text-zinc-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-white/10 rounded-[20px] text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-base font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="stagger-el p-5 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-[20px] border border-red-100 dark:border-red-900/50 flex items-start gap-3 shadow-sm">
                  <CircleSlash size={18} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="stagger-el w-full py-5 px-6 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black uppercase tracking-widest text-sm rounded-[20px] transition-all duration-500 focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-70 flex justify-center items-center mt-4 shadow-xl shadow-black/10 hover:scale-[1.02]"
              >
                {loading ? (
                  <span className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    {isLogin ? 'Authenticating...' : 'Registering...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-3">
                    {isLogin ? 'Access Dashboard' : 'Create Account'} <ArrowRight size={18} />
                  </span>
                )}
              </button>
            </form>

            <div className="mt-8 text-center stagger-el">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                  onClick={() => {
                    setIsLogin(!isLogin);
                    clearError();
                  }}
                  className="font-bold text-primary hover:underline transition-all"
                >
                  {isLogin ? 'Register Here' : 'Login Here'}
                </button>
              </p>
            </div>

            <div className="mt-8 text-center stagger-el">
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">&copy; {new Date().getFullYear()} Maharana Pratap Properties.</p>
            </div>
          </div>
        </div>
      </div>

      <div ref={rightPanelRef} className="hidden lg:block lg:w-[55%] relative overflow-hidden bg-[#09090B]">
        <div className="absolute inset-0 z-0">
          {showcaseImages.map((src, index) => (
            <img 
              key={index} 
              ref={(el) => { imagesRef.current[index] = el; }}
              src={src} 
              alt="Showcase" 
              className="absolute inset-0 w-full h-full object-cover opacity-0" 
              referrerPolicy="no-referrer"
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/40 to-transparent z-10"></div>
        </div>
        <div className="relative z-20 h-full flex flex-col justify-end p-24">
          <div className="max-w-lg backdrop-blur-2xl bg-white/5 border border-white/10 p-12 rounded-[48px] shadow-3xl">
            <h2 className="text-5xl font-display font-black text-white mb-6 tracking-tighter uppercase leading-none">EXCELLENCE <br />IN RESIDENCE.</h2>
            <p className="text-zinc-300 text-xl font-light leading-relaxed mb-10">Providing top-tier accommodation, robust security, and an environment curated for academic and personal growth.</p>
            <div className="flex gap-12 border-t border-white/10 pt-10">
              <div><span className="block text-4xl font-display font-black text-white uppercase tracking-tighter">4+</span><span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Blocks</span></div>
              <div className="w-px bg-white/10"></div>
              <div><span className="block text-4xl font-display font-black text-white uppercase tracking-tighter">1200+</span><span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Residents</span></div>
              <div className="w-px bg-white/10"></div>
              <div><span className="block text-4xl font-display font-black text-white uppercase tracking-tighter">24/7</span><span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Security</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}