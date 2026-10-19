import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, LogIn, Calendar, Sun, Moon, User as UserIcon, LogOut, Settings, HelpCircle, Briefcase, ChevronDown } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { ThemeMode } from '../types';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { name: 'Properties', href: '/properties' },
    { name: 'About', href: '/about' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Community', href: '/community' },
    { name: 'Contact', href: '/contact' },
  ];

  const toggleTheme = () => {
    setTheme(theme === ThemeMode.LIGHT ? ThemeMode.DARK : ThemeMode.LIGHT);
  };

  const scrollToSection = (hash: string) => {
    const id = hash.replace('#', '');
    const target = document.getElementById(id);
    if (!target) return;

    const headerOffset = 84;
    const elementPosition = target.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - headerOffset;

    window.history.pushState(null, '', hash);
    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await logout();
    setIsProfileOpen(false);
  };

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 py-4",
      isScrolled ? "bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/10 py-3" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-2xl font-display font-black text-zinc-900 dark:text-white uppercase tracking-tighter">
          MAHARANA <span className="text-primary">PRATAP.</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-primary transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-500 hover:text-primary transition-all"
          >
            {theme === ThemeMode.DARK ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <Link
              to="/booking"
              className="hidden md:flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
            >
              <Calendar size={14} />
              Book Now
            </Link>
          ) : (
            <Link
              to="/login"
              className="hidden md:flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
            >
              <Calendar size={14} />
              Book Now
            </Link>
          )}

          {user ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 bg-zinc-100 dark:bg-white/5 pl-2 pr-4 py-1.5 rounded-full border border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-white/10 transition-all"
              >
                <div className="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                  <UserIcon size={14} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-900 dark:text-white hidden md:block">{user.name.split(' ')[0]}</span>
                <ChevronDown size={14} className={cn("text-zinc-400 transition-transform ml-1", isProfileOpen && "rotate-180")} />
              </button>

              {isProfileOpen && (
                <div className="absolute top-full right-0 mt-3 w-56 bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-4 duration-200">
                  <div className="px-3 py-3 border-b border-zinc-100 dark:border-white/5 mb-2">
                    <p className="font-bold text-sm text-zinc-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-0.5 truncate">{user.email}</p>
                  </div>
                  <div className="space-y-1">
                    <Link to="/bookings" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-primary dark:hover:text-primary transition-all">
                      <Briefcase size={16} />
                      My Bookings
                    </Link>
                    <Link to="/settings" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-primary dark:hover:text-primary transition-all">
                      <Settings size={16} />
                      Settings
                    </Link>
                    <Link to="/support" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-primary dark:hover:text-primary transition-all">
                      <HelpCircle size={16} />
                      Support
                    </Link>
                    <div className="h-px bg-zinc-100 dark:bg-white/5 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-xs font-medium text-red-500 transition-all"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden md:flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
            >
              Login
            </Link>
          )}

          <button
            className="lg:hidden w-10 h-10 rounded-full border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-900 dark:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-[#09090B] border-b border-zinc-200 dark:border-white/10 p-8 flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
          {user && (
            <div className="flex items-center gap-4 p-6 bg-zinc-50 dark:bg-white/5 rounded-[32px] border border-zinc-100 dark:border-white/5 mb-4">
              <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                <UserIcon size={24} />
              </div>
              <div>
                <p className="font-bold text-zinc-900 dark:text-white">{user.name}</p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-1">{user.email}</p>
              </div>
            </div>
          )}

          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-2xl font-display font-bold text-zinc-900 dark:text-white uppercase tracking-tight"
            >
              {link.name}
            </Link>
          ))}

          <div className="pt-8 border-t border-zinc-100 dark:border-white/5 flex flex-col gap-4">
            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 text-red-500 font-bold uppercase tracking-widest text-xs"
              >
                <LogOut size={18} />
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 bg-zinc-100 dark:bg-white/5 p-4 rounded-2xl font-bold uppercase tracking-widest text-xs text-zinc-900 dark:text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <LogIn size={18} />
                Login
              </Link>
            )}
            {user ? (
              <Link
                to="/booking"
                className="flex items-center justify-center gap-2 bg-primary p-4 rounded-2xl font-bold uppercase tracking-widest text-xs text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Calendar size={18} />
                Book Now
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 bg-primary p-4 rounded-2xl font-bold uppercase tracking-widest text-xs text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Calendar size={18} />
                Book Now
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
